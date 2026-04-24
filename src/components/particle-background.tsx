'use client';

import { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';

// Declare particles.js global types
declare global {
  interface Window {
    particlesJS?: (id: string, config: Record<string, unknown>) => void;
    pJSDom?: Array<{ pJS: { fn: { vendors: { destroypJS: () => void } } } }>;
  }
}

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

  useEffect(() => {
    if (!mounted) return;
    let destroyed = false;

    const init = () => {
      if (destroyed || !containerRef.current || !window.particlesJS) return;

      // Monochrome palette keyed to theme
      const palette = isDark
        ? { particles: '#f4f1ea', lines: '#d7d2c4', accent: '#8a8578' }
        : { particles: '#1a1a1a', lines: '#333333', accent: '#666666' };

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
          number: { value: 90, density: { enable: true, value_area: 900 } },
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
    };

    ensureParticlesScript().then(init).catch(() => { /* silently fail */ });

    return () => {
      destroyed = true;
    };
  }, [isDark, mounted]);

  return (
    <div
      id="pf-particles"
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 1, pointerEvents: 'auto' }}
    />
  );
}
