const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const {
  getDatabase,
  saveDatabase,
  initNeonDatabase,
  isNeonConnected,
  queryNeon,
  logActivity,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} = require('./db');
const neon = require('./neon');

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

function isRateLimited(store, key, maxAttempts = 15, lockDurationMs = 2 * 60 * 1000) {
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

function recordFailedAttempt(store, key, maxAttempts = 15, lockDurationMs = 2 * 60 * 1000) {
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

// Helper to verify request admin auth (supports Authorization Bearer header and session cookie)
async function getAuthAdmin(req) {
  const candidates = [];

  // 1. Prioritize Authorization: Bearer header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const candidate = req.headers.authorization.slice(7).trim();
    if (candidate && candidate !== 'null' && candidate !== 'undefined') {
      candidates.push(candidate);
    }
  }

  // 2. Also check session cookie
  const cookies = parseCookies(req);
  if (cookies['charan_admin_session']) {
    candidates.push(cookies['charan_admin_session']);
  }

  if (candidates.length === 0) return null;

  for (const token of candidates) {
    const payload = verifyToken(token);
    if (payload && (payload.id || payload.email)) {
      let admin = null;
      if (payload.id) admin = await neon.getAdminById(payload.id);
      if (!admin && payload.email) admin = await neon.getAdminByEmail(payload.email);
      if (!admin) {
        const db = getDatabase();
        admin = (db.admins || []).find((a) => a.id === payload.id || a.email === payload.email);
      }
      if (admin) return admin;
    }
  }

  return null;
}

// Helper to parse JSON body with stream destruction on overflow (15MB limit)
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
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
  "connect-src 'self' https://formspree.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
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

  const isDynamicAsset = ext === '.html' || ext === '.pdf' || ext === '.json';
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': isDynamicAsset ? 'no-cache, no-store, must-revalidate, max-age=0' : 'public, max-age=86400',
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

      const identifier = String(email || '').toLowerCase().trim();
      const clientIp = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || identifier;
      const rateLimitKey = `${clientIp}_${identifier}`;

      if (isRateLimited(loginAttempts, rateLimitKey)) {
        return sendJson(res, 429, { error: 'Too many failed login attempts. Please wait 2 minutes before trying again.' });
      }

      let admin = await neon.getAdminByEmail(identifier);
      if (!admin) {
        const db = getDatabase();
        admin = (db.admins || []).find((a) => {
          const aEmail = String(a.email || '').toLowerCase().trim();
          const profEmail = String(db.profile?.email || '').toLowerCase().trim();
          return (
            aEmail === identifier ||
            identifier === 'admin' ||
            identifier === 'charan' ||
            identifier === 'charansai' ||
            (profEmail && profEmail === identifier)
          );
        });
      }

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
      const admin = await getAuthAdmin(req);
      if (admin) {
        await neon.updateAdminTokenVersion(admin.id, (admin.tokenVersion || 1) + 1);
        const db = getDatabase();
        const adminIndex = (db.admins || []).findIndex((a) => a.id === admin.id);
        if (adminIndex !== -1) {
          db.admins[adminIndex].tokenVersion = (db.admins[adminIndex].tokenVersion || 1) + 1;
          saveDatabase(db);
        }
        logActivity('LOGOUT', 'Admin', `Admin ${admin.email} logged out (session revoked)`);
      }
      const cookieHeader = buildAuthCookie(req, '', true);
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' }, { 'Set-Cookie': cookieHeader });
    }

    // Database & Neon PostgreSQL Status
    if (pathname === '/api/db/status' && method === 'GET') {
      let counts = {};
      try {
        const [adm, prj, skl, tm, crt, srv, exp] = await Promise.all([
          neon.query('SELECT COUNT(*) AS c FROM admins;'),
          neon.query('SELECT COUNT(*) AS c FROM projects;'),
          neon.query('SELECT COUNT(*) AS c FROM skills;'),
          neon.query('SELECT COUNT(*) AS c FROM team_members;'),
          neon.query('SELECT COUNT(*) AS c FROM certifications;'),
          neon.query('SELECT COUNT(*) AS c FROM services;'),
          neon.query('SELECT COUNT(*) AS c FROM experiences;'),
        ]);
        counts = {
          admins: parseInt(adm[0]?.c || 0, 10),
          projects: parseInt(prj[0]?.c || 0, 10),
          skills: parseInt(skl[0]?.c || 0, 10),
          team: parseInt(tm[0]?.c || 0, 10),
          certifications: parseInt(crt[0]?.c || 0, 10),
          services: parseInt(srv[0]?.c || 0, 10),
          experiences: parseInt(exp[0]?.c || 0, 10),
        };
      } catch (err) {
        console.warn('[NEON] /api/db/status query warning:', err.message);
        const db = getDatabase();
        counts = {
          admins: (db.admins || []).length,
          projects: (db.projects || []).length,
          skills: (db.skills || []).length,
          team: (db.team || []).length,
          certifications: (db.certifications || []).length,
          services: (db.services || []).length,
          experiences: (db.experiences || []).length,
        };
      }
      return sendJson(res, 200, {
        database: 'Neon PostgreSQL',
        connected: isNeonConnected(),
        counts,
        timestamp: new Date().toISOString(),
      });
    }

    // Auth Me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const admin = await getAuthAdmin(req);
      if (!admin) {
        return sendJson(res, 401, { authenticated: false, admin: null });
      }
      const token = createToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        tokenVersion: admin.tokenVersion || 1,
      });
      const cookieHeader = buildAuthCookie(req, token);
      return sendJson(res, 200, {
        authenticated: true,
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      }, { 'Set-Cookie': cookieHeader });
    }

    // Auth Change Password (Protected, Rate-Limited, Session-Revoking)
    if (pathname === '/api/auth/change-password' && method === 'POST') {
      const admin = await getAuthAdmin(req);
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

      const newTokenVersion = (admin.tokenVersion || 1) + 1;
      const newHash = hashPassword(newPassword);

      await neon.updateAdminPassword(admin.id, newHash, newTokenVersion);
      const db = getDatabase();
      const adminIndex = (db.admins || []).findIndex((a) => a.id === admin.id);
      if (adminIndex !== -1) {
        db.admins[adminIndex].passwordHash = newHash;
        db.admins[adminIndex].tokenVersion = newTokenVersion;
        db.admins[adminIndex].passwordChangedAt = new Date().toISOString();
        saveDatabase(db);
      }

      clearFailedAttempts(passwordChangeAttempts, rateLimitKey);
      logActivity('SECURITY', 'Admin', 'Admin password changed successfully and all existing sessions revoked');

      // Issue a fresh token for current session
      const freshToken = createToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
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
      if (method === 'GET') {
        try {
          const liveProfile = await neon.getProfile();
          if (liveProfile) {
            return sendJson(res, 200, { profile: liveProfile });
          }
        } catch (err) {
          console.warn('[NEON] Profile live query failed:', err.message);
        }
        const db = getDatabase();
        return sendJson(res, 200, { profile: db.profile || {} });
      }
      if (method === 'PUT') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized admin credentials required' });
        const updates = await parseJsonBody(req);
        const existing = (await neon.getProfile()) || getDatabase().profile || {};
        const updatedProfile = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        try {
          await neon.upsertProfile(updatedProfile);
        } catch (err) {
          console.error('[NEON] Failed to sync profile to Neon:', err.message);
        }
        const db = getDatabase();
        db.profile = updatedProfile;
        saveDatabase(db);
        logActivity('UPDATE', 'Profile', 'Updated personal profile details');
        return sendJson(res, 200, { success: true, profile: updatedProfile });
      }
    }

    // Asset Upload (Protected, Strict Raster Only, Magic Bytes Verified)
    if (pathname === '/api/upload' && method === 'POST') {
      const admin = await getAuthAdmin(req);
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

      // Check max size: 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        return sendJson(res, 400, { error: 'File size exceeds maximum 10MB limit' });
      }

      // Strict allowed raster formats only (SVG strictly disallowed to prevent XSS)
      const allowedExts = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/pjpeg': '.jpg',
        'image/jfif': '.jpg',
        'image/png': '.png',
        'image/x-png': '.png',
        'image/webp': '.webp',
      };

      if (!allowedExts[mimeType]) {
        return sendJson(res, 400, { error: 'Only JPG, PNG, and WebP raster images are allowed. SVG and vector formats are rejected for security.' });
      }

      // Magic bytes signature verification
      function isValidRasterImage(buf, mime) {
        if (!buf || buf.length < 12) return false;
        if (mime.includes('png')) {
          return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
        }
        if (mime.includes('jpeg') || mime.includes('jpg') || mime.includes('pjpeg') || mime.includes('jfif')) {
          return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
        }
        if (mime.includes('webp')) {
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

      // Persist asset to Neon PostgreSQL cloud database
      try {
        await neon.saveUploadedAsset(filename, mimeType, base64Data);
      } catch (neonErr) {
        console.warn('[NEON] Could not sync uploaded asset to Neon:', neonErr.message);
      }

      return sendJson(res, 200, {
        success: true,
        url: publicUrl,
        dataUrl: rawData,
        filename,
      });
    }

    // Projects GET & POST
    if (pathname === '/api/projects') {
      const admin = await getAuthAdmin(req);

      if (method === 'GET') {
        try {
          const projs = await neon.getProjects(!admin);
          return sendJson(res, 200, { projects: projs, isAdmin: !!admin });
        } catch (err) {
          console.warn('[NEON] Projects live query error:', err.message);
          const db = getDatabase();
          let list = db.projects || [];
          if (!admin) list = list.filter((p) => p.published);
          list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          return sendJson(res, 200, { projects: list, isAdmin: !!admin });
        }
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
          displayOrder: parseInt(body.displayOrder, 10) || 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await neon.upsertProject(newProject);
        const db = getDatabase();
        db.projects = db.projects || [];
        db.projects.push(newProject);
        saveDatabase(db);
        logActivity('CREATE', 'Project', `Added project: ${newProject.title}`);
        return sendJson(res, 201, { success: true, project: newProject });
      }
    }

    // Projects Single (PUT, DELETE)
    if (pathname.startsWith('/api/projects/')) {
      const id = pathname.replace('/api/projects/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });

      const db = getDatabase();
      db.projects = db.projects || [];
      const idx = db.projects.findIndex((p) => p.id === id);

      if (method === 'PUT') {
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getProjectById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.projects[idx];
        if (!existing) return sendJson(res, 404, { error: 'Project not found' });

        const updates = await parseJsonBody(req);
        const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
        try {
          await neon.upsertProject(updated);
        } catch (err) {
          console.error('[NEON] Failed to update project in Neon:', err.message);
        }
        if (idx !== -1) db.projects[idx] = updated;
        saveDatabase(db);
        logActivity('UPDATE', 'Project', `Updated project: ${updated.title}`);
        return sendJson(res, 200, { success: true, project: updated });
      }

      if (method === 'DELETE') {
        try {
          await neon.deleteProject(id);
        } catch (err) {
          console.error('[NEON] Failed to delete project from Neon:', err.message);
        }
        let delTitle = id;
        if (idx !== -1) {
          const del = db.projects.splice(idx, 1)[0];
          delTitle = del.title;
        } else {
          db.projects = db.projects.filter((p) => p.id !== id);
        }
        saveDatabase(db);
        logActivity('DELETE', 'Project', `Deleted project: ${delTitle}`);
        return sendJson(res, 200, { success: true, message: 'Deleted' });
      }
    }

    // Certifications GET & POST
    if (pathname === '/api/certifications') {
      const admin = await getAuthAdmin(req);

      if (method === 'GET') {
        try {
          const certs = await neon.getCertifications(!admin);
          return sendJson(res, 200, { certifications: certs, isAdmin: !!admin });
        } catch (err) {
          console.warn('[NEON] Certifications live query error:', err.message);
          const db = getDatabase();
          let list = db.certifications || [];
          if (!admin) list = list.filter((c) => c.published);
          return sendJson(res, 200, { certifications: list, isAdmin: !!admin });
        }
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
          displayOrder: parseInt(body.displayOrder, 10) || 1,
        };

        await neon.upsertCertification(newCert);
        const db = getDatabase();
        db.certifications = db.certifications || [];
        db.certifications.push(newCert);
        saveDatabase(db);
        logActivity('CREATE', 'Certification', `Added certification: ${newCert.title}`);
        return sendJson(res, 201, { success: true, certification: newCert });
      }
    }

    // Certifications Single (PUT, DELETE)
    if (pathname.startsWith('/api/certifications/')) {
      const id = pathname.replace('/api/certifications/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });

      const db = getDatabase();
      db.certifications = db.certifications || [];
      const idx = db.certifications.findIndex((c) => c.id === id);

      if (method === 'PUT') {
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getCertificationById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.certifications[idx];
        if (!existing) return sendJson(res, 404, { error: 'Certification not found' });

        const updates = await parseJsonBody(req);
        const updated = { ...existing, ...updates, id };
        try {
          await neon.upsertCertification(updated);
        } catch (err) {
          console.error('[NEON] Failed to update certification in Neon:', err.message);
        }
        if (idx !== -1) db.certifications[idx] = updated;
        saveDatabase(db);
        logActivity('UPDATE', 'Certification', `Updated cert: ${updated.title}`);
        return sendJson(res, 200, { success: true, certification: updated });
      }

      if (method === 'DELETE') {
        try {
          await neon.deleteCertification(id);
        } catch (err) {
          console.error('[NEON] Failed to delete certification from Neon:', err.message);
        }
        let delTitle = id;
        if (idx !== -1) {
          const del = db.certifications.splice(idx, 1)[0];
          delTitle = del.title;
        } else {
          db.certifications = db.certifications.filter((c) => c.id !== id);
        }
        saveDatabase(db);
        logActivity('DELETE', 'Certification', `Deleted cert: ${delTitle}`);
        return sendJson(res, 200, { success: true, message: 'Deleted' });
      }
    }

    // Skills GET & POST
    if (pathname === '/api/skills') {
      if (method === 'GET') {
        if (isNeonConnected()) {
          try {
            const skills = await neon.getSkills();
            return sendJson(res, 200, { skills });
          } catch (err) {
            console.warn('[NEON] Skills live query error:', err.message);
          }
        }
        const db = getDatabase();
        return sendJson(res, 200, { skills: db.skills || [] });
      }
      if (method === 'POST') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        if (!body.name) return sendJson(res, 400, { error: 'Skill name is required' });
        const db = getDatabase();
        const count = isNeonConnected() ? (await neon.getSkills()).length : (db.skills || []).length;
        const newSkill = {
          id: `sk-${Date.now()}`,
          name: body.name.trim(),
          category: body.category || 'Frontend',
          icon: body.icon || 'Code',
          featured: typeof body.featured === 'boolean' ? body.featured : true,
          displayOrder: parseInt(body.displayOrder, 10) || count + 1,
        };
        try {
          await neon.upsertSkill(newSkill);
        } catch (err) {
          console.error('[NEON] Failed to sync new skill to Neon:', err.message);
        }
        db.skills = db.skills || [];
        db.skills.push(newSkill);
        saveDatabase(db);
        logActivity('CREATE', 'Skill', `Added skill: ${newSkill.name}`);
        return sendJson(res, 201, { success: true, skill: newSkill });
      }
    }

    if (pathname.startsWith('/api/skills/')) {
      const id = pathname.replace('/api/skills/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      const db = getDatabase();
      db.skills = db.skills || [];
      const idx = db.skills.findIndex((s) => s.id === id);

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getSkillById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.skills[idx];
        if (!existing) return sendJson(res, 404, { error: 'Skill not found' });

        const updatedSkill = { ...existing, ...updates, id };
        try {
          await neon.upsertSkill(updatedSkill);
        } catch (err) {
          console.error('[NEON] Failed to update skill in Neon:', err.message);
        }
        if (idx !== -1) db.skills[idx] = updatedSkill;
        saveDatabase(db);
        logActivity('UPDATE', 'Skill', `Updated skill: ${updatedSkill.name}`);
        return sendJson(res, 200, { success: true, skill: updatedSkill });
      }
      if (method === 'DELETE') {
        try {
          await neon.deleteSkill(id);
        } catch (err) {
          console.error('[NEON] Failed to delete skill from Neon:', err.message);
        }
        let delName = id;
        if (idx !== -1) {
          const del = db.skills.splice(idx, 1)[0];
          delName = del.name;
        }
        saveDatabase(db);
        logActivity('DELETE', 'Skill', `Deleted skill: ${delName}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Experience GET, POST, PUT, DELETE
    if (pathname === '/api/experience') {
      if (method === 'GET') {
        if (isNeonConnected()) {
          try {
            const experiences = await neon.getExperiences();
            return sendJson(res, 200, { experiences });
          } catch (err) {
            console.warn('[NEON] Experiences live query error:', err.message);
          }
        }
        const db = getDatabase();
        return sendJson(res, 200, { experiences: db.experiences || [] });
      }
      if (method === 'POST') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const db = getDatabase();
        const count = isNeonConnected() ? (await neon.getExperiences()).length : (db.experiences || []).length;
        const newExp = {
          id: `exp-${Date.now()}`,
          role: body.role?.trim() || '',
          company: body.company?.trim() || '',
          location: body.location?.trim() || '',
          period: body.period?.trim() || '',
          description: body.description?.trim() || '',
          highlights: Array.isArray(body.highlights) ? body.highlights : (body.highlights ? body.highlights.split('\n').filter(Boolean) : []),
          type: body.type || 'work',
          displayOrder: parseInt(body.displayOrder, 10) || count + 1,
        };
        try {
          await neon.upsertExperience(newExp);
        } catch (err) {
          console.error('[NEON] Failed to sync new experience to Neon:', err.message);
        }
        db.experiences = db.experiences || [];
        db.experiences.push(newExp);
        saveDatabase(db);
        logActivity('CREATE', 'Experience', `Added experience: ${newExp.role}`);
        return sendJson(res, 201, { success: true, experience: newExp });
      }
    }

    if (pathname.startsWith('/api/experience/')) {
      const id = pathname.replace('/api/experience/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      const db = getDatabase();
      db.experiences = db.experiences || [];
      const idx = db.experiences.findIndex((e) => e.id === id);

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        if (updates.highlights && typeof updates.highlights === 'string') {
          updates.highlights = updates.highlights.split('\n').filter(Boolean);
        }
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getExperienceById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.experiences[idx];
        if (!existing) return sendJson(res, 404, { error: 'Experience not found' });

        const updatedExp = { ...existing, ...updates, id };
        try {
          await neon.upsertExperience(updatedExp);
        } catch (err) {
          console.error('[NEON] Failed to update experience in Neon:', err.message);
        }
        if (idx !== -1) db.experiences[idx] = updatedExp;
        saveDatabase(db);
        logActivity('UPDATE', 'Experience', `Updated experience: ${updatedExp.role}`);
        return sendJson(res, 200, { success: true, experience: updatedExp });
      }
      if (method === 'DELETE') {
        try {
          await neon.deleteExperience(id);
        } catch (err) {
          console.error('[NEON] Failed to delete experience from Neon:', err.message);
        }
        let delName = id;
        if (idx !== -1) {
          const del = db.experiences.splice(idx, 1)[0];
          delName = del.role;
        }
        saveDatabase(db);
        logActivity('DELETE', 'Experience', `Deleted experience: ${delName}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Events GET, POST, PUT, DELETE
    if (pathname === '/api/events') {
      const admin = await getAuthAdmin(req);
      if (method === 'GET') {
        if (isNeonConnected()) {
          try {
            let events = await neon.getEvents(!admin);
            return sendJson(res, 200, { events, isAdmin: !!admin });
          } catch (err) {
            console.warn('[NEON] Events live query error:', err.message);
          }
        }
        const db = getDatabase();
        let list = db.events || [];
        if (!admin) list = list.filter((e) => e.published);
        return sendJson(res, 200, { events: list, isAdmin: !!admin });
      }
      if (method === 'POST') {
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const db = getDatabase();
        const count = isNeonConnected() ? (await neon.getEvents()).length : (db.events || []).length;
        const newEvent = {
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: body.title?.trim() || '',
          role: body.role || 'Participant',
          date: body.date || '',
          location: body.location || '',
          description: body.description || '',
          published: typeof body.published === 'boolean' ? body.published : true,
          displayOrder: parseInt(body.displayOrder, 10) || count + 1,
        };
        try {
          await neon.upsertEvent(newEvent);
        } catch (err) {
          console.error('[NEON] Failed to sync new event to Neon:', err.message);
        }
        db.events = db.events || [];
        db.events.push(newEvent);
        saveDatabase(db);
        logActivity('CREATE', 'Event', `Added event: ${newEvent.title}`);
        return sendJson(res, 201, { success: true, event: newEvent });
      }
    }

    if (pathname.startsWith('/api/events/')) {
      const id = pathname.replace('/api/events/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      const db = getDatabase();
      db.events = db.events || [];
      const idx = db.events.findIndex((e) => e.id === id);

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getEventById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.events[idx];
        if (!existing) return sendJson(res, 404, { error: 'Event not found' });

        const updatedEvent = { ...existing, ...updates, id };
        try {
          await neon.upsertEvent(updatedEvent);
        } catch (err) {
          console.error('[NEON] Failed to update event in Neon:', err.message);
        }
        if (idx !== -1) db.events[idx] = updatedEvent;
        saveDatabase(db);
        logActivity('UPDATE', 'Event', `Updated event: ${updatedEvent.title}`);
        return sendJson(res, 200, { success: true, event: updatedEvent });
      }
      if (method === 'DELETE') {
        try {
          await neon.deleteEvent(id);
        } catch (err) {
          console.error('[NEON] Failed to delete event from Neon:', err.message);
        }
        let delName = id;
        if (idx !== -1) {
          const del = db.events.splice(idx, 1)[0];
          delName = del.title;
        }
        saveDatabase(db);
        logActivity('DELETE', 'Event', `Deleted event: ${delName}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Services GET, POST, PUT, DELETE
    if (pathname === '/api/services') {
      if (method === 'GET') {
        if (isNeonConnected()) {
          try {
            const services = await neon.getServices();
            return sendJson(res, 200, { services });
          } catch (err) {
            console.warn('[NEON] Services live query error:', err.message);
          }
        }
        const db = getDatabase();
        return sendJson(res, 200, { services: db.services || [] });
      }
      if (method === 'POST') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseJsonBody(req);
        const db = getDatabase();
        const count = isNeonConnected() ? (await neon.getServices()).length : (db.services || []).length;
        const newServ = {
          id: `serv-${Date.now()}`,
          title: body.title?.trim() || '',
          description: body.description?.trim() || '',
          icon: body.icon || 'Layout',
          category: body.category || 'Development',
          features: Array.isArray(body.features) ? body.features : (body.features ? body.features.split('\n').filter(Boolean) : []),
          displayOrder: parseInt(body.displayOrder, 10) || count + 1,
        };
        try {
          await neon.upsertService(newServ);
        } catch (err) {
          console.error('[NEON] Failed to sync new service to Neon:', err.message);
        }
        db.services = db.services || [];
        db.services.push(newServ);
        saveDatabase(db);
        logActivity('CREATE', 'Service', `Added service: ${newServ.title}`);
        return sendJson(res, 201, { success: true, service: newServ });
      }
    }

    if (pathname.startsWith('/api/services/')) {
      const id = pathname.replace('/api/services/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      const db = getDatabase();
      db.services = db.services || [];
      const idx = db.services.findIndex((s) => s.id === id);

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        if (updates.features && typeof updates.features === 'string') {
          updates.features = updates.features.split('\n').filter(Boolean);
        }
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getServiceById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.services[idx];
        if (!existing) return sendJson(res, 404, { error: 'Service not found' });

        const updatedServ = { ...existing, ...updates, id };
        try {
          await neon.upsertService(updatedServ);
        } catch (err) {
          console.error('[NEON] Failed to update service in Neon:', err.message);
        }
        if (idx !== -1) db.services[idx] = updatedServ;
        saveDatabase(db);
        logActivity('UPDATE', 'Service', `Updated service: ${updatedServ.title}`);
        return sendJson(res, 200, { success: true, service: updatedServ });
      }
      if (method === 'DELETE') {
        try {
          await neon.deleteService(id);
        } catch (err) {
          console.error('[NEON] Failed to delete service from Neon:', err.message);
        }
        let delName = id;
        if (idx !== -1) {
          const del = db.services.splice(idx, 1)[0];
          delName = del.title;
        }
        saveDatabase(db);
        logActivity('DELETE', 'Service', `Deleted service: ${delName}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Team Members GET, POST, PUT, DELETE
    if (pathname === '/api/team') {
      if (method === 'GET') {
        if (isNeonConnected()) {
          try {
            const team = await neon.getTeamMembers();
            return sendJson(res, 200, { team });
          } catch (err) {
            console.warn('[NEON] Team live query error:', err.message);
          }
        }
        const db = getDatabase();
        const sorted = [...(db.team || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return sendJson(res, 200, { team: sorted });
      }
      if (method === 'POST') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized. Admin credentials required.' });
        const body = await parseJsonBody(req);
        if (!body.name || !body.role) {
          return sendJson(res, 400, { error: 'Member name and role are required' });
        }
        let skills = [];
        if (Array.isArray(body.skills)) {
          skills = body.skills;
        } else if (typeof body.skills === 'string') {
          skills = body.skills.split(',').map((s) => s.trim()).filter(Boolean);
        }
        const github = body.github?.trim() || body.socials?.github?.trim() || '';
        const linkedin = body.linkedin?.trim() || body.socials?.linkedin?.trim() || '';
        const email = body.email?.trim() || body.socials?.email?.trim() || '';
        const portfolio = body.portfolio?.trim() || body.socials?.portfolio?.trim() || '';
        const db = getDatabase();
        const count = isNeonConnected() ? (await neon.getTeamMembers()).length : (db.team || []).length;
        const newMember = {
          id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: body.name.trim(),
          role: body.role.trim(),
          bio: body.bio?.trim() || '',
          avatarUrl: body.avatarUrl?.trim() || '',
          skills,
          github,
          linkedin,
          email,
          portfolio,
          socials: { github, linkedin, email, portfolio },
          displayOrder: parseInt(body.displayOrder, 10) || count + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await neon.upsertTeamMember(newMember);
        } catch (err) {
          console.error('[NEON] Failed to sync new team member to Neon:', err.message);
        }
        db.team = db.team || [];
        db.team.push(newMember);
        saveDatabase(db);
        logActivity('CREATE', 'Team', `Added team member: ${newMember.name} (${newMember.role})`);
        return sendJson(res, 201, { success: true, member: newMember });
      }
    }

    if (pathname.startsWith('/api/team/')) {
      const id = pathname.replace('/api/team/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized. Admin credentials required.' });
      const db = getDatabase();
      db.team = db.team || [];
      const idx = db.team.findIndex((m) => m.id === id);

      if (method === 'PUT') {
        const updates = await parseJsonBody(req);
        let existing = null;
        if (isNeonConnected()) {
          try {
            existing = await neon.getTeamMemberById(id);
          } catch {}
        }
        if (!existing && idx !== -1) existing = db.team[idx];
        if (!existing) return sendJson(res, 404, { error: 'Team member not found' });

        let skills = existing.skills;
        if (Array.isArray(updates.skills)) {
          skills = updates.skills;
        } else if (typeof updates.skills === 'string') {
          skills = updates.skills.split(',').map((s) => s.trim()).filter(Boolean);
        }
        const github = (updates.github !== undefined ? updates.github : updates.socials?.github !== undefined ? updates.socials.github : existing.github) || '';
        const linkedin = (updates.linkedin !== undefined ? updates.linkedin : updates.socials?.linkedin !== undefined ? updates.socials.linkedin : existing.linkedin) || '';
        const email = (updates.email !== undefined ? updates.email : updates.socials?.email !== undefined ? updates.socials.email : existing.email) || '';
        const portfolio = (updates.portfolio !== undefined ? updates.portfolio : updates.socials?.portfolio !== undefined ? updates.socials.portfolio : existing.portfolio) || '';
        const avatarUrl = (updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl) || '';

        const updatedMember = {
          ...existing,
          ...updates,
          avatarUrl: String(avatarUrl).trim(),
          skills,
          github: String(github).trim(),
          linkedin: String(linkedin).trim(),
          email: String(email).trim(),
          portfolio: String(portfolio).trim(),
          socials: {
            github: String(github).trim(),
            linkedin: String(linkedin).trim(),
            email: String(email).trim(),
            portfolio: String(portfolio).trim(),
          },
          id,
          updatedAt: new Date().toISOString(),
        };

        try {
          await neon.upsertTeamMember(updatedMember);
        } catch (err) {
          console.error('[NEON] Failed to update team member in Neon:', err.message);
        }
        if (idx !== -1) db.team[idx] = updatedMember;
        saveDatabase(db);
        logActivity('UPDATE', 'Team', `Updated team member: ${updatedMember.name}`);
        return sendJson(res, 200, { success: true, member: updatedMember });
      }
      if (method === 'DELETE') {
        try {
          await neon.deleteTeamMember(id);
        } catch (err) {
          console.error('[NEON] Failed to delete team member from Neon:', err.message);
        }
        let delName = id;
        if (idx !== -1) {
          const del = db.team.splice(idx, 1)[0];
          delName = del.name;
        }
        saveDatabase(db);
        logActivity('DELETE', 'Team', `Removed team member: ${delName}`);
        return sendJson(res, 200, { success: true, message: 'Deleted' });
      }
    }

    // Contact Submissions (Public POST, Admin GET, Admin PATCH, Admin DELETE)
    if (pathname === '/api/contact') {
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

        try {
          await neon.insertInquiry(newInquiry);
        } catch (err) {
          console.error('[NEON] Failed to sync inquiry to Neon:', err.message);
        }
        const db = getDatabase();
        db.inquiries = [newInquiry, ...(db.inquiries || [])];
        saveDatabase(db);
        logActivity('INQUIRY', 'Contact', `New message from ${newInquiry.name} (${newInquiry.email})`);

        // Forward to Formspree in background
        try {
          const https = require('https');
          const payload = JSON.stringify({
            name: newInquiry.name,
            email: newInquiry.email,
            subject: newInquiry.subject,
            message: newInquiry.message,
            _replyto: newInquiry.email,
          });
          const formspreeReq = https.request('https://formspree.io/f/xpqylowj', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          });
          formspreeReq.on('error', (err) => console.warn('[FORMSPREE] Server relay notice:', err.message));
          formspreeReq.write(payload);
          formspreeReq.end();
        } catch (e) {
          console.warn('[FORMSPREE] Relay error:', e.message);
        }

        return sendJson(res, 201, {
          success: true,
          message: 'Thank you! Your message has been sent directly to Charan Sai via Formspree.',
          inquiryId: newInquiry.id,
        });
      }

      if (method === 'GET') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        if (isNeonConnected()) {
          try {
            const inquiries = await neon.getInquiries();
            return sendJson(res, 200, { inquiries });
          } catch (err) {
            console.warn('[NEON] Inquiries live query error:', err.message);
          }
        }
        const db = getDatabase();
        return sendJson(res, 200, { inquiries: db.inquiries || [] });
      }
    }

    if (pathname.startsWith('/api/contact/')) {
      const id = pathname.replace('/api/contact/', '');
      const admin = await getAuthAdmin(req);
      if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
      const db = getDatabase();
      db.inquiries = db.inquiries || [];
      const idx = db.inquiries.findIndex((i) => i.id === id);

      if (method === 'PATCH') {
        const updates = await parseJsonBody(req);
        try {
          await neon.updateInquiry(id, updates);
        } catch (err) {
          console.error('[NEON] Failed to update inquiry in Neon:', err.message);
        }
        if (idx !== -1) {
          db.inquiries[idx] = { ...db.inquiries[idx], ...updates };
          saveDatabase(db);
          return sendJson(res, 200, { success: true, inquiry: db.inquiries[idx] });
        }
        return sendJson(res, 200, { success: true, inquiry: { id, ...updates } });
      }
      if (method === 'DELETE') {
        try {
          await neon.deleteInquiry(id);
        } catch (err) {
          console.error('[NEON] Failed to delete inquiry from Neon:', err.message);
        }
        let delName = id;
        if (idx !== -1) {
          const del = db.inquiries.splice(idx, 1)[0];
          delName = del.name;
        }
        saveDatabase(db);
        logActivity('DELETE', 'Inquiry', `Deleted inquiry from: ${delName}`);
        return sendJson(res, 200, { success: true });
      }
    }

    // Settings GET & PUT
    if (pathname === '/api/settings') {
      if (method === 'GET') {
        if (isNeonConnected()) {
          try {
            const settings = await neon.getSettings();
            if (settings) return sendJson(res, 200, { settings });
          } catch (err) {
            console.warn('[NEON] Settings live query error:', err.message);
          }
        }
        const db = getDatabase();
        return sendJson(res, 200, { settings: db.settings });
      }
      if (method === 'PUT') {
        const admin = await getAuthAdmin(req);
        if (!admin) return sendJson(res, 401, { error: 'Unauthorized' });
        const updates = await parseJsonBody(req);
        const db = getDatabase();
        const newSettings = { ...db.settings, ...updates };
        try {
          await neon.updateSettings(newSettings);
        } catch (err) {
          console.error('[NEON] Failed to update settings in Neon:', err.message);
        }
        db.settings = newSettings;
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

    // Dedicated serving for persistent uploads directory (with Neon PostgreSQL cloud persistence fallback)
    if (pathname.startsWith('/uploads/')) {
      let rel = pathname.slice('/uploads/'.length);
      try {
        rel = decodeURIComponent(rel);
      } catch {}
      const safeUploadPath = path.normalize(path.join(UPLOADS_DIR, rel));
      if (safeUploadPath.startsWith(UPLOADS_DIR) && fs.existsSync(safeUploadPath) && !fs.statSync(safeUploadPath).isDirectory()) {
        return serveStatic(req, res, safeUploadPath);
      }

      // Neon Cloud persistence fallback: restore asset from database if container disk was wiped or redeployed
      try {
        const filename = path.basename(rel);
        const asset = await neon.getUploadedAsset(filename);
        if (asset && asset.data_base64) {
          const assetBuf = Buffer.from(asset.data_base64, 'base64');
          // Write to disk cache for fast future serving
          try {
            fs.writeFileSync(safeUploadPath, assetBuf);
          } catch {}
          const contentType = asset.mime_type || MIME_TYPES[path.extname(filename).toLowerCase()] || 'image/jpeg';
          const secHeaders = getSecurityHeaders(req);
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': assetBuf.length,
            'Cache-Control': 'public, max-age=86400',
            ...secHeaders,
          });
          return res.end(assetBuf);
        }
      } catch (dbErr) {
        console.warn('[STORAGE] Error retrieving asset from Neon:', dbErr.message);
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

async function startServer() {
  console.log(`\n=======================================================`);
  console.log(`  Starting Charan Sai Portfolio Server...`);
  console.log(`  Environment:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Host & Port:      ${HOST}:${currentPort}`);
  console.log(`  Storage DATA_DIR: ${path.join(__dirname, '..', 'data')}`);
  console.log(`  Storage UPLOADS:  ${UPLOADS_DIR}`);

  try {
    const neonOk = await initNeonDatabase();
    if (neonOk) {
      console.log(`  Database:         Neon PostgreSQL [LIVE CONNECTED]`);
      console.log(`  Neon Branch:      ${process.env.NEON_BRANCH || 'production'}`);
    } else {
      console.log(`  Database:         Local Filesystem (Neon not configured)`);
    }
  } catch (dbErr) {
    console.warn(`  Database Warning: Could not connect to Neon: ${dbErr.message}`);
  }

  server.listen(currentPort, HOST, () => {
    console.log(`  Charan Sai Portfolio Server is RUNNING!`);
    console.log(`  Website URL:      http://localhost:${currentPort}`);
    console.log(`  Admin Dashboard:  http://localhost:${currentPort}/admin`);
    console.log(`=======================================================\n`);
  });
}

startServer();


