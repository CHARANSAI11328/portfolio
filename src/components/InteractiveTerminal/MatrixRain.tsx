'use client';

import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  onClose?: () => void;
  className?: string;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ onClose, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンCHARANSAI1010101XYZ';
    const charArray = chars.split('');
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = new Array(columns).fill(1);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(1);
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      // Semi-transparent black rectangle to create trailing fade effect
      ctx.fillStyle = 'rgba(5, 10, 15, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];

        // Randomly highlight head character with bright neon white/green
        if (Math.random() > 0.88) {
          ctx.fillStyle = '#A7F3D0'; // Bright emerald white
          ctx.shadowColor = '#10B981';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#10B981'; // Neon Matrix Green
          ctx.shadowBlur = 0;
        }

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[300px] overflow-hidden rounded-lg bg-black/90 ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={onClose}
          type="button"
          className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
        >
          [ Esc / Click to Stop ]
        </button>
      </div>
      <div className="absolute bottom-3 left-4 text-xs font-mono text-emerald-400/80 pointer-events-none select-none">
        MATRIX SUB-ROUTINE // DIGITAL RAIN ACTIVE
      </div>
    </div>
  );
};

export default MatrixRain;
