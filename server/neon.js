const fs = require('fs');
const path = require('path');

// Automatically load environment variables from .env.local and .env
function loadEnv() {
  const root = path.resolve(__dirname, '..');
  const files = ['.env.local', '.env'];
  for (const f of files) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        content.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eq = trimmed.indexOf('=');
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      } catch (err) {
        console.warn('[NEON ENV] Could not load', f, err.message);
      }
    }
  }
}
loadEnv();

let sqlClient = null;
let isConnected = false;

function getClient() {
  if (sqlClient) return sqlClient;
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) return null;

  try {
    const { neon } = require('@neondatabase/serverless');
    sqlClient = neon(dbUrl);
    return sqlClient;
  } catch (err) {
    console.error('[NEON] Error initializing @neondatabase/serverless driver:', err.message);
    return null;
  }
}

/**
 * Initialize Neon tables and seed with initial data if empty.
 */
async function initNeon(initialData = null) {
  const sql = getClient();
  if (!sql) {
    console.warn('[NEON] DATABASE_URL not set — running with local filesystem persistence.');
    return false;
  }

  try {
    // 1. Core portfolio state table (atomic validated JSONB state document)
    await sql.query(`
      CREATE TABLE IF NOT EXISTS portfolio_state (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Structured profile table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS profile (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        bio TEXT,
        hero_heading TEXT,
        hero_desc TEXT,
        location VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        avatar_url TEXT,
        resume_url TEXT,
        availability_status VARCHAR(100),
        availability_text TEXT,
        social_links JSONB,
        stats JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Structured projects table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        short_desc TEXT,
        case_study TEXT,
        category VARCHAR(100),
        technologies JSONB,
        status VARCHAR(100),
        live_url TEXT,
        repo_url TEXT,
        featured BOOLEAN DEFAULT true,
        published BOOLEAN DEFAULT true,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Structured skills table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        icon VARCHAR(100),
        featured BOOLEAN DEFAULT true,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Structured team members table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        bio TEXT,
        avatar_url TEXT,
        skills JSONB,
        socials JSONB,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Structured certifications table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        issuer VARCHAR(255),
        issue_date VARCHAR(50),
        credential_id VARCHAR(255),
        verification_url TEXT,
        published BOOLEAN DEFAULT true,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    try {
      await sql.query(`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS verification_url TEXT;`);
      await sql.query(`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;`);
    } catch {}

    // 7. Structured experiences table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id VARCHAR(100) PRIMARY KEY,
        role VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        location VARCHAR(255),
        period VARCHAR(100),
        description TEXT,
        highlights JSONB,
        type VARCHAR(50),
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Structured services table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        category VARCHAR(100),
        features JSONB,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 9. Structured events table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        date VARCHAR(50),
        location VARCHAR(255),
        description TEXT,
        published BOOLEAN DEFAULT true,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Structured inquiries table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    isConnected = true;
    console.log('[NEON] Connected successfully to Neon PostgreSQL database.');

    // Only seed from initialData if Neon cloud is empty; otherwise preserve cloud state
    const existingCloudState = await fetchNeonState();
    if (!existingCloudState && initialData) {
      await saveNeonState(initialData);
    } else if (existingCloudState) {
      // Sync relational tables with the authoritative cloud state
      await saveNeonState(existingCloudState);
    }

    return true;
  } catch (err) {
    console.error('[NEON] Connection or initialization error:', err.message);
    isConnected = false;
    return false;
  }
}

/**
 * Fetch the current state from Neon PostgreSQL
 */
async function fetchNeonState() {
  const sql = getClient();
  if (!sql) return null;
  try {
    const rows = await sql.query("SELECT data FROM portfolio_state WHERE id = 'current' LIMIT 1;");
    let state = (rows && rows.length > 0 && rows[0].data) ? rows[0].data : {};

    // Also populate relational tables so that any direct SQL changes in Neon are reflected
    try {
      const [certs, team, projs, skills, exps, servs, events, inqs] = await Promise.all([
        sql.query("SELECT * FROM certifications ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM team_members ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM projects ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM skills ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM experiences ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM services ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM events ORDER BY display_order ASC, id ASC;"),
        sql.query("SELECT * FROM inquiries ORDER BY created_at DESC;"),
      ]);

      if (certs) state.certifications = certs.map(formatCertification);
      if (team) state.team = team.map(formatTeamMember);
      if (projs) state.projects = projs.map(formatProject);
      if (skills) state.skills = skills.map(formatSkill);
      if (exps) state.experiences = exps.map(formatExperience);
      if (servs) state.services = servs.map(formatService);
      if (events) state.events = events.map(formatEvent);
      if (inqs) state.inquiries = inqs.map(formatInquiry);
    } catch (tblErr) {
      console.warn('[NEON] Could not hydrate from relational tables directly:', tblErr.message);
    }

    return state;
  } catch (err) {
    console.error('[NEON] Error fetching state from Neon:', err.message);
    return null;
  }
}

/**
 * Persist the current state to Neon PostgreSQL (both document JSONB and all individual relational tables)
 */
async function saveNeonState(data) {
  const sql = getClient();
  if (!sql || !data) return false;

  try {
    const jsonStr = JSON.stringify(data);

    // 1. Core portfolio_state JSONB document
    await sql.query(
      `
      INSERT INTO portfolio_state (id, data, updated_at)
      VALUES ('current', $1::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [jsonStr]
    );

    // 2. Sync Profile Table
    if (data.profile && typeof data.profile === 'object') {
      const p = data.profile;
      await sql.query(
        `
        INSERT INTO profile (
          id, name, title, bio, hero_heading, hero_desc, location, email, phone, avatar_url, resume_url, availability_status, availability_text, social_links, stats, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          bio = EXCLUDED.bio,
          hero_heading = EXCLUDED.hero_heading,
          hero_desc = EXCLUDED.hero_desc,
          location = EXCLUDED.location,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          resume_url = EXCLUDED.resume_url,
          availability_status = EXCLUDED.availability_status,
          availability_text = EXCLUDED.availability_text,
          social_links = EXCLUDED.social_links,
          stats = EXCLUDED.stats,
          updated_at = NOW();
        `,
        [
          p.id || 'profile-charan-sai',
          p.name || 'Charan Sai',
          p.title || '',
          p.bio || '',
          p.heroHeading || '',
          p.heroDesc || '',
          p.location || '',
          p.email || '',
          p.phone || '',
          p.avatarUrl || '',
          p.resumeUrl || '',
          p.availabilityStatus || 'available',
          p.availabilityText || '',
          JSON.stringify(p.socialLinks || {}),
          JSON.stringify(p.stats || []),
        ]
      );
    }

    // 3. Sync Projects Table
    if (Array.isArray(data.projects)) {
      const projectIds = [];
      for (const pr of data.projects) {
        if (!pr.id || !pr.title) continue;
        projectIds.push(pr.id);
        await sql.query(
          `
          INSERT INTO projects (
            id, title, slug, short_desc, case_study, category, technologies, status, live_url, repo_url, featured, published, display_order, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            short_desc = EXCLUDED.short_desc,
            case_study = EXCLUDED.case_study,
            category = EXCLUDED.category,
            technologies = EXCLUDED.technologies,
            status = EXCLUDED.status,
            live_url = EXCLUDED.live_url,
            repo_url = EXCLUDED.repo_url,
            featured = EXCLUDED.featured,
            published = EXCLUDED.published,
            display_order = EXCLUDED.display_order,
            updated_at = NOW();
          `,
          [
            pr.id,
            pr.title,
            pr.slug || '',
            pr.shortDesc || '',
            pr.caseStudy || '',
            pr.category || 'Web Applications',
            JSON.stringify(pr.technologies || []),
            pr.status || 'Active',
            pr.liveUrl || '',
            pr.repoUrl || '',
            pr.featured !== false,
            pr.published !== false,
            pr.displayOrder || 1,
          ]
        );
      }
      if (projectIds.length > 0) {
        await sql.query(`DELETE FROM projects WHERE id NOT IN (${projectIds.map((_, i) => `$${i + 1}`).join(', ')});`, projectIds);
      }
    }

    // 4. Sync Skills Table
    if (Array.isArray(data.skills)) {
      const skillIds = [];
      for (const sk of data.skills) {
        if (!sk.id || !sk.name) continue;
        skillIds.push(sk.id);
        await sql.query(
          `
          INSERT INTO skills (id, name, category, icon, featured, display_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            icon = EXCLUDED.icon,
            featured = EXCLUDED.featured,
            display_order = EXCLUDED.display_order;
          `,
          [sk.id, sk.name, sk.category || 'General', sk.icon || 'Code', sk.featured !== false, sk.displayOrder || 1]
        );
      }
      if (skillIds.length > 0) {
        await sql.query(`DELETE FROM skills WHERE id NOT IN (${skillIds.map((_, i) => `$${i + 1}`).join(', ')});`, skillIds);
      }
    }

    // 5. Sync Team Members Table
    if (Array.isArray(data.team)) {
      const teamIds = [];
      for (const m of data.team) {
        if (!m.id || !m.name) continue;
        teamIds.push(m.id);
        await sql.query(
          `
          INSERT INTO team_members (id, name, role, bio, avatar_url, skills, socials, display_order, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            bio = EXCLUDED.bio,
            avatar_url = EXCLUDED.avatar_url,
            skills = EXCLUDED.skills,
            socials = EXCLUDED.socials,
            display_order = EXCLUDED.display_order,
            updated_at = NOW();
          `,
          [
            m.id,
            m.name,
            m.role || '',
            m.bio || '',
            m.avatarUrl || '',
            JSON.stringify(m.skills || []),
            JSON.stringify(m.socials || {}),
            m.displayOrder || 1,
          ]
        );
      }
      if (teamIds.length > 0) {
        await sql.query(`DELETE FROM team_members WHERE id NOT IN (${teamIds.map((_, i) => `$${i + 1}`).join(', ')});`, teamIds);
      }
    }

    // 6. Sync Certifications Table
    if (Array.isArray(data.certifications)) {
      const certIds = [];
      for (const c of data.certifications) {
        if (!c.id || !c.title) continue;
        certIds.push(c.id);
        await sql.query(
          `
          INSERT INTO certifications (id, title, issuer, issue_date, credential_id, verification_url, published, display_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            issuer = EXCLUDED.issuer,
            issue_date = EXCLUDED.issue_date,
            credential_id = EXCLUDED.credential_id,
            verification_url = EXCLUDED.verification_url,
            published = EXCLUDED.published,
            display_order = EXCLUDED.display_order;
          `,
          [
            c.id,
            c.title,
            c.issuer || '',
            c.issueDate || '',
            c.credentialId || '',
            c.verificationUrl || '',
            c.published !== false,
            c.displayOrder || 1,
          ]
        );
      }
      if (certIds.length > 0) {
        await sql.query(`DELETE FROM certifications WHERE id NOT IN (${certIds.map((_, i) => `$${i + 1}`).join(', ')});`, certIds);
      } else {
        await sql.query(`DELETE FROM certifications;`);
      }
    }

    // 7. Sync Experiences Table
    if (Array.isArray(data.experiences)) {
      const expIds = [];
      for (const e of data.experiences) {
        if (!e.id || !e.role) continue;
        expIds.push(e.id);
        await sql.query(
          `
          INSERT INTO experiences (id, role, company, location, period, description, highlights, type, display_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            company = EXCLUDED.company,
            location = EXCLUDED.location,
            period = EXCLUDED.period,
            description = EXCLUDED.description,
            highlights = EXCLUDED.highlights,
            type = EXCLUDED.type,
            display_order = EXCLUDED.display_order;
          `,
          [
            e.id,
            e.role,
            e.company || '',
            e.location || '',
            e.period || '',
            e.description || '',
            JSON.stringify(e.highlights || []),
            e.type || 'work',
            e.displayOrder || 1,
          ]
        );
      }
      if (expIds.length > 0) {
        await sql.query(`DELETE FROM experiences WHERE id NOT IN (${expIds.map((_, i) => `$${i + 1}`).join(', ')});`, expIds);
      }
    }

    // 8. Sync Services Table
    if (Array.isArray(data.services)) {
      const servIds = [];
      for (const s of data.services) {
        if (!s.id || !s.title) continue;
        servIds.push(s.id);
        await sql.query(
          `
          INSERT INTO services (id, title, description, icon, category, features, display_order)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            icon = EXCLUDED.icon,
            category = EXCLUDED.category,
            features = EXCLUDED.features,
            display_order = EXCLUDED.display_order;
          `,
          [
            s.id,
            s.title,
            s.description || '',
            s.icon || 'Layout',
            s.category || 'Development',
            JSON.stringify(s.features || []),
            s.displayOrder || 1,
          ]
        );
      }
      if (servIds.length > 0) {
        await sql.query(`DELETE FROM services WHERE id NOT IN (${servIds.map((_, i) => `$${i + 1}`).join(', ')});`, servIds);
      }
    }

    // 9. Sync Events Table
    if (Array.isArray(data.events)) {
      const eventIds = [];
      for (const ev of data.events) {
        if (!ev.id || !ev.title) continue;
        eventIds.push(ev.id);
        await sql.query(
          `
          INSERT INTO events (id, title, role, date, location, description, published, display_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            role = EXCLUDED.role,
            date = EXCLUDED.date,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            published = EXCLUDED.published,
            display_order = EXCLUDED.display_order;
          `,
          [
            ev.id,
            ev.title,
            ev.role || 'Participant',
            ev.date || '',
            ev.location || '',
            ev.description || '',
            ev.published !== false,
            ev.displayOrder || 1,
          ]
        );
      }
      if (eventIds.length > 0) {
        await sql.query(`DELETE FROM events WHERE id NOT IN (${eventIds.map((_, i) => `$${i + 1}`).join(', ')});`, eventIds);
      } else {
        await sql.query(`DELETE FROM events;`);
      }
    }

    // 10. Sync Inquiries Table
    if (Array.isArray(data.inquiries)) {
      for (const inq of data.inquiries) {
        if (!inq.id) continue;
        await sql.query(
          `
          INSERT INTO inquiries (id, name, email, subject, message, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status;
          `,
          [
            inq.id,
            inq.name || '',
            inq.email || '',
            inq.subject || '',
            inq.message || '',
            inq.status || 'unread',
            inq.createdAt || new Date().toISOString(),
          ]
        );
      }
    }

    return true;
  } catch (err) {
    console.error('[NEON] Error saving state to Neon:', err.message);
    return false;
  }
}

/**
 * Update the atomic portfolio_state JSONB document in Neon
 */
async function updatePortfolioState(data) {
  const sql = getClient();
  if (!sql || !data) return false;
  try {
    const jsonStr = JSON.stringify(data);
    await sql.query(
      `INSERT INTO portfolio_state (id, data, updated_at)
       VALUES ('current', $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
      [jsonStr]
    );
    return true;
  } catch (err) {
    console.error('[NEON] Error updating portfolio_state:', err.message);
    return false;
  }
}

// --- TARGETED ATOMIC SQL OPERATIONS (< 300ms latency) ---

async function upsertProfile(p) {
  const sql = getClient();
  if (!sql || !p) return false;
  await sql.query(
    `INSERT INTO profile (id, name, title, bio, hero_heading, hero_desc, location, email, phone, avatar_url, resume_url, availability_status, availability_text, social_links, stats, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       title = EXCLUDED.title,
       bio = EXCLUDED.bio,
       hero_heading = EXCLUDED.hero_heading,
       hero_desc = EXCLUDED.hero_desc,
       location = EXCLUDED.location,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       avatar_url = EXCLUDED.avatar_url,
       resume_url = EXCLUDED.resume_url,
       availability_status = EXCLUDED.availability_status,
       availability_text = EXCLUDED.availability_text,
       social_links = EXCLUDED.social_links,
       stats = EXCLUDED.stats,
       updated_at = NOW();`,
    [
      p.id || 'profile-charan-sai',
      p.name || 'Charan Sai',
      p.title || '',
      p.bio || '',
      p.heroHeading || '',
      p.heroDesc || '',
      p.location || '',
      p.email || '',
      p.phone || '',
      p.avatarUrl || '',
      p.resumeUrl || '',
      p.availabilityStatus || 'available',
      p.availabilityText || '',
      JSON.stringify(p.socialLinks || {}),
      JSON.stringify(p.stats || []),
    ]
  );
  return true;
}

async function upsertProject(pr) {
  const sql = getClient();
  if (!sql || !pr) return false;
  await sql.query(
    `INSERT INTO projects (id, title, slug, short_desc, case_study, category, technologies, status, live_url, repo_url, featured, published, display_order, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, NOW())
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       slug = EXCLUDED.slug,
       short_desc = EXCLUDED.short_desc,
       case_study = EXCLUDED.case_study,
       category = EXCLUDED.category,
       technologies = EXCLUDED.technologies,
       status = EXCLUDED.status,
       live_url = EXCLUDED.live_url,
       repo_url = EXCLUDED.repo_url,
       featured = EXCLUDED.featured,
       published = EXCLUDED.published,
       display_order = EXCLUDED.display_order,
       updated_at = NOW();`,
    [
      pr.id,
      pr.title,
      pr.slug || '',
      pr.shortDesc || '',
      pr.caseStudy || '',
      pr.category || 'Web Applications',
      JSON.stringify(pr.technologies || []),
      pr.status || 'Active',
      pr.liveUrl || '',
      pr.repoUrl || '',
      pr.featured !== false,
      pr.published !== false,
      pr.displayOrder || 1,
    ]
  );
  return true;
}

async function deleteProject(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM projects WHERE id = $1;`, [id]);
  return true;
}

async function upsertSkill(sk) {
  const sql = getClient();
  if (!sql || !sk) return false;
  await sql.query(
    `INSERT INTO skills (id, name, category, icon, featured, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       category = EXCLUDED.category,
       icon = EXCLUDED.icon,
       featured = EXCLUDED.featured,
       display_order = EXCLUDED.display_order;`,
    [sk.id, sk.name, sk.category || 'General', sk.icon || 'Code', sk.featured !== false, sk.displayOrder || 1]
  );
  return true;
}

async function deleteSkill(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM skills WHERE id = $1;`, [id]);
  return true;
}

async function upsertTeamMember(m) {
  const sql = getClient();
  if (!sql || !m) return false;
  await sql.query(
    `INSERT INTO team_members (id, name, role, bio, avatar_url, skills, socials, display_order, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, NOW())
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       bio = EXCLUDED.bio,
       avatar_url = EXCLUDED.avatar_url,
       skills = EXCLUDED.skills,
       socials = EXCLUDED.socials,
       display_order = EXCLUDED.display_order,
       updated_at = NOW();`,
    [
      m.id,
      m.name,
      m.role || '',
      m.bio || '',
      m.avatarUrl || '',
      JSON.stringify(m.skills || []),
      JSON.stringify(m.socials || {}),
      m.displayOrder || 1,
    ]
  );
  return true;
}

async function deleteTeamMember(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM team_members WHERE id = $1;`, [id]);
  return true;
}

async function upsertCertification(c) {
  const sql = getClient();
  if (!sql || !c) return false;
  await sql.query(
    `INSERT INTO certifications (id, title, issuer, issue_date, credential_id, verification_url, published, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       issuer = EXCLUDED.issuer,
       issue_date = EXCLUDED.issue_date,
       credential_id = EXCLUDED.credential_id,
       verification_url = EXCLUDED.verification_url,
       published = EXCLUDED.published,
       display_order = EXCLUDED.display_order;`,
    [
      c.id,
      c.title,
      c.issuer || '',
      c.issueDate || '',
      c.credentialId || '',
      c.verificationUrl || '',
      c.published !== false,
      c.displayOrder || 1,
    ]
  );
  return true;
}

async function deleteCertification(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM certifications WHERE id = $1;`, [id]);
  return true;
}

async function upsertExperience(e) {
  const sql = getClient();
  if (!sql || !e) return false;
  await sql.query(
    `INSERT INTO experiences (id, role, company, location, period, description, highlights, type, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       role = EXCLUDED.role,
       company = EXCLUDED.company,
       location = EXCLUDED.location,
       period = EXCLUDED.period,
       description = EXCLUDED.description,
       highlights = EXCLUDED.highlights,
       type = EXCLUDED.type,
       display_order = EXCLUDED.display_order;`,
    [
      e.id,
      e.role,
      e.company || '',
      e.location || '',
      e.period || '',
      e.description || '',
      JSON.stringify(e.highlights || []),
      e.type || 'work',
      e.displayOrder || 1,
    ]
  );
  return true;
}

async function deleteExperience(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM experiences WHERE id = $1;`, [id]);
  return true;
}

async function upsertService(s) {
  const sql = getClient();
  if (!sql || !s) return false;
  await sql.query(
    `INSERT INTO services (id, title, description, icon, category, features, display_order)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       icon = EXCLUDED.icon,
       category = EXCLUDED.category,
       features = EXCLUDED.features,
       display_order = EXCLUDED.display_order;`,
    [
      s.id,
      s.title,
      s.description || '',
      s.icon || 'Layout',
      s.category || 'Development',
      JSON.stringify(s.features || []),
      s.displayOrder || 1,
    ]
  );
  return true;
}

async function deleteService(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM services WHERE id = $1;`, [id]);
  return true;
}

async function upsertEvent(ev) {
  const sql = getClient();
  if (!sql || !ev) return false;
  await sql.query(
    `INSERT INTO events (id, title, role, date, location, description, published, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       role = EXCLUDED.role,
       date = EXCLUDED.date,
       location = EXCLUDED.location,
       description = EXCLUDED.description,
       published = EXCLUDED.published,
       display_order = EXCLUDED.display_order;`,
    [
      ev.id,
      ev.title,
      ev.role || 'Participant',
      ev.date || '',
      ev.location || '',
      ev.description || '',
      ev.published !== false,
      ev.displayOrder || 1,
    ]
  );
  return true;
}

async function deleteEvent(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM events WHERE id = $1;`, [id]);
  return true;
}

async function insertInquiry(inq) {
  const sql = getClient();
  if (!sql || !inq) return false;
  await sql.query(
    `INSERT INTO inquiries (id, name, email, subject, message, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`,
    [
      inq.id,
      inq.name || '',
      inq.email || '',
      inq.subject || '',
      inq.message || '',
      inq.status || 'unread',
      inq.createdAt || new Date().toISOString(),
    ]
  );
  return true;
}

async function updateInquiry(id, updates) {
  const sql = getClient();
  if (!sql || !id) return false;
  if (updates.status) {
    await sql.query(`UPDATE inquiries SET status = $1 WHERE id = $2;`, [updates.status, id]);
  }
  return true;
}

async function deleteInquiry(id) {
  const sql = getClient();
  if (!sql || !id) return false;
  await sql.query(`DELETE FROM inquiries WHERE id = $1;`, [id]);
  return true;
}

// Helpers to format rows from Neon into camelCase models
function formatCertification(r) {
  return {
    id: r.id,
    title: r.title,
    issuer: r.issuer || '',
    issueDate: r.issue_date || '',
    credentialId: r.credential_id || '',
    verificationUrl: r.verification_url || '',
    published: r.published !== false,
    displayOrder: r.display_order || 1,
  };
}

function formatTeamMember(r) {
  return {
    id: r.id,
    name: r.name,
    role: r.role || '',
    bio: r.bio || '',
    avatarUrl: r.avatar_url || '',
    skills: Array.isArray(r.skills) ? r.skills : [],
    socials: (r.socials && typeof r.socials === 'object') ? r.socials : {},
    github: r.socials?.github || '',
    linkedin: r.socials?.linkedin || '',
    email: r.socials?.email || '',
    portfolio: r.socials?.portfolio || '',
    displayOrder: r.display_order || 1,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  };
}

function formatProject(r) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug || '',
    shortDesc: r.short_desc || '',
    caseStudy: r.case_study || '',
    category: r.category || 'Web Applications',
    technologies: Array.isArray(r.technologies) ? r.technologies : [],
    status: r.status || 'Active',
    liveUrl: r.live_url || '',
    repoUrl: r.repo_url || '',
    featured: r.featured !== false,
    published: r.published !== false,
    displayOrder: r.display_order || 1,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  };
}

function formatSkill(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category || 'General',
    icon: r.icon || 'Code',
    featured: r.featured !== false,
    displayOrder: r.display_order || 1,
  };
}

function formatProfile(r) {
  return {
    id: r.id || 'profile-charan-sai',
    name: r.name || 'Charan Sai',
    title: r.title || '',
    bio: r.bio || '',
    heroHeading: r.hero_heading || '',
    heroDesc: r.hero_desc || '',
    location: r.location || '',
    email: r.email || '',
    phone: r.phone || '',
    avatarUrl: r.avatar_url || '',
    resumeUrl: r.resume_url || '',
    availabilityStatus: r.availability_status || 'available',
    availabilityText: r.availability_text || '',
    socialLinks: (r.social_links && typeof r.social_links === 'object') ? r.social_links : {},
    stats: Array.isArray(r.stats) ? r.stats : [],
    updatedAt: r.updated_at || new Date().toISOString(),
  };
}

function formatExperience(r) {
  return {
    id: r.id,
    role: r.role,
    company: r.company || '',
    location: r.location || '',
    period: r.period || '',
    description: r.description || '',
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
    type: r.type || 'work',
    displayOrder: r.display_order || 1,
  };
}

function formatService(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || '',
    icon: r.icon || 'Layout',
    category: r.category || 'Development',
    features: Array.isArray(r.features) ? r.features : [],
    displayOrder: r.display_order || 1,
  };
}

function formatEvent(r) {
  return {
    id: r.id,
    title: r.title,
    role: r.role || 'Participant',
    date: r.date || '',
    location: r.location || '',
    description: r.description || '',
    published: r.published !== false,
    displayOrder: r.display_order || 1,
  };
}

function formatInquiry(r) {
  return {
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    subject: r.subject || '',
    message: r.message || '',
    status: r.status || 'unread',
    createdAt: r.created_at || new Date().toISOString(),
  };
}

/**
 * Execute raw SQL query against Neon
 */
async function query(sqlText, params = []) {
  const sql = getClient();
  if (!sql) throw new Error('Neon database client not initialized');
  return await sql.query(sqlText, params);
}

module.exports = {
  getClient,
  initNeon,
  fetchNeonState,
  saveNeonState,
  updatePortfolioState,
  upsertProfile,
  upsertProject,
  deleteProject,
  upsertSkill,
  deleteSkill,
  upsertTeamMember,
  deleteTeamMember,
  upsertCertification,
  deleteCertification,
  upsertExperience,
  deleteExperience,
  upsertService,
  deleteService,
  upsertEvent,
  deleteEvent,
  insertInquiry,
  updateInquiry,
  deleteInquiry,
  formatCertification,
  formatTeamMember,
  formatProject,
  formatSkill,
  formatProfile,
  formatExperience,
  formatService,
  formatEvent,
  formatInquiry,
  query,
  isNeonConnected: () => isConnected,
};
