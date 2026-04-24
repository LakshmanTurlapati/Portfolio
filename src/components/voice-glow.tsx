'use client';

// src/components/voice-glow.tsx
// Phase 13: VoiceGlow — fixed full-viewport div that communicates VoiceBus state
// via CSS box-shadow animations (VFBK-01 through VFBK-04).
// Per D-10: subtle outer glow, not a border.
// Per D-11/D-12: MONOCHROME glow — color set via --glow-color CSS custom property.
//   Dark mode (black bg): --glow-color: 255,255,255 (white glow)
//   Light mode (white bg): --glow-color: 0,0,0 (black glow)
// Per D-13: driven by VoiceBus state events.
// States are differentiated by animation PATTERN only, not color.

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';

type GlowState = 'idle' | 'listening' | 'executing' | 'success' | 'error';

export function VoiceGlow() {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const [glowState, setGlowState] = useState<GlowState>('idle');

  // --glow-color drives all rgba() calls in globals.css keyframes and utility classes.
  // Dark mode (dark background) → white glow. Light mode (light background) → black glow.
  const glowColor = resolvedTheme === 'dark' ? '255,255,255' : '0,0,0';

  // Subscribe to VoiceBus state events — maps listening → 'listening', others → 'idle'.
  // tool-executing / tool-success / tool-error are separate custom events (not VoiceState).
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.VoiceBus) return;

    const unsubState = window.VoiceBus.on('state', (s) => {
      const state = s as string;
      if (state === 'listening') {
        setGlowState('listening');
      } else {
        // thinking, speaking, idle → no persistent glow (glow state already handled by tool events)
        // Only reset to idle if we are not in executing/error (those persist until tool resolves)
        setGlowState((prev) => (prev === 'executing' || prev === 'error' ? prev : 'idle'));
      }
    });

    // Per D-12: tool-executing → steady monochrome glow (VFBK-02)
    const unsubExec = window.VoiceBus.on('tool-executing', () => {
      setGlowState('executing');
    });

    // Per D-14: success glow flashes briefly (VFBK-03) — JS timer resets to idle after 1000ms
    const unsubSuccess = window.VoiceBus.on('tool-success', () => {
      setGlowState('success');
    });

    // Per D-14: error glow persists until VoiceBus state changes (VFBK-04)
    const unsubError = window.VoiceBus.on('tool-error', () => {
      setGlowState('error');
    });

    return () => {
      (unsubState as () => void)();
      (unsubExec as () => void)();
      (unsubSuccess as () => void)();
      (unsubError as () => void)();
    };
  }, [mounted]);

  // Per D-14: success glow is one-shot — reset to idle after 1000ms (animation duration).
  // This matches the voiceGlowSuccess keyframe timing in globals.css.
  useEffect(() => {
    if (glowState !== 'success') return;
    const timer = setTimeout(() => setGlowState('idle'), 1000);
    return () => clearTimeout(timer);
  }, [glowState]);

  // Per UI-SPEC: render nothing when idle or before hydration
  if (!mounted || glowState === 'idle') return null;

  return (
    <div
      aria-hidden="true"
      style={{ '--glow-color': glowColor } as React.CSSProperties}
      className={`fixed inset-0 pointer-events-none z-[60] voice-glow-${glowState}`}
    />
  );
}
