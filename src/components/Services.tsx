'use client';

import React from 'react';
import { ServiceItem } from '@/lib/types';
import { Layout, Globe, Monitor, Sparkles, CheckCircle2 } from 'lucide-react';

interface ServicesProps {
  services: ServiceItem[];
}

export default function Services({ services }: ServicesProps) {
  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('web app')) return <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
    if (t.includes('business') || t.includes('website')) return <Globe className="w-6 h-6 text-sky-600 dark:text-sky-400" />;
    if (t.includes('desktop') || t.includes('software')) return <Monitor className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
    return <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />;
  };

  return (
    <section id="services" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Solutions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Services I <span className="text-gradient">Offer</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            Tailored engineering capabilities delivering tangible business value and exceptional digital products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((serv) => (
            <div
              key={serv.id}
              className="p-6 rounded-3xl glass-panel glow-card flex flex-col justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                  {getIcon(serv.title)}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {serv.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  {serv.description}
                </p>

                {serv.features && serv.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {serv.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <a
                href="#contact"
                className="w-full py-2.5 rounded-xl text-center text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-900 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 transition-all shadow-sm"
              >
                Inquire Service
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
