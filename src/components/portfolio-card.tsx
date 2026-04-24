'use client';

import { useRef, useState } from 'react';
import { FaLink, FaCodeFork, FaFigma, FaGithub } from 'react-icons/fa6';
import type { Project } from '@/data/projects';
import { PROJECT_EFFECTS } from '@/data/projects';
import { setCardHover } from './data-grid';

interface PortfolioCardProps {
  project: Project;
  isDark: boolean;
  onOpen: (project: Project) => void;
  onOpenLink: (url: string, label: string) => void;
}

export function PortfolioCard({ project, isDark, onOpen, onOpenLink }: PortfolioCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const onEnter = () => {
    setIsHovered(true);
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const effect = PROJECT_EFFECTS[project.name] || 'ripple';
    setCardHover({
      active: true,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      effect,
      startedAt: performance.now(),
      endedAt: 0,
    });
  };

  const onLeave = () => {
    setIsHovered(false);
    setCardHover({ active: false, endedAt: performance.now() });
  };

  const openLink = (url: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) onOpenLink(url, label);
  };

  return (
    <div
      ref={cardRef}
      className="break-inside-avoid mb-8 rounded-xl overflow-hidden relative cursor-pointer transition-all duration-300"
      onClick={() => onOpen(project)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        background: isHovered
          ? (isDark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)')
          : (isDark ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
        transition: 'background 0.3s',
      }}
    >
      {/* Image */}
      {project.useIframe ? (
        <div
          className="mx-2 mt-2 rounded-xl h-[220px] grid place-items-center text-[40px]"
          style={{
            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.2)',
            color: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <FaGithub />
        </div>
      ) : project.image ? (
        <img
          className="w-[calc(100%-16px)] mx-2 mt-2 rounded-xl block"
          style={{ background: 'rgba(0,0,0,0.2)' }}
          src={project.image}
          alt={project.name}
          loading="lazy"
        />
      ) : (
        <div
          className="mx-2 mt-2 rounded-xl h-[220px] grid place-items-center text-[40px]"
          style={{
            background: 'rgba(0,0,0,0.2)',
            color: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <FaGithub />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center px-3 py-2.5 gap-3">
        <div
          className="font-bold text-[15px] truncate"
          style={{
            color: isDark ? '#000' : '#fff',
            textShadow: isDark ? '1px 1px 4px rgba(255,255,255,0.7)' : '1px 1px 4px rgba(0,0,0,0.7)',
          }}
        >
          {project.name}
        </div>
        <div className="flex gap-3 shrink-0">
          {project.links.Website && (
            <button
              className="text-sm opacity-85 hover:opacity-100 hover:-translate-y-px transition-all"
              style={{ color: isDark ? '#000' : '#fff' }}
              onClick={(e) => openLink(project.links.Website, 'Visit site', e)}
              title="Website"
            >
              <FaLink />
            </button>
          )}
          {project.links.GitHub && (
            <button
              className="text-sm opacity-85 hover:opacity-100 hover:-translate-y-px transition-all"
              style={{ color: isDark ? '#000' : '#fff' }}
              onClick={(e) => openLink(project.links.GitHub, 'Source', e)}
              title="GitHub"
            >
              <FaCodeFork />
            </button>
          )}
          {project.links.Design && (
            <button
              className="text-sm opacity-85 hover:opacity-100 hover:-translate-y-px transition-all"
              style={{ color: isDark ? '#000' : '#fff' }}
              onClick={(e) => openLink(project.links.Design, 'Design', e)}
              title="Design"
            >
              <FaFigma />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
