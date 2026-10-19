'use client';

import React from 'react';
import { EventItem } from '@/lib/types';
import { Calendar, MapPin, ExternalLink, Sparkles, Compass } from 'lucide-react';

interface EventsProps {
  events: EventItem[];
}

export default function Events({ events }: EventsProps) {
  return (
    <section id="events" className="py-20 relative bg-slate-50/30 dark:bg-slate-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Events</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Events & <span className="text-gradient">Activities</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Workshops, hackathons, seminars, and tech symposium participation.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl glass-panel p-10 sm:p-12 text-center max-w-xl mx-auto border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No events recorded yet.
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Genuine event attendance, college workshops, and hackathons will appear here once updated in the admin panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-6 rounded-3xl glass-panel glow-card flex flex-col justify-between border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      {ev.participationType}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {ev.date}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {ev.title}
                  </h3>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">
                    {ev.organizer}
                  </span>

                  {ev.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-3">
                      {ev.description}
                    </p>
                  )}

                  {ev.location && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>

                {ev.url && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>Event Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
