'use client';

import React, { useState } from 'react';

interface TerminalBadgeProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const TerminalBadge: React.FC<TerminalBadgeProps> = ({ isOpen, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isOpen) {
    return null; // Hide badge when modal is active
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      <div
        className={`absolute right-full mr-3 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-950/90 text-slate-200 border border-slate-700/70 shadow-xl backdrop-blur-md whitespace-nowrap transition-all duration-200 pointer-events-none flex items-center gap-2 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span>Developer Terminal</span>
        <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
          <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>`</kbd>
        </span>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onToggle}
        type="button"
        aria-label="Toggle Developer Terminal (Ctrl+K)"
        className="relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white shadow-xl hover:shadow-emerald-500/10 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer group"
      >
        {/* Glowing aura */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

        {/* Live indicator dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>

        {/* Terminal glyph */}
        <span className="relative font-mono font-bold text-sm tracking-tighter text-emerald-400 group-hover:text-emerald-300">
          &gt;_
        </span>

        {/* Label on wider screens */}
        <span className="hidden sm:inline-block relative text-xs font-mono font-medium text-slate-300 group-hover:text-white">
          Terminal
        </span>
      </button>
    </div>
  );
};

export default TerminalBadge;
