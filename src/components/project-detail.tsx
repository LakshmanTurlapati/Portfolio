'use client';

import { useEffect } from 'react';
import { FaXmark, FaArrowLeft, FaLink, FaCodeFork, FaFigma } from 'react-icons/fa6';
import { FaGithub } from 'react-icons/fa6';
import type { Project, ProjectDetail as ProjectDetailData } from '@/data/projects';
import { PROJECT_DETAILS } from '@/data/projects';

interface ProjectDetailProps {
  project: Project;
  isDark: boolean;
  onClose: () => void;
  onOpenLink?: (url: string, label: string) => void;
}

export function ProjectDetail({ project, isDark, onClose, onOpenLink }: ProjectDetailProps) {
  const detail: ProjectDetailData = PROJECT_DETAILS[project.name] || {};
  const links = project.links || {};

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const openInViewer = (url: string, label: string) => {
    if (!url) return;
    onOpenLink?.(url, label);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-end ${isDark ? 'pd-overlay-light' : 'pd-overlay-dark'}`}
      onClick={onClose}
      style={{
        background: isDark
          ? 'rgba(250, 249, 245, 0.55)'
          : 'rgba(10, 10, 12, 0.55)',
        backdropFilter: 'blur(10px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
        animation: 'pd-fade 220ms ease-out',
      }}
    >
      <div
        className="relative w-full max-w-[820px] h-full overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark
            ? 'rgba(252, 251, 247, 0.98)'
            : 'rgba(18, 18, 20, 0.92)',
          color: isDark ? '#1a1a1a' : '#f3f2ee',
          borderLeft: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          animation: 'pd-slide 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: isDark ? '-24px 0 64px rgba(0,0,0,0.12)' : '-24px 0 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Close button */}
        <button
          className="absolute top-5 right-5 w-9 h-9 rounded-[10px] grid place-items-center text-sm z-[2] transition-all duration-150 hover:rotate-90"
          onClick={onClose}
          style={{
            border: `1px solid ${isDark ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)'}`,
            background: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
            color: 'inherit',
          }}
          aria-label="Close"
        >
          <FaXmark />
        </button>

        {/* Hero section */}
        <header className="px-14 pt-14 pb-6">
          <div className="flex gap-2 flex-wrap mb-5">
            {detail.year && (
              <span
                className="text-[10px] tracking-[0.12em] uppercase px-[10px] py-[5px] rounded-full"
                style={{
                  fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                  background: isDark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)'}`,
                }}
              >
                {detail.year}
              </span>
            )}
            {detail.role && (
              <span
                className="text-[10px] tracking-[0.12em] uppercase px-[10px] py-[5px] rounded-full opacity-[0.70]"
                style={{
                  fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                  background: 'transparent',
                  border: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)'}`,
                }}
              >
                {detail.role}
              </span>
            )}
          </div>

          <h1 className="text-[56px] leading-[1.02] font-normal tracking-[-0.02em] m-0 mb-3 font-[family-name:var(--font-instrument-serif)]">
            {project.name}
          </h1>

          {detail.tagline && (
            <p className="text-[18px] leading-[1.5] opacity-[0.72] m-0 mb-6 max-w-[62ch]">
              {detail.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-2.5">
            {links.Website && (
              <button
                className="text-[13px] font-medium px-4 py-2.5 rounded-[10px] inline-flex items-center gap-2 transition-all duration-150 hover:-translate-y-px"
                onClick={() => openInViewer(links.Website, 'Visit site')}
                style={{
                  background: isDark ? '#1a1a1a' : '#f3f2ee',
                  color: isDark ? '#f8f6f0' : '#1a1a1a',
                  border: `1px solid ${isDark ? '#1a1a1a' : '#f3f2ee'}`,
                }}
              >
                <FaLink className="text-xs" /> Visit site
              </button>
            )}
            {links.GitHub && (
              <button
                className="text-[13px] font-medium px-4 py-2.5 rounded-[10px] inline-flex items-center gap-2 transition-all duration-150 hover:-translate-y-px"
                onClick={() => openInViewer(links.GitHub, 'Source')}
                style={{
                  border: `1px solid ${isDark ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)'}`,
                  background: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                  color: 'inherit',
                }}
              >
                <FaGithub className="text-xs" /> Source
              </button>
            )}
            {links.Design && (
              <button
                className="text-[13px] font-medium px-4 py-2.5 rounded-[10px] inline-flex items-center gap-2 transition-all duration-150 hover:-translate-y-px"
                onClick={() => openInViewer(links.Design, 'Design')}
                style={{
                  border: `1px solid ${isDark ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)'}`,
                  background: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                  color: 'inherit',
                }}
              >
                <FaFigma className="text-xs" /> Design
              </button>
            )}
          </div>
        </header>

        {/* Cover image */}
        <div
          className="mt-4 mx-14 mb-8 rounded-[14px] overflow-hidden aspect-video"
          style={{
            border: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            background: isDark ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
          }}
        >
          {project.useIframe || !project.image ? (
            <div className="w-full h-full grid place-items-center text-5xl opacity-30">
              <FaGithub />
            </div>
          ) : (
            <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Body */}
        <div className="px-14 pb-10">
          {detail.overview && (
            <p className="text-[22px] leading-[1.45] opacity-[0.92] mb-8 max-w-[62ch] font-[family-name:var(--font-instrument-serif)]">{detail.overview}</p>
          )}

          {detail.stats && detail.stats.length > 0 && (
            <div
              className="grid gap-4 mb-8 py-5"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                borderTop: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                borderBottom: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {detail.stats.map((s, i) => (
                <div key={i}>
                  <div className="text-[28px] leading-none tracking-[-0.01em] mb-1.5 font-[family-name:var(--font-instrument-serif)] font-normal">{s.value}</div>
                  <div
                    className="text-[10px] uppercase tracking-[0.12em] opacity-55"
                    style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}
                  >{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {detail.stack && detail.stack.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              {detail.stack.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-[10px] py-1 rounded-[6px]"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                    opacity: 0.82,
                    background: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {detail.highlights && detail.highlights.length > 0 && (
            <section className="mb-8">
              <h3
                className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-55 mb-[14px]"
                style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}
              >Highlights</h3>
              <ul className="pd-highlights-list">
                {detail.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          {detail.sections?.map((s, i) => (
            <section key={i} className="mb-8">
              <h3
                className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-55 mb-[14px]"
                style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}
              >{s.heading}</h3>
              <p className="text-[15px] leading-[1.65] opacity-[0.88]">{s.body}</p>
            </section>
          ))}

          {!detail.overview && !detail.highlights && !detail.sections && (
            <p className="text-base opacity-50">
              More details about this project are available at the links above.
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="px-14 mt-8" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
          <button
            className="text-sm font-medium inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <FaArrowLeft /> Back to all projects
          </button>
        </footer>
      </div>
    </div>
  );
}
