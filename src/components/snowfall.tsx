'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '@/hooks/use-canvas';
import { useMediaQuery } from '@/hooks/use-media-query';

interface Snowflake {
  x: number;       // normalized 0-1
  y: number;       // normalized 0-1
  speed: number;   // movement per frame
  size: number;    // radius in px
  drift: number;   // base horizontal drift
  opacity: number; // layer opacity
}

// Layer configuration constants (not state)
const LAYERS = [
  { name: 'back',  desktopCount: 50,  mobileCount: 25, speedMin: 0.5, speedMax: 1.0, sizeMin: 2.0, sizeMax: 4.0, opacity: 0.7 },
  { name: 'mid',   desktopCount: 70,  mobileCount: 35, speedMin: 0.5, speedMax: 1.5, sizeMin: 0.5, sizeMax: 3.0, opacity: 0.5 },
  { name: 'front', desktopCount: 100, mobileCount: 50, speedMin: 2.0, speedMax: 3.0, sizeMin: 1.0, sizeMax: 2.0, opacity: 0.3 },
] as const;

function createSnowflakes(isMobile: boolean): Snowflake[] {
  const flakes: Snowflake[] = [];
  for (const layer of LAYERS) {
    const count = isMobile ? layer.mobileCount : layer.desktopCount;
    for (let i = 0; i < count; i++) {
      flakes.push({
        x: Math.random(),
        y: Math.random(),
        speed: layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
        size: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
        drift: (Math.random() - 0.5) * 0.002,
        opacity: layer.opacity,
      });
    }
  }
  return flakes;
}

// Parse an rgba/rgb color string and apply a custom opacity
function colorWithOpacity(colorStr: string, opacity: number): string {
  // Handle rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = colorStr.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
  }
  // Fallback: white with opacity
  return `rgba(255, 255, 255, ${opacity})`;
}

export function SnowfallEffect() {
  const isMobile = useMediaQuery('(max-width: 599px)');
  const flakesRef = useRef<Snowflake[]>([]);
  const driftFactorRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Initialize snowflakes when mobile state changes
  useEffect(() => {
    flakesRef.current = createSnowflakes(isMobile);
    initializedRef.current = true;
  }, [isMobile]);

  // Mouse drift tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      driftFactorRef.current = ((event.clientX / window.innerWidth) - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const animate = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!initializedRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    // Read theme-aware snow color once per frame
    const snowColorRaw = getComputedStyle(canvas).getPropertyValue('--color-snow').trim();

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const flakes = flakesRef.current;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];

      // Update position
      f.y += f.speed / 1000;
      f.x += f.drift + (driftFactorRef.current * 0.001);

      // Wrap behavior
      if (f.y > 1) {
        f.y = -0.05;
        f.x = Math.random();
      }
      if (f.x > 1) f.x = 0;
      if (f.x < 0) f.x = 1;

      // Convert normalized coords to canvas coords
      const drawX = f.x * canvasWidth;
      const drawY = f.y * canvasHeight;

      // Draw filled circle with layer opacity
      ctx.beginPath();
      ctx.arc(drawX, drawY, f.size, 0, Math.PI * 2);
      ctx.fillStyle = colorWithOpacity(snowColorRaw, f.opacity);
      ctx.fill();
    }
  }, []);

  const canvasRef = useCanvas({ animate });

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15, filter: 'blur(1px)' }}
    />
  );
}
