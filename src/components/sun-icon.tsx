'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

interface SunIconProps {
  active: boolean;
  className?: string;
}

const ANGLES = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
const CENTER = 15;
const RADIUS = 5;
const GAP = 4;
const RAY_START = RADIUS + GAP; // 9px from center

function computeRays(rayLength: number) {
  return ANGLES.map((angle) => ({
    x1: CENTER + RAY_START * Math.cos(angle),
    y1: CENTER + RAY_START * Math.sin(angle),
    x2: CENTER + (RAY_START + rayLength) * Math.cos(angle),
    y2: CENTER + (RAY_START + rayLength) * Math.sin(angle),
  }));
}

export function SunIcon({ active: _active, className }: SunIconProps) {
  // active prop is part of the interface for semantic clarity (light mode = active)
  // but color is handled by CSS variable --color-sun which auto-switches per theme
  void _active;
  const [hovered, setHovered] = useState(false);

  const rayLength = hovered ? 6 : 4;
  const rays = computeRays(rayLength);

  return (
    <svg
      viewBox="0 0 30 30"
      width={30}
      height={30}
      className={cn('cursor-pointer', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Center circle */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="var(--color-sun)"
        strokeWidth={2}
        style={{ transition: 'all 300ms ease-in-out' }}
      />
      {/* 8 rays at 45-degree intervals */}
      {rays.map((ray, i) => (
        <line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke="var(--color-sun)"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transition: 'all 300ms ease-in-out' }}
        />
      ))}
    </svg>
  );
}
