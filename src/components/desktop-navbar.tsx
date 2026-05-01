'use client';

import { useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { useMounted } from '@/hooks/use-mounted';
import { PortfolioButton } from '@/components/portfolio-button';
import { AskParzButton } from '@/components/ask-parz-button';
import { useTransition } from '@/providers/transition-provider';
import {
  getAboutBackButtonRect,
  rectFromDomRect,
  startAboutButtonMorph,
  storeDesktopHomeAboutButtonRect,
} from '@/lib/portfolio-button-morph';
import gsap from 'gsap';
import { Flip } from 'gsap/all';
import { useGSAP } from '@gsap/react';
import { VoicePanel, type VoicePanelProps } from '@/components/voice-panel';

gsap.registerPlugin(Flip);

// VoiceNavProps is VoicePanelProps minus the fields the navbar injects itself (isDark, micDenied)
type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;

const SOCIAL_LINKS = [
  { icon: FaGithub, url: 'https://github.com/LakshmanTurlapati', label: 'GitHub profile' },
  { icon: FaLinkedin, url: 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/', label: 'LinkedIn profile' },
  { icon: FaXTwitter, url: 'https://x.com/parzival1213', label: 'X (Twitter) profile' },
] as const;

interface DesktopNavbarProps {
  onAskParz: () => void;
  voiceActive?: boolean;
  voiceProps?: VoiceNavProps;
  micDenied?: boolean;
}

export function DesktopNavbar({ onAskParz, voiceActive, voiceProps, micDenied }: DesktopNavbarProps) {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { navigateWithReveal } = useTransition();
  const navRef = useRef<HTMLElement>(null);

  const handleAboutClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const sourceRect = rectFromDomRect(rect);

      storeDesktopHomeAboutButtonRect(sourceRect);
      startAboutButtonMorph({
        from: sourceRect,
        to: getAboutBackButtonRect(window.innerWidth),
        direction: 'open',
      });
      navigateWithReveal('/about', originX, originY);
    },
    [navigateWithReveal]
  );

  // GSAP Flip morph: capture layout state before toggling voice-active class, then animate
  // Per D-12: 760×72px voice-active capsule, Flip.from() animates from previous state
  // Per D-24: prefers-reduced-motion jumps directly to final state without animation
  useGSAP(
    () => {
      if (!navRef.current) return;
      // Check prefers-reduced-motion
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        // Jump-cut: just toggle class, no animation (per D-24)
        navRef.current.classList.toggle('voice-active', !!voiceActive);
        return;
      }
      const state = Flip.getState(navRef.current);
      navRef.current.classList.toggle('voice-active', !!voiceActive);
      Flip.from(state, {
        duration: 0.45,
        ease: 'power2.out',
        scale: false,
      });
    },
    { dependencies: [voiceActive], scope: navRef }
  );

  if (!mounted) {
    // SSR placeholder matching navbar dimensions
    return (
      <div
        className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[630px] h-[60px] rounded-[25px] z-50"
      />
    );
  }

  return (
    <nav
      ref={navRef}
      data-chat-morph-origin={voiceActive ? 'true' : undefined}
      className={`fixed top-[10px] left-1/2 -translate-x-1/2 rounded-[25px] z-50 flex items-center relative overflow-hidden ${voiceActive ? 'w-[760px] h-[72px]' : 'w-[630px] h-[60px]'}`}
      style={{
        backgroundColor: 'var(--color-navbar-bg)',
        transition: 'width 0.45s cubic-bezier(.22,1,.36,1), height 0.45s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Default navbar content — hidden when voice mode is active */}
      <div
        className="absolute inset-0 flex items-center"
        style={{
          opacity: voiceActive ? 0 : 1,
          pointerEvents: voiceActive ? 'none' : 'auto',
          transition: 'opacity 0.25s ease',
        }}
      >
        {/* Left: Portfolio button */}
        <PortfolioButton variant="desktop" isDark={isDark} />

        {/* Center: About Me link */}
        <div className="flex-1 flex items-center justify-center">
          <button
            data-about-morph-source="true"
            onClick={handleAboutClick}
            className="text-[16px] font-bold no-underline cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--color-navbar-text)' }}
          >
            About Me
          </button>
        </div>

        {/* Ask Parz button */}
        <AskParzButton isDark={isDark} onClick={onAskParz} />

        {/* Right: Social icons */}
        <div className="flex items-center gap-[8px] pr-[12px]">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex items-center justify-center"
              style={{ color: 'var(--color-social-icon)' }}
            >
              <link.icon size={17} />
            </a>
          ))}
        </div>
      </div>

      {/* Voice panel content — shown when voice mode is active */}
      {voiceActive && voiceProps && (
        <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied ?? false} />
      )}
    </nav>
  );
}
