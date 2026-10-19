'use client';

import React from 'react';
import { ExperienceItem } from '@/lib/types';
import { Briefcase, GraduationCap, Calendar, MapPin, Sparkles } from 'lucide-react';

interface ExperienceProps {
  experiences: ExperienceItem[];
}

export default function Experience({ experiences }: ExperienceProps) {
  return (
    <section id="experience" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Experience & Education</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Work <span className="text-gradient">Journey</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            Academic foundation, software development milestones, and independent digital solution delivery.
          </p>
        </div>

        {/* Timeline Layout matching reference image style */}
        <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {experiences.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[35px] sm:-left-[51px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-600 dark:border-indigo-400 shadow-md group-hover:scale-125 transition-transform" />

              {/* Timeline Card */}
              <div className="p-6 sm:p-7 rounded-3xl glass-panel glow-card border border-slate-200/80 dark:border-slate-800/80 shadow-sm max-w-3xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                      {item.type === 'education' ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : (
                        <Briefcase className="w-4 h-4" />
                      )}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.role}
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/60">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.period}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.company}
                  </span>
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.location}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {item.description}
                  </p>
                )}

                {item.highlights && item.highlights.length > 0 && (
                  <ul className="space-y-2">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
