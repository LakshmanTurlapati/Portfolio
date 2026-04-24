'use client';

import { FaXmark, FaStop, FaComment, FaMicrophone } from 'react-icons/fa6';
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
}: VoicePanelProps) {
  const dot = STATE_DOTS[state] ?? STATE_DOTS.idle;
  const textColor = isDark ? '#e8e4d8' : '#1a1a1a';
  const btnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  const displayCaption =
    caption || transcript || (state === 'idle' ? 'Tap the mic and talk to me.' : '');

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
          gap: '16px',
          padding: '0 16px',
          opacity: 1,
          animation: 'vmFadeIn 0.25s ease forwards',
          color: textColor,
          cursor: state === 'listening' ? 'default' : 'pointer',
        }}
        onClick={state === 'idle' ? onMic : undefined}
        role={state === 'idle' ? 'button' : undefined}
        aria-label={state === 'idle' ? 'Start listening' : undefined}
      >
        {/* Mic button / wave area */}
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMic();
            }}
            aria-label={state === 'listening' ? 'Stop listening' : 'Start listening'}
            style={{
              width: '48px',
              height: '48px',
              flexShrink: 0,
              borderRadius: '50%',
              border: `1px solid ${btnBorder}`,
              background:
                state === 'listening'
                  ? 'radial-gradient(circle at 35% 30%, rgba(255,150,150,0.5), rgba(220,80,80,0.2) 60%, rgba(200,0,0,0) 75%)'
                  : btnBg,
              boxShadow:
                state === 'listening'
                  ? '0 0 18px rgba(255,120,120,0.55), inset 0 0 14px rgba(255,255,255,0.25)'
                  : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            <FaMicrophone size={18} />
          </button>
        )}

        {/* Waveform */}
        <VoiceWave isDark={isDark} />

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
          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.25',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: 0.85,
            }}
          >
            {displayCaption}
          </div>
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
