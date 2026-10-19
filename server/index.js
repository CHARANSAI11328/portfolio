const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const {
  getDatabase,
  saveDatabase,
  logActivity,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} = require('./db');

const isProd = process.env.NODE_ENV === 'production';
const HOST = '0.0.0.0';
let currentPort = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(PUBLIC_DIR, 'uploads');

// Ensure upload directory exists safely
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Non-destructive migration to persistent volume on Render/PaaS
const localUploadsDir = path.join(PUBLIC_DIR, 'uploads');
if (UPLOADS_DIR !== localUploadsDir && fs.existsSync(localUploadsDir)) {
  try {
    fs.readdirSync(localUploadsDir).forEach((file) => {
      const src = path.join(localUploadsDir, file);
      const dst = path.join(UPLOADS_DIR, file);
      if (!fs.existsSync(dst) && fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
      }
    });
  } catch (err) {
    console.error('[STORAGE] Error copying uploads to volume:', err);
  }
}

// MIME types (strict raster-only for user uploads)
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

// Rate limiting state for brute-force protection
const loginAttempts = {};
const passwordChangeAttempts = {};

function isRateLimited(store, key, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = store[key];
  if (!entry) return false;
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return true;
  }
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    delete store[key];
    return false;
  }
  return false;
}

function recordFailedAttempt(store, key, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000) {
  const now = Date.now();
  if (!store[key]) {
    store[key] = { count: 1, firstAttempt: now };
  } else {
    store[key].count++;
  }
  if (store[key].count >= maxAttempts) {
    store[key].lockedUntil = now + lockDurationMs;
  }
}

function clearFailedAttempts(store, key) {
  delete store[key];
}

// Helper to parse cookies
function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Secure cookie builder
function buildAuthCookie(req, token, isLogout = false) {
  if (isLogout) {
    return 'charan_admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
  }
  const isHttps = isProd || (req && (req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted));
  const secureFlag = isHttps ? '; Secure' : '';
  return `charan_admin_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}${secureFlag}`;
}

// Helper to verify request admin auth with strict tokenVersion session invalidation
function getAuthAdmin(req) {
  const cookies = parseCookies(req);
  let token = cookies['charan_admin_session'];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;
  const db = getDatabase();
  const admin = db.admins.find((a) => a.id === payload.id);
  if (!admin) return null;

  // Strict session invalidation check
  if (typeof admin.tokenVersion === 'number' && payload.tokenVersion !== admin.tokenVersion) {
    return null; // Session has been revoked!
  }
  return admin;
}

// Helper to parse JSON body with stream destruction on overflow
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Request entity too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function getSecurityHeaders(req) {
  const isHttps = isProd || (req && (req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted)));
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': CSP_POLICY,
  };
  if (isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}

function getCorsHeaders(req) {
  const reqOrigin = req ? req.headers.origin : null;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (allowedOrigin) {
    if (reqOrigin === allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  } else if (!isProd) {
    if (reqOrigin) {
      headers['Access-Control-Allow-Origin'] = reqOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    } else {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  }
  return headers;
}

// JSON responder with cache busting and security headers
function sendJson(res, statusCode, data, headers = {}) {
  const req = res.__req;
  const secHeaders = getSecurityHeaders(req);
  const corsHeaders = getCorsHeaders(req);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...secHeaders,
    ...corsHeaders,
    ...headers,
  });
  res.end(JSON.stringify(data));
}

// Static file server with security headers
function serveStatic(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const secHeaders = getSecurityHeaders(req);

  const isDynamicAsset = ext === '.html' || ext === '.pdf';
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': isDynamicAsset ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400',
    ...secHeaders,
  };
  if (isDynamicAsset) {
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.__req = req;
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(req);
    res.writeHead(204, {
      ...corsHeaders,
    });
    return res.end();
  }

  try {
    // ==========================================
    // API ROUTES
    // ==========================================

    // Auth Login with Brute-Force Rate Limiting
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = await parseJsonBody(req);
      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password required' });
      }

      const clientIp = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || email;
      const rateLimitKey = `${clientIp}_${email.toLowerCase().trim()}`;

      if (isRateLimited(loginAttempts, rateLimitKey)) {
        return sendJson(res, 429, { error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' });
      }

      const db = getDatabase();
      const admin = db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
      if (!admin || !verifyPassword(password, admin.passwordHash)) {
        recordFailedAttempt(loginAttempts, rateLimitKey);
        return sendJson(res, 401, { error: 'Invalid admin credentials' });
      }

      clearFailedAttempts(loginAttempts, rateLimitKey);
      const token = createToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        tokenVersion: admin.tokenVersion || 1,
      });
      logActivity('LOGIN', 'Admin', `Admin ${admin.email} signed in`);

      const cookieHeader = buildAuthCookie(req, token);
      return sendJson(res, 200, {
        success: true,
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      }, { 'Set-Cookie': cookieHeader });
    }

    // Auth Logout with Token Version Invalidation
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const admin = getAuthAdmin(req);
      if (admin) {
        const db = getDatabase();
        const adminIndex = db.admins.findIndex((a) => a.id === admin.id);
        if (adminIndex !== -1) {
          db.admins[adminIndex].tokenVersion = (db.admins[adminIndex].tokenVersion || 1) + 1;
          saveDatabase(db);
        }
        logActivity('LOGOUT', 'Admin', `Admin ${admin.email} logged out (session revoked)`);
      }
      const cookieHeader = buildAuthCookie(req, '', true);
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' }, { 'Set-Cookie': cookieHeader });
    }

    // Auth Me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const admin = getAuthAdmin(req);
      if (!admin) {
        return sendJson(res, 401, { authenticated: false, admin: null });
      }
      return sendJson(res, 200, {
        authenticated: true,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      });
    }

    // Auth Change Password (Protected, Rate-Limited, Session-Revoking)
    if (pathname === '/api/auth/change-password' && method === 'POST') {
      const admin = getAuthAdmin(req);
      if (!admin) {
        return sendJson(res, 401, { error: 'Unauthorized. Admin credentials required.' });
      }

      const clientIp = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || admin.id;
      const rateLimitKey = `${clientIp}_${admin.id}`;

      if (isRateLimited(passwordChangeAttempts, rateLimitKey)) {
        return sendJson(res, 429, { error: 'Too many failed password change attempts. Please wait 15 minutes before trying again.' });
      }

      const { currentPassword, newPassword, confirmPassword } = await parseJsonBody(req);
      if (!currentPassword || !newPassword || !confirmPassword) {
        return sendJson(res, 400, { error: 'Current password, new password, and confirmation are required.' });
      }

      if (newPassword !== confirmPassword) {
        return sendJson(res, 400, { error: 'New password and confirmation do not match.' });
      }

      if (!verifyPassword(currentPassword, admin.passwordHash)) {
        recordFailedAttempt(passwordChangeAttempts, rateLimitKey);
        return sendJson(res, 400, { error: 'Current password is incorrect.' });
      }

      // Password length requirements
      if (newPassword.length < 8) {
        return sendJson(res, 400, {
          error: 'New password must be at least 8 characters long.'
        });
      }

      if (currentPassword === newPassword) {
        return sendJson(res, 400, { error: 'New password must be different from current password.' });
      }

      const db = getDatabase();
      const adminIndex = db.admins.findIndex((a) => a.id === admin.id);
      if (adminIndex === -1) {
        return sendJson(res, 500, { error: 'Admin account record not found.' });
      }

      // Invalidate all existing tokens by incrementing tokenVersion
      const newTokenVersion = (db.admins[adminIndex].tokenVersion || 1) + 1;
      db.admins[adminIndex].passwordHash = hashPassword(newPassword);
      db.admins[adminIndex].tokenVersion = newTokenVersion;
      db.admins[adminIndex].passwordChangedAt = new Date().toISOString();
      saveDatabase(db);

      clearFailedAttempts(passwordChangeAttempts, rateLimitKey);
      logActivity('SECURITY', 'Admin', 'Admin password changed successfully and all existing sessions revoked');

      // Issue a fresh token for current session
      const freshToken = createToken({
        id: db.admins[adminIndex].id,
        email: db.admins[adminIndex].email,
        name: db.admins[adminIndex].name,
        role: db.admins[adminIndex].role,
        tokenVersion: newTokenVersion,
      });
      const cookieHeader = buildAuthCookie(req, freshToken);

      return sendJson(res, 200, {
        success: true,
        message: 'Password changed successfully. All other active sessions have been revoked.',
        token: freshToken,
      }, { 'Set-Cookie': cookieHeader });
    }

    // Profile GET & PUT
    if (pathname === '/api/profile') {
      const db = getDatabase();
      if (method === 'GET') {
        return sendJson(res, 200, { profile: db.profile });
      }
      if (method === 'PUT') {
        const admin = getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized admin credentials required' });
        const updates = await parseJsonBody(req);
        db.profile = { ...db.profile, ...updates, updatedAt: new Date().toISOString() };
        saveDatabase(db);
        logActivity('UPDATE', 'Profile', 'Updated personal profile details');
        return sendJson(res, 200, { success: true, profile: db.profile });
      }
    }

    // Asset Upload (Protected, Strict Raster Only, Magic Bytes Verified)
    if (pathname === '/api/upload' && method === 'POST') {
      const admin = getAuthAdmin(req);
      if (!admin) {
        return sendJson(res, 401, { error: 'Unauthorized. Admin credentials required.' });
      }

      const body = await parseJsonBody(req);
      const rawData = body.data || body.fileData;
      const rawName = body.filename || body.fileName || 'upload.png';

      if (!rawData || typeof rawData !== 'string') {
        return sendJson(res, 400, { error: 'No image data provided' });
      }

      const match = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!match) {
        return sendJson(res, 400, { error: 'Invalid file format. Base64 data URL required.' });
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Check max size: 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return sendJson(res, 400, { error: 'File size exceeds maximum 5MB limit' });
      }

      // Strict allowed raster formats only (SVG strictly disallowed to prevent XSS)
      const allowedExts = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
      };

      if (!allowedExts[mimeType]) {
        return sendJson(res, 400, { error: 'Only JPG, PNG, and WebP raster images are allowed. SVG and vector formats are rejected for security.' });
      }

      // Magic bytes signature verification
      function isValidRasterImage(buf, mime) {
        if (!buf || buf.length < 12) return false;
        if (mime === 'image/png') {
          return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
        }
        if (mime === 'image/jpeg') {
          return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
        }
        if (mime === 'image/webp') {
          const isRiff = buf.toString('ascii', 0, 4) === 'RIFF';
          const isWebp = buf.toString('ascii', 8, 12) === 'WEBP';
          return isRiff && isWebp;
        }
        return false;
      }

      if (!isValidRasterImage(buffer, mimeType)) {
        return sendJson(res, 400, { error: 'File signature does not match authentic raster image content' });
      }

      const ext = allowedExts[mimeType];
      const safeBase = path.basename(rawName, path.extname(rawName))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30) || 'asset';

      const randSuffix = crypto.randomBytes(4).toString('hex');
      const filename = `${safeBase}_${Date.now()}_${randSuffix}${ext}`;
      const targetPath = path.normalize(path.join(UPLOADS_DIR, filename));

      // Path traversal safeguard
      if (!targetPath.startsWith(UPLOADS_DIR)) {
        return sendJson(res, 400, { error: 'Invalid file target path' });
      }

      fs.writeFileSync(targetPath, buffer);
      const publicUrl = `/uploads/${filename}`;
      logActivity('UPLOAD', 'File', `Admin uploaded asset: ${filename}`);

      return sendJson(res, 200, {
        success: true,
        url: publicUrl,
        filename,
      });
    }

    // Projects GET & POST
    if (pathname === '/api/projects') {
      const db = getDatabase();
      const admin = getAuthAdmin(req);

      if (method === 'GET') {
        let list = db.projects || [];
        if (!admin) {
          list = list.filter((p) => p.published);
        }
        list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return sendJson(res, 200, { projects: list, isAdmin: !!admin });
      }

      if (method === 'POST') {
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        if (!body.title || !body.shortDesc) {
          return sendJson(res, 400, { error: 'Project title and description required' });
        }

        const newProject = {
          id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: body.title.trim(),
          slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDesc: body.shortDesc.trim(),
          caseStudy: body.caseStudy || '',
          category: body.category || 'Web Applications',
          thumbnail: body.thumbnail || '',
          technologies: Array.isArray(body.technologies) ? body.technologies : ['React', 'Next.js'],
          status: body.status || 'In Progress',
          liveUrl: body.liveUrl?.trim() || '',
          repoUrl: body.repoUrl?.trim() || '',
          featured: !!body.featured,
          published: typeof body.published === 'boolean' ? body.published : true,
          displayOrder: db.projects.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.projects.push(newProject);
        saveDatabase(db);
        logActivity('CREATE', 'Project', `Added project: ${newProject.title}`);
        return sendJson(res, 201, { success: true, project: newProject });
      }
    }

    // Projects Single (PUT, DELETE)
    if (pathname.startsWith('/api/projects/')) {
      const id = pathname.replace('/api/projects/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });

      const idx = db.projects.findIndex((p) => p.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Project not found' });

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        db.projects[idx] = { ...db.projects[idx], ...updates, id, updatedAt: new Date().toISOString() };
        saveDatabase(db);
        logActivity('UPDATE', 'Project', `Updated project: ${db.projects[idx].title}`);
        return sendJson(res, 200, { success: true, project: db.projects[idx] });
      }

      if (method === 'DELETE') {
        const deleted = db.projects.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Project', `Deleted project: ${deleted.title}`);
        return sendJson(res, 200, { success: true, message: 'Deleted' });
      }
    }

    // Certifications GET & POST
    if (pathname === '/api/certifications') {
      const db = getDatabase();
      const admin = getAuthAdmin(req);

      if (method === 'GET') {
        let list = db.certifications || [];
        if (!admin) list = list.filter((c) => c.published);
        return sendJson(res, 200, { certifications: list, isAdmin: !!admin });
      }

      if (method === 'POST') {
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        if (!body.title || !body.issuer || !body.issueDate) {
          return sendJson(res, 400, { error: 'Title, issuer, and issue date are required' });
        }

        const newCert = {
          id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: body.title.trim(),
          issuer: body.issuer.trim(),
          issueDate: body.issueDate.trim(),
          credentialId: body.credentialId?.trim() || '',
          verificationUrl: body.verificationUrl?.trim() || '',
          published: typeof body.published === 'boolean' ? body.published : true,
          displayOrder: db.certifications.length + 1,
        };

        db.certifications.push(newCert);
        saveDatabase(db);
        logActivity('CREATE', 'Certification', `Added certification: ${newCert.title}`);
        return sendJson(res, 201, { success: true, certification: newCert });
      }
    }

    // Certifications Single (PUT, DELETE)
    if (pathname.startsWith('/api/certifications/')) {
      const id = pathname.replace('/api/certifications/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });

      const idx = db.certifications.findIndex((c) => c.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Certification not found' });

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        db.certifications[idx] = { ...db.certifications[idx], ...updates, id };
        saveDatabase(db);
        logActivity('UPDATE', 'Certification', `Updated cert: ${db.certifications[idx].title}`);
        return sendJson(res, 200, { success: true, certification: db.certifications[idx] });
      }

      if (method === 'DELETE') {
        const deleted = db.certifications.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Certification', `Deleted cert: ${deleted.title}`);
        return sendJson(res, 200, { success: true, message: 'Deleted' });
      }
    }

    // Skills GET & POST
    if (pathname === '/api/skills') {
      const db = getDatabase();
      if (method === 'GET') {
        return sendJson(res, 200, { skills: db.skills || [] });
      }
      if (method === 'POST') {
        const admin = getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const newSkill = {
          id: `sk-${Date.now()}`,
          name: body.name.trim(),
          category: body.category || 'Frontend',
          icon: body.icon || 'Code',
          featured: typeof body.featured === 'boolean' ? body.featured : true,
          displayOrder: (db.skills || []).length + 1,
        };
        db.skills = db.skills || [];
        db.skills.push(newSkill);
        saveDatabase(db);
        logActivity('CREATE', 'Skill', `Added skill: ${newSkill.name}`);
        return sendJson(res, 201, { success: true, skill: newSkill });
      }
    }

    if (pathname.startsWith('/api/skills/')) {
      const id = pathname.replace('/api/skills/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      db.skills = db.skills || [];
      const idx = db.skills.findIndex((s) => s.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Skill not found' });
      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        db.skills[idx] = { ...db.skills[idx], ...updates, id };
        saveDatabase(db);
        logActivity('UPDATE', 'Skill', `Updated skill: ${db.skills[idx].name}`);
        return sendJson(res, 200, { success: true, skill: db.skills[idx] });
      }
      if (method === 'DELETE') {
        const del = db.skills.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Skill', `Deleted skill: ${del.name}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Experience GET, POST, PUT, DELETE
    if (pathname === '/api/experience') {
      const db = getDatabase();
      if (method === 'GET') {
        return sendJson(res, 200, { experiences: db.experiences || [] });
      }
      if (method === 'POST') {
        const admin = getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const newExp = {
          id: `exp-${Date.now()}`,
          role: body.role?.trim() || '',
          company: body.company?.trim() || '',
          location: body.location?.trim() || '',
          period: body.period?.trim() || '',
          description: body.description?.trim() || '',
          highlights: Array.isArray(body.highlights) ? body.highlights : (body.highlights ? body.highlights.split('\n').filter(Boolean) : []),
          type: body.type || 'work',
          displayOrder: (db.experiences || []).length + 1,
        };
        db.experiences = db.experiences || [];
        db.experiences.push(newExp);
        saveDatabase(db);
        logActivity('CREATE', 'Experience', `Added experience: ${newExp.role}`);
        return sendJson(res, 201, { success: true, experience: newExp });
      }
    }

    if (pathname.startsWith('/api/experience/')) {
      const id = pathname.replace('/api/experience/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      db.experiences = db.experiences || [];
      const idx = db.experiences.findIndex((e) => e.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Experience not found' });
      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        if (updates.highlights && typeof updates.highlights === 'string') {
          updates.highlights = updates.highlights.split('\n').filter(Boolean);
        }
        db.experiences[idx] = { ...db.experiences[idx], ...updates, id };
        saveDatabase(db);
        logActivity('UPDATE', 'Experience', `Updated experience: ${db.experiences[idx].role}`);
        return sendJson(res, 200, { success: true, experience: db.experiences[idx] });
      }
      if (method === 'DELETE') {
        const del = db.experiences.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Experience', `Deleted experience: ${del.role}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Events GET, POST, PUT, DELETE
    if (pathname === '/api/events') {
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (method === 'GET') {
        let list = db.events || [];
        if (!admin) list = list.filter((e) => e.published);
        return sendJson(res, 200, { events: list, isAdmin: !!admin });
      }
      if (method === 'POST') {
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const newEvent = {
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: body.title?.trim() || '',
          role: body.role || 'Participant',
          date: body.date || '',
          location: body.location || '',
          description: body.description || '',
          published: typeof body.published === 'boolean' ? body.published : true,
          displayOrder: (db.events || []).length + 1,
        };
        db.events = db.events || [];
        db.events.push(newEvent);
        saveDatabase(db);
        logActivity('CREATE', 'Event', `Added event: ${newEvent.title}`);
        return sendJson(res, 201, { success: true, event: newEvent });
      }
    }

    if (pathname.startsWith('/api/events/')) {
      const id = pathname.replace('/api/events/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      db.events = db.events || [];
      const idx = db.events.findIndex((e) => e.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Event not found' });
      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        db.events[idx] = { ...db.events[idx], ...updates, id };
        saveDatabase(db);
        logActivity('UPDATE', 'Event', `Updated event: ${db.events[idx].title}`);
        return sendJson(res, 200, { success: true, event: db.events[idx] });
      }
      if (method === 'DELETE') {
        const del = db.events.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Event', `Deleted event: ${del.title}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Services GET, POST, PUT, DELETE
    if (pathname === '/api/services') {
      const db = getDatabase();
      if (method === 'GET') {
        return sendJson(res, 200, { services: db.services || [] });
      }
      if (method === 'POST') {
        const admin = getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const newServ = {
          id: `serv-${Date.now()}`,
          title: body.title?.trim() || '',
          description: body.description?.trim() || '',
          icon: body.icon || 'Layout',
          category: body.category || 'Development',
          features: Array.isArray(body.features) ? body.features : (body.features ? body.features.split('\n').filter(Boolean) : []),
          displayOrder: (db.services || []).length + 1,
        };
        db.services = db.services || [];
        db.services.push(newServ);
        saveDatabase(db);
        logActivity('CREATE', 'Service', `Added service: ${newServ.title}`);
        return sendJson(res, 201, { success: true, service: newServ });
      }
    }

    if (pathname.startsWith('/api/services/')) {
      const id = pathname.replace('/api/services/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      db.services = db.services || [];
      const idx = db.services.findIndex((s) => s.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Service not found' });
      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        if (updates.features && typeof updates.features === 'string') {
          updates.features = updates.features.split('\n').filter(Boolean);
        }
        db.services[idx] = { ...db.services[idx], ...updates, id };
        saveDatabase(db);
        logActivity('UPDATE', 'Service', `Updated service: ${db.services[idx].title}`);
        return sendJson(res, 200, { success: true, service: db.services[idx] });
      }
      if (method === 'DELETE') {
        const del = db.services.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Service', `Deleted service: ${del.title}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Contact Submissions (Public POST, Admin GET, Admin PATCH, Admin DELETE)
    if (pathname === '/api/contact') {
      const db = getDatabase();
      if (method === 'POST') {
        const { name, email, subject, message, _hp } = await parseJsonBody(req);
        if (_hp) {
          // Honeypot caught spam bot
          return sendJson(res, 200, { success: true, message: 'Message received.' });
        }
        if (!name || !email || !message) {
          return sendJson(res, 400, { error: 'Name, email, and message are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return sendJson(res, 400, { error: 'Please enter a valid email address' });
        }

        const newInquiry = {
          id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: name.trim(),
          email: email.trim(),
          subject: subject?.trim() || 'Project Inquiry via Portfolio',
          message: message.trim(),
          status: 'unread',
          createdAt: new Date().toISOString(),
        };

        db.inquiries = [newInquiry, ...(db.inquiries || [])];
        saveDatabase(db);
        logActivity('INQUIRY', 'Contact', `New message from ${newInquiry.name} (${newInquiry.email})`);

        return sendJson(res, 201, {
          success: true,
          message: 'Thank you! Your message has been sent directly to Charan Sai.',
          inquiryId: newInquiry.id,
        });
      }

      if (method === 'GET') {
        const admin = getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        return sendJson(res, 200, { inquiries: db.inquiries || [] });
      }
    }

    if (pathname.startsWith('/api/contact/')) {
      const id = pathname.replace('/api/contact/', '');
      const db = getDatabase();
      const admin = getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      db.inquiries = db.inquiries || [];
      const idx = db.inquiries.findIndex((i) => i.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Inquiry not found' });
      if (method === 'PATCH') {
        const updates = await parseJsonBody(req);
        db.inquiries[idx] = { ...db.inquiries[idx], ...updates };
        saveDatabase(db);
        return sendJson(res, 200, { success: true, inquiry: db.inquiries[idx] });
      }
      if (method === 'DELETE') {
        const del = db.inquiries.splice(idx, 1)[0];
        saveDatabase(db);
        logActivity('DELETE', 'Inquiry', `Deleted inquiry from: ${del.name}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Settings GET & PUT
    if (pathname === '/api/settings') {
      const db = getDatabase();
      if (method === 'GET') {
        return sendJson(res, 200, { settings: db.settings });
      }
      if (method === 'PUT') {
        const admin = getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const updates = await parseJsonBody(req);
        db.settings = { ...db.settings, ...updates };
        saveDatabase(db);
        logActivity('UPDATE', 'Settings', 'Updated appearance & SEO settings');
        return sendJson(res, 200, { success: true, settings: db.settings });
      }
    }

    // ==========================================
    // PAGE & STATIC ROUTES
    // ==========================================

    // Home page
    if (pathname === '/' || pathname === '/index.html') {
      return serveStatic(req, res, path.join(PUBLIC_DIR, 'index.html'));
    }

    // Admin dashboard
    if (pathname === '/admin' || pathname === '/admin/') {
      return serveStatic(req, res, path.join(PUBLIC_DIR, 'admin.html'));
    }

    // Admin login
    if (pathname === '/admin/login') {
      return serveStatic(req, res, path.join(PUBLIC_DIR, 'admin-login.html'));
    }

    // Dedicated Resume Endpoints (instant vector PDF download with legal name & no cache)
    if (
      pathname === '/resume' ||
      pathname === '/cv' ||
      pathname === '/download-resume' ||
      pathname === '/Charan_Sai_Resume.pdf' ||
      pathname === '/KAMARAJUGADDA_CHARAN_SAI_Resume.pdf'
    ) {
      const resumeFilePath = path.join(PUBLIC_DIR, 'KAMARAJUGADDA_CHARAN_SAI_Resume.pdf');
      const fallbackPath = path.join(PUBLIC_DIR, 'Charan_Sai_Resume.pdf');
      const targetPath = fs.existsSync(resumeFilePath) ? resumeFilePath : fallbackPath;
      if (fs.existsSync(targetPath)) {
        const secHeaders = getSecurityHeaders(req);
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="KAMARAJUGADDA_CHARAN_SAI_Resume.pdf"',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...secHeaders,
        });
        return fs.createReadStream(targetPath).pipe(res);
      }
    }

    // Dedicated serving for persistent uploads directory
    if (pathname.startsWith('/uploads/')) {
      const rel = pathname.slice('/uploads/'.length);
      const safeUploadPath = path.normalize(path.join(UPLOADS_DIR, rel));
      if (safeUploadPath.startsWith(UPLOADS_DIR) && fs.existsSync(safeUploadPath) && !fs.statSync(safeUploadPath).isDirectory()) {
        return serveStatic(req, res, safeUploadPath);
      }
    }

    // Static asset fallback in public/
    const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
    if (safePath.startsWith(PUBLIC_DIR) && fs.existsSync(safePath) && !fs.statSync(safePath).isDirectory()) {
      return serveStatic(req, res, safePath);
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (isProd) {
      console.error(`FATAL: Port ${currentPort} is already in use. Cloud deployment health checks require binding to the assigned PORT.`);
      process.exit(1);
    }
    console.warn(`[PORT IN USE] Port ${currentPort} is already occupied by another service. Trying port ${currentPort + 1} (dev fallback)...`);
    currentPort++;
    setTimeout(() => {
      server.listen(currentPort, HOST);
    }, 150);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(currentPort, HOST, () => {
  console.log(`\n=======================================================`);
  console.log(`  Charan Sai Portfolio Server is RUNNING!`);
  console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Host & Port:      ${HOST}:${currentPort}`);
  console.log(`  Storage DATA_DIR: ${path.join(__dirname, '..', 'data')}`);
  console.log(`  Storage UPLOADS:  ${UPLOADS_DIR}`);
  console.log(`  Website URL:      http://localhost:${currentPort}`);
  console.log(`  Admin Dashboard:  http://localhost:${currentPort}/admin`);
  console.log(`=======================================================\n`);
});


