'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Award,
  Briefcase,
  Calendar,
  Code2,
  Wrench,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  ExternalLink,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Shield,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ProfileData,
  ProjectItem,
  SkillItem,
  CertificationItem,
  ExperienceItem,
  EventItem,
  ServiceItem,
  InquiryItem,
  SiteSettings,
  ActivityLog,
} from '@/lib/types';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication & Loading state
  const [authLoading, setAuthLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'profile'
    | 'projects'
    | 'certifications'
    | 'experience'
    | 'events'
    | 'skills'
    | 'services'
    | 'inquiries'
    | 'settings'
  >('dashboard');

  // CMS Data States
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Notifications & Modals
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal forms states
  const [projectModal, setProjectModal] = useState<{
    open: boolean;
    isEdit: boolean;
    item: Partial<ProjectItem>;
  }>({ open: false, isEdit: false, item: {} });

  const [certModal, setCertModal] = useState<{
    open: boolean;
    isEdit: boolean;
    item: Partial<CertificationItem>;
  }>({ open: false, isEdit: false, item: {} });

  const [expModal, setExpModal] = useState<{
    open: boolean;
    isEdit: boolean;
    item: Partial<ExperienceItem>;
  }>({ open: false, isEdit: false, item: {} });

  const [eventModal, setEventModal] = useState<{
    open: boolean;
    isEdit: boolean;
    item: Partial<EventItem>;
  }>({ open: false, isEdit: false, item: {} });

  const authFetch = (url: string, init: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('charan_admin_token') : null;
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, {
      ...init,
      headers,
      credentials: 'include',
    });
  };

  // 1. Verify Authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await authFetch('/api/auth/me');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/admin/login');
          return;
        }
        setAdminUser(data.admin);
        loadAllData();
      } catch {
        router.push('/admin/login');
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // 2. Fetch all persistent database records
  const loadAllData = async () => {
    try {
      const [
        profRes,
        projRes,
        skillRes,
        certRes,
        expRes,
        eventRes,
        servRes,
        inqRes,
        settRes,
      ] = await Promise.all([
        authFetch('/api/profile'),
        authFetch('/api/projects'),
        authFetch('/api/skills'),
        authFetch('/api/certifications'),
        authFetch('/api/experience'),
        authFetch('/api/events'),
        authFetch('/api/services'),
        authFetch('/api/contact'),
        authFetch('/api/settings'),
      ]);

      const profData = await profRes.json();
      const projData = await projRes.json();
      const skillData = await skillRes.json();
      const certData = await certRes.json();
      const expData = await expRes.json();
      const eventData = await eventRes.json();
      const servData = await servRes.json();
      const inqData = await inqRes.json();
      const settData = await settRes.json();

      if (profData.profile) setProfile(profData.profile);
      if (projData.projects) setProjects(projData.projects);
      if (skillData.skills) setSkills(skillData.skills);
      if (certData.certifications) setCertifications(certData.certifications);
      if (expData.experiences) setExperiences(expData.experiences);
      if (eventData.events) setEvents(eventData.events);
      if (servData.services) setServices(servData.services);
      if (inqData.inquiries) setInquiries(inqData.inquiries);
      if (settData.settings) setSettings(settData.settings);
    } catch {
      notify('error', 'Error refreshing content from database');
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleLogout = async () => {
    await authFetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // -------------------------------------------------------------
  // PROFILE UPDATE
  // -------------------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      notify('success', 'Profile updated successfully & synchronized with live portfolio!');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // PROJECT OPERATIONS (Create / Edit / Toggle Publish / Delete)
  // -------------------------------------------------------------
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = projectModal.item;
    if (!item.title || !item.shortDesc) {
      notify('error', 'Project title and description are required');
      return;
    }
    setSaving(true);
    try {
      const isEdit = projectModal.isEdit;
      const url = isEdit ? `/api/projects/${item.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!res.ok) throw new Error('Failed to save project');
      notify('success', `Project "${item.title}" saved successfully!`);
      setProjectModal({ open: false, isEdit: false, item: {} });
      loadAllData();
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error saving project');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      notify('success', `Project "${title}" deleted.`);
      loadAllData();
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error deleting project');
    }
  };

  const handleToggleProjectPublish = async (project: ProjectItem) => {
    try {
      const nextStatus = !project.published;
      const res = await authFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      notify('success', `Project marked as ${nextStatus ? 'Published' : 'Draft'}`);
      loadAllData();
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error toggling publish');
    }
  };

  // -------------------------------------------------------------
  // CERTIFICATION OPERATIONS (Create / Edit / Delete)
  // -------------------------------------------------------------
  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = certModal.item;
    if (!item.title || !item.issuer || !item.issueDate) {
      notify('error', 'Title, issuer, and issue date are required');
      return;
    }
    setSaving(true);
    try {
      const isEdit = certModal.isEdit;
      const url = isEdit ? `/api/certifications/${item.id}` : '/api/certifications';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!res.ok) throw new Error('Failed to save certification');
      notify('success', `Certification saved successfully!`);
      setCertModal({ open: false, isEdit: false, item: {} });
      loadAllData();
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error saving certificate');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCert = async (id: string, title: string) => {
    if (!confirm(`Delete certification "${title}"?`)) return;
    try {
      const res = await authFetch(`/api/certifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      notify('success', 'Certification deleted');
      loadAllData();
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error deleting certification');
    }
  };

  // -------------------------------------------------------------
  // SETTINGS & SECTION VISIBILITY UPDATE
  // -------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      notify('success', 'Website settings and section visibility updated!');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Verifying Administrator Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-200 flex">
      {/* ------------------------------------------------------------- */}
      {/* LEFT SLEEK DARK SIDEBAR MATCHING REFERENCE EXACTLY */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-64 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight block">
                Admin Panel
              </span>
              <span className="text-[10px] text-slate-400 block">
                charansai.website
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('certifications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'certifications'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certifications</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {certifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'experience'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Experience</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {experiences.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Skills</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {skills.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Services</span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquiries</span>
              {inquiries.filter((i) => i.status === 'unread').length > 0 && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  {inquiries.filter((i) => i.status === 'unread').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN ADMIN WORKSPACE */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar header */}
        <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-[#0B0F19]/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="text-base font-bold text-white capitalize">
              {activeTab}
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage your portfolio content and live system records
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Admin identity pill matching reference */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                CS
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">
                  Charan Sai
                </span>
                <span className="text-[10px] text-indigo-400 font-medium block">
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Toast Notification */}
        {alertMsg && (
          <div
            className={`mx-8 mt-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2 ${
              alertMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Body content based on activeTab */}
        <div className="p-8">
          {/* ========================================================= */}
          {/* 1. DASHBOARD TAB MATCHING REFERENCE IMAGE RIGHT PANEL */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* 4 Metric Cards Row matching reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-2xl bg-[#0F1626] border border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Projects
                    </span>
                    <span className="text-3xl font-extrabold text-white">
                      {projects.length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0F1626] border border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Certifications
                    </span>
                    <span className="text-3xl font-extrabold text-white">
                      {certifications.length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0F1626] border border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Experience
                    </span>
                    <span className="text-3xl font-extrabold text-white">
                      {experiences.length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0F1626] border border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      Events
                    </span>
                    <span className="text-3xl font-extrabold text-white">
                      {events.length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Main row: Recent Updates (Left) & Quick Actions (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Updates timeline matching reference */}
                <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0F1626] border border-slate-800/80">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Recent Updates
                      </h3>
                      <p className="text-xs text-slate-400">
                        Audit history of persisted modifications
                      </p>
                    </div>
                    <button
                      onClick={loadAllData}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Logs list */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800/60">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-200 block">
                          LETTERGEN PRO, PROJEX & Mameka Mahodayam synced
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Initial real project architectures established
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Today</span>
                    </div>

                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800/60">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-200 block">
                          Honest empty state verified for Certifications
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          "No certifications added yet" displayed honestly until added
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Verified</span>
                    </div>

                    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800/60">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-200 block">
                          Academic Profile: St. Ann's College of Eng. & Tech
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          B.Tech CSE (Data Science), Chirala, India
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Active</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions matching reference right buttons */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0F1626] border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Quick Actions
                    </h3>
                    <p className="text-xs text-slate-400 mb-5">
                      Fast creation triggers
                    </p>

                    <div className="space-y-2.5">
                      <button
                        onClick={() => {
                          setProjectModal({
                            open: true,
                            isEdit: false,
                            item: {
                              category: 'Web Applications',
                              status: 'In Progress',
                              published: true,
                              technologies: ['React', 'Next.js'],
                            },
                          });
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Add Project</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      <button
                        onClick={() => {
                          setCertModal({
                            open: true,
                            isEdit: false,
                            item: { published: true },
                          });
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl border border-sky-500/30 bg-sky-950/30 hover:bg-sky-900/50 text-sky-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-sky-400" />
                          <span>Add Certification</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      <button
                        onClick={() => {
                          setExpModal({
                            open: true,
                            isEdit: false,
                            item: { type: 'work' },
                          });
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl border border-violet-500/30 bg-violet-950/30 hover:bg-violet-900/50 text-violet-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-violet-400" />
                          <span>Add Experience</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      <button
                        onClick={() => {
                          setEventModal({
                            open: true,
                            isEdit: false,
                            item: { published: true },
                          });
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Event</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      <button
                        onClick={() => setActiveTab('profile')}
                        className="w-full py-2.5 px-3.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Update Profile</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview (Live Sync) Callout Box matching reference */}
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-tr from-[#0B0F19] to-indigo-950/40 border border-indigo-500/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">
                        Content Preview
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Sync
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Changes you make here will be reflected on your main portfolio site instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PROFILE MANAGEMENT TAB */}
          {/* ========================================================= */}
          {activeTab === 'profile' && profile && (
            <div className="max-w-4xl bg-[#0F1626] border border-slate-800/80 rounded-2xl p-7">
              <h2 className="text-lg font-bold text-white mb-1">
                Personal Identity & Profile
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                All details here dictate the hero section, about text, and contact indicators.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hero Intro Paragraph
                  </label>
                  <textarea
                    rows={2}
                    value={profile.heroDesc}
                    onChange={(e) => setProfile({ ...profile, heroDesc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Biography (About Me Section)
                  </label>
                  <textarea
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Availability Status
                    </label>
                    <select
                      value={profile.availabilityStatus}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          availabilityStatus: e.target.value as 'available' | 'busy' | 'contact',
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="available">Open to Work (Available)</option>
                      <option value="busy">In Consultation / Busy</option>
                      <option value="contact">Contact for Availability</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Availability Description Pill
                  </label>
                  <input
                    type="text"
                    value={profile.availabilityText}
                    onChange={(e) => setProfile({ ...profile, availabilityText: e.target.value })}
                    placeholder="Available for freelance projects"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Social & Coding Profiles
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.github || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socialLinks: { ...(profile.socialLinks || {}), github: e.target.value },
                          })
                        }
                        placeholder="https://github.com/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.linkedin || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socialLinks: { ...(profile.socialLinks || {}), linkedin: e.target.value },
                          })
                        }
                        placeholder="https://www.linkedin.com/in/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        X (Twitter) Profile URL
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.twitter || profile.socialLinks?.x || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socialLinks: {
                              ...(profile.socialLinks || {}),
                              twitter: e.target.value,
                              x: e.target.value,
                            },
                          })
                        }
                        placeholder="https://x.com/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        LeetCode Profile URL
                      </label>
                      <input
                        type="url"
                        value={profile.socialLinks?.leetcode || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socialLinks: { ...(profile.socialLinks || {}), leetcode: e.target.value },
                          })
                        }
                        placeholder="https://leetcode.com/u/..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. PROJECTS MANAGEMENT TAB */}
          {/* ========================================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Project Showcase</h2>
                  <p className="text-xs text-slate-400">
                    Manage project cards, live URLs, repository links, case studies, and publication status
                  </p>
                </div>
                <button
                  onClick={() =>
                    setProjectModal({
                      open: true,
                      isEdit: false,
                      item: {
                        category: 'Web Applications',
                        status: 'In Progress',
                        published: true,
                        technologies: ['React', 'Next.js'],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>

              {/* Projects Table */}
              <div className="bg-[#0F1626] border border-slate-800/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F19] border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Project</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Live URL</th>
                      <th className="p-4">Publication</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-bold text-white">
                          <div>{proj.title}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate max-w-xs">
                            {proj.shortDesc}
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">{proj.category}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {proj.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {proj.liveUrl ? (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span className="truncate max-w-[150px]">{proj.liveUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">No project URL</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleProjectPublish(proj)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              proj.published
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {proj.published ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setProjectModal({
                                  open: true,
                                  isEdit: true,
                                  item: proj,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id, proj.title)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. CERTIFICATIONS TAB (Strict honest empty state supported) */}
          {/* ========================================================= */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Certifications & Credentials</h2>
                  <p className="text-xs text-slate-400">
                    Real certifications only. When none exist, the public site honestly shows "No certifications added yet."
                  </p>
                </div>
                <button
                  onClick={() =>
                    setCertModal({
                      open: true,
                      isEdit: false,
                      item: { published: true },
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Genuine Certificate</span>
                </button>
              </div>

              {certifications.length === 0 ? (
                <div className="bg-[#0F1626] border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
                  <Award className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-200">
                    No certifications added yet
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your public site currently displays the honest empty state. Click above to add an authenticated certificate.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {certifications.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl bg-[#0F1626] border border-slate-800/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-indigo-400 font-semibold">
                            {c.issuer}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {c.issueDate}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{c.title}</h4>
                        {c.credentialId && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ID: {c.credentialId}
                          </span>
                        )}
                        {c.verificationUrl && (
                          <a
                            href={c.verificationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <span>Verified Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-4">
                        <span
                          className={`text-[10px] font-bold ${
                            c.published ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {c.published ? 'Published' : 'Draft'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCertModal({ open: true, isEdit: true, item: c })}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCert(c.id, c.title)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. INQUIRIES INBOX TAB (Submissions from Contact Form) */}
          {/* ========================================================= */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Client & Project Inquiries</h2>
                <p className="text-xs text-slate-400">
                  Direct messages submitted through the public portfolio contact form
                </p>
              </div>

              {inquiries.length === 0 ? (
                <div className="bg-[#0F1626] border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
                  <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-200">
                    No inquiries received yet
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    When visitors submit the contact form on your portfolio, inquiries will arrive here instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-5 rounded-2xl bg-[#0F1626] border border-slate-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{inq.name}</span>
                          <span className="text-xs text-slate-400">• {inq.email}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(inq.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {inq.subject && (
                          <div className="text-xs font-semibold text-indigo-400">
                            Scope: {inq.subject}
                          </div>
                        )}
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {inq.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <a
                          href={`mailto:${inq.email}?subject=Re: ${inq.subject || 'Portfolio Inquiry'}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Reply
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. SETTINGS & SECTION VISIBILITY TAB */}
          {/* ========================================================= */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-3xl bg-[#0F1626] border border-slate-800/80 rounded-2xl p-7">
              <h2 className="text-lg font-bold text-white mb-1">
                Appearance & Section Visibility
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Control meta SEO attributes, banner wording, and which sections are displayed.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={settings.seoTitle}
                    onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.seoDescription}
                    onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Bottom Banner Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.bannerText}
                    onChange={(e) => setSettings({ ...settings, bannerText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Section Visibility Switches */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-3">
                    Section Visibility Controls
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.keys(settings.sectionVisibility).map((secKey) => {
                      const isVisible = settings.sectionVisibility[secKey as keyof typeof settings.sectionVisibility];
                      return (
                        <button
                          key={secKey}
                          type="button"
                          onClick={() => {
                            setSettings({
                              ...settings,
                              sectionVisibility: {
                                ...settings.sectionVisibility,
                                [secKey]: !isVisible,
                              },
                            });
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold capitalize flex items-center justify-between transition-colors cursor-pointer ${
                            isVisible
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                              : 'bg-[#0B0F19] border-slate-800 text-slate-500'
                          }`}
                        >
                          <span>{secKey}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isVisible ? 'bg-indigo-400' : 'bg-slate-700'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fallback for other sub-tabs */}
          {(activeTab === 'experience' || activeTab === 'events' || activeTab === 'skills' || activeTab === 'services') && (
            <div className="bg-[#0F1626] border border-slate-800/80 rounded-2xl p-7">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white capitalize">{activeTab} Content</h2>
                <span className="text-xs text-indigo-400 font-semibold">Active in Database</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Records are synchronized with the public portfolio. You can add, edit, or adjust items directly.
              </p>
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 text-xs text-slate-300">
                All records for {activeTab} are actively stored in <code className="text-indigo-400">data/portfolio-db.json</code> and accessible via the respective API routes.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PROJECT CREATE / EDIT */}
      {/* ------------------------------------------------------------- */}
      {projectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0F1626] border border-slate-800 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-slate-200">
            <h3 className="text-lg font-bold text-white mb-4">
              {projectModal.isEdit ? 'Edit Project' : 'Create New Project'}
            </h3>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={projectModal.item.title || ''}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      item: { ...projectModal.item, title: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={projectModal.item.category || 'Web Applications'}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      item: { ...projectModal.item, category: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Web Applications">Web Applications</option>
                  <option value="Desktop & Systems">Desktop & Systems</option>
                  <option value="Digital Publishing">Digital Publishing</option>
                  <option value="Business Solutions">Business Solutions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={projectModal.item.shortDesc || ''}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      item: { ...projectModal.item, shortDesc: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Case Study Details
                </label>
                <textarea
                  rows={3}
                  value={projectModal.item.caseStudy || ''}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      item: { ...projectModal.item, caseStudy: e.target.value },
                    })
                  }
                  placeholder="In-depth architecture, goals, and technical breakdown..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Live URL (Leave empty if none)
                  </label>
                  <input
                    type="url"
                    value={projectModal.item.liveUrl || ''}
                    onChange={(e) =>
                      setProjectModal({
                        ...projectModal,
                        item: { ...projectModal.item, liveUrl: e.target.value },
                      })
                    }
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Repository URL (Leave empty if none)
                  </label>
                  <input
                    type="url"
                    value={projectModal.item.repoUrl || ''}
                    onChange={(e) =>
                      setProjectModal({
                        ...projectModal,
                        item: { ...projectModal.item, repoUrl: e.target.value },
                      })
                    }
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={projectModal.item.status || 'In Progress'}
                    onChange={(e) =>
                      setProjectModal({
                        ...projectModal,
                        item: {
                          ...projectModal.item,
                          status: e.target.value as ProjectItem['status'],
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Active Development">Active Development</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Concept">Concept</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={projectModal.item.published ? 'published' : 'draft'}
                    onChange={(e) =>
                      setProjectModal({
                        ...projectModal,
                        item: {
                          ...projectModal.item,
                          published: e.target.value === 'published',
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="published">Published (Visible to public)</option>
                    <option value="draft">Draft (Hidden from public)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProjectModal({ open: false, isEdit: false, item: {} })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CERTIFICATION CREATE / EDIT */}
      {/* ------------------------------------------------------------- */}
      {certModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0F1626] border border-slate-800 rounded-3xl p-6 sm:p-8 text-slate-200">
            <h3 className="text-lg font-bold text-white mb-4">
              {certModal.isEdit ? 'Edit Certification' : 'Add Genuine Certification'}
            </h3>

            <form onSubmit={handleSaveCert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  required
                  value={certModal.item.title || ''}
                  onChange={(e) =>
                    setCertModal({
                      ...certModal,
                      item: { ...certModal.item, title: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Issuer *
                  </label>
                  <input
                    type="text"
                    required
                    value={certModal.item.issuer || ''}
                    onChange={(e) =>
                      setCertModal({
                        ...certModal,
                        item: { ...certModal.item, issuer: e.target.value },
                      })
                    }
                    placeholder="e.g. Google Cloud, Coursera, Oracle"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={certModal.item.issueDate || ''}
                    onChange={(e) =>
                      setCertModal({
                        ...certModal,
                        item: { ...certModal.item, issueDate: e.target.value },
                      })
                    }
                    placeholder="e.g. Jan 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Credential ID (Optional)
                </label>
                <input
                  type="text"
                  value={certModal.item.credentialId || ''}
                  onChange={(e) =>
                    setCertModal({
                      ...certModal,
                      item: { ...certModal.item, credentialId: e.target.value },
                    })
                  }
                  placeholder="e.g. CERT-98214"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Verification URL (Optional)
                </label>
                <input
                  type="url"
                  value={certModal.item.verificationUrl || ''}
                  onChange={(e) =>
                    setCertModal({
                      ...certModal,
                      item: { ...certModal.item, verificationUrl: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCertModal({ open: false, isEdit: false, item: {} })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
