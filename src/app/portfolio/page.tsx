'use client';

import { useMemo, useCallback } from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import { pinnedProjects, shuffleableProjects } from '@/data/projects';
import { PortfolioCard } from '@/components/portfolio-card';
import { SnowfallEffect } from '@/components/snowfall';
import { useTransition } from '@/providers/transition-provider';

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function PortfolioPage() {
  const { navigateWithReveal } = useTransition();

  // Shuffle once on mount, pinned projects always first
  const displayProjects = useMemo(
    () => [...pinnedProjects, ...shuffle(shuffleableProjects)],
    []
  );

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      navigateWithReveal('/', originX, originY);
    },
    [navigateWithReveal]
  );

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: 'var(--color-page-inverted-bg)' }}
    >
      {/* Back button */}
      <button
        className="fixed top-6 left-6 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer z-20"
        style={{ backgroundColor: 'var(--color-page-inverted-text)' }}
        onClick={handleBack}
      >
        <FaArrowLeft
          className="w-5 h-5"
          style={{ color: 'var(--color-page-inverted-bg)' }}
        />
      </button>

      {/* Snowfall overlay */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <SnowfallEffect />
      </div>

      {/* Main grid area */}
      <div className="page-vertical-fade-mask overflow-y-auto h-screen">
        <div className="columns-1 sm:columns-4 gap-4 px-6 sm:px-[58px] pt-20 pb-24">
          {displayProjects.map((project) => (
            <div key={project.name} className="break-inside-avoid mb-4">
              <PortfolioCard project={project} />
            </div>
          ))}
        </div>

        {/* Footer text */}
        <div className="text-center pb-8">
          <p
            className="text-sm"
            style={{ color: 'var(--color-page-inverted-text)', opacity: 0.6 }}
          >
            Some of my <strong>finest works</strong> are missing, Thanks to the <strong>&apos;NDA&apos;</strong>!
          </p>
        </div>
      </div>
    </div>
  );
}
