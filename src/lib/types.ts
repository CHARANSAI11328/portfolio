export interface ProfileData {
  id: string;
  name: string;
  title: string;
  bio: string;
  heroHeading: string;
  heroDesc: string;
  location: string;
  email: string;
  phone: string;
  avatarUrl: string;
  resumeUrl: string;
  availabilityStatus: 'available' | 'busy' | 'contact';
  availabilityText: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    x?: string;
    leetcode?: string;
    email?: string;
    website?: string;
  };
  stats: {
    label: string;
    value: string;
  }[];
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  caseStudy?: string;
  category: string;
  thumbnail?: string;
  images?: string[];
  technologies: string[];
  status: 'In Progress' | 'Completed' | 'Concept' | 'Active Development';
  liveUrl?: string;
  repoUrl?: string;
  featured: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend & Data' | 'Languages' | 'Tools & Platforms';
  icon: string;
  level?: string;
  featured: boolean;
  displayOrder: number;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expDate?: string;
  credentialId?: string;
  verificationUrl?: string;
  image?: string;
  description?: string;
  published: boolean;
  displayOrder: number;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  description: string;
  highlights: string[];
  type: 'work' | 'education';
  displayOrder: number;
}

export interface EventItem {
  id: string;
  title: string;
  organizer: string;
  date: string;
  location: string;
  description: string;
  participationType: string;
  url?: string;
  image?: string;
  published: boolean;
  displayOrder: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  displayOrder: number;
}

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface SiteSettings {
  themePreference: 'system' | 'light' | 'dark';
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  bannerText: string;
  sectionVisibility: {
    about: boolean;
    skills: boolean;
    projects: boolean;
    certifications: boolean;
    experience: boolean;
    events: boolean;
    team?: boolean;
    services: boolean;
    contact: boolean;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  passwordHash: string;
  tokenVersion?: number;
  passwordChangedAt?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  email?: string;
  portfolio?: string;
  socials?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    x?: string;
    leetcode?: string;
    email?: string;
    portfolio?: string;
  };
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioDatabase {
  admins: AdminUser[];
  profile: ProfileData;
  projects: ProjectItem[];
  skills: SkillItem[];
  certifications: CertificationItem[];
  experiences: ExperienceItem[];
  events: EventItem[];
  services: ServiceItem[];
  team?: TeamMember[];
  inquiries: InquiryItem[];
  settings: SiteSettings;
  activityLogs: ActivityLog[];
}
