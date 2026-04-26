'use client';

// Phase 27 / FSB-04: Caption state machine inside the FSB control overlay.
// Subscribes to VoiceBus tool-executing / tool-success / tool-error events
// (payload `{ name, args }` from Plan 27-01) and renders a context-aware
// caption inside the badge while a tool runs. After tool-success the caption
// holds for SUCCESS_HOLD_MS (1500ms); after tool-error it holds for
// ERROR_HOLD_MS (3000ms); then it cross-fades back to the idle text
// (`powered by FSB`). Timers are cleared on unmount and on rapid re-trigger.
//
// Security: caption is rendered as text-only React children. No
// dangerouslySetInnerHTML, no template into HTML — model-supplied args
// (slug, page) are only ever interpolated into a string and rendered as
// text content (T-27-03 mitigation).

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { resolveProject } from '@/data/projects';

interface FsbControlOverlayProps {
  active: boolean;
}

const IDLE_TEXT = 'powered by FSB';
const SUCCESS_HOLD_MS = 1500;
const ERROR_HOLD_MS = 3000;
const FADE_MS = 200;

type ToolExecutingPayload = { name: string; args: Record<string, unknown> };

// Per CONTEXT 27 + UI-SPEC: locked caption copy. Trailing char is U+2026 (…).
// Unknown tool names return null so the badge falls back to IDLE_TEXT
// (T-27-04 mitigation: never render args for unknown tool names).
function resolveCaption(payload: ToolExecutingPayload): string | null {
  const { name, args } = payload;
  switch (name) {
    case 'openProject': {
      const slug = (args as { slug?: string }).slug ?? '';
      const project = slug ? resolveProject(slug) : null;
      // Fall back to the slug if resolveProject misses (defensive — caption never crashes).
      const display = project?.name ?? slug ?? '';
      return `Opening ${display}\u2026`;
    }
    case 'scrollTo':
      return 'Scrolling\u2026';
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

export function FsbControlOverlay({ active }: FsbControlOverlayProps) {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const [caption, setCaption] = useState<string | null>(null);
  // Controls fade opacity. true = caption (or idle) at full opacity; false = mid-cross-fade.
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);

  // Detect reduced-motion once on mount (matches voice-controller pattern).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const scheduleReturnToIdle = (holdMs: number) => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (reducedMotionRef.current) {
        setCaption(null);
        setVisible(true);
        return;
      }
      // Fade out current caption, then swap to idle and fade back in.
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        fadeTimerRef.current = null;
        setCaption(null);
        setVisible(true);
      }, FADE_MS);
    }, holdMs);
  };

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.VoiceBus) return;

    const unsubExec = window.VoiceBus.on('tool-executing', (raw) => {
      const payload = raw as ToolExecutingPayload | undefined;
      if (!payload || typeof payload !== 'object' || typeof payload.name !== 'string') return;
      const next = resolveCaption(payload);
      // Cancel any pending success/error hold or fade — latest event wins (T-27-05).
      clearTimers();
      // null next -> unknown tool, leave caption at idle (IDLE_TEXT).
      setCaption(next);
      setVisible(true);
    });

    const unsubSuccess = window.VoiceBus.on('tool-success', () => {
      // Hold caption for SUCCESS_HOLD_MS, then return to idle.
      scheduleReturnToIdle(SUCCESS_HOLD_MS);
    });

    const unsubError = window.VoiceBus.on('tool-error', () => {
      scheduleReturnToIdle(ERROR_HOLD_MS);
    });

    return () => {
      (unsubExec as () => void)();
      (unsubSuccess as () => void)();
      (unsubError as () => void)();
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // When the overlay deactivates, drop pending timers. Caption is cleared via
  // the `if (!active) return null` guard below (component unmounts).
  useEffect(() => {
    if (!active) clearTimers();
  }, [active]);

  if (!mounted || !active) return null;

  const overlayRgb = resolvedTheme === 'dark' ? '255,255,255' : '0,0,0';
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
        aria-hidden="true"
        style={{ '--fsb-overlay-rgb': overlayRgb } as CSSProperties}
        className="fsb-control-overlay pointer-events-none fixed inset-0"
      >
        <div className="fsb-control-grid" />
        <div className="fsb-control-corners" />
        <div className="fsb-control-target" />
        <div className="fsb-control-badge" style={fadeStyle}>
          {renderText}
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {captionToSrText(caption)}
      </span>
    </>
  );
}
