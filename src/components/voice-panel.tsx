'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { FaXmark, FaStop, FaComment } from 'react-icons/fa6';
import { VoiceWave } from '@/components/voice-wave';

// State dot colors from prototype styles.css
// idle=#8fbcff, listening=#ff8f8f (vmDotBlink 0.9s), thinking=#ffd58f (vmDotBlink 0.6s), speaking=#8fffb6
const STATE_DOTS: Record<string, { color: string; shadow: string; animation?: string }> = {
  idle: { color: '#8fbcff', shadow: '0 0 6px rgba(143,188,255,0.8)' },
  listening: {
    color: '#ff8f8f',
    shadow: '0 0 8px rgba(255,143,143,0.9)',
    animation: 'vmDotBlink 0.9s ease-in-out infinite',
  },
  thinking: {
    color: '#ffd58f',
    shadow: '0 0 8px rgba(255,213,143,0.9)',
    animation: 'vmDotBlink 0.6s ease-in-out infinite',
  },
  speaking: { color: '#8fffb6', shadow: '0 0 8px rgba(143,255,182,0.9)' },
};

const STATE_LABELS: Record<string, string> = {
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

function VoiceCaptionLine({ text }: { text: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const viewportEl = viewportRef.current;
    const lineEl = lineRef.current;
    if (!viewportEl || !lineEl) return;

    let raf: number | null = null;
    const updateOffset = () => {
      const nextOffset = Math.max(0, lineEl.scrollWidth - viewportEl.clientWidth);
      setOffset(nextOffset);
    };
    const schedule = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateOffset);
    };

    schedule();

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(viewportEl);
    observer?.observe(lineEl);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [text]);

  return (
    <div
      ref={viewportRef}
      aria-live="polite"
      style={{
        position: 'relative',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div
        ref={lineRef}
        className="voice-caption-track"
        style={{
          display: 'inline-block',
          fontSize: '14px',
          lineHeight: '1.25',
          whiteSpace: 'nowrap',
          opacity: 0.85,
          transform: `translate3d(${-offset}px, 0, 0)`,
          transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {text}
      </div>
    </div>
  );
}

export interface VoicePanelProps {
  isDark: boolean;
  state: string;
  caption: string;
  transcript: string;
  micDenied: boolean;
  onMic: () => void;
  onStop: () => void;
  onClose: () => void;
  onFallbackChat: () => void;
  /** Tighter padding + smaller wave for mobile-sized containers. */
  compact?: boolean;
}

export function VoicePanel({
  isDark,
  state,
  caption,
  transcript,
  micDenied,
  onMic,
  onStop,
  onClose,
  onFallbackChat,
  compact = false,
}: VoicePanelProps) {
  const dot = STATE_DOTS[state] ?? STATE_DOTS.idle;
  const textColor = isDark ? '#111' : '#fff';
  const btnBg = isDark ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const btnBorder = isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';

  const displayCaption =
    caption || transcript || (state === 'idle' ? 'Tap and talk to me.' : '');

  return (
    <>
      <style>{`
        @keyframes vmDotBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes vmFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap: compact ? '10px' : '16px',
          padding: compact ? '0 10px 0 14px' : '0 14px 0 22px',
          opacity: 1,
          animation: 'vmFadeIn 0.25s ease forwards',
          color: textColor,
          cursor: 'pointer',
        }}
        onClick={onMic}
        role="button"
        aria-label={state === 'listening' ? 'Stop listening' : 'Start listening'}
      >
        {/* Waveform or mic-denied banner */}
        {micDenied ? (
          <div
            onClick={(e) => { e.stopPropagation(); onMic(); }}
            style={{
              padding: '6px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ef4444',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Mic denied — click to retry
          </div>
        ) : (
          <VoiceWave isDark={isDark} compact={compact} />
        )}

        {/* Caption area */}
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10.5px',
              opacity: 0.7,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dot.color,
                boxShadow: dot.shadow,
                animation: dot.animation,
                flexShrink: 0,
              }}
            />
            {STATE_LABELS[state] ?? 'Ready'}
          </div>
          <VoiceCaptionLine text={displayCaption} />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {/* Switch to text chat */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFallbackChat();
            }}
            title="Switch to text chat"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `1px solid ${btnBorder}`,
              background: btnBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            <FaComment size={14} />
          </button>
          {/* Stop */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            title="Stop"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `1px solid ${btnBorder}`,
              background: btnBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            <FaStop size={14} />
          </button>
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close voice mode"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `1px solid ${btnBorder}`,
              background: btnBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            <FaXmark size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
