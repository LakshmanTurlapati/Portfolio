'use client';

import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { useMounted } from '@/hooks/use-mounted';
import { PortfolioButton } from '@/components/portfolio-button';
import { AskParzButton } from '@/components/ask-parz-button';
import { useTransition } from '@/providers/transition-provider';
import { VoicePanel, type VoicePanelProps } from '@/components/voice-panel';

// VoiceNavProps is VoicePanelProps minus the fields the navbar injects itself (isDark, micDenied)
type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;

const SOCIAL_LINKS = [
  { icon: FaGithub, url: 'https://github.com/LakshmanTurlapati', label: 'GitHub profile' },
  { icon: FaLinkedin, url: 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/', label: 'LinkedIn profile' },
  { icon: FaXTwitter, url: 'https://x.com/parzival1213', label: 'X (Twitter) profile' },
] as const;

interface MobileNavbarProps {
  onAskParz: () => void;
  voiceActive?: boolean;
  voiceProps?: VoiceNavProps;
  micDenied?: boolean;
}

export function MobileNavbar({ onAskParz, voiceActive, voiceProps, micDenied }: MobileNavbarProps) {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { navigateWithReveal } = useTransition();

  const handleAboutClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      navigateWithReveal('/about', originX, originY);
    },
    [navigateWithReveal]
  );

  if (!mounted) {
    // SSR placeholder matching mobile navbar dimensions.
    // Bottom uses max(20px, safe-area-inset-bottom) so iOS notched devices
    // don't have the home indicator overlap the navbar.
    return (
      <div
        className="fixed left-[20px] right-[20px] h-[70px] rounded-[25px] z-50"
        style={{ bottom: 'max(20px, env(safe-area-inset-bottom))' }}
      />
    );
  }

  return (
    <nav
      data-testid="mobile-navbar"
      data-chat-morph-origin={voiceActive ? 'true' : undefined}
      className={`fixed rounded-[25px] z-50 flex flex-col items-center overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.22)] ${voiceActive ? 'h-[140px]' : 'h-[70px]'}`}
      style={{
        backgroundColor: 'var(--color-navbar-bg)',
        left: 'max(14px, env(safe-area-inset-left))',
        right: 'max(14px, env(safe-area-inset-right))',
        bottom: 'max(20px, env(safe-area-inset-bottom))',
        border: isDark ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(18px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
        transition: 'height 0.45s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Default content row (h-[70px]) — fades out when voice mode is active */}
      <div
        className="w-full h-[70px] flex items-center flex-shrink-0 px-1"
        style={{
          opacity: voiceActive ? 0 : 1,
          pointerEvents: voiceActive ? 'none' : 'auto',
          transition: 'opacity 0.25s ease',
        }}
      >
        {/* Left (flex: 2): Portfolio button with image */}
        <PortfolioButton variant="mobile" isDark={isDark} />

        {/* Center (flex: 2): About Me link */}
        <div className="flex-[2] flex items-center justify-center">
          <button
            onClick={handleAboutClick}
            className="min-h-11 px-1 text-[clamp(13px,3.8vw,16px)] font-bold leading-none no-underline cursor-pointer border-none bg-transparent whitespace-nowrap"
            style={{ color: 'var(--color-navbar-text)' }}
          >
            About Me
          </button>
        </div>

        {/* Ask Parz button (flex: 2) — mobile variant uses static positioning so
            it sits inside its flex slot instead of escaping to desktop coords. */}
        <div className="flex-[2] flex items-center justify-center">
          <AskParzButton isDark={isDark} onClick={onAskParz} variant="mobile" />
        </div>

        {/* Right (flex: 3): Social icons */}
        <div className="flex-[3] flex items-center justify-center gap-[2px] min-w-0">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex h-11 w-8 min-w-8 items-center justify-center"
              style={{ color: 'var(--color-social-icon)' }}
            >
              <link.icon style={{ fontSize: 'clamp(12px, 3vw, 18px)' }} />
            </a>
          ))}
        </div>
      </div>

      {/* Voice capsule area — visible when voice mode is active */}
      {voiceActive && voiceProps && (
        <div className="w-full flex-1 relative">
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied ?? false} compact />
        </div>
      )}
    </nav>
  );
}
