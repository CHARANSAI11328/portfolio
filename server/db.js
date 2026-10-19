const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'portfolio-db.json');

// Password hashing using Node.js built-in crypto PBKDF2
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return checkHash === originalHash;
}

// Production-hardened JWT secret resolution
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!secret || secret.trim().length < 32 || secret.toLowerCase().includes('charan-sai-super-secure') || secret.toLowerCase().includes('default')) {
      console.error('FATAL: A strong JWT_SECRET environment variable (minimum 32 characters) must be configured in production!');
      process.exit(1);
    }
    return secret.trim();
  }
  return secret || 'dev-only-local-secret-charan-portfolio-minimum-32-chars-2026';
}

// Immediate fail-safe validation on production startup
if (process.env.NODE_ENV === 'production') {
  getJwtSecret();
}

function createToken(payload) {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const secret = getJwtSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Initial Admin from environment if provided, otherwise safe local dev fallback
const initialAdminEmail = process.env.ADMIN_EMAIL || 'admin@charansai.website';
const initialAdminPass = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@CharanSai2026!';

const INITIAL_DB = {
  admins: [
    {
      id: 'admin-charan-01',
      email: initialAdminEmail.toLowerCase().trim(),
      name: 'Charan Sai',
      role: 'superadmin',
      tokenVersion: 1,
      passwordHash: hashPassword(initialAdminPass, 'salt_charan_2026'),
      createdAt: new Date().toISOString(),
    },
  ],
  profile: {
    id: 'profile-charan-sai',
    name: 'Charan Sai',
    title: 'Independent Developer & Digital Solutions',
    bio: "Passionate developer crafting modern, scalable, and user-friendly digital experiences. Specializing in high-performance web applications, desktop systems, and responsive digital solutions tailored for real-world impact.",
    heroHeading: "Building Next-Gen Digital Solutions",
    heroDesc: "I build modern, fast and user-friendly web applications that turn ideas into reality. Passionate about technology, design and creating digital experiences that matter.",
    location: "Chirala, Andhra Pradesh, India",
    email: "contact@charansai.website",
    phone: "+91 (Verified on inquiry)",
    avatarUrl: "/images/charan_sai_avatar.jpg",
    resumeUrl: "/KAMARAJUGADDA_CHARAN_SAI_Resume.pdf?v=20261019",
    availabilityStatus: "available",
    availabilityText: "Available for freelance projects",
    socialLinks: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      email: "mailto:contact@charansai.website",
      website: "https://charansai.website",
    },
    stats: [
      { label: "Core Projects", value: "4+" },
      { label: "Tech Stack", value: "15+" },
      { label: "Commitment", value: "100%" },
    ],
    updatedAt: new Date().toISOString(),
  },
  projects: [
    {
      id: 'proj-lettergen-pro',
      title: 'LETTERGEN PRO',
      slug: 'lettergen-pro',
      shortDesc: 'A Java Swing desktop letter-generation application with related website and PDF functionality and a PostgreSQL/Neon-backed data component.',
      caseStudy: 'Comprehensive desktop letter drafting automation suite built in Java Swing with vector PDF output generation, template management, and relational database synchronization with PostgreSQL on Neon.',
      category: 'Desktop & Systems',
      technologies: ['Java', 'Swing', 'PostgreSQL', 'Neon', 'PDF Automation'],
      status: 'Completed',
      liveUrl: '',
      repoUrl: '',
      featured: true,
      published: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-projex',
      title: 'PROJEX',
      slug: 'projex',
      shortDesc: 'An engineering-student-focused learning and career-readiness platform involving learning roadmaps, skills, assessments, guided projects, and progress tracking.',
      caseStudy: 'Built to empower engineering students with structured skill pathways, interactive curriculum roadmaps, verified skill assessments, hands-on guided project milestones, and real-time progress analytics.',
      category: 'Web Applications',
      technologies: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
      status: 'Active Development',
      liveUrl: '',
      repoUrl: '',
      featured: true,
      published: true,
      displayOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-mameka-mahodayam',
      title: 'MAMEKA MAHODAYAM',
      slug: 'mameka-mahodayam',
      shortDesc: 'A digital newspaper platform featuring Telugu content, article presentation, archive management, and a developing publishing workflow.',
      caseStudy: 'Modern regional journalism web portal tailored for seamless Telugu vernacular typography, digital e-paper edition viewing, responsive article reading, and dynamic editorial publishing workflows.',
      category: 'Digital Publishing',
      technologies: ['Next.js', 'JavaScript', 'Render', 'Digital Publishing', 'CSS3'],
      status: 'In Progress',
      liveUrl: 'https://project-mm-1.onrender.com',
      repoUrl: '',
      featured: true,
      published: true,
      displayOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-business-websites',
      title: 'BUSINESS WEBSITES & DIGITAL SOLUTIONS',
      slug: 'business-websites',
      shortDesc: 'Scalable business website architectures, client landing portals, and responsive corporate platforms built for commercial conversion.',
      caseStudy: 'Designing and engineering tailored web solutions for businesses seeking high conversion, rapid page load times, SEO optimization, and brand presentation across diverse client industries.',
      category: 'Business Solutions',
      technologies: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'SEO'],
      status: 'Active Development',
      liveUrl: '',
      repoUrl: '',
      featured: true,
      published: true,
      displayOrder: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  skills: [
    { id: 'sk-1', name: 'React', category: 'Frontend', icon: 'Code', featured: true, displayOrder: 1 },
    { id: 'sk-2', name: 'Next.js', category: 'Frontend', icon: 'Layers', featured: true, displayOrder: 2 },
    { id: 'sk-3', name: 'JavaScript', category: 'Languages', icon: 'Code', featured: true, displayOrder: 3 },
    { id: 'sk-4', name: 'TypeScript', category: 'Languages', icon: 'FileCode', featured: true, displayOrder: 4 },
    { id: 'sk-5', name: 'HTML5 & CSS3', category: 'Frontend', icon: 'Globe', featured: true, displayOrder: 5 },
    { id: 'sk-6', name: 'Tailwind CSS', category: 'Frontend', icon: 'Palette', featured: true, displayOrder: 6 },
    { id: 'sk-7', name: 'Flutter & Dart', category: 'Frontend', icon: 'Smartphone', featured: true, displayOrder: 7 },
    { id: 'sk-8', name: 'Java', category: 'Languages', icon: 'Coffee', featured: true, displayOrder: 8 },
    { id: 'sk-9', name: 'Python', category: 'Languages', icon: 'Terminal', featured: true, displayOrder: 9 },
    { id: 'sk-10', name: 'PostgreSQL', category: 'Backend & Data', icon: 'Database', featured: true, displayOrder: 10 },
    { id: 'sk-11', name: 'Neon', category: 'Backend & Data', icon: 'Server', featured: true, displayOrder: 11 },
    { id: 'sk-12', name: 'Firebase', category: 'Backend & Data', icon: 'Flame', featured: true, displayOrder: 12 },
    { id: 'sk-13', name: 'Git & GitHub', category: 'Tools & Platforms', icon: 'GitBranch', featured: true, displayOrder: 13 },
    { id: 'sk-14', name: 'Netlify & Render', category: 'Tools & Platforms', icon: 'Cloud', featured: true, displayOrder: 14 },
    { id: 'sk-15', name: 'AI-Assisted Dev', category: 'Tools & Platforms', icon: 'Cpu', featured: true, displayOrder: 15 },
  ],
  certifications: [
    // Deliberately empty for honest empty state
  ],
  experiences: [
    {
      id: 'exp-btech',
      role: 'B.Tech in Computer Science and Engineering — Data Science',
      company: "St. Ann's College of Engineering & Technology",
      location: 'Chirala, Andhra Pradesh, India',
      period: '2022 — Present',
      description: 'Specializing in computer science fundamentals, data analytics, software development, algorithms, and engineering project lifecycles.',
      highlights: [
        'Core focus on Data Science, Data Structures, Database Systems & Full-Stack Engineering',
        'Actively developing production-grade software projects and platforms for students and businesses',
      ],
      type: 'education',
      displayOrder: 1,
    },
    {
      id: 'exp-dev',
      role: 'Independent Developer & Digital Solutions',
      company: 'Freelance & Independent Projects',
      location: 'India',
      period: '2023 — Present',
      description: 'Engineering responsive web applications, Java desktop automation software, regional news platforms, and business websites for clients and open-source initiatives.',
      highlights: [
        'Designed and deployed responsive Next.js and React web portals',
        'Built LETTERGEN PRO Java desktop utility and Mameka Mahodayam Telugu news publishing platform',
      ],
      type: 'work',
      displayOrder: 2,
    },
  ],
  events: [],
  services: [
    {
      id: 'serv-web-app',
      title: 'Web Application Development',
      description: 'Custom, full-stack dynamic web applications built with Next.js, React, and robust database architectures.',
      icon: 'Layout',
      category: 'Development',
      features: ['Modern React & Next.js', 'PostgreSQL & Neon DB', 'Secure Authentication', 'Responsive UI/UX'],
      displayOrder: 1,
    },
    {
      id: 'serv-biz-sites',
      title: 'Business Websites & Redesigns',
      description: 'Fast, high-converting digital storefronts and landing pages optimized for search engines, brand impact, and speed.',
      icon: 'Globe',
      category: 'Design & Web',
      features: ['Bespoke Aesthetic', 'Mobile-First Perfection', 'SEO Optimization', 'Lightning Performance'],
      displayOrder: 2,
    },
    {
      id: 'serv-desktop',
      title: 'Software & Desktop Utilities',
      description: 'Specialized desktop software, automated document/PDF generation, and relational data management in Java.',
      icon: 'Monitor',
      category: 'Software Engineering',
      features: ['Java Swing & Modern UI', 'PDF Generation Engines', 'Relational DB Sync', 'Offline Reliability'],
      displayOrder: 3,
    },
    {
      id: 'serv-ai',
      title: 'AI-Assisted Digital Solutions',
      description: 'Integrating modern AI capabilities, intelligent data automation, and workflow acceleration into products.',
      icon: 'Sparkles',
      category: 'AI & Data',
      features: ['Intelligent Workflows', 'API Integration', 'Data Processing', 'Rapid Prototyping'],
      displayOrder: 4,
    },
  ],
  inquiries: [],
  settings: {
    themePreference: 'light',
    seoTitle: 'Charan Sai — Independent Developer & Digital Solutions',
    seoDescription: 'Personal portfolio and freelance digital solutions by Charan Sai. Exploring modern web applications, Java desktop systems, and interactive digital experiences.',
    keywords: 'Charan Sai, Full Stack Developer, Data Science, Next.js, React, Java, Flutter, Chirala, India',
    bannerText: "More Than Just a Portfolio — It's a Journey of Ideas, Code and Creativity",
    sectionVisibility: {
      about: true,
      skills: true,
      projects: true,
      certifications: true,
      experience: true,
      events: true,
      services: true,
      contact: true,
    },
  },
  activityLogs: [
    {
      id: 'log-1',
      action: 'INIT',
      entity: 'System',
      details: 'Initialized portfolio CMS database with authentic Charan Sai records',
      timestamp: new Date().toISOString(),
    },
  ],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDatabase() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const localDefaultDb = path.join(__dirname, '..', 'data', 'portfolio-db.json');
    if (DATA_DIR !== path.join(__dirname, '..', 'data') && fs.existsSync(localDefaultDb)) {
      try {
        fs.copyFileSync(localDefaultDb, DB_FILE);
        console.log(`[STORAGE] Migrated initial DB to persistent volume: ${DB_FILE}`);
      } catch (err) {
        console.error('[STORAGE] Error copying initial DB to persistent volume:', err);
      }
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(INITIAL_DB);
    return INITIAL_DB;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(content);
    // Ensure all admin records have a tokenVersion for session revocation
    let needsSave = false;
    if (Array.isArray(db.admins)) {
      db.admins.forEach((a) => {
        if (typeof a.tokenVersion !== 'number') {
          a.tokenVersion = 1;
          needsSave = true;
        }
      });
    }
    if (needsSave) {
      saveDatabase(db);
    }
    return db;
  } catch (err) {
    console.error('Error reading DB, repairing with initial state...', err);
    saveDatabase(INITIAL_DB);
    return INITIAL_DB;
  }
}

function saveDatabase(db) {
  ensureDataDir();
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

function logActivity(action, entity, details) {
  const db = getDatabase();
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    entity,
    details,
    timestamp: new Date().toISOString(),
  };
  db.activityLogs = [newLog, ...(db.activityLogs || [])].slice(0, 50);
  saveDatabase(db);
}

module.exports = {
  getDatabase,
  saveDatabase,
  logActivity,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  DATA_DIR,
  DB_FILE,
};

