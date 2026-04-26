'use client';

import { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { useMediaQuery } from '@/hooks/use-media-query';

// Declare particles.js global types (extended with particle array for VoiceBus breathing)
declare global {
  interface Window {
    particlesJS?: (id: string, config: Record<string, unknown>) => void;
    pJSDom?: Array<{
      pJS: {
        fn: { vendors: { destroypJS: () => void } };
        particles: {
          array: Array<{
            opacity: number | { value: number };
          }>;
          line_linked: {
            opacity: number;
            distance: number;
          };
        };
      };
    }>;
  }
}

// Extended container type for VoiceBus breathing rAF cancellation
type ParticleContainer = HTMLDivElement & { __vmTick?: () => void };

function ensureParticlesScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.particlesJS) return resolve();
    const existing = document.querySelector('script[data-particles-lib]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    s.async = true;
    s.setAttribute('data-particles-lib', '1');
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!mounted) return;
    let destroyed = false;

    const init = () => {
      if (destroyed || !containerRef.current || !window.particlesJS) return;

      // Monochrome palette keyed to theme
      const palette = isDark
        ? { particles: '#f4f1ea', lines: '#d7d2c4', accent: '#8a8578' }
        : { particles: '#1a1a1a', lines: '#333333', accent: '#666666' };

      // Cancel stale breathing rAF before reinitializing pJS (per D-11, Pitfall 4)
      try { (containerRef.current as ParticleContainer).__vmTick?.(); } catch { /* ignore */ }

      // Verified: cleanup correct per Phase 6 audit
      // Order: destroy instances → clear array → remove canvas → call particlesJS()
      if (window.pJSDom && window.pJSDom.length) {
        window.pJSDom.forEach((p) => {
          try { p.pJS.fn.vendors.destroypJS(); } catch { /* ignore */ }
        });
        window.pJSDom = [];
      }
      const oldCanvas = containerRef.current.querySelector('canvas');
      if (oldCanvas) oldCanvas.remove();

      window.particlesJS('pf-particles', {
        particles: {
          number: { value: isMobile ? 45 : 90, density: { enable: true, value_area: 900 } },
          color: { value: palette.particles },
          shape: { type: 'circle', stroke: { width: 0.5, color: palette.accent } },
          opacity: { value: isDark ? 0.45 : 0.55, random: true, anim: { enable: true, speed: 0.6, opacity_min: 0.15 } },
          size: { value: 2.4, random: true, anim: { enable: true, speed: 1.5, size_min: 0.6 } },
          line_linked: { enable: true, distance: 150, color: palette.lines, opacity: isDark ? 0.18 : 0.25, width: 1 },
          move: { enable: true, speed: 1.2, random: true, out_mode: 'bounce' },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'grab' },
            onclick: { enable: true, mode: 'push' },
            resize: true,
          },
          modes: {
            grab: { distance: 200, line_linked: { opacity: isDark ? 0.5 : 0.6 } },
            push: { particles_nb: 3 },
            repulse: { distance: 160, duration: 0.4 },
          },
        },
        retina_detect: true,
      });

      // ── VoiceBus breathing hook (per D-10, D-11) ──────────────────────────
      // Port of home.jsx lines 79-156: poll for pJSDom entry, capture baselines,
      // run rAF loop modulating particles by VoiceBus.level + state.
      let breathRaf: number;
      let breathCancelled = false;
      const waitForInst = (tries = 0) => {
        if (breathCancelled) return;
        const entry = (window.pJSDom || []).slice(-1)[0];
        const inst = entry?.pJS;
        if (!inst?.particles?.array?.length) {
          if (tries < 40) return void setTimeout(() => waitForInst(tries + 1), 50);
          return; // give up silently after 2 seconds
        }
        const baseLine = inst.particles.line_linked.opacity;
        const baseLineDist = inst.particles.line_linked.distance;
        const baseOps = inst.particles.array.map((p) =>
          typeof p.opacity === 'object' && p.opacity !== null
            ? (p.opacity as { value: number }).value
            : (p.opacity as number)
        );
        const tick = () => {
          if (breathCancelled) return;
          const bus = (typeof window !== 'undefined' && window.VoiceBus) ? window.VoiceBus : null;
          const level = bus?.level ?? 0;
          const vState = bus?.state ?? 'idle';
          if (vState === 'thinking') {
            const t = performance.now() / 1000;
            const pulse = (Math.sin(t * 3.2) + 1) / 2;
            const spark = (Math.sin(t * 11 + 0.7) + 1) / 2;
            inst.particles.line_linked.distance = baseLineDist * (1.35 + pulse * 0.35);
            inst.particles.line_linked.opacity = Math.min(1, baseLine * (1.6 + pulse * 0.6 + spark * 0.2));
            const arr = inst.particles.array;
            for (let i = 0; i < arr.length; i++) {
              const p = arr[i];
              const base = baseOps[i] != null ? baseOps[i] : 0.45;
              const local = (Math.sin(t * 4.0 + i * 0.42) + 1) / 2;
              const v = Math.min(1, base * (0.9 + local * 0.8));
              if (typeof p.opacity === 'object' && p.opacity !== null) {
                (p.opacity as { value: number }).value = v;
              } else {
                (p as { opacity: number }).opacity = v;
              }
            }
          } else if (level > 0.01) {
            const t = performance.now() / 1000;
            const breath = (Math.sin(t * 1.6) + 1) / 2;   // 1.6 Hz (per D-10)
            const ripple = (Math.sin(t * 4.2 + 1.3) + 1) / 2;  // 4.2 Hz (per D-10)
            const wave = breath * 0.65 + ripple * 0.35;   // weighted 65/35 (per D-10)
            inst.particles.line_linked.distance = baseLineDist * (1 + level * 0.25);
            inst.particles.line_linked.opacity = baseLine * (0.5 + wave * (0.8 + level));
            const arr = inst.particles.array;
            for (let i = 0; i < arr.length; i++) {
              const p = arr[i];
              const base = baseOps[i] != null ? baseOps[i] : 0.45;
              const local = (Math.sin(t * 2.2 + i * 0.18) + 1) / 2;  // per-particle phase offset i*0.18 (per D-10)
              const v = base * (0.6 + local * (0.5 + level * 0.9));
              if (typeof p.opacity === 'object' && p.opacity !== null) {
                (p.opacity as { value: number }).value = v;
              } else {
                (p as { opacity: number }).opacity = v;
              }
            }
          } else {
            // Restore baselines
            inst.particles.line_linked.distance = baseLineDist;
            inst.particles.line_linked.opacity = baseLine;
            const arr = inst.particles.array;
            for (let i = 0; i < arr.length; i++) {
              const p = arr[i];
              const base = baseOps[i] != null ? baseOps[i] : 0.45;
              if (typeof p.opacity === 'object' && p.opacity !== null) {
                (p.opacity as { value: number }).value = base;
              } else {
                (p as { opacity: number }).opacity = base;
              }
            }
          }
          breathRaf = requestAnimationFrame(tick);
        };
        breathRaf = requestAnimationFrame(tick);
        // Expose cancellation so cleanup + reinit can stop the loop (per D-11, Pitfall 4)
        if (containerRef.current) {
          (containerRef.current as ParticleContainer).__vmTick =
            () => { breathCancelled = true; if (breathRaf) cancelAnimationFrame(breathRaf); };
        }
      };
      waitForInst();
    };

    ensureParticlesScript().then(init).catch(() => { /* silently fail */ });

    return () => {
      destroyed = true;
      try { (containerRef.current as ParticleContainer).__vmTick?.(); } catch { /* ignore */ }
    };
  }, [isDark, mounted, isMobile]);

  return (
    <div
      id="pf-particles"
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 1, pointerEvents: 'auto' }}
    />
  );
}
