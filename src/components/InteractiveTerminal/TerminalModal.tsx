'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTerminalHistory } from './useTerminalHistory';
import { PORTFOLIO_FACTS, COMMAND_REGISTRY } from './commands';
import MatrixRain from './MatrixRain';

// SSR-safe subscription for portal mounting
const emptySubscribe = () => () => {};

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ isOpen, onClose, onToggle }) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [inputVal, setInputVal] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMatrixActive, setIsMatrixActive] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const terminalBodyRef = useRef<HTMLDivElement | null>(null);

  const {
    outputs,
    addOutput,
    clearOutputs,
    pushHistory,
    navigateHistory,
    bottomRef,
  } = useTerminalHistory();

  // Global hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggle();
        return;
      }

      // Backtick (`) toggle (when not typing in an input/textarea)
      if (e.key === '`' && !isInputActive) {
        e.preventDefault();
        onToggle();
        return;
      }

      // Escape to close or dismiss matrix
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        if (isMatrixActive) {
          setIsMatrixActive(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle, onClose, isMatrixActive]);

  // Focus input when opened or restored from minimize
  useEffect(() => {
    if (isOpen && !isMinimized && !isMatrixActive) {
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isMinimized, isMatrixActive]);

  // Scroll lock when modal is open and not minimized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, isMinimized]);

  // Command Execution Dispatcher
  const handleCommandSubmit = useCallback(
    (rawCmd: string) => {
      const trimmed = rawCmd.trim();
      if (!trimmed) return;

      pushHistory(trimmed);
      setInputVal('');

      const parts = trimmed.split(' ');
      const commandName = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (commandName) {
        case 'help':
        case '?':
        case 'commands': {
          addOutput({
            command: trimmed,
            type: 'output',
            component: 'help',
            metadata: { filter: args[0] },
          });
          break;
        }

        case 'about':
        case 'bio':
        case 'whoami': {
          addOutput({
            command: trimmed,
            type: 'output',
            component: 'about',
          });
          break;
        }

        case 'skills':
        case 'stack':
        case 'tech': {
          addOutput({
            command: trimmed,
            type: 'output',
            component: 'skills',
            metadata: { category: args[0] },
          });
          break;
        }

        case 'projects':
        case 'work':
        case 'portfolio': {
          addOutput({
            command: trimmed,
            type: 'output',
            component: 'projects',
          });
          break;
        }

        case 'contact':
        case 'socials':
        case 'email':
        case 'links': {
          addOutput({
            command: trimmed,
            type: 'output',
            component: 'contact',
          });
          break;
        }

        case 'resume':
        case 'cv': {
          // Trigger download / open
          if (typeof window !== 'undefined') {
            window.open(PORTFOLIO_FACTS.resumeUrl, '_blank', 'noopener,noreferrer');
          }
          addOutput({
            command: trimmed,
            type: 'output',
            component: 'resume',
          });
          break;
        }

        case 'clear':
        case 'cls': {
          clearOutputs();
          break;
        }

        case 'matrix':
        case 'rain':
        case 'cyber': {
          setIsMatrixActive(true);
          addOutput({
            command: trimmed,
            type: 'output',
            content: 'Initializing Cybernetic Neural Stream... [Press ESC or click stop button to exit]',
          });
          break;
        }

        case 'sudo': {
          addOutput({
            command: trimmed,
            type: 'error',
            content: `User 'guest' is not in the sudoers file. This incident has been logged and transmitted to Charan Sai. 🚨`,
          });
          break;
        }

        case 'date': {
          const now = new Date();
          addOutput({
            command: trimmed,
            type: 'output',
            content: `System Time: ${now.toString()}\nISO 8601:    ${now.toISOString()}`,
          });
          break;
        }

        case 'theme': {
          const sub = args[0]?.toLowerCase();
          const html = document.documentElement;
          let newTheme = 'dark';
          if (sub === 'light') {
            html.classList.remove('dark');
            newTheme = 'light';
          } else if (sub === 'dark') {
            html.classList.add('dark');
            newTheme = 'dark';
          } else {
            html.classList.toggle('dark');
            newTheme = html.classList.contains('dark') ? 'dark' : 'light';
          }
          try {
            localStorage.setItem('charan_portfolio_theme', newTheme);
          } catch {}
          addOutput({
            command: trimmed,
            type: 'output',
            content: `Display theme shifted to: ${newTheme.toUpperCase()}`,
          });
          break;
        }

        case 'exit':
        case 'quit':
        case 'q': {
          onClose();
          break;
        }

        case 'echo': {
          addOutput({
            command: trimmed,
            type: 'output',
            content: args.join(' '),
          });
          break;
        }

        default: {
          addOutput({
            command: trimmed,
            type: 'error',
            content: `zsh: command not found: ${commandName}\nType 'help' to see the list of executable commands.`,
          });
        }
      }
    },
    [pushHistory, addOutput, clearOutputs, onClose]
  );

  // Keyboard Navigation inside terminal input (History & Tabs)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSubmit(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = navigateHistory('up', inputVal);
      setInputVal(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = navigateHistory('down', inputVal);
      setInputVal(next);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-completion
      const trimmed = inputVal.trim().toLowerCase();
      if (!trimmed) return;
      const matches = Object.keys(COMMAND_REGISTRY).filter((c) =>
        c.startsWith(trimmed)
      );
      if (matches.length === 1) {
        setInputVal(matches[0] + ' ');
      } else if (matches.length > 1) {
        addOutput({
          command: inputVal,
          type: 'output',
          content: `Suggestions: ${matches.join('  ')}`,
        });
      }
    }
  };

  // Quick Command Pills
  const quickCommands = ['help', 'about', 'skills', 'projects', 'contact', 'resume', 'matrix', 'clear'];

  if (!isMounted || !isOpen) return null;

  // Render Component Outputs
  const renderOutputContent = (out: {
    command: string;
    type: 'output' | 'error' | 'system' | 'custom';
    content?: string | React.ReactNode;
    component?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (out.component === 'welcome') {
      return (
        <div className="space-y-2 text-slate-300">
          <div className="font-mono text-emerald-400 font-bold text-xs sm:text-sm">
            {`  ___ _                          ____        _ `}
            <br className="hidden sm:inline" />
            {` / __| |_  __ _ _ _ __ _ _ _    / ___|  __ _(_)`}
            <br className="hidden sm:inline" />
            {`| (__| ' \\/ _\` | '_/ _\` | ' \\   \\___ \\ / _\` | |`}
            <br className="hidden sm:inline" />
            {` \\___|_||_\\__,_|_| \\__,_|_||_|  |____/ \\__,_|_|`}
          </div>
          <div className="text-xs text-slate-400 border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
            <p className="text-slate-200 font-semibold">
              Charan Sai — Interactive Developer Terminal [Version 2.4.0-release]
            </p>
            <p>
              Lead Architect & Full-Stack Engineer • Chirala / Bapatla, AP, India
            </p>
            <p className="text-emerald-400 text-[11px]">
              Type <span className="text-white font-bold bg-slate-800 px-1 py-0.5 rounded">help</span> for commands or click quick action chips below.
            </p>
          </div>
        </div>
      );
    }

    if (out.component === 'help') {
      return (
        <div className="space-y-2 text-xs">
          <p className="text-slate-400 font-medium">Available CLI Commands:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
            {Object.values(COMMAND_REGISTRY).map((cmd) => (
              <div
                key={cmd.name}
                onClick={() => handleCommandSubmit(cmd.name)}
                className="flex items-start gap-2 p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group"
              >
                <span className="font-mono font-bold text-emerald-400 group-hover:text-emerald-300 w-20 shrink-0">
                  {cmd.name}
                </span>
                <span className="text-slate-400 group-hover:text-slate-200">
                  {cmd.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (out.component === 'about') {
      return (
        <div className="space-y-3 text-xs bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center font-bold text-indigo-300">
              CS
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{PORTFOLIO_FACTS.name}</h3>
              <p className="text-emerald-400 font-mono text-[11px]">{PORTFOLIO_FACTS.title}</p>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">{PORTFOLIO_FACTS.bio}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-500 font-mono">Location: </span>
              <span className="text-slate-200">{PORTFOLIO_FACTS.location}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono">Education: </span>
              <span className="text-slate-200">{PORTFOLIO_FACTS.education}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono">Status: </span>
              <span className="text-emerald-400 font-semibold">{PORTFOLIO_FACTS.status}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono">Direct Email: </span>
              <a
                href={`mailto:${PORTFOLIO_FACTS.email}`}
                className="text-indigo-400 hover:underline"
              >
                {PORTFOLIO_FACTS.email}
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (out.component === 'skills') {
      return (
        <div className="space-y-3 text-xs">
          <p className="text-slate-400">Technical Expertise & Capabilities:</p>
          <div className="space-y-2.5">
            {Object.entries(PORTFOLIO_FACTS.skills).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                  {category}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (out.component === 'projects') {
      return (
        <div className="space-y-3 text-xs">
          <p className="text-slate-400">Showcase Portfolio Projects:</p>
          <div className="space-y-2.5">
            {PORTFOLIO_FACTS.projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{proj.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                      {proj.category}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                    {proj.status}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.tech.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {proj.liveUrl && (
                  <div className="pt-1.5">
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                    >
                      🔗 Open Live Project ({proj.liveUrl})
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (out.component === 'contact') {
      return (
        <div className="space-y-3 text-xs bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
          <p className="text-slate-300 font-semibold">Connect with Charan Sai:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <a
              href={`mailto:${PORTFOLIO_FACTS.email}`}
              className="flex items-center gap-2 p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span className="font-mono text-slate-500">EMAIL:</span>
              <span className="truncate">{PORTFOLIO_FACTS.email}</span>
            </a>
            <a
              href={PORTFOLIO_FACTS.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span className="font-mono text-slate-500">GITHUB:</span>
              <span>github.com/CHARANSAI11328</span>
            </a>
            <a
              href={PORTFOLIO_FACTS.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 transition-colors"
            >
              <span className="font-mono text-slate-500">LINKEDIN:</span>
              <span className="truncate">charan-sai-kamarajugadda</span>
            </a>
            <a
              href={PORTFOLIO_FACTS.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span className="font-mono text-slate-500">X / TWITTER:</span>
              <span>@C6H11O5D</span>
            </a>
            <a
              href={PORTFOLIO_FACTS.socials.leetcode}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span className="font-mono text-slate-500">LEETCODE:</span>
              <span>89IIBeaoVG</span>
            </a>
            <a
              href={PORTFOLIO_FACTS.socials.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span className="font-mono text-slate-500">WEBSITE:</span>
              <span>charansai.website</span>
            </a>
          </div>
        </div>
      );
    }

    if (out.component === 'resume') {
      return (
        <div className="space-y-2 text-xs bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-lg text-emerald-300">
          <p className="font-semibold flex items-center gap-1.5">
            <span>📄</span> Curriculum Vitae Dispatched
          </p>
          <p className="text-slate-300 text-[11px]">
            The resume has been opened in a new browser tab. If your browser blocked popups, click below:
          </p>
          <a
            href={PORTFOLIO_FACTS.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[11px] transition-colors"
          >
            Download / View Resume (PDF)
          </a>
        </div>
      );
    }

    if (out.type === 'error') {
      return (
        <div className="font-mono text-xs text-rose-400 whitespace-pre-wrap">
          {out.content}
        </div>
      );
    }

    return (
      <div className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
        {out.content}
      </div>
    );
  };

  const portalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Developer Terminal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-text"
      onClick={(e) => {
        // Backdrop click to close (when clicking the darkened mask directly)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Minimized Docked Tab */}
      {isMinimized ? (
        <div
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-slate-200 hover:text-white cursor-pointer hover:border-emerald-500/50 transition-all duration-200"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-emerald-400">&gt;_ charan@terminal</span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            Click to Restore
          </span>
        </div>
      ) : (
        /* Main Terminal Window */
        <div
          className={`relative flex flex-col w-full bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden font-mono text-slate-200 backdrop-blur-xl transition-all duration-300 ${
            isMaximized
              ? 'fixed inset-2 sm:inset-4 max-w-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]'
              : 'max-w-3xl h-[560px] max-h-[85vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* macOS Traffic Light Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 select-none">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close terminal"
                className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer group flex items-center justify-center"
              >
                <span className="text-[9px] text-rose-950 opacity-0 group-hover:opacity-100 font-bold">×</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                aria-label="Minimize terminal"
                className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer group flex items-center justify-center"
              >
                <span className="text-[9px] text-amber-950 opacity-0 group-hover:opacity-100 font-bold">-</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                aria-label="Maximize terminal"
                className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer group flex items-center justify-center"
              >
                <span className="text-[8px] text-emerald-950 opacity-0 group-hover:opacity-100 font-bold">+</span>
              </button>
              <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                charan@portfolio: ~ (zsh)
              </span>
            </div>

            {/* Central Badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 font-semibold">&gt;_</span>
              <span>interactive-cli</span>
            </div>

            {/* Quick Actions / Close Indicator */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                ESC to close
              </span>
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden text-slate-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>

          {/* Quick Command Navigation Bar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider shrink-0 mr-1">
              Shortcuts:
            </span>
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleCommandSubmit(cmd)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-emerald-300 font-mono text-[10px] shrink-0 transition-colors cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Terminal Body */}
          <div
            ref={terminalBodyRef}
            className="relative flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs focus:outline-none selection:bg-emerald-500 selection:text-black"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Matrix Rain Mode Overlay if active */}
            {isMatrixActive ? (
              <MatrixRain onClose={() => setIsMatrixActive(false)} />
            ) : (
              <>
                {outputs.map((out) => (
                  <div key={out.id} className="space-y-1.5">
                    {out.command !== 'system::init' && (
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">➜</span>
                        <span className="text-indigo-400">~</span>
                        <span className="text-slate-100">{out.command}</span>
                        <span className="text-[10px] text-slate-600 ml-auto">
                          {out.timestamp}
                        </span>
                      </div>
                    )}
                    <div className="pl-3 sm:pl-4">{renderOutputContent(out)}</div>
                  </div>
                ))}

                {/* Active Prompt Input Row */}
                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span className="text-emerald-400 font-bold shrink-0">➜</span>
                  <span className="text-indigo-400 shrink-0 font-bold">~</span>
                  <div className="relative flex-1 flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      aria-label="Terminal input line"
                      placeholder="Type 'help' for commands..."
                      className="w-full bg-transparent text-emerald-300 font-mono text-xs focus:outline-none border-none placeholder-slate-600 caret-emerald-400"
                    />
                  </div>
                </div>

                <div ref={bottomRef} className="h-1" />
              </>
            )}
          </div>

          {/* Terminal Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 select-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Ready</span>
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline text-slate-500">
                UTF-8 • Node.js / React 19 Engine
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="hidden md:inline">Use ↑ ↓ for history</span>
              <span className="hidden md:inline">•</span>
              <span>Tab to complete</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default TerminalModal;
