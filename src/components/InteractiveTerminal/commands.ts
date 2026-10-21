export interface CommandOutput {
  id: string;
  command: string;
  timestamp: string;
  type: 'output' | 'error' | 'system' | 'custom';
  content?: string | React.ReactNode;
  component?: string;
  metadata?: Record<string, unknown>;
}

export interface PortfolioData {
  name: string;
  title: string;
  headline: string;
  bio: string;
  location: string;
  education: string;
  status: string;
  email: string;
  resumeUrl: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    leetcode: string;
    website: string;
  };
  projects: Array<{
    title: string;
    category: string;
    status: string;
    tech: string[];
    description: string;
    liveUrl?: string;
    repoUrl?: string;
  }>;
  skills: {
    frontend: string[];
    backend: string[];
    languages: string[];
    devops: string[];
    tools: string[];
  };
}

export const PORTFOLIO_FACTS: PortfolioData = {
  name: 'Charan Sai',
  title: 'Lead Architect & Full-Stack Engineer',
  headline: 'Independent Developer & Digital Solutions',
  bio: 'Systems design, full-stack web architectures, secure APIs, and client solution delivery. Crafting modern, scalable, and user-friendly digital experiences with high performance.',
  location: 'Bapatla / Chirala, Andhra Pradesh, India',
  education: 'B.Tech CSE (Data Science) @ St. Ann\'s College of Engineering & Technology, Chirala',
  status: 'Available for freelance projects & innovative collaborations 🟢',
  email: 'saikamarajugadda21@gmail.com',
  resumeUrl: '/KAMARAJUGADDA_CHARAN_SAI_Resume.pdf?v=20261019',
  socials: {
    github: 'https://github.com/CHARANSAI11328',
    linkedin: 'https://www.linkedin.com/in/charan-sai-kamarajugadda-865870370/',
    twitter: 'https://x.com/C6H11O5D',
    leetcode: 'https://leetcode.com/u/89IIBeaoVG/',
    website: 'https://charansai.website',
  },
  projects: [
    {
      title: 'LETTERGEN PRO',
      category: 'Desktop & Systems',
      status: 'Completed',
      tech: ['Java', 'Swing', 'PostgreSQL', 'Neon', 'PDF Automation'],
      description:
        'Desktop letter drafting automation suite built in Java Swing with vector PDF output generation, template management, and relational database synchronization with PostgreSQL on Neon.',
    },
    {
      title: 'PROJEX',
      category: 'Web Applications',
      status: 'Active Development',
      tech: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
      description:
        'Engineering-student-focused learning and career-readiness platform involving learning roadmaps, skills assessments, guided projects, and real-time progress analytics.',
    },
    {
      title: 'MAMEKA MAHODAYAM',
      category: 'Digital Publishing',
      status: 'In Progress',
      tech: ['Next.js', 'JavaScript', 'Render', 'CSS3', 'Digital Publishing'],
      description:
        'Modern regional journalism web portal tailored for seamless Telugu vernacular typography, digital e-paper edition viewing, responsive article reading, and dynamic editorial publishing.',
      liveUrl: 'https://project-mm-1.onrender.com',
    },
    {
      title: 'BUSINESS WEBSITES & DIGITAL SOLUTIONS',
      category: 'Business Solutions',
      status: 'Active Development',
      tech: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'SEO'],
      description:
        'Designing and engineering bespoke web architectures, client landing portals, and high-conversion business storefronts with sub-second load times.',
    },
  ],
  skills: {
    frontend: ['React', 'Next.js', 'HTML5 & CSS3', 'Tailwind CSS', 'Flutter & Dart'],
    backend: ['PostgreSQL', 'Neon DB', 'Node.js', 'Firebase', 'RESTful APIs'],
    languages: ['JavaScript (ES6+)', 'TypeScript', 'Java', 'Python', 'Dart', 'SQL'],
    devops: ['Render', 'Netlify', 'Docker', 'Fly.io', 'Git & GitHub'],
    tools: ['AI-Assisted Dev', 'VS Code', 'Linux / Bash', 'Figma', 'Systems Architecture'],
  },
};

export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  category: 'core' | 'portfolio' | 'fun' | 'system';
}

export const COMMAND_REGISTRY: Record<string, CommandDefinition> = {
  help: {
    name: 'help',
    description: 'Display list of available commands and instructions',
    usage: 'help [command]',
    aliases: ['?', 'commands'],
    category: 'core',
  },
  about: {
    name: 'about',
    description: 'Developer biography, current role, and core focus',
    aliases: ['bio', 'whoami'],
    category: 'portfolio',
  },
  skills: {
    name: 'skills',
    description: 'Categorized technical stack (Frontend, Backend, DevOps, Tools)',
    aliases: ['stack', 'tech'],
    category: 'portfolio',
  },
  projects: {
    name: 'projects',
    description: 'Showcase portfolio projects with live links and tech stacks',
    aliases: ['work', 'portfolio'],
    category: 'portfolio',
  },
  contact: {
    name: 'contact',
    description: 'Direct communication channels and verified social handles',
    aliases: ['socials', 'email', 'links'],
    category: 'portfolio',
  },
  resume: {
    name: 'resume',
    description: 'Automatically view or download developer curriculum vitae',
    aliases: ['cv'],
    category: 'portfolio',
  },
  clear: {
    name: 'clear',
    description: 'Flush the terminal scrollback and command history buffer',
    aliases: ['cls'],
    category: 'core',
  },
  matrix: {
    name: 'matrix',
    description: 'Toggle the green cyber digital rain visualizer',
    aliases: ['rain', 'cyber'],
    category: 'fun',
  },
  sudo: {
    name: 'sudo',
    description: 'Execute command with elevated superuser privileges',
    usage: 'sudo <command>',
    category: 'fun',
  },
  date: {
    name: 'date',
    description: 'Display current system time and UTC timestamp',
    category: 'system',
  },
  theme: {
    name: 'theme',
    description: 'Toggle dark / light display mode',
    usage: 'theme [toggle|dark|light]',
    category: 'system',
  },
  exit: {
    name: 'exit',
    description: 'Close the developer terminal overlay',
    aliases: ['quit', 'q'],
    category: 'core',
  },
};
