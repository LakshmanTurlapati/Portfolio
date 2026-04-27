'use client';

import { useMemo } from 'react';
import {
  buildContributionMatrix,
  type GitHubContributionDay,
} from '@/lib/github-activity';

interface DotMatrixProps {
  isMobile?: boolean;
  contributionDays?: GitHubContributionDay[];
  isLoading?: boolean;
  hasError?: boolean;
}

// Constants
const DOT_SIZE = 14; // px
const MARGIN = DOT_SIZE * 0.15; // 2.1px
const BORDER_RADIUS = DOT_SIZE * 0.2; // 2.8px

export function DotMatrix({
  isMobile = false,
  contributionDays = [],
  isLoading = false,
  hasError = false,
}: DotMatrixProps) {
  const columns = isMobile ? 20 : 48;
  const matrix = useMemo(
    () => buildContributionMatrix(contributionDays, columns),
    [contributionDays, columns]
  );
  const muted = isLoading || hasError || contributionDays.length === 0;

  return (
    <a
      href="https://github.com/LakshmanTurlapati"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub contribution activity graph"
      className={`${isMobile ? 'dot-matrix-fade-mask ' : ''}block`}
      style={{ opacity: muted ? 0.55 : 1 }}
    >
      {matrix.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center">
          {row.map((cell, colIdx) => (
            <span
              key={colIdx}
              className="dot-matrix-dot cursor-pointer block"
              title={cell.isPlaceholder ? 'No GitHub contribution data' : formatContributionTitle(cell.date, cell.count)}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                margin: `${MARGIN}px`,
                borderRadius: `${BORDER_RADIUS}px`,
                backgroundColor: `color-mix(in srgb, var(--color-dot-end) ${cell.level * 25}%, var(--color-dot-start))`,
                transition: 'width 300ms, height 300ms',
                opacity: cell.isPlaceholder ? 0.45 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </a>
  );
}

function formatContributionTitle(date: string, count: number): string {
  return `${count} contribution${count === 1 ? '' : 's'} on ${date}`;
}
