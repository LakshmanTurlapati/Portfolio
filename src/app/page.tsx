'use client';

import { useState, useCallback, useEffect, type MouseEvent } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMounted } from '@/hooks/use-mounted';
import { DesktopNavbar } from '@/components/desktop-navbar';
import { ChatPopup } from '@/components/chat-popup';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthorName } from '@/components/author-name';
import { ParticleBackground } from '@/components/particle-background';

import { DotMatrix } from '@/components/dot-matrix';
import { RotatingCircularText } from '@/components/rotating-circular-text';
import { SpotlightEffect } from '@/components/spotlight';
import { ScrollingText } from '@/components/scrolling-text';
import { GitHubStats } from '@/components/github-stats';
import { useTheme } from 'next-themes';
import { useVoiceSession } from '@/providers/voice-session-provider';
import type { GitHubActivity } from '@/lib/github-activity';
import type { ChatMorphRect, ChatVoiceSnapshot, OpenTextChatDetail } from '@/lib/chat-morph';

export default function Home() {
  const [clickCount, setClickCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatOriginRect, setChatOriginRect] = useState<ChatMorphRect | undefined>();
  const [chatVoiceSnapshot, setChatVoiceSnapshot] = useState<ChatVoiceSnapshot | undefined>();
  const [hideNavbarForChatMorph, setHideNavbarForChatMorph] = useState(false);
  const [githubActivity, setGithubActivity] = useState<GitHubActivity | null>(null);
  const [githubActivityError, setGithubActivityError] = useState(false);
  const isMobile = useMediaQuery('(max-width: 599px)');
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';
  const { voiceActive, voiceProps, micDenied, openVoice, closeVoice } = useVoiceSession();
  const githubActivityLoading = !githubActivity && !githubActivityError;

  // Per D-06 + Pattern 3 (RESEARCH.md): receive parz:open-text-chat signal from VoiceSessionProvider.openTextChat
  // when user says "switch to text" on a non-home page — navigates home first, then this listener fires.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OpenTextChatDetail>).detail;
      setChatOriginRect(detail?.originRect);
      setChatVoiceSnapshot(detail?.voiceSnapshot);
      setHideNavbarForChatMorph(Boolean(detail?.originRect));
      setChatOpen(true);
    };
    window.addEventListener('parz:open-text-chat', handler);
    return () => window.removeEventListener('parz:open-text-chat', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/github-stats')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GitHub stats request failed: ${response.status}`);
        }

        return response.json() as Promise<GitHubActivity>;
      })
      .then((activity) => {
        if (cancelled) {
          return;
        }

        setGithubActivity(activity);
        setGithubActivityError(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setGithubActivity(null);
        setGithubActivityError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // AskParz button toggles voice mode (per D-16 integration)
  const handleAskParz = useCallback(() => {
    if (voiceActive) {
      closeVoice();
    } else {
      openVoice();
    }
  }, [voiceActive, openVoice, closeVoice]);

  const handleChatClose = useCallback(() => {
    setChatOpen(false);
    setChatOriginRect(undefined);
    setChatVoiceSnapshot(undefined);
    setHideNavbarForChatMorph(false);
  }, []);

  const handleChatOpenAnimationComplete = useCallback(() => {
    setHideNavbarForChatMorph(false);
  }, []);

  const handleHomeChromeClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-parz-btn]')) return;
    setClickCount((prev) => prev + 1);
  }, []);

  if (!mounted) {
    // SSR placeholder - render minimal structure to prevent hydration mismatch
    return <main className="bg-gradient-main min-h-screen relative overflow-hidden" />;
  }

  const chatPopup = chatOpen ? (
    <ChatPopup
      isDark={isDark}
      onClose={handleChatClose}
      originRect={chatOriginRect}
      voiceSnapshot={chatVoiceSnapshot}
      onOpenAnimationComplete={handleChatOpenAnimationComplete}
    />
  ) : null;

  if (isMobile) {
    return (
      <>
        <main
          aria-hidden="true"
          data-testid="mobile-home-route-shell"
          inert
          className="bg-gradient-main h-dvh min-h-screen overflow-hidden"
          style={{ pointerEvents: 'none', visibility: 'hidden' }}
        />
        {chatPopup}
      </>
    );
  }

  return (
    <main className="bg-gradient-main min-h-screen relative overflow-hidden">
      {/* Layer 1: z-1 -- Particle Background (particles.js connected mesh) */}
      <ParticleBackground />

      {/* Layer 2: z-20 -- Scrolling Text (focal point) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <div
          style={{ marginTop: isMobile ? '-80px' : '-40px' }}
          className="pointer-events-auto"
        >
          <ScrollingText isMobile={isMobile} clickCount={clickCount} />
        </div>
      </div>

      {/* Layer 5: z-25 -- Rotating Circular Text (desktop only, conditional) */}
      {!isMobile && (
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 25,
            left: 'calc(50% - 270px - 1vw)',
            top: 'calc(10px - 5vh)',
          }}
        >
          <RotatingCircularText visible={clickCount === 1} />
        </div>
      )}

      {/* Layer 6: z-30 -- Dot Matrix */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{
          zIndex: 30,
          bottom: isMobile ? '140px' : '160px',
        }}
      >
        <DotMatrix isMobile={isMobile} />
      </div>

      {/* Layer 7: z-30/z-50 -- Navbar */}
      {/* Desktop navbar: visible >= 600px */}
      <div
        className="hidden sm:block"
        style={{
          opacity: hideNavbarForChatMorph ? 0 : 1,
          pointerEvents: hideNavbarForChatMorph ? 'none' : 'auto',
          transition: hideNavbarForChatMorph ? 'none' : 'opacity 120ms ease',
        }}
        onClick={handleHomeChromeClick}
      >
        <DesktopNavbar
          onAskParz={handleAskParz}
          voiceActive={voiceActive}
          voiceProps={voiceProps}
          micDenied={micDenied}
        />
      </div>

      {/* Layer 8: z-30 -- GitHub Stats */}
      {!isMobile && (
        <GitHubStats
          isDark={isDark}
          activity={githubActivity}
          isLoading={githubActivityLoading}
          hasError={githubActivityError}
        />
      )}

      {/* Layer 9: z-35 -- Spotlight */}
      <SpotlightEffect />

      {/* Layer 10: z-40 -- Theme Toggle */}
      {/* Desktop: bottom-left */}
      <div className="hidden sm:block fixed bottom-5 left-5 z-40">
        <ThemeToggle />
      </div>

      {/* Layer 11: z-40 -- Author Name */}
      {/* Desktop: bottom-right */}
      <div className="hidden sm:block fixed bottom-5 right-[30px] z-40">
        <AuthorName variant="desktop" />
      </div>

      {/* Layer 12: z-40/z-50 -- Chat Popup (gated on mount to avoid hydration mismatch) */}
      {chatPopup}
    </main>
  );
}
