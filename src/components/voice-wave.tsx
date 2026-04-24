'use client';

import { useState, useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';

interface VoiceWaveProps {
  isDark: boolean;
}

export function VoiceWave({ isDark }: VoiceWaveProps) {
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
  const barColor = isDark ? '#fff' : '#1a1a1a';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        height: '40px',
        width: '88px',
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
              width: '8px',
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
