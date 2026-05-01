'use client';

import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { AuthorName } from '@/components/author-name';
import { DotMatrix } from '@/components/dot-matrix';
import { MobileNavbar } from '@/components/mobile-navbar';
import { ParticleBackground } from '@/components/particle-background';
import { ScrollingText } from '@/components/scrolling-text';
import { SpotlightEffect } from '@/components/spotlight';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/cn';

interface MobileHomeSceneProps {
  children?: ReactNode;
  className?: string;
  dataProgress?: string;
  hideNavbar?: boolean;
  inert?: boolean;
  onChromeClick?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
  testId?: string;
}

export function MobileHomeScene({
  children,
  className,
  dataProgress,
  hideNavbar = false,
  inert = false,
  onChromeClick,
  style,
  testId = 'mobile-home-scene',
}: MobileHomeSceneProps) {
  return (
    <main
      aria-hidden={inert || undefined}
      data-progress={dataProgress}
      data-testid={testId}
      inert={inert || undefined}
      className={cn('bg-gradient-main min-h-screen relative overflow-hidden', className)}
      style={style}
    >
      <ParticleBackground />

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <div
          style={{ marginTop: '-80px' }}
          className="pointer-events-auto"
        >
          <ScrollingText isMobile />
        </div>
      </div>

      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ zIndex: 30, bottom: '140px' }}
      >
        <DotMatrix isMobile />
      </div>

      <div
        className="sm:hidden"
        style={{
          opacity: hideNavbar ? 0 : 1,
          pointerEvents: hideNavbar ? 'none' : 'auto',
          transition: hideNavbar ? 'none' : 'opacity 120ms ease',
        }}
        onClick={onChromeClick}
      >
        <MobileNavbar />
      </div>

      <SpotlightEffect />

      <div
        className="sm:hidden fixed right-5 z-40"
        style={{ top: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
        <ThemeToggle />
      </div>

      <div
        className="sm:hidden fixed left-5 z-40"
        style={{ top: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
        <AuthorName variant="mobile" />
      </div>

      {children}
    </main>
  );
}
