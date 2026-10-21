'use client';

import { useState, useCallback, useRef } from 'react';
import { CommandOutput } from './commands';

const INITIAL_OUTPUTS: CommandOutput[] = [
  {
    id: 'out-welcome',
    command: 'system::init',
    timestamp: '',
    type: 'system',
    component: 'welcome',
  },
];

export function useTerminalHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tempInput, setTempInput] = useState<string>('');
  const [outputs, setOutputs] = useState<CommandOutput[]>(INITIAL_OUTPUTS);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const addOutput = useCallback(
    (output: Omit<CommandOutput, 'id' | 'timestamp'>) => {
      const newEntry: CommandOutput = {
        ...output,
        id: `out-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setOutputs((prev) => [...prev, newEntry]);
      // Defer scroll until render completes
      setTimeout(scrollToBottom, 30);
    },
    [scrollToBottom]
  );

  const pushHistory = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setTempInput('');
  }, []);

  const navigateHistory = useCallback(
    (direction: 'up' | 'down', currentInput: string): string => {
      if (history.length === 0) return currentInput;

      if (direction === 'up') {
        if (historyIndex === -1) {
          // Starting history navigation, save what the user currently typed
          setTempInput(currentInput);
          const nextIndex = history.length - 1;
          setHistoryIndex(nextIndex);
          return history[nextIndex];
        } else if (historyIndex > 0) {
          const nextIndex = historyIndex - 1;
          setHistoryIndex(nextIndex);
          return history[nextIndex];
        }
        return history[0];
      } else {
        // Down
        if (historyIndex === -1) {
          return currentInput;
        } else if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          setHistoryIndex(nextIndex);
          return history[nextIndex];
        } else {
          // Past the newest history entry, restore whatever the user was typing
          setHistoryIndex(-1);
          return tempInput;
        }
      }
    },
    [history, historyIndex, tempInput]
  );

  const clearOutputs = useCallback(() => {
    setOutputs(INITIAL_OUTPUTS);
  }, []);

  return {
    outputs,
    addOutput,
    clearOutputs,
    pushHistory,
    navigateHistory,
    bottomRef,
    scrollToBottom,
  };
}
