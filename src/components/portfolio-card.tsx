'use client';

import { FaLink, FaCodeBranch, FaFigma } from 'react-icons/fa6';
import type { Project } from '@/data/projects';

const linkIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Website: FaLink,
  GitHub: FaCodeBranch,
  Design: FaFigma,
};

interface PortfolioCardProps {
  project: Project;
}

export function PortfolioCard({ project }: PortfolioCardProps) {
  // Primary link is the first entry in the links object
  const primaryUrl = Object.values(project.links)[0];

  const handleCardClick = () => {
    if (primaryUrl) {
      window.open(primaryUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image or placeholder */}
      {project.image ? (
        <div className="p-2 pb-0">
          <img
            src={project.image}
            alt={project.name}
            loading="lazy"
            className="w-full rounded-lg object-cover"
          />
        </div>
      ) : (
        <div
          className="h-[180px] flex items-center justify-center p-2"
          style={{ color: 'var(--color-page-inverted-text)' }}
        >
          <span className="text-4xl font-mono">&lt;&gt;</span>
        </div>
      )}

      {/* Name and link icons */}
      <div className="p-3 flex items-center justify-between">
        <span
          className="font-bold text-sm truncate"
          style={{ color: 'var(--color-page-inverted-text)' }}
        >
          {project.name}
        </span>
        <div className="flex gap-2">
          {Object.entries(project.links).map(([type, url]) => {
            const Icon = linkIconMap[type];
            if (!Icon) return null;
            return (
              <a
                key={type}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <span style={{ color: 'var(--color-page-inverted-text)' }}>
                  <Icon className="w-4 h-4" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
