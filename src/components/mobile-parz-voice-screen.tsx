'use client';

import type { CSSProperties } from 'react';
import { useCallback, useRef, useState } from 'react';
import { IoChevronBackSharp } from 'react-icons/io5';
import { VoiceWave } from '@/components/voice-wave';
import type { LegacyChatTheme } from '@/lib/chat-theme';

export const MOBILE_VOICE_STATE_LABELS: Record<string, string> = {
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

interface MobileParzVoiceScreenProps {
  isDark: boolean;
  legacyTheme: LegacyChatTheme;
  voiceState: string;
  caption: string;
  micDenied: boolean;
  onMic?: () => void;
  onStop?: () => void;
  onToggleToLegacy?: () => void;
  onExitTap?: () => void;
  onExitDragStart?: () => void;
  onExitDragProgress?: (progress: number) => void;
  onExitDragCommit?: (progress: number) => void;
  onExitDragCancel?: (progress: number) => void;
  interactive?: boolean;
  showControls?: boolean;
}

const EXIT_MIN_DRAG_DISTANCE = 28;
const EXIT_COMMIT_PROGRESS = 0.72;
const EXIT_COMMIT_VELOCITY = 650;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

interface ExitChevronProps {
  interactive?: boolean;
  onTap?: () => void;
  onDragStart?: () => void;
  onDragProgress?: (progress: number) => void;
  onDragCommit?: (progress: number) => void;
  onDragCancel?: (progress: number) => void;
}

function ExitChevron({
  interactive = true,
  onTap,
  onDragStart,
  onDragProgress,
  onDragCommit,
  onDragCancel,
}: ExitChevronProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(0);
  const dragDistanceRef = useRef(EXIT_MIN_DRAG_DISTANCE);
  const dragStartTimeRef = useRef(0);
  const dragProgressRef = useRef(0);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);

  const start = useCallback(
    (clientX: number) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      setDragOffset(0);
      dragProgressRef.current = 0;
      suppressClickRef.current = false;
      dragStartRef.current = clientX;
      dragDistanceRef.current = Math.max(clientX, EXIT_MIN_DRAG_DISTANCE);
      dragStartTimeRef.current = Date.now();
      onDragStart?.();
    },
    [onDragStart]
  );

  const move = useCallback(
    (clientX: number) => {
      if (!isDraggingRef.current) return;
      const delta = dragStartRef.current - clientX;
      const progress = clamp(delta / dragDistanceRef.current);
      dragProgressRef.current = progress;
      setDragOffset(-Math.max(0, Math.min(delta, dragDistanceRef.current)));
      onDragProgress?.(progress);
    },
    [onDragProgress]
  );

  const end = useCallback(
    (clientX: number) => {
      if (!isDraggingRef.current) return;
      const delta = dragStartRef.current - clientX;
      const elapsed = Math.max((Date.now() - dragStartTimeRef.current) / 1000, 0.016);
      const velocity = delta / elapsed;
      const progress = dragProgressRef.current;

      suppressClickRef.current = Math.abs(delta) > 6;
      if (progress >= EXIT_COMMIT_PROGRESS || (delta > 18 && velocity > EXIT_COMMIT_VELOCITY)) {
        onDragCommit?.(progress);
      } else {
        onDragCancel?.(progress);
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      setDragOffset(0);
    },
    [onDragCancel, onDragCommit]
  );

  return (
    <button
      type="button"
      aria-label="Exit chat"
      data-testid="mobile-chat-exit-chevron"
      className="absolute z-30 flex h-12 w-12 items-center justify-center rounded-full active:scale-95"
      tabIndex={interactive ? undefined : -1}
      style={{
        top: 'max(20px, env(safe-area-inset-top))',
        right: 'max(16px, env(safe-area-inset-right))',
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 220ms ease',
        touchAction: 'none',
        color: 'var(--mobile-voice-control-fg)',
        backgroundColor: 'var(--mobile-voice-control-bg)',
        border: '1px solid var(--mobile-voice-control-border)',
        backdropFilter: 'blur(12px)',
      }}
      onPointerDown={interactive ? (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start(e.clientX);
      } : undefined}
      onPointerMove={interactive ? (e) => move(e.clientX) : undefined}
      onPointerUp={interactive ? (e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        end(e.clientX);
      } : undefined}
      onPointerCancel={interactive ? () => {
        onDragCancel?.(dragProgressRef.current);
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragOffset(0);
      } : undefined}
      onClick={interactive ? () => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onTap?.();
      } : undefined}
    >
      <IoChevronBackSharp
        data-direction="left"
        size={20}
      />
    </button>
  );
}

export function MobileParzVoiceScreen({
  isDark,
  legacyTheme,
  voiceState,
  caption,
  micDenied,
  onMic,
  onStop,
  onToggleToLegacy,
  onExitTap,
  onExitDragStart,
  onExitDragProgress,
  onExitDragCommit,
  onExitDragCancel,
  interactive = true,
  showControls = true,
}: MobileParzVoiceScreenProps) {
  const voiceStateLabel = MOBILE_VOICE_STATE_LABELS[voiceState] ?? 'Ready';
  const stageLabel = voiceState === 'listening' ? 'Stop listening' : 'Start listening';
  const canStop = voiceState === 'listening' || voiceState === 'thinking' || voiceState === 'speaking';
  const primaryAction = canStop ? onStop : onMic;
  const primaryActionLabel = canStop ? 'Stop' : 'Talk to begin';
  const stageAction = interactive ? onMic : undefined;
  const primaryActionHandler = interactive ? primaryAction : undefined;

  return (
    <div
      style={{
        '--mobile-voice-control-fg': legacyTheme.foreground,
        '--mobile-voice-control-bg': legacyTheme.controlFill,
        '--mobile-voice-control-border': legacyTheme.controlBorder,
      } as CSSProperties}
    >
      {showControls && (
        <ExitChevron
          interactive={interactive}
          onTap={interactive ? onExitTap : undefined}
          onDragStart={interactive ? onExitDragStart : undefined}
          onDragProgress={interactive ? onExitDragProgress : undefined}
          onDragCommit={interactive ? onExitDragCommit : undefined}
          onDragCancel={interactive ? onExitDragCancel : undefined}
        />
      )}

      {showControls && (
        <button
          onClick={interactive ? onToggleToLegacy : undefined}
          tabIndex={interactive ? undefined : -1}
          data-testid="toggle-to-legacy-chat"
          className="absolute z-20 min-h-11 rounded-full px-4 text-sm font-bold active:scale-95"
          style={{
            top: 'max(20px, env(safe-area-inset-top))',
            left: 'max(18px, env(safe-area-inset-left))',
            color: legacyTheme.foreground,
            backgroundColor: legacyTheme.controlFill,
            border: `1px solid ${legacyTheme.controlBorder}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          Legacy chat
        </button>
      )}

      <section
        data-testid="mobile-parz-voice-stage"
        className="absolute inset-0 flex flex-col"
        style={{
          color: legacyTheme.foreground,
          backgroundColor: legacyTheme.surface,
          backdropFilter: 'blur(10px)',
          paddingTop: 'calc(max(20px, env(safe-area-inset-top)) + 72px)',
          paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          role={stageAction ? 'button' : undefined}
          tabIndex={stageAction ? 0 : undefined}
          aria-label={stageAction ? stageLabel : undefined}
          onClick={stageAction}
          onKeyDown={(e) => {
            if (!stageAction) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              stageAction();
            }
          }}
          className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center outline-none"
          style={{ color: legacyTheme.foreground }}
        >
          <div
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.11em]"
            style={{ color: legacyTheme.muted }}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: micDenied ? '#ef4444' : voiceState === 'listening' ? '#ff8f8f' : '#8fbcff',
                boxShadow: micDenied
                  ? '0 0 10px rgba(239,68,68,0.55)'
                  : voiceState === 'listening'
                    ? '0 0 12px rgba(255,143,143,0.7)'
                    : '0 0 10px rgba(143,188,255,0.65)',
              }}
            />
            {voiceStateLabel}
          </div>

          <div className="my-10">
            <VoiceWave
              isDark={isDark}
              size="hero"
              color={legacyTheme.foreground}
              testId="mobile-parz-wave"
            />
          </div>

          <p
            data-testid="mobile-parz-caption"
            className="max-w-[320px] text-[clamp(16px,4.7vw,20px)] font-bold leading-tight"
            style={{ color: legacyTheme.foreground, overflowWrap: 'anywhere' }}
          >
            {caption}
          </p>
        </div>

        {showControls && (
          <div className="flex shrink-0 justify-center px-6">
            <button
              type="button"
              onClick={primaryActionHandler}
              tabIndex={interactive ? undefined : -1}
              data-testid="mobile-voice-primary-action"
              className="min-h-11 rounded-full px-5 text-[13px] font-bold active:scale-95"
              style={{
                color: legacyTheme.foreground,
                border: `1px solid ${legacyTheme.controlBorder}`,
                backgroundColor: legacyTheme.controlFill,
                backdropFilter: 'blur(12px)',
              }}
            >
              {primaryActionLabel}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
