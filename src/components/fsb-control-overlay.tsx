'use client';

import { useTheme } from 'next-themes';
import type { CSSProperties } from 'react';
import { useMounted } from '@/hooks/use-mounted';

interface FsbControlOverlayProps {
  active: boolean;
}

export function FsbControlOverlay({ active }: FsbControlOverlayProps) {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();

  if (!mounted || !active) return null;

  const overlayRgb = resolvedTheme === 'dark' ? '255,255,255' : '0,0,0';

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
        <div className="fsb-control-badge">powered by FSB</div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Parz is controlling the site.
      </span>
    </>
  );
}
