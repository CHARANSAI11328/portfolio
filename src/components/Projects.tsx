'use client';

import React, { useState } from 'react';
import { ProjectItem } from '@/lib/types';
import { ExternalLink, Github, Sparkles, X, Layers, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ProjectsProps {
  projects: ProjectItem[];
}

export default function Projects({ projects }: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Web Applications', 'Desktop & Systems', 'Digital Publishing', 'Business Solutions'];

  const filtered =
    activeCategory === 'All'
      ? projects
      : projects.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>My Projects</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Some of my <span className="text-gradient">recent work</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              Authentic software architectures, web platforms, and automated desktop systems.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid matching reference card layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="rounded-3xl glass-panel glow-card overflow-hidden flex flex-col justify-between group border border-slate-200/80 dark:border-slate-800/80 shadow-md transition-all duration-300 hover:shadow-xl"
            >
              {/* Window Chrome Header & Preview Container */}
              <div>
                {/* Browser window chrome dots matching reference */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                    {proj.category}
                  </span>
                </div>

                {/* Visual Preview Graphic */}
                <div
                  onClick={() => setSelectedProject(proj)}
                  className="w-full h-44 bg-gradient-to-tr from-slate-100 via-indigo-50/40 to-slate-200/50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden cursor-pointer"
                >
                  {/* Subtle decorative geometric backdrop */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

                  {proj.thumbnail ? (
                    <img
                      src={proj.thumbnail}
                      alt={proj.title}
                      className="w-full h-full object-cover rounded-xl shadow group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center relative z-10">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight block">
                        {proj.title}
                      </span>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        Click to view case study
                      </span>
                    </div>
                  )}

                  {/* Status chip */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {proj.status}
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6">
                  <h3
                    onClick={() => setSelectedProject(proj)}
                    className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {proj.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {proj.shortDesc}
                  </p>

                  {/* Tech stack tags matching reference */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {proj.technologies.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer action links with Honest Empty States */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                {/* Live URL handling */}
                {proj.liveUrl ? (
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Live Preview</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic">
                    No project URL available
                  </span>
                )}

                {/* Repo URL or Case Study Trigger */}
                {proj.repoUrl ? (
                  <a
                    href={proj.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Source</span>
                  </a>
                ) : (
                  <button
                    onClick={() => setSelectedProject(proj)}
                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
                  >
                    Case Study
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Case Study Modal */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {selectedProject.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Status: {selectedProject.status}
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                {selectedProject.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {selectedProject.shortDesc}
              </p>

              {/* Case Study Details */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
                  Technical Architecture & Case Study
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedProject.caseStudy ||
                    'Detailed technical documentation, architectural milestones, and implementation workflows for this project are maintained through the Charan Sai admin portfolio system.'}
                </p>
              </div>

              {/* Technologies */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Technologies Utilized
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Destination Links */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                {selectedProject.liveUrl ? (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Live Project</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 italic">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>No project URL available</span>
                  </div>
                )}

                {selectedProject.repoUrl ? (
                  <a
                    href={selectedProject.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>View Repository</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 italic">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>No repository URL available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
