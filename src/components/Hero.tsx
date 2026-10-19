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
