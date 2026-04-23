'use client';

import type { CSSProperties } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { IoChevronForwardSharp } from 'react-icons/io5';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';
import { getLegacyChatTheme } from '@/lib/chat-theme';
import {
  MobileParzVoiceScreen,
  MOBILE_VOICE_STATE_LABELS,
} from '@/components/mobile-parz-voice-screen';

// Role list matching Flutter source exactly
const ROLES = [
  'UI/UX Designer',
  'Product Developer',
  'Software Developer',
  'Cloud Developer',
  'Applied AI',
  'OpenSource',
];

const ITEM_EXTENT = 30; // px per item
const ROLLER_HEIGHT = 150; // px
const ROLLER_WIDTH = 230; // px
const ROLE_SET_HEIGHT = ROLES.length * ITEM_EXTENT;
const ROLE_CENTER_OFFSET = ROLLER_HEIGHT / 2 - ITEM_EXTENT / 2;
const LOOPED_ROLES = [...ROLES, ...ROLES, ...ROLES];
const CHAT_DRAG_DISTANCE = 180;
const CHAT_COMMIT_PROGRESS = 0.42;
const CHAT_COMMIT_VELOCITY = 300;
const CHAT_HOME_SHIFT_VW = 32;
const CHAT_OPEN_DURATION_MS = 320;
const CHAT_CANCEL_DURATION_MS = 220;
const CHAT_SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface ScrollingTextProps {
  isMobile: boolean;
  clickCount?: number;
}

interface RoleRollerProps {
  fontSize: number | string;
  width?: number | string;
  testId?: string;
}

interface MobileChevronProps {
  onDragStart: () => void;
  onDragProgress: (progress: number) => void;
  onDragCommit: (progress: number) => void;
  onDragCancel: (progress: number) => void;
  onTap: () => void;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

// -- Role Roller (shared between desktop and mobile) --
function RoleRoller({ fontSize, width = ROLLER_WIDTH, testId }: RoleRollerProps) {
  const trackStyle = {
    '--role-roller-start': `${ROLE_CENTER_OFFSET - ROLE_SET_HEIGHT}px`,
    '--role-roller-distance': `${ROLE_SET_HEIGHT}px`,
    '--role-roller-duration': `${ROLES.length}s`,
  } as CSSProperties;

  return (
    <div
      data-testid={testId}
      className="scroll-roller-mask overflow-hidden"
      style={{ height: ROLLER_HEIGHT, width }}
    >
      <div className="role-roller-track" style={trackStyle}>
        {LOOPED_ROLES.map((role, i) => (
          <div
            key={`${role}-${i}`}
            className="text-center"
            style={{
              height: ITEM_EXTENT,
              lineHeight: `${ITEM_EXTENT}px`,
              fontSize,
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            {role}
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Desktop Layout --
function DesktopScrollingText() {
  return (
    <div className="flex items-center justify-center">
      {/* Static text start */}
      <span
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--color-text)',
        }}
      >
        I&rsquo;m an enthused
      </span>

      {/* 12px gap */}
      <div style={{ width: 12 }} />

      {/* Role roller */}
      <RoleRoller fontSize={24} />

      {/* 8px gap */}
      <div style={{ width: 8 }} />

      {/* Static text end */}
      <span
        style={{
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--color-text)',
        }}
      >
        from Texas!
      </span>
    </div>
  );
}

// -- Mobile chevron with bounce and drag --
function MobileChevron({
  onDragStart,
  onDragProgress,
  onDragCommit,
  onDragCancel,
  onTap,
}: MobileChevronProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const dragProgressRef = useRef(0);
  const suppressClickRef = useRef(false);

  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setDragOffset(0);
    dragProgressRef.current = 0;
    suppressClickRef.current = false;
    dragStartRef.current = clientX;
    dragStartTimeRef.current = Date.now();
    onDragStart();
  }, [onDragStart]);

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const delta = clientX - dragStartRef.current;
      const progress = clamp(delta / CHAT_DRAG_DISTANCE);
      dragProgressRef.current = progress;
      setDragOffset(progress * 12);
      onDragProgress(progress);
    },
    [isDragging, onDragProgress]
  );

  const handleDragEnd = useCallback(
    (clientX: number) => {
      if (!isDragging) return;

      const delta = clientX - dragStartRef.current;
      const elapsed = Math.max((Date.now() - dragStartTimeRef.current) / 1000, 0.016); // seconds
      const velocity = delta / elapsed; // px/s
      const progress = dragProgressRef.current;

      suppressClickRef.current = Math.abs(delta) > 6;
      if (progress >= CHAT_COMMIT_PROGRESS || (delta > 20 && velocity > CHAT_COMMIT_VELOCITY)) {
        onDragCommit(progress);
      } else {
        onDragCancel(progress);
      }

      setIsDragging(false);
      setDragOffset(0);
    },
    [isDragging, onDragCancel, onDragCommit]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      handleDragMove(e.clientX);
    },
    [handleDragMove]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      handleDragEnd(e.clientX);
    },
    [handleDragEnd]
  );

  return (
    <button
      type="button"
      style={{
        transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 300ms ease',
        cursor: 'grab',
        padding: 12,
        touchAction: 'none',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Open chat"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        onDragCancel(dragProgressRef.current);
        setIsDragging(false);
        setDragOffset(0);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onTap();
      }}
    >
      <span className={isDragging ? '' : 'animate-arrow-bounce'}>
        <IoChevronForwardSharp
          data-testid="mobile-chat-chevron-icon"
          data-direction="right"
          size={18}
          style={{ color: 'var(--color-arrow-icon)' }}
        />
      </span>
    </button>
  );
}

// -- Mobile "What Defines me?" text with wave shimmer --
function MobileDefinesText({ showAnimations }: { showAnimations: boolean }) {
  if (showAnimations) {
    // Wave shimmer effect using CSS background-clip: text
    return (
      <span
        className="animate-wave-shimmer"
        style={{
          fontSize: 20,
          color: 'transparent',
          background:
            'linear-gradient(90deg, var(--color-text) 0%, var(--color-text) 30%, rgba(128,128,128,0.3) 50%, var(--color-text) 70%, var(--color-text) 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          backgroundSize: '200% 100%',
          whiteSpace: 'nowrap',
        }}
      >
        What <span style={{ fontWeight: 700 }}>Defines</span> me?
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: 20,
        fontWeight: 400,
        color: 'var(--color-text)',
        whiteSpace: 'nowrap',
      }}
    >
      What <span style={{ fontWeight: 700 }}>Defines</span> me?
    </span>
  );
}

// -- Mobile Layout --
function MobileScrollingText() {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';
  const legacyTheme = getLegacyChatTheme(isDark);
  const { voiceActive, voiceProps, micDenied, openVoice } = useVoiceSession();
  const [chatDrag, setChatDrag] = useState({
    active: false,
    animating: false,
    durationMs: CHAT_OPEN_DURATION_MS,
    progress: 0,
  });
  const progressRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const setProgress = useCallback((progress: number, animating = false, durationMs = CHAT_OPEN_DURATION_MS) => {
    const nextProgress = clamp(progress);
    progressRef.current = nextProgress;
    setChatDrag({
      active: nextProgress > 0.001 || animating,
      animating,
      durationMs,
      progress: nextProgress,
    });
  }, []);

  const ensureVoiceOpen = useCallback(() => {
    if (!voiceActive) openVoice();
  }, [openVoice, voiceActive]);

  const animateTo = useCallback(
    (target: number, durationMs: number, onComplete?: () => void) => {
      clearTimers();

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setProgress(target, false, durationMs);
        if (target <= 0) setProgress(0, false, durationMs);
        onComplete?.();
        return;
      }

      setProgress(target, true, durationMs);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setProgress(target, false, durationMs);
        if (target <= 0) setProgress(0, false, durationMs);
        onComplete?.();
      }, durationMs);
    },
    [clearTimers, setProgress]
  );

  const handleDragStart = useCallback(() => {
    clearTimers();
    setProgress(progressRef.current, false);
  }, [clearTimers, setProgress]);

  const handleDragProgress = useCallback(
    (progress: number) => {
      clearTimers();
      setProgress(progress, false);
    },
    [clearTimers, setProgress]
  );

  const handleDragCommit = useCallback(
    (progress: number) => {
      ensureVoiceOpen();
      setProgress(progress, false);
      animateTo(1, CHAT_OPEN_DURATION_MS, () => {
        router.push('/chat');
      });
    },
    [animateTo, ensureVoiceOpen, router, setProgress]
  );

  const handleDragCancel = useCallback(
    (progress: number) => {
      if (progress <= 0.001) {
        setProgress(0, false, CHAT_CANCEL_DURATION_MS);
        return;
      }
      setProgress(progress, false, CHAT_CANCEL_DURATION_MS);
      animateTo(0, CHAT_CANCEL_DURATION_MS);
    },
    [animateTo, setProgress]
  );

  const handleTap = useCallback(() => {
    ensureVoiceOpen();
    clearTimers();
    setProgress(0, false, CHAT_OPEN_DURATION_MS);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      animateTo(1, CHAT_OPEN_DURATION_MS, () => {
        router.push('/chat');
      });
    });
  }, [animateTo, clearTimers, ensureVoiceOpen, router, setProgress]);

  useEffect(() => {
    const homeMain = document.querySelector('main.bg-gradient-main') as HTMLElement | null;
    if (!homeMain) return;

    if (pathname !== '/' || (!chatDrag.active && chatDrag.progress <= 0.001)) {
      homeMain.style.transform = '';
      homeMain.style.transition = '';
      homeMain.style.willChange = '';
      return;
    }

    homeMain.style.transform = `translateX(${(chatDrag.progress * CHAT_HOME_SHIFT_VW).toFixed(3)}vw)`;
    homeMain.style.transition = chatDrag.animating
      ? `transform ${chatDrag.durationMs}ms ${CHAT_SLIDE_EASING}`
      : 'none';
    homeMain.style.willChange = 'transform';
  }, [chatDrag, pathname]);

  useEffect(() => {
    if (pathname !== '/' && chatDrag.progress > 0.001) {
      setProgress(0, false);
    }
  }, [chatDrag.progress, pathname, setProgress]);

  useEffect(() => {
    return () => {
      clearTimers();
      const homeMain = document.querySelector('main.bg-gradient-main') as HTMLElement | null;
      if (!homeMain) return;
      homeMain.style.transform = '';
      homeMain.style.transition = '';
      homeMain.style.willChange = '';
    };
  }, [clearTimers]);

  const voiceStateLabel = MOBILE_VOICE_STATE_LABELS[voiceProps.state] ?? 'Ready';
  const voiceCaption = micDenied
    ? 'Mic access blocked'
    : voiceProps.transcript || voiceProps.caption || voiceStateLabel;
  const previewTransform = `translate3d(${(-100 + chatDrag.progress * 100).toFixed(3)}vw, 0, 0)`;
  const previewActive = pathname === '/' && mounted && (chatDrag.active || chatDrag.progress > 0.001);

  return (
    <>
      <div
        className="grid items-center"
        style={{
          width: '100vw',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          gridTemplateColumns: 'auto minmax(0, 1fr)',
          columnGap: 8,
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(24px, env(safe-area-inset-right))',
        }}
      >
        {/* Left side: Rotated "What Defines me?" text + arrow */}
        <div className="flex min-w-0 items-center">
          {/* Rotated text */}
          <div
            className="flex shrink-0 items-center justify-center overflow-visible"
            style={{
              width: 52,
              height: ROLLER_HEIGHT,
            }}
          >
            <div
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center center',
                whiteSpace: 'nowrap',
              }}
            >
              <MobileDefinesText showAnimations />
            </div>
          </div>

          <div className="shrink-0" style={{ marginLeft: 4 }}>
            <MobileChevron
              onDragStart={handleDragStart}
              onDragProgress={handleDragProgress}
              onDragCommit={handleDragCommit}
              onDragCancel={handleDragCancel}
              onTap={handleTap}
            />
          </div>
        </div>

        {/* Right side: Role roller */}
        <div className="min-w-0 justify-self-end">
          <RoleRoller
            fontSize="clamp(17px, 5.2vw, 22px)"
            width="clamp(152px, 52vw, 210px)"
            testId="mobile-home-role-roller"
          />
        </div>
      </div>

      {previewActive && createPortal(
        <div
          aria-hidden="true"
          data-testid="mobile-chat-drag-preview"
          data-progress={chatDrag.progress.toFixed(3)}
          className="fixed inset-0 z-[70] overflow-hidden pointer-events-none"
          style={{
            transform: previewTransform,
            transition: chatDrag.animating
              ? `transform ${chatDrag.durationMs}ms ${CHAT_SLIDE_EASING}`
              : 'none',
            willChange: 'transform',
          }}
        >
          <div
            data-testid="mobile-parz-chat-preview"
            className="h-dvh overflow-hidden relative"
            style={{ backgroundColor: legacyTheme.surface }}
          >
            <MobileParzVoiceScreen
              isDark={isDark}
              legacyTheme={legacyTheme}
              voiceState={voiceProps.state}
              caption={voiceCaption}
              micDenied={micDenied}
              interactive={false}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// -- Main ScrollingText Component --
export function ScrollingText({ isMobile }: ScrollingTextProps) {
  if (isMobile) {
    return <MobileScrollingText />;
  }
  return <DesktopScrollingText />;
}
