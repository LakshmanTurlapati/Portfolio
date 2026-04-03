'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '@/hooks/use-canvas';
import { useMediaQuery } from '@/hooks/use-media-query';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  stamp: HTMLCanvasElement;
}

// Pre-render a blurred gradient circle to an offscreen canvas
function createBlurredCircle(size: number): HTMLCanvasElement {
  const blurAmount = size / 8;
  const padding = blurAmount * 3;
  const fullSize = (size + padding) * 2;

  const offscreen = document.createElement('canvas');
  offscreen.width = fullSize;
  offscreen.height = fullSize;
  const ctx = offscreen.getContext('2d')!;

  // Apply blur filter once during stamp creation
  ctx.filter = `blur(${blurAmount}px)`;

  // Radial gradient matching Flutter particle_background.dart
  const gradient = ctx.createRadialGradient(
    fullSize / 2, fullSize / 2, 0,
    fullSize / 2, fullSize / 2, size
  );
  gradient.addColorStop(0, 'rgba(168, 168, 168, 0.6)');
  gradient.addColorStop(0.7, 'rgba(140, 140, 140, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(fullSize / 2, fullSize / 2, size, 0, Math.PI * 2);
  ctx.fill();

  return offscreen;
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const size = 80 + Math.random() * 100;
    particles.push({
      x: Math.random() * 500,
      y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 2, // -1 to +1
      vy: (Math.random() - 0.5) * 2, // -1 to +1
      size,
      stamp: createBlurredCircle(size),
    });
  }
  return particles;
}

export function ParticleBackground() {
  const isMobile = useMediaQuery('(max-width: 599px)');
  const particlesRef = useRef<Particle[]>([]);
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const initializedRef = useRef(false);

  // Initialize particles when mobile state is known or changes
  useEffect(() => {
    const count = isMobile ? 4 : 7;
    particlesRef.current = createParticles(count);
    initializedRef.current = true;
  }, [isMobile]);

  const handleResize = useCallback((width: number, height: number) => {
    canvasSizeRef.current = { width, height };
  }, []);

  const animate = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!initializedRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    // Clear canvas in CSS pixel space
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Edge check: if circle fully exits viewport, respawn at random edge
      if (p.x + p.size < 0 || p.x - p.size > canvasWidth ||
          p.y + p.size < 0 || p.y - p.size > canvasHeight) {
        // Respawn at random edge with new random velocity
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0: // top
            p.x = Math.random() * canvasWidth;
            p.y = -p.size;
            break;
          case 1: // right
            p.x = canvasWidth + p.size;
            p.y = Math.random() * canvasHeight;
            break;
          case 2: // bottom
            p.x = Math.random() * canvasWidth;
            p.y = canvasHeight + p.size;
            break;
          case 3: // left
            p.x = -p.size;
            p.y = Math.random() * canvasHeight;
            break;
        }
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
      }

      // Draw pre-rendered blur stamp
      const stampCenterX = p.stamp.width / 2;
      const stampCenterY = p.stamp.height / 2;
      ctx.drawImage(p.stamp, p.x - stampCenterX, p.y - stampCenterY);
    }
  }, []);

  const canvasRef = useCanvas({
    animate,
    onResize: handleResize,
  });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
