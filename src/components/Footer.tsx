'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, Shield, Heart } from 'lucide-react';
import { ProfileData } from '@/lib/types';

interface FooterProps {
  profile: ProfileData;
}

export default function Footer({ profile }: FooterProps) {
  const [currentYear, setCurrentYear] = React.useState<number>(2026);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

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
              href={profile.socialLinks?.github || 'https://github.com/CHARANSAI11328'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="GitHub"
              title="GitHub Profile"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={profile.socialLinks?.linkedin || 'https://www.linkedin.com/in/charan-sai-kamarajugadda-865870370/'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="LinkedIn"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={profile.socialLinks?.twitter || profile.socialLinks?.x || 'https://x.com/C6H11O5D'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="X Profile"
              title="X (Twitter) Profile"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href={profile.socialLinks?.leetcode || 'https://leetcode.com/u/89IIBeaoVG/'}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="LeetCode Profile"
              title="LeetCode Profile"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.874 5.874 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.818 3.551 5.955 5.955 0 0 0 1.254-.031 6.042 6.042 0 0 0 2.227-.852l3.49-2.316a1.381 1.381 0 0 0-.824-2.48h-5.24a3.172 3.172 0 0 1-2.28-1.02 3.25 3.25 0 0 1-.77-2.368 3.218 3.218 0 0 1 1.01-2.18l3.774-4.04 4.908-5.244A1.38 1.38 0 0 0 13.483 0zm-2.88 7.218l-3.854 4.126a1.38 1.38 0 1 0 2.016 1.884l3.854-4.126a1.38 1.38 0 1 0-2.016-1.884zM16.14 12.923h6.48a1.38 1.38 0 0 0 0-2.76h-6.48a1.38 1.38 0 0 0 0 2.76z"/>
              </svg>
            </a>
            <a
              href={`mailto:${profile.email || 'contact@charansai.website'}`}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              aria-label="Email"
              title="Email"
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
