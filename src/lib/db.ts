import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import {
  PortfolioDatabase,
  ProfileData,
  ProjectItem,
  SkillItem,
  CertificationItem,
  ExperienceItem,
  EventItem,
  ServiceItem,
  InquiryItem,
  SiteSettings,
  AdminUser,
  ActivityLog,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'portfolio-db.json');

const INITIAL_PROFILE: ProfileData = {
  id: 'profile-charan-sai',
  name: 'Charan Sai',
  title: 'Independent Developer & Digital Solutions',
  bio: "Passionate developer crafting modern, scalable, and user-friendly digital experiences. Specializing in high-performance web applications, desktop systems, and responsive digital solutions tailored for real-world impact.",
  heroHeading: "Building Next-Gen Digital Solutions",
  heroDesc: "I build modern, fast, and user-friendly web applications that turn ideas into reality. Passionate about technology, design, and creating digital experiences that matter.",
  location: "Chirala, Andhra Pradesh, India",
  email: "contact@charansai.website",
  phone: "+91 (Verified on inquiry)",
  avatarUrl: "/images/charan_sai_avatar.jpg",
  resumeUrl: "/Charan_Sai_Resume.pdf",
  availabilityStatus: "available",
  availabilityText: "Available for freelance projects",
  socialLinks: {
    github: "https://github.com/CHARANSAI11328",
    linkedin: "https://www.linkedin.com/in/charan-sai-kamarajugadda-865870370/",
    twitter: "https://x.com/C6H11O5D",
    x: "https://x.com/C6H11O5D",
    leetcode: "https://leetcode.com/u/89IIBeaoVG/",
    email: "mailto:contact@charansai.website",
    website: "https://charansai.website",
  },
  stats: [
    { label: "Core Projects", value: "4+" },
    { label: "Tech Stack", value: "15+" },
    { label: "Commitment", value: "100%" },
  ],
  updatedAt: new Date().toISOString(),
};

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-lettergen-pro',
    title: 'LETTERGEN PRO',
    slug: 'lettergen-pro',
    shortDesc: 'A Java Swing desktop letter-generation application with related website and PDF functionality backed by PostgreSQL/Neon.',
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
    shortDesc: 'An engineering-student-focused learning and career-readiness platform involving learning roadmaps, skills, assessments, and guided projects.',
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
    shortDesc: 'A digital newspaper platform featuring Telugu content, article presentation, archive management, and a publishing workflow.',
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
];

const INITIAL_SKILLS: SkillItem[] = [
  { id: 'sk-1', name: 'React', category: 'Frontend', icon: 'Atom', featured: true, displayOrder: 1 },
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
];

const INITIAL_CERTIFICATIONS: CertificationItem[] = [
  // Deliberately empty to adhere strictly to the requirement:
  // "If no certificates exist, show: 'No certifications added yet.'
  // Never invent certificates or certificate issuers."
];

const INITIAL_EXPERIENCE: ExperienceItem[] = [
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
];

const INITIAL_EVENTS: EventItem[] = [
  // Deliberately empty or honest events only
];

const INITIAL_SERVICES: ServiceItem[] = [
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
];

const INITIAL_SETTINGS: SiteSettings = {
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
};

// Initial admin hash for admin@charansai.website (default password: Admin@CharanSai2026! - editable in Settings)
const DEFAULT_ADMIN_HASH = bcrypt.hashSync('Admin@CharanSai2026!', 10);

const INITIAL_ADMIN: AdminUser = {
  id: 'admin-charan-01',
  email: 'admin@charansai.website',
  name: 'Charan Sai',
  role: 'superadmin',
  passwordHash: DEFAULT_ADMIN_HASH,
  createdAt: new Date().toISOString(),
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDatabase(): PortfolioDatabase {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: PortfolioDatabase = {
      admins: [INITIAL_ADMIN],
      profile: INITIAL_PROFILE,
      projects: INITIAL_PROJECTS,
      skills: INITIAL_SKILLS,
      certifications: INITIAL_CERTIFICATIONS,
      experiences: INITIAL_EXPERIENCE,
      events: INITIAL_EVENTS,
      services: INITIAL_SERVICES,
      inquiries: [],
      settings: INITIAL_SETTINGS,
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
    saveDatabase(initialDb);
    return initialDb;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as PortfolioDatabase;
    return parsed;
  } catch (err) {
    console.error('Error reading database file, repairing...', err);
    const initialDb: PortfolioDatabase = {
      admins: [INITIAL_ADMIN],
      profile: INITIAL_PROFILE,
      projects: INITIAL_PROJECTS,
      skills: INITIAL_SKILLS,
      certifications: INITIAL_CERTIFICATIONS,
      experiences: INITIAL_EXPERIENCE,
      events: INITIAL_EVENTS,
      services: INITIAL_SERVICES,
      inquiries: [],
      settings: INITIAL_SETTINGS,
      activityLogs: [],
    };
    saveDatabase(initialDb);
    return initialDb;
  }
}

export function getNeonClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) return null;
  return neon(dbUrl);
}

export function saveDatabase(db: PortfolioDatabase): void {
  ensureDataDir();
  const json = JSON.stringify(db, null, 2);
  const tempPath = `${DB_FILE}.tmp`;
  try {
    fs.writeFileSync(tempPath, json, 'utf-8');
    try {
      fs.renameSync(tempPath, DB_FILE);
    } catch {
      fs.writeFileSync(DB_FILE, json, 'utf-8');
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    }
  } catch {
    fs.writeFileSync(DB_FILE, json, 'utf-8');
  }

  // Replicate to Neon PostgreSQL asynchronously (atomic state document)
  try {
    const neonPath = path.join(process.cwd(), 'server', 'neon.js');
    if (fs.existsSync(neonPath)) {
      const neon = require(neonPath);
      if (neon && typeof neon.updatePortfolioState === 'function') {
        neon.updatePortfolioState(db).catch(() => {});
      }
    }
  } catch {}
}

export function logActivity(action: string, entity: string, details: string): void {
  const db = getDatabase();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    entity,
    details,
    timestamp: new Date().toISOString(),
  };
  db.activityLogs = [newLog, ...(db.activityLogs || [])].slice(0, 50);
  saveDatabase(db);
}
