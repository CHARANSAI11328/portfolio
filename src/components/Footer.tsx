'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, Shield, Heart } from 'lucide-react';
import { ProfileData } from '@/lib/types';

interface FooterProps {
  profile: ProfileData;
}

export default function Footer({ profile }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative pt-12 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sleek Dark Cosmic Banner matching reference bottom image */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 mb-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Subtle cosmic background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.2),transparent_70%)] pointer-events-none" />

          {/* Left star glyph */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-wide">
              Charan Sai
            </span>
          </div>

          {/* Central memorable quote matching reference */}
          <div className="relative z-10 text-center">
            <p className="text-sm sm:text-base font-semibold text-slate-200 tracking-wide">
              More Than Just a Portfolio <span className="text-indigo-400 mx-2">—</span> It's a Journey of Ideas, Code and Creativity
            </p>
          </div>

          {/* Right 3D shield / gem icon */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-inner">
              <Shield className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Footer links & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {currentYear} Charan Sai. All rights reserved.</span>
            <span>•</span>
            <span>Chirala, AP, India</span>
          </div>

          {/* Social and Quick Links */}
          <div className="flex items-center gap-5">
            <a
              href={profile.socialLinks?.github || 'https://github.com'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={profile.socialLinks?.linkedin || 'https://linkedin.com'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={`mailto:${profile.email || 'contact@charansai.website'}`}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/admin"
              className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin CMS</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
