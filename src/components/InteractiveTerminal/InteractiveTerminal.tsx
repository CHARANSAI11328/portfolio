'use client';

import React, { useState, useCallback } from 'react';
import TerminalModal from './TerminalModal';
import TerminalBadge from './TerminalBadge';

export const InteractiveTerminal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <>
      <TerminalBadge isOpen={isOpen} onToggle={handleOpen} />
      <TerminalModal
        isOpen={isOpen}
        onClose={handleClose}
        onToggle={handleToggle}
      />
    </>
  );
};

export default InteractiveTerminal;
