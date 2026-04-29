'use client';

import type { CSSProperties } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowForwardSharp } from 'react-icons/io5';

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

interface ScrollingTextProps {
  isMobile: boolean;
  clickCount?: number; // for mobile arrow visibility (appears when > 0)
}

// -- Role Roller (shared between desktop and mobile) --
function RoleRoller({ fontSize }: { fontSize: number }) {
  const trackStyle = {
    '--role-roller-start': `${ROLE_CENTER_OFFSET - ROLE_SET_HEIGHT}px`,
    '--role-roller-distance': `${ROLE_SET_HEIGHT}px`,
    '--role-roller-duration': `${ROLES.length}s`,
  } as CSSProperties;

  return (
    <div
      className="scroll-roller-mask overflow-hidden"
      style={{ height: ROLLER_HEIGHT, width: ROLLER_WIDTH }}
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

// -- Mobile Arrow with bounce and drag --
function MobileArrow({ onNavigate }: { onNavigate: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(0);
  const dragStartTimeRef = useRef(0);

  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setDragOffset(0);
    dragStartRef.current = clientX;
    dragStartTimeRef.current = Date.now();
  }, []);

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const delta = clientX - dragStartRef.current;
      // Only allow dragging to the right
      setDragOffset(Math.max(0, delta));
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(
    (clientX: number) => {
      if (!isDragging) return;

      const delta = clientX - dragStartRef.current;
      const elapsed = (Date.now() - dragStartTimeRef.current) / 1000; // seconds
      const velocity = Math.abs(delta) / elapsed; // px/s

      // Check if drag exceeds threshold (50% of 300px = 150px, or velocity > 300px/s)
      const progress = delta / 300;
      if (progress > 0.5 || velocity > 300) {
        onNavigate();
      }

      setIsDragging(false);
      setDragOffset(0);
    },
    [isDragging, onNavigate]
  );

  // Touch event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientX);
    },
    [handleDragStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientX);
    },
    [handleDragMove]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      handleDragEnd(e.changedTouches[0].clientX);
    },
    [handleDragEnd]
  );

  // Mouse event handlers (for testing)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX);
    },
    [handleDragMove]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      handleDragEnd(e.clientX);
    },
    [handleDragEnd]
  );

  return (
    <div
      className={isDragging ? '' : 'animate-arrow-bounce'}
      style={{
        transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 300ms ease',
        cursor: 'grab',
        padding: 12,
        touchAction: 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={() => {
        if (!isDragging) onNavigate();
      }}
    >
      <IoArrowForwardSharp
        size={18}
        style={{ color: 'var(--color-arrow-icon)' }}
      />
    </div>
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
function MobileScrollingText({ clickCount = 0 }: { clickCount: number }) {
  const router = useRouter();
  const [showAnimations, setShowAnimations] = useState(false);
  const prevClickCountRef = useRef(clickCount);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevCount = prevClickCountRef.current;
    prevClickCountRef.current = clickCount;

    // Check if click count changed from 0 to > 0
    if (prevCount === 0 && clickCount > 0) {
      setShowAnimations(false);
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
      delayTimerRef.current = setTimeout(() => {
        setShowAnimations(true);
      }, 2000);
    } else if (clickCount === 0) {
      // If count goes back to 0, immediately hide animations
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
      setShowAnimations(false);
    } else if (clickCount > 0 && prevCount > 0) {
      // If count was already > 0 and still > 0, keep showing
      setShowAnimations(true);
    }
  }, [clickCount]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, []);

  const handleNavigate = useCallback(() => {
    router.push('/chat');
  }, [router]);

  return (
    <div className="flex items-center w-full">
      {/* Left side: Rotated "What Defines me?" text + arrow */}
      <div style={{ paddingLeft: 20 }} className="flex items-center">
        {/* Rotated text */}
        <div
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
          }}
        >
          <MobileDefinesText showAnimations={showAnimations} />
        </div>

        {/* Arrow (shows when clickCount > 0, after 2s delay) */}
        {showAnimations && (
          <div style={{ marginLeft: 12 }}>
            <MobileArrow onNavigate={handleNavigate} />
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Role roller */}
      <div style={{ paddingRight: 20 }}>
        <RoleRoller fontSize={22} />
      </div>
    </div>
  );
}

// -- Main ScrollingText Component --
export function ScrollingText({ isMobile, clickCount = 0 }: ScrollingTextProps) {
  if (isMobile) {
    return <MobileScrollingText clickCount={clickCount} />;
  }
  return <DesktopScrollingText />;
}
