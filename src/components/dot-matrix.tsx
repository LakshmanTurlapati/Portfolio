'use client';

import { useState } from 'react';

interface DotMatrixProps {
  isMobile?: boolean;
}

// Constants
const ROWS = 7;
const DOT_SIZE = 14; // px
const MARGIN = DOT_SIZE * 0.15; // 2.1px
const BORDER_RADIUS = DOT_SIZE * 0.2; // 2.8px

export function DotMatrix({ isMobile = false }: DotMatrixProps) {
  const columns = isMobile ? 20 : 48;

  const [pattern] = useState(() =>
    Array.from({ length: ROWS }, () =>
      Array.from({ length: columns }, () => Math.random())
    )
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
