'use client';

import React from 'react';
import { ProfileData } from '@/lib/types';
import { MapPin, Mail, Briefcase, GraduationCap, FileText, Sparkles } from 'lucide-react';

interface AboutProps {
  profile: ProfileData;
}

export default function About({ profile }: AboutProps) {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & Meta Details */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>About Me</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Turning Ideas into <span className="text-gradient">Digital Reality</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {profile.bio ||
                "I am a passionate software developer with a strong focus on creating modern, scalable, and user-friendly web applications. I enjoy solving complex problems, working across the entire development stack, and engineering digital products that make a real-world difference."}
            </p>

            {/* Quick Meta Info List matching reference card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-5 rounded-2xl glass-panel">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Location</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {profile.location || 'Chirala, Andhra Pradesh, India'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Email</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] block">
                    {profile.email || 'contact@charansai.website'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Freelance</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {profile.availabilityStatus === 'available' ? 'Available' : 'Limited availability'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Education</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    B.Tech CSE (Data Science)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-4 mt-2">
              <a
                href={profile.resumeUrl || '#contact'}
                target={profile.resumeUrl ? '_blank' : '_self'}
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Resume</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Composition with Handwritten Annotation */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Playful Handwritten Annotation: "Code Design Create" with crown */}
            <div className="absolute -top-6 right-2 sm:right-6 z-20 pointer-events-none hidden sm:block text-right">
              {/* Little doodle crown */}
              <svg
                className="w-7 h-7 ml-auto text-amber-500 mb-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 18h20" />
                <path d="M4 18l2-10 6 5 6-5 2 10" />
              </svg>
              <div className="font-handwriting text-2xl font-bold text-slate-800 dark:text-slate-200 rotate-2">
                Code<br />Design<br />Create
              </div>
              {/* Arrow */}
              <svg
                className="w-8 h-8 ml-auto text-slate-600 dark:text-slate-400 transform -rotate-45"
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M30 10 Q15 20 10 32" />
                <path d="M8 22 L10 32 L20 30" />
              </svg>
            </div>

            {/* Dimensional Card Box */}
            <div className="relative w-full max-w-[360px] aspect-[4/5] rounded-3xl glass-panel overflow-hidden p-3 shadow-2xl border border-slate-200/80 dark:border-slate-800/80">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-slate-100 via-indigo-50/50 to-violet-100/50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                {/* Background decorative geometry */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-violet-400/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />

                {/* Profile portrait placeholder / avatar illustration */}
                <div className="relative z-10 w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-sky-400 to-purple-500 shadow-xl mb-5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Charan Sai — Independent Developer"
                        className="w-full h-full object-cover object-[center_20%]"
                      />
                    ) : (
                      <div className="text-3xl font-black text-gradient">CS</div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 text-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    Charan Sai
                  </h3>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-3">
                    St. Ann's College of Eng. & Tech
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                    B.Tech in Computer Science & Engineering with specialization in Data Science.
                  </p>
                </div>

                {/* Floating pill badge */}
                <div className="absolute bottom-4 z-10 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  India • Digital Solutions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
