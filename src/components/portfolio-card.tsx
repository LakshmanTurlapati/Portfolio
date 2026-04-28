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
  variant?: 'desktop' | 'mobile';
  active?: boolean;
}

export function PortfolioCard({
  project,
  isDark,
  onOpen,
  onOpenLink,
  variant = 'desktop',
  active = false,
}: PortfolioCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = variant === 'mobile';

  const onEnter = () => {
    if (isMobile) return;
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
    if (isMobile) return;
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
      className={`${isMobile ? 'mb-0 rounded-[14px]' : 'break-inside-avoid mb-8 rounded-xl'} overflow-hidden relative cursor-pointer transition-all duration-300`}
      onClick={() => onOpen(project)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        background: isMobile
          ? (active
            ? (isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.075)')
            : (isDark ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.04)'))
          : (isHovered
            ? (isDark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)')
            : (isDark ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)')),
        border: isMobile
          ? `1px solid ${active ? (isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.18)') : 'transparent'}`
          : undefined,
        boxShadow: isMobile && active ? '0 14px 46px rgba(0,0,0,0.22)' : undefined,
        backdropFilter: isMobile && active ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: isMobile && active ? 'blur(12px)' : undefined,
        transform: isMobile && active ? 'translateY(-1px)' : undefined,
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.3s',
      }}
    >
      {/* Image */}
      {project.useIframe ? (
        <div
          className={`${isMobile ? 'mx-2 mt-2 h-[180px] rounded-lg' : 'mx-2 mt-2 h-[220px] rounded-xl'} grid place-items-center text-[40px]`}
          style={{
            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.2)',
            color: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <FaGithub />
        </div>
      ) : project.image ? (
        <img
          className={`${isMobile ? 'rounded-lg' : 'rounded-xl'} w-[calc(100%-16px)] mx-2 mt-2 block`}
          style={{ background: 'rgba(0,0,0,0.2)' }}
          src={project.image}
          alt={project.name}
          loading="lazy"
        />
      ) : (
        <div
          className={`${isMobile ? 'mx-2 mt-2 h-[180px] rounded-lg' : 'mx-2 mt-2 h-[220px] rounded-xl'} grid place-items-center text-[40px]`}
          style={{
            background: 'rgba(0,0,0,0.2)',
            color: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <FaGithub />
        </div>
      )}

      {/* Footer */}
      <div className={`flex justify-between items-center gap-3 ${isMobile ? 'px-3 py-2' : 'px-3 py-2.5'}`}>
        <div
          className={`${isMobile ? 'text-[14px]' : 'text-[15px]'} font-bold truncate`}
          style={{
            color: isDark ? '#000' : '#fff',
            textShadow: isDark ? '1px 1px 4px rgba(255,255,255,0.7)' : '1px 1px 4px rgba(0,0,0,0.7)',
          }}
        >
          {project.name}
        </div>
        <div className={`flex shrink-0 ${isMobile ? 'gap-1' : 'gap-3'}`}>
          {project.links.Website && (
            <button
              className={`${isMobile ? 'h-11 w-9' : 'text-sm'} grid place-items-center opacity-85 hover:opacity-100 hover:-translate-y-px transition-all`}
              style={{ color: isDark ? '#000' : '#fff' }}
              onClick={(e) => openLink(project.links.Website, 'Visit site', e)}
              title="Website"
            >
              <FaLink />
            </button>
          )}
          {project.links.GitHub && (
            <button
              className={`${isMobile ? 'h-11 w-9' : 'text-sm'} grid place-items-center opacity-85 hover:opacity-100 hover:-translate-y-px transition-all`}
              style={{ color: isDark ? '#000' : '#fff' }}
              onClick={(e) => openLink(project.links.GitHub, 'Source', e)}
              title="GitHub"
            >
              <FaCodeFork />
            </button>
          )}
          {project.links.Design && (
            <button
              className={`${isMobile ? 'h-11 w-9' : 'text-sm'} grid place-items-center opacity-85 hover:opacity-100 hover:-translate-y-px transition-all`}
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
