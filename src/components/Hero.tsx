'use client';

import React from 'react';
import Hero3D from './Hero3D';
import { ProfileData } from '@/lib/types';
import { ArrowRight, Download, Sparkles, ChevronDown } from 'lucide-react';

interface HeroProps {
  profile: ProfileData;
}

export default function Hero({ profile }: HeroProps) {
  return (
    <section id="home" className="relative min-h-[92vh] pt-28 pb-16 flex items-center overflow-hidden">
      {/* Ambient background aura */}
      <div className="atmospheric-bg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* "HEY, I'M" greeting badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 w-fit mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>HEY, I'M</span>
            </div>

            {/* Main Name Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-3">
              Charan <span className="text-gradient">Sai</span>
            </h1>

            {/* Professional Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">
              {profile.title || 'Independent Developer & Digital Solutions'}
            </h2>

            {/* Introduction paragraph */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
              {profile.heroDesc ||
                'I build modern, fast and user-friendly web applications that turn ideas into reality. Passionate about technology, design and creating digital experiences that matter.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-12">
              <a
                href="#projects"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>View Projects</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                <span>Contact Me</span>
              </a>

              <a
                href={profile.resumeUrl || '/Charan_Sai_Resume.pdf'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Resume</span>
              </a>
            </div>

            {/* Social & Coding Profiles Strip */}
            <div className="flex items-center gap-2.5 flex-wrap -mt-6 mb-8">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Profiles:
              </span>
              <a
                href={profile.socialLinks?.github || 'https://github.com/CHARANSAI11328'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all shadow-sm hover:-translate-y-0.5"
                title="GitHub — CHARANSAI11328"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                <span>GitHub</span>
              </a>
              <a
                href={profile.socialLinks?.linkedin || 'https://www.linkedin.com/in/charan-sai-kamarajugadda-865870370/'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all shadow-sm hover:-translate-y-0.5"
                title="LinkedIn Profile"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.92 0 1.67-.75 1.67-1.67s-.75-1.67-1.67-1.67-1.67.75-1.67 1.67.75 1.67 1.67 1.67M5.07 18.5h2.79v-8.37H5.07v8.37z"/></svg>
                <span>LinkedIn</span>
              </a>
              <a
                href={profile.socialLinks?.twitter || profile.socialLinks?.x || 'https://x.com/C6H11O5D'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all shadow-sm hover:-translate-y-0.5"
                title="X (Twitter) Profile"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>X</span>
              </a>
              <a
                href={profile.socialLinks?.leetcode || 'https://leetcode.com/u/89IIBeaoVG/'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all shadow-sm hover:-translate-y-0.5"
                title="LeetCode Profile"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.874 5.874 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.818 3.551 5.955 5.955 0 0 0 1.254-.031 6.042 6.042 0 0 0 2.227-.852l3.49-2.316a1.381 1.381 0 0 0-.824-2.48h-5.24a3.172 3.172 0 0 1-2.28-1.02 3.25 3.25 0 0 1-.77-2.368 3.218 3.218 0 0 1 1.01-2.18l3.774-4.04 4.908-5.244A1.38 1.38 0 0 0 13.483 0zm-2.88 7.218l-3.854 4.126a1.38 1.38 0 1 0 2.016 1.884l3.854-4.126a1.38 1.38 0 1 0-2.016-1.884zM16.14 12.923h6.48a1.38 1.38 0 0 0 0-2.76h-6.48a1.38 1.38 0 0 0 0 2.76z"/></svg>
                <span>LeetCode</span>
              </a>
            </div>

            {/* Metric Chips / Stats matching reference bottom left */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 max-w-lg">
              {profile.stats && profile.stats.length > 0 ? (
                profile.stats.map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {stat.value}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {stat.label}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">4+</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Core Projects</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">15+</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Tech Stack</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">100%</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Commitment</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: 3D Centerpiece & Artistic Annotations */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            {/* Playful hand-drawn annotation at top: "Let's Create Something Amazing" */}
            <div className="absolute -top-3 right-8 sm:right-16 z-20 pointer-events-none hidden sm:block">
              <div className="relative text-right">
                <span className="font-handwriting text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-wide rotate-[-4deg] inline-block">
                  Let's Create Something<br />Amazing
                </span>
                {/* Drawn curved arrow pointing toward center 3D */}
                <svg
                  className="w-10 h-10 ml-auto -mt-1 text-slate-700 dark:text-slate-300 transform -rotate-12"
                  viewBox="0 0 50 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 38 4 C 34 16, 20 28, 10 38" />
                  <path d="M 8 28 L 10 38 L 22 36" />
                </svg>
              </div>
            </div>

            {/* Three.js Interactive 3D Canvas */}
            <Hero3D />

            {/* Availability Status Badge matching reference */}
            <div className="absolute bottom-6 right-2 sm:right-8 z-20">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-panel shadow-lg border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {profile.availabilityStatus === 'available' ? 'Open to Work' : 'In Consultation'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {profile.availabilityText || 'Available for freelance projects'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="hidden sm:flex absolute -bottom-6 left-6 items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
              <div className="w-5 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-start justify-center p-1">
                <div className="w-1 h-2 rounded-full bg-indigo-500 animate-bounce" />
              </div>
              <span className="tracking-wider uppercase text-[10px]">Scroll Down</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
