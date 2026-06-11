'use client';

import { useMemo } from 'react';

interface DotMatrixProps {
  isMobile?: boolean;
}

// Constants
const ROWS = 7;
const DOT_SIZE = 14; // px
const MARGIN = DOT_SIZE * 0.15; // 2.1px
const BORDER_RADIUS = DOT_SIZE * 0.2; // 2.8px

function deterministicIntensity(row: number, col: number, columns: number) {
  const value = Math.sin((row + 1) * 12.9898 + (col + 1) * 78.233 + columns * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

export function DotMatrix({ isMobile = false }: DotMatrixProps) {
  const columns = isMobile ? 20 : 48;

  const pattern = useMemo(() =>
    Array.from({ length: ROWS }, (_, rowIdx) =>
      Array.from({ length: columns }, (_, colIdx) => deterministicIntensity(rowIdx, colIdx, columns))
    ),
    [columns]
  );

  return (
    <a
      href="https://github.com/LakshmanTurlapati"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub profile"
      className={`${isMobile ? 'dot-matrix-fade-mask ' : ''}block`}
    >
      {pattern.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center">
          {row.map((intensity, colIdx) => (
            <span
              key={colIdx}
              className="dot-matrix-dot cursor-pointer block"
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                margin: `${MARGIN}px`,
                borderRadius: `${BORDER_RADIUS}px`,
                backgroundColor: `color-mix(in srgb, var(--color-dot-end) ${Math.round(intensity * 100)}%, var(--color-dot-start))`,
                transition: 'width 300ms, height 300ms',
              }}
            />
          ))}
        </div>
      ))}
    </a>
  );
}
