'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { FaArrowLeft, FaSliders, FaXmark } from 'react-icons/fa6';
import { useTheme } from 'next-themes';
import { getProjectBrowserTarget, pinnedProjects, resolveProject, shuffleableProjects } from '@/data/projects';
import type { Project } from '@/data/projects';
import { PortfolioCard } from '@/components/portfolio-card';
import { DataGrid, DEFAULT_DG_CFG } from '@/components/data-grid';
import type { DataGridConfig } from '@/components/data-grid';
import { IframeViewer } from '@/components/iframe-viewer';
import { useTransition } from '@/providers/transition-provider';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';

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
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === 'dark';
  const { registerToolCallbacks } = useVoiceSession();

  const projects = useMemo(
    () => [...pinnedProjects, ...shuffle(shuffleableProjects)],
    []
  );

  const [dgCfg, setDgCfg] = useState<DataGridConfig>(DEFAULT_DG_CFG);
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewer, setViewer] = useState<{ url: string; label: string } | null>(null);
  const [browserFallback, setBrowserFallback] = useState<{ heading: string; body: string } | null>(null);

  const openProject = useCallback((project: Project) => {
    const target = getProjectBrowserTarget(project);
    if (target) {
      setBrowserFallback(null);
      setViewer(target);
      return;
    }
    setBrowserFallback({
      heading: 'Project unavailable',
      body: 'I could not find an approved browser target for this project.',
    });
  }, []);

  const openInViewer = useCallback((url: string, label: string) => {
    if (!url) return;
    setViewer({ url, label });
  }, []);

  const randomize = useCallback(() => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const anims: DataGridConfig['animationType'][] = ['pulse', 'wave', 'random'];
    setDgCfg((c) => ({
      ...c,
      cellSize: Math.floor(rand(3, 12)),
      spacing: Math.floor(rand(6, 22)),
      duration: rand(3, 10),
      animationType: anims[Math.floor(Math.random() * anims.length)],
      pulseEffect: Math.random() > 0.15,
      mouseGlow: Math.random() > 0.3,
      proximityReveal: Math.random() > 0.2,
      proximityRadius: Math.floor(rand(100, 260)),
      opacityMin: rand(0.02, 0.08),
      opacityMax: rand(0.10, 0.24),
    }));
  }, []);

  // Phase 17: resolve spoken aliases to approved project records, then open the browser path directly.
  useEffect(() => {
    registerToolCallbacks({
      openProject: ({ slug }) => {
        const project = resolveProject(slug);
        if (project) {
          openProject(project);
          return;
        }
        setViewer(null);
        setBrowserFallback({
          heading: 'Project unavailable',
          body: `I could not find an approved browser target for "${slug}".`,
        });
      },
    });
    // Deregister on unmount — prevents stale callbacks when navigating away
    return () => registerToolCallbacks({});
  }, [openProject, registerToolCallbacks]);

  // Phase 13 (D-08, TOOL-06): emit 'page-ready' after mount so the tour's waitForPage resolves.
  // Empty deps — fires once after first mount. Guards for VoiceBus availability (SSR safety).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.VoiceBus) {
      window.VoiceBus.emit('page-ready', 'portfolio');
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === 'h') setPanelOpen((v) => !v);
      if (k === 'r') randomize();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [randomize]);

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      navigateWithReveal('/', rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [navigateWithReveal]
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: isDark ? '#DBDBDB' : '#2A2A2A', color: isDark ? '#000' : '#fff' }}
    >
      {/* DataGrid canvas background */}
      <DataGrid cfg={dgCfg} isDark={isDark} />

      {/* Header */}
      <div className="relative z-[3] px-5 h-[76px] flex items-center">
        <button
          className="w-12 h-12 rounded-xl grid place-items-center text-lg transition-transform hover:-translate-x-0.5"
          style={{
            backgroundColor: isDark ? '#fff' : '#000',
            color: isDark ? '#000' : '#fff',
          }}
          onClick={handleBack}
        >
          <FaArrowLeft />
        </button>
        <button
          className="ml-2.5 w-12 h-12 rounded-xl grid place-items-center text-base transition-all hover:-translate-y-px"
          style={{
            background: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            color: 'inherit',
          }}
          onClick={() => setPanelOpen((v) => !v)}
          title="Grid controls (H)"
        >
          <FaSliders />
        </button>
      </div>

      {/* Card grid */}
      <div className="relative z-[2] px-[58px] pb-[58px] page-vertical-fade-mask max-sm:px-5 max-sm:pb-10">
        <div className="columns-4 gap-8 max-[1400px]:columns-3 max-[1020px]:columns-2 max-sm:columns-1">
          {projects.map((p) => (
            <PortfolioCard
              key={p.name}
              project={p}
              isDark={isDark}
              onOpen={openProject}
              onOpenLink={openInViewer}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-[2] py-5 text-center text-xs" style={{ color: 'inherit' }}>
        Some of my <b>finest works</b> are missing, thanks to the <b>&apos;NDA&apos;</b>!
      </div>

      {/* Grid controls panel */}
      {panelOpen && (
        <GridControlsPanel
          cfg={dgCfg}
          setCfg={setDgCfg}
          isDark={isDark}
          onClose={() => setPanelOpen(false)}
          onRandomize={randomize}
        />
      )}

      {/* Iframe viewer */}
      {viewer && (
        <IframeViewer
          url={viewer.url}
          label={viewer.label}
          isDark={isDark}
          onClose={() => setViewer(null)}
        />
      )}

      {/* Browser fallback */}
      {browserFallback && (
        <ProjectBrowserFallback
          heading={browserFallback.heading}
          body={browserFallback.body}
          isDark={isDark}
          onClose={() => setBrowserFallback(null)}
        />
      )}
    </div>
  );
}

function ProjectBrowserFallback({
  heading, body, isDark, onClose,
}: {
  heading: string;
  body: string;
  isDark: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center px-6"
      onClick={onClose}
      style={{
        background: isDark ? 'rgba(250,249,245,0.55)' : 'rgba(10,10,12,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl px-6 py-7 text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#fafaf7' : '#1a1a1c',
          color: isDark ? '#1a1a1a' : '#f3f2ee',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
      >
        <button
          className="absolute right-3 top-3 w-8 h-8 rounded-lg grid place-items-center text-xs opacity-60 hover:opacity-100 transition-opacity"
          onClick={onClose}
          title="Close"
        >
          <FaXmark />
        </button>
        <h3 className="text-xl font-bold">{heading}</h3>
        <p className="mt-3 text-sm opacity-60">{body}</p>
      </div>
    </div>
  );
}

// Grid controls panel
function GridControlsPanel({
  cfg, setCfg, isDark, onClose, onRandomize,
}: {
  cfg: DataGridConfig;
  setCfg: (c: DataGridConfig) => void;
  isDark: boolean;
  onClose: () => void;
  onRandomize: () => void;
}) {
  const set = <K extends keyof DataGridConfig>(k: K) => (v: DataGridConfig[K]) =>
    setCfg({ ...cfg, [k]: v });

  const panelBg = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(20,20,20,0.82)';
  const panelBorder = isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const panelColor = isDark ? '#000' : '#fff';

  return (
    <aside
      className="fixed top-[90px] right-5 z-30 w-[280px] p-4 rounded-2xl flex flex-col gap-3 text-[11px] font-mono"
      style={{
        background: panelBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${panelBorder}`,
        color: panelColor,
        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.15)' : '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-[0.12em] uppercase opacity-70 m-0">Grid Controls</h3>
        <button className="w-6 h-6 rounded-md opacity-60 hover:opacity-100 grid place-items-center" onClick={onClose}>
          &times;
        </button>
      </div>

      <SliderCtrl label="Dot size" min={2} max={20} step={1} value={cfg.cellSize} onChange={set('cellSize')} />
      <SliderCtrl label="Spacing" min={2} max={30} step={1} value={cfg.spacing} onChange={set('spacing')} />
      <SliderCtrl label="Duration" min={1} max={15} step={0.1} value={cfg.duration} onChange={set('duration')} />

      <label className="flex flex-col gap-1.5">
        <span>Animation</span>
        <select
          value={cfg.animationType}
          onChange={(e) => set('animationType')(e.target.value as DataGridConfig['animationType'])}
          className="w-full px-2 py-1.5 rounded-lg text-[11px] bg-current/5 border border-current/10 appearance-none"
          style={{ color: 'inherit', background: isDark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' }}
        >
          <option value="pulse">Pulse from center</option>
          <option value="wave">Wave</option>
          <option value="random">Random</option>
        </select>
      </label>

      <ToggleCtrl label="Pulse effect" value={cfg.pulseEffect} onChange={set('pulseEffect')} isDark={isDark} />
      <ToggleCtrl label="Mouse glow" value={cfg.mouseGlow} onChange={set('mouseGlow')} isDark={isDark} />
      <ToggleCtrl label="Proximity reveal" value={cfg.proximityReveal} onChange={set('proximityReveal')} isDark={isDark} />
      <SliderCtrl label="Reveal radius" min={60} max={320} step={10} value={cfg.proximityRadius} onChange={set('proximityRadius')} />
      <SliderCtrl label="Opacity min" min={0} max={1} step={0.01} value={cfg.opacityMin} onChange={set('opacityMin')} />
      <SliderCtrl label="Opacity max" min={0} max={1} step={0.01} value={cfg.opacityMax} onChange={set('opacityMax')} />

      <div className="flex gap-2 mt-1">
        <button
          className="flex-1 py-2 px-2.5 rounded-lg text-[11px] transition-all hover:-translate-y-px"
          style={{ background: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
          onClick={onRandomize}
        >
          Randomize (R)
        </button>
        <button
          className="flex-1 py-2 px-2.5 rounded-lg text-[11px] transition-all hover:-translate-y-px"
          style={{ background: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
          onClick={onClose}
        >
          Close (H)
        </button>
      </div>
    </aside>
  );
}

function SliderCtrl({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span>{label}</span>
        <span className="opacity-60 tabular-nums">{Number(value).toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-0.5 rounded appearance-none cursor-pointer accent-current opacity-40"
      />
    </label>
  );
}

function ToggleCtrl({ label, value, onChange, isDark }: {
  label: string; value: boolean; onChange: (v: boolean) => void; isDark: boolean;
}) {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className="relative w-8 h-[18px] rounded-[10px] transition-colors"
        style={{
          background: value
            ? (isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)')
            : (isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)'),
        }}
        onClick={() => onChange(!value)}
      >
        <span
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-[left]"
          style={{
            left: value ? 16 : 2,
            background: isDark ? (value ? '#fff' : '#000') : '#fff',
          }}
        />
      </button>
    </label>
  );
}
