'use client';

import React, { useState } from 'react';
import { TeamMember } from '@/lib/types';
import { Users, ExternalLink, Mail, Github, Linkedin, Globe, X, ArrowRight } from 'lucide-react';

interface TeamProps {
  team: TeamMember[];
}

function getInitials(name: string): string {
  if (!name) return 'TM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getInitialsAvatarSvg(name: string): string {
  const initials = getInitials(name);
  const colors = [
    ['#6366F1', '#8B5CF6'],
    ['#EC4899', '#8B5CF6'],
    ['#3B82F6', '#06B6D4'],
    ['#F59E0B', '#EF4444'],
    ['#10B981', '#3B82F6'],
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const pair = colors[Math.abs(hash) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="gt_${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pair[0]}"/><stop offset="100%" stop-color="${pair[1]}"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="url(#gt_${Math.abs(hash)})"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="52" fill="#FFFFFF" dominant-baseline="middle" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function Team({ team }: TeamProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <section id="team" className="py-20 relative bg-slate-50/20 dark:bg-slate-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Engineering & Design Collective</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Meet <span className="text-gradient">My Team</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Multidisciplinary specialists collaborating to architect, build, and deliver scalable enterprise systems and digital experiences.
          </p>
        </div>

        {team.length === 0 ? (
          <div className="rounded-3xl glass-panel p-10 sm:p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Our collaborative team is growing.
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Core team members, software engineers, and design partners will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => {
              const avatarSrc = (member.avatarUrl && member.avatarUrl.trim().length > 0)
                ? member.avatarUrl.trim()
                : getInitialsAvatarSvg(member.name);
              const socials = member.socials || {};

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="p-6 rounded-3xl glass-panel glow-card flex flex-col justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden p-[2.5px] bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatarSrc}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover bg-slate-900"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = getInitialsAvatarSvg(member.name);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">
                            {member.name}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                            #{member.displayOrder || 1}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                          {member.role}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {member.bio || 'Core engineering contributor specializing in enterprise software architecture.'}
                    </p>

                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {member.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100/60 dark:border-indigo-900/40"
                          >
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 4 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                            +{member.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {(member.github || socials.github) && (
                        <a
                          href={member.github || socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {(member.linkedin || socials.linkedin) && (
                        <a
                          href={member.linkedin || socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {(member.email || socials.email) && (
                        <a
                          href={`mailto:${member.email || socials.email}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {(member.portfolio || socials.portfolio) && (
                        <a
                          href={member.portfolio || socials.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Website"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for viewing team member profile */}
        {selectedMember && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-5 mb-5">
                <div className="w-20 h-20 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedMember.avatarUrl || getInitialsAvatarSvg(selectedMember.name)}
                    alt={selectedMember.name}
                    className="w-full h-full rounded-full object-cover bg-slate-900"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = getInitialsAvatarSvg(selectedMember.name);
                    }}
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40">
                    Team Member #{selectedMember.displayOrder || 1}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedMember.name}
                  </h3>
                  <p className="text-xs font-semibold text-indigo-500">
                    {selectedMember.role}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Biography & Focus
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedMember.bio || 'Core engineering contributor specializing in enterprise software architecture and digital products.'}
                </p>
              </div>

              {selectedMember.skills && selectedMember.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Specializations & Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMember.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5">
                {(selectedMember.email || selectedMember.socials?.email) && (
                  <a
                    href={`mailto:${selectedMember.email || selectedMember.socials?.email}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Member</span>
                  </a>
                )}
                {(selectedMember.github || selectedMember.socials?.github) && (
                  <a
                    href={selectedMember.github || selectedMember.socials?.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {(selectedMember.linkedin || selectedMember.socials?.linkedin) && (
                  <a
                    href={selectedMember.linkedin || selectedMember.socials?.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {(selectedMember.portfolio || selectedMember.socials?.portfolio) && (
                  <a
                    href={selectedMember.portfolio || selectedMember.socials?.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
