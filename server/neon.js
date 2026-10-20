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
    // 1. Core portfolio state table (holds atomic validated state with JSONB)
    await sql.query(`
      CREATE TABLE IF NOT EXISTS portfolio_state (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Structured team members table
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

    // 3. Structured certifications table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        issuer VARCHAR(255),
        issue_date VARCHAR(50),
        expiry_date VARCHAR(50),
        credential_id VARCHAR(255),
        credential_url TEXT,
        image_url TEXT,
        skills JSONB,
        display_order INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Structured inquiries table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        date VARCHAR(50),
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    isConnected = true;
    console.log('[NEON] Connected successfully to Neon PostgreSQL database.');

    // Check if state exists in Neon
    const rows = await sql.query("SELECT data FROM portfolio_state WHERE id = 'current' LIMIT 1;");
    if (rows.length === 0 && initialData) {
      console.log('[NEON] Seeding initial portfolio state to Neon PostgreSQL...');
      await saveNeonState(initialData);
      console.log('[NEON] Initial seed to Neon complete.');
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
    if (rows && rows.length > 0) {
      return rows[0].data;
    }
    return null;
  } catch (err) {
    console.error('[NEON] Error fetching state from Neon:', err.message);
    return null;
  }
}

/**
 * Persist the current state to Neon PostgreSQL (both document JSONB and structured tables)
 */
async function saveNeonState(data) {
  const sql = getClient();
  if (!sql || !data) return false;

  try {
    const jsonStr = JSON.stringify(data);
    await sql.query(
      `
      INSERT INTO portfolio_state (id, data, updated_at)
      VALUES ('current', $1::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [jsonStr]
    );

    // Sync structured team members table if present
    if (Array.isArray(data.team)) {
      for (const m of data.team) {
        if (!m.id || !m.name) continue;
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
    }

    return true;
  } catch (err) {
    console.error('[NEON] Error saving state to Neon:', err.message);
    return false;
  }
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
  query,
  isNeonConnected: () => isConnected,
};
