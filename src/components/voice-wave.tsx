'use client';

import { useState, useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';

interface VoiceWaveProps {
  isDark: boolean;
  /** Compact size for mobile/cramped containers (60×32 instead of 88×40). */
  compact?: boolean;
  size?: 'default' | 'compact' | 'hero';
  color?: string;
  testId?: string;
}

export function VoiceWave({ isDark, compact = false, size, color, testId }: VoiceWaveProps) {
  const mounted = useMounted();
  const [level, setLevel] = useState(0);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.VoiceBus) return;
    const unsub = window.VoiceBus.on('level', (v) => setLevel(v as number));
    return unsub;
  }, [mounted]);

  useEffect(() => {
    let raf: number;
    let alive = true;
    const step = () => {
      if (!alive) return;
      setT(performance.now() / 1000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!mounted) return null;

  const baseHeights = [0.32, 0.62, 1.0, 0.62, 0.32];
  const barColor = color ?? (isDark ? '#1a1a1a' : '#fff');

  const waveSize = size ?? (compact ? 'compact' : 'default');
  const dims = {
    compact: { gap: '5px', height: '32px', width: '60px', barWidth: '6px' },
    default: { gap: '7px', height: '40px', width: '88px', barWidth: '8px' },
    hero: {
      gap: 'clamp(8px, 2.8vw, 11px)',
      height: 'clamp(72px, 18vh, 92px)',
      width: 'clamp(156px, 48vw, 190px)',
      barWidth: 'clamp(11px, 3.6vw, 15px)',
    },
  }[waveSize];

  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dims.gap,
        height: dims.height,
        width: dims.width,
        flexShrink: 0,
      }}
    >
      {baseHeights.map((base, i) => {
        const phase = t * 2.4 + i * 0.5;
        const wobble = 0.18 * Math.sin(phase) + 0.12 * Math.sin(phase * 1.7 + i);
        const amp = Math.max(0.2, Math.min(1, base + level * 0.25 + wobble * (0.4 + level)));
        return (
          <span
            key={i}
            style={{
              display: 'block',
              width: dims.barWidth,
              height: '100%',
              background: barColor,
              borderRadius: '9999px',
              transformOrigin: 'bottom',
              transform: `scaleY(${amp.toFixed(3)})`,
              transition: 'transform 0.12s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}
