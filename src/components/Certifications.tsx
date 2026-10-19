'use client';

import React from 'react';
import { CertificationItem } from '@/lib/types';
import { Award, ExternalLink, Calendar, ShieldCheck, Sparkles } from 'lucide-react';

interface CertificationsProps {
  certifications: CertificationItem[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  return (
    <section id="certifications" className="py-20 relative bg-slate-50/40 dark:bg-slate-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Certifications</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My <span className="text-gradient">Achievements</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Verified credentials, industry certifications, and academic assessments.
          </p>
        </div>

        {/* Honest Empty State or Rendered Certificates */}
        {certifications.length === 0 ? (
          <div className="rounded-3xl glass-panel p-10 sm:p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No certifications added yet.
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Official course completions, technical credentials, and verification proofs will be displayed here once verified.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-6 rounded-3xl glass-panel glow-card flex flex-col justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    {cert.issueDate && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {cert.issueDate}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {cert.title}
                  </h3>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-2">
                    {cert.issuer}
                  </span>

                  {cert.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                      {cert.description}
                    </p>
                  )}

                  {cert.credentialId && (
                    <div className="text-[11px] text-slate-400 font-mono mb-2">
                      ID: {cert.credentialId}
                    </div>
                  )}
                </div>

                {cert.verificationUrl ? (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>Verify Credential</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
