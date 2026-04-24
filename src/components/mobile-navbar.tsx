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
    // SSR placeholder matching mobile navbar dimensions
    return (
      <div
        className="fixed bottom-[20px] left-[20px] right-[20px] h-[70px] rounded-[25px] z-50"
      />
    );
  }

  return (
    <nav
      className={`fixed bottom-[20px] left-[20px] right-[20px] rounded-[25px] z-50 flex flex-col items-center relative overflow-hidden ${voiceActive ? 'h-[140px]' : 'h-[70px]'}`}
      style={{
        backgroundColor: 'var(--color-navbar-bg)',
        transition: 'height 0.45s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Default content row (h-[70px]) — fades out when voice mode is active */}
      <div
        className="w-full h-[70px] flex items-center flex-shrink-0"
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
            className="text-[16px] font-bold no-underline cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--color-navbar-text)' }}
          >
            About Me
          </button>
        </div>

        {/* Ask Parz button (flex: 2) */}
        <div className="flex-[2] flex items-center justify-center">
          <AskParzButton isDark={isDark} onClick={onAskParz} />
        </div>

        {/* Right (flex: 3): Social icons */}
        <div className="flex-[3] flex items-center justify-center gap-[8px]">
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
              <link.icon style={{ fontSize: 'clamp(12px, 3vw, 18px)' }} />
            </a>
          ))}
        </div>
      </div>

      {/* Voice capsule area — visible when voice mode is active */}
      {voiceActive && voiceProps && (
        <div className="w-full flex-1 relative">
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied ?? false} />
        </div>
      )}
    </nav>
  );
}
