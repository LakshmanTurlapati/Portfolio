'use client';

import { useRef, useEffect } from 'react';

interface UseCanvasOptions {
  animate: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, deltaTime: number) => void;
  onResize?: (width: number, height: number) => void;
  willReadFrequently?: boolean;
}

export function useCanvas({ animate, onResize, willReadFrequently = false }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animateRef = useRef(animate);
  animateRef.current = animate;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently });
    if (!ctx) return;

    // ResizeObserver for canvas dimensions and DPR scaling
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        onResize?.(width, height);
      }
    });
    observer.observe(canvas.parentElement || canvas);

    // Animation loop with deltaTime calculation
    const loop = (time: number) => {
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      animateRef.current(ctx, canvas, deltaTime);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [willReadFrequently]); // onResize intentionally excluded -- use ref pattern if needed

  return canvasRef;
}
