'use client';

import React, { useState } from 'react';
import { SkillItem } from '@/lib/types';
import SkillsGyro3D from './SkillsGyro3D';
import {
  Code,
  Layers,
  FileCode,
  Globe,
  Palette,
  Smartphone,
  Coffee,
  Terminal,
  Database,
  Server,
  Flame,
  GitBranch,
  Cloud,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface SkillsProps {
  skills: SkillItem[];
}

export default function Skills({ skills }: SkillsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Frontend', 'Backend & Data', 'Languages', 'Tools & Platforms'];

  const filteredSkills =
    activeCategory === 'All'
      ? skills
      : skills.filter((s) => s.category.toLowerCase() === activeCategory.toLowerCase());

  // Icon resolver for modern tech stack
  const renderIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('react')) return <Code className="w-5 h-5 text-cyan-500" />;
    if (lower.includes('next')) return <Layers className="w-5 h-5 text-slate-900 dark:text-white" />;
    if (lower.includes('type')) return <FileCode className="w-5 h-5 text-blue-500" />;
    if (lower.includes('java') && !lower.includes('script')) return <Coffee className="w-5 h-5 text-amber-600" />;
    if (lower.includes('script')) return <Code className="w-5 h-5 text-yellow-500" />;
    if (lower.includes('python')) return <Terminal className="w-5 h-5 text-emerald-500" />;
    if (lower.includes('flutter') || lower.includes('dart')) return <Smartphone className="w-5 h-5 text-sky-400" />;
    if (lower.includes('postgre') || lower.includes('sql')) return <Database className="w-5 h-5 text-indigo-500" />;
    if (lower.includes('neon')) return <Server className="w-5 h-5 text-emerald-400" />;
    if (lower.includes('firebase')) return <Flame className="w-5 h-5 text-amber-500" />;
    if (lower.includes('git')) return <GitBranch className="w-5 h-5 text-orange-500" />;
    if (lower.includes('netlify') || lower.includes('render')) return <Cloud className="w-5 h-5 text-cyan-400" />;
    if (lower.includes('html') || lower.includes('css')) return <Globe className="w-5 h-5 text-rose-500" />;
    if (lower.includes('tailwind')) return <Palette className="w-5 h-5 text-sky-400" />;
    if (lower.includes('ai')) return <Cpu className="w-5 h-5 text-purple-500" />;
    return <Code className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <section id="skills" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>My Skills</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Technologies <span className="text-gradient">I Work With</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            A curated repertoire of core languages, frameworks, cloud databases, and development tooling.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid & 3D Gyro Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Skills Badge Cards */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3.5 rounded-2xl glass-panel glow-card flex flex-col items-center justify-center text-center group cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                    {renderIcon(skill.name)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    {skill.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {skill.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Gyroscopic Structure with "Always Learning..." annotation */}
          <div className="lg:col-span-4 relative flex flex-col items-center justify-center">
            {/* Playful Handwritten Annotation matching reference */}
            <div className="absolute top-2 left-6 z-20 pointer-events-none hidden sm:block">
              <span className="font-handwriting text-2xl font-bold text-slate-800 dark:text-slate-200 rotate-[-8deg] inline-block">
                Always<br />Learning...
              </span>
              <svg
                className="w-8 h-8 text-slate-600 dark:text-slate-400 ml-4 mt-0.5 transform -rotate-12"
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M 10 10 Q 25 12 30 25" />
                <path d="M 22 26 L 30 25 L 30 18" />
              </svg>
            </div>

            {/* Three.js Gyroscopic Levitating Rings */}
            <SkillsGyro3D />

            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Continuous Exploration
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Always sharpening problem solving & system architecture
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
