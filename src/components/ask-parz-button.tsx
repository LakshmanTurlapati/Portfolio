'use client';

import { useState, useEffect, useRef } from 'react';

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  life: number;
  phase: 'in' | 'out';
}

interface AskParzButtonProps {
  isDark: boolean;
  onClick: () => void;
}

export function AskParzButton({ isDark, onClick }: AskParzButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [hover, setHover] = useState(false);
  const hoverRef = useRef(false);
  useEffect(() => { hoverRef.current = hover; }, [hover]);

  // Spawn orbs at intervals. Idle ~700ms, hover ~140ms.
  useEffect(() => {
    let alive = true;
    const spawn = () => {
      if (!alive) return;
      const el = btnRef.current;
      if (el) {
        const w = el.offsetWidth, h = el.offsetHeight;
        const id = Date.now() + Math.random();
        const x = Math.random() * w;
        const y = Math.random() * h;
        const size = hoverRef.current ? 14 + Math.random() * 10 : 8 + Math.random() * 6;
        const life = hoverRef.current ? 1400 : 1900;
        setOrbs((prev) => [...prev, { id, x, y, size, life, phase: 'in' }]);
        // fade in -> out -> remove
        setTimeout(() => setOrbs((p) => p.map(o => o.id === id ? { ...o, phase: 'out' } : o)), life * 0.45);
        setTimeout(() => setOrbs((p) => p.filter(o => o.id !== id)), life);
      }
      const next = hoverRef.current ? 110 + Math.random() * 80 : 600 + Math.random() * 400;
      setTimeout(spawn, next);
    };
    const t = setTimeout(spawn, 200);
    return () => { alive = false; clearTimeout(t); };
  }, []);

  return (
    <button
      ref={btnRef}
      data-parz-btn
      className="absolute top-1/2 flex items-center gap-[7px] h-12 rounded-[20px] text-[13px] font-semibold cursor-pointer overflow-hidden isolate transition-all duration-250"
      style={{
        right: 132,
        transform: hover ? 'translateY(-50%) scale(1.04)' : 'translateY(-50%)',
        padding: '0 16px 0 13px',
        background: isDark
          ? (hover ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.05)')
          : (hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'),
        border: `1px solid ${isDark
          ? (hover ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.14)')
          : (hover ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.14)')}`,
        color: isDark ? '#1a1a1a' : '#e8e4d8',
        fontFamily: '"Inter", sans-serif',
        letterSpacing: '-0.005em',
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Activate Parz voice mode"
    >
      {/* Ambient orbs layer */}
      <span className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[inherit]">
        {orbs.map(o => (
          <span
            key={o.id}
            className="absolute rounded-full"
            style={{
              left: o.x,
              top: o.y,
              width: o.size,
              height: o.size,
              transform: 'translate(-50%, -50%)',
              filter: o.phase === 'in' && hover ? 'blur(6px)' : 'blur(8px)',
              opacity: o.phase === 'in' ? (hover ? 0.85 : 0.5) : 0,
              background: isDark
                ? 'radial-gradient(circle, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)',
              transition: 'opacity 0.55s ease, filter 0.55s ease',
            }}
          />
        ))}
      </span>

      {/* Green status dot */}
      <span
        className="relative z-[1] w-1.5 h-1.5 rounded-full"
        style={{
          background: '#a9e34b',
          boxShadow: '0 0 0 0 rgba(169,227,75,0.7)',
          animation: 'askParzPulse 2.2s ease-in-out infinite',
        }}
      />

      {/* Label */}
      <span className="relative z-[1] whitespace-nowrap max-[760px]:hidden">Parz</span>
    </button>
  );
}
