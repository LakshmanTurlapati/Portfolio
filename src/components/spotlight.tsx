'use client';

import { useRef, useEffect } from 'react';

export function SpotlightEffect() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const targetPosRef = useRef<{ x: number; y: number } | null>(null);

  // Mouse/touch tracking via document-level listeners
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleLeave = () => {
      targetPosRef.current = null;
      currentPosRef.current = null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        targetPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };
    const handleTouchEnd = () => {
      targetPosRef.current = null;
      currentPosRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Interpolation loop at 20ms (50fps) with lerp factor 0.2
  useEffect(() => {
    const interval = setInterval(() => {
      if (!spotlightRef.current) return;

      if (!targetPosRef.current) {
        // Clear spotlight when no target
        spotlightRef.current.style.background = 'transparent';
        return;
      }

      const current = currentPosRef.current || targetPosRef.current;
      // Lerp: current + (target - current) * 0.2
      const x = current.x + (targetPosRef.current.x - current.x) * 0.2;
      const y = current.y + (targetPosRef.current.y - current.y) * 0.2;
      currentPosRef.current = { x, y };

      const color = getComputedStyle(spotlightRef.current)
        .getPropertyValue('--color-spotlight').trim();
      spotlightRef.current.style.background =
        `radial-gradient(circle 275px at ${x}px ${y}px, ${color}, transparent)`;
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={spotlightRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 35,
        filter: 'blur(100px)',
      }}
    />
  );
}
