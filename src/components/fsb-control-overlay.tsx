'use client';

// Caption state machine inside the FSB control overlay. Concierge lifecycle
// events are the sole source of action state. After success the caption
// holds for SUCCESS_HOLD_MS (1500ms); after tool-error it holds for
// ERROR_HOLD_MS (3000ms); then it cross-fades back to the idle text
// (`powered by FSB`). Timers are cleared on unmount and on rapid re-trigger.
//
// Security: caption is rendered as text-only React children. No
// dangerouslySetInnerHTML, no template into HTML — model-supplied args
// (slug, page) are only ever interpolated into a string and rendered as
// text content (T-27-03 mitigation).

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { DispatchEvent } from '@full-self-browsing/concierge';
import { useConcierge } from '@full-self-browsing/concierge-react/client';
import { useMounted } from '@/hooks/use-mounted';
import { resolveProject } from '@/data/projects';

const IDLE_TEXT = 'powered by FSB';
const SUCCESS_HOLD_MS = 1500;
const ERROR_HOLD_MS = 3000;
const FADE_MS = 200;

type OverlayTone = 'on-light' | 'on-dark';
type OverlayStatus = 'acting' | 'success' | 'error';

// Per CONTEXT 27 + UI-SPEC: locked caption copy. Trailing char is U+2026 (…).
// Unknown tool names return null so the badge falls back to IDLE_TEXT
// (T-27-04 mitigation: never render args for unknown tool names).
function resolveCaption(event: DispatchEvent): string | null {
  const { name } = event;
  const args = event.input.kind === 'included' && event.input.value !== null &&
      typeof event.input.value === 'object'
    ? event.input.value as Record<string, unknown>
    : {};
  switch (name) {
    case 'openProject': {
      const projectName = (args as { name?: string }).name ?? '';
      const project = projectName ? resolveProject(projectName) : null;
      const display = project?.name ?? projectName;
      return `Opening ${display}\u2026`;
    }
    case 'scrollTo':
      return 'Scrolling\u2026';
    case 'scrollProjectPreview':
      return 'Scrolling preview\u2026';
    case 'closeBrowser':
      return 'Closing browser\u2026';
    case 'toggleTheme':
      return 'Switching theme\u2026';
    case 'openLink':
      return 'Opening link\u2026';
    case 'openCurrentProjectExternal':
      return 'Opening externally\u2026';
    case 'navigate': {
      const page = (args as { page?: string }).page ?? '';
      return `Navigating to ${page}\u2026`;
    }
    case 'startTour':
      return 'Guiding the tour\u2026';
    case 'switchToText':
      return 'Switching to text\u2026';
    case 'endCall':
      return 'Ending voice mode\u2026';
    case 'unsupportedIframeControl':
      return 'Checking browser controls\u2026';
    default:
      // Unknown tool name -> render IDLE_TEXT, no crash. Per UI-SPEC fallback rule.
      return null;
  }
}

// SR copy: lowercase first char of caption (preserves any embedded uppercase
// like "FSB"), strip trailing ellipsis, append period. Example:
// "Opening FSB / Full Self Browsing…" -> "Parz is opening FSB / Full Self Browsing."
function captionToSrText(caption: string | null): string {
  if (!caption) return 'Parz is controlling the site.';
  const stripped = caption.replace(/\u2026$/, '');
  const srBody =
    stripped.length > 0 ? stripped.charAt(0).toLowerCase() + stripped.slice(1) : stripped;
  return `Parz is ${srBody}.`;
}

function parseCssRgb(value: string): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1]
    .replace(/\//g, ' ')
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((part) => Number.parseFloat(part));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  return {
    r: parts[0],
    g: parts[1],
    b: parts[2],
    a: parts[3] ?? 1,
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function sampledOverlayTone(overlay: HTMLElement): OverlayTone {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const points = [
    [Math.max(32, window.visualViewport?.offsetLeft ?? 0) + 60, height - 32],
    [Math.min(300, width - 32), height - 32],
    [width / 2, height / 2],
    [Math.max(32, width - 32), Math.max(32, height * 0.25)],
  ];
  const luminanceSamples: number[] = [];

  for (const [x, y] of points) {
    const stack = document.elementsFromPoint(x, y);
    for (const element of stack) {
      if (!(element instanceof HTMLElement) || overlay.contains(element)) continue;
      let current: HTMLElement | null = element;
      while (current && current !== document.documentElement) {
        const bg = parseCssRgb(getComputedStyle(current).backgroundColor);
        if (bg && bg.a > 0.05) {
          luminanceSamples.push(relativeLuminance(bg));
          current = null;
          break;
        }
        current = current.parentElement;
      }
      break;
    }
  }

  if (luminanceSamples.length === 0) return 'on-dark';
  const avg = luminanceSamples.reduce((sum, value) => sum + value, 0) / luminanceSamples.length;
  return avg > 0.45 ? 'on-light' : 'on-dark';
}

export function FsbControlOverlay() {
  const mounted = useMounted();
  const concierge = useConcierge();
  const [active, setActive] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [overlayTone, setOverlayTone] = useState<OverlayTone>('on-dark');
  const [status, setStatus] = useState<OverlayStatus>('acting');
  // Controls fade opacity. true = caption (or idle) at full opacity; false = mid-cross-fade.
  const [visible, setVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);
  const activeDispatchesRef = useRef(new Set<string>());

  // Detect reduced-motion once on mount (matches voice-controller pattern).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const updateDynamicContrast = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || typeof window === 'undefined') return;
    setOverlayTone(sampledOverlayTone(overlay));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const activeDispatches = activeDispatchesRef.current;

    const unsubscribe = concierge.onDispatch((event) => {
      if (event.phase === 'accepted' || event.phase === 'waiting' || event.phase === 'executing') {
        activeDispatches.add(event.dispatchId);
        clearTimers();
        setActive(true);
        setCaption(resolveCaption(event));
        setStatus('acting');
        setVisible(true);
        return;
      }

      activeDispatches.delete(event.dispatchId);
      if (activeDispatches.size > 0) {
        setStatus('acting');
        return;
      }

      const succeeded = event.phase === 'succeeded';
      setStatus(succeeded ? 'success' : 'error');
      clearTimers();
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        if (reducedMotionRef.current) {
          setActive(false);
          setCaption(null);
          setVisible(true);
          return;
        }
        setVisible(false);
        fadeTimerRef.current = setTimeout(() => {
          fadeTimerRef.current = null;
          setActive(false);
          setCaption(null);
          setVisible(true);
        }, FADE_MS);
      }, succeeded ? SUCCESS_HOLD_MS : ERROR_HOLD_MS);
    });

    return () => {
      unsubscribe();
      activeDispatches.clear();
      clearTimers();
    };
  }, [clearTimers, concierge, mounted]);

  useEffect(() => {
    if (!mounted || !active) return;
    updateDynamicContrast();
    let raf: number | null = null;
    const schedule = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateDynamicContrast);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    const interval = window.setInterval(updateDynamicContrast, 500);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      window.clearInterval(interval);
    };
  }, [active, mounted, updateDynamicContrast]);

  if (!mounted || !active) return null;

  const renderText = caption ?? IDLE_TEXT;
  const fadeStyle: CSSProperties = reducedMotionRef.current
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ${visible ? 'ease-out' : 'ease-in'}`,
      };

  return (
    <>
      <div
        ref={overlayRef}
        aria-hidden="true"
        className={`fsb-control-overlay fsb-control-overlay--${overlayTone} fsb-control-overlay--${status} pointer-events-none fixed inset-0`}
      >
        <div className="fsb-control-badge" style={fadeStyle}>
          <div className="fsb-control-badge-row">
            <span className="fsb-control-mark">FSB</span>
            <span className="fsb-control-badge-text">{renderText}</span>
          </div>
          <div className="fsb-control-progress">
            <span />
          </div>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {captionToSrText(caption)}
      </span>
    </>
  );
}
