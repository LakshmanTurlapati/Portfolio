'use client';

import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { useMounted } from '@/hooks/use-mounted';
import { PortfolioButton } from '@/components/portfolio-button';
import { useTransition } from '@/providers/transition-provider';

const SOCIAL_LINKS = [
  { icon: FaGithub, url: 'https://github.com/LakshmanTurlapati', label: 'GitHub profile' },
  { icon: FaLinkedin, url: 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/', label: 'LinkedIn profile' },
  { icon: FaXTwitter, url: 'https://x.com/parzival1213', label: 'X (Twitter) profile' },
] as const;

export function MobileNavbar() {
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
      className="fixed h-[70px] rounded-[25px] z-50 flex items-center overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      style={{
        backgroundColor: 'var(--color-navbar-bg)',
        left: 'max(14px, env(safe-area-inset-left))',
        right: 'max(14px, env(safe-area-inset-right))',
        bottom: 'max(20px, env(safe-area-inset-bottom))',
        border: isDark ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(18px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
      }}
    >
      <div className="w-full h-[70px] flex items-center flex-shrink-0 px-1">
        {/* Left: Portfolio button with image */}
        <PortfolioButton variant="mobile" isDark={isDark} />

        {/* Center: About Me link */}
        <div className="flex-[3] flex items-center justify-center">
          <button
            onClick={handleAboutClick}
            className="min-h-11 px-1 text-[clamp(13px,3.8vw,16px)] font-bold leading-none no-underline cursor-pointer border-none bg-transparent whitespace-nowrap"
            style={{ color: 'var(--color-navbar-text)' }}
          >
            About Me
          </button>
        </div>

        {/* Right: Social icons */}
        <div className="flex-[3] flex items-center justify-center gap-[3px] min-w-0">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex h-11 w-9 min-w-9 items-center justify-center"
              style={{ color: 'var(--color-social-icon)' }}
            >
              <link.icon style={{ fontSize: 'clamp(16px, 4.6vw, 20px)' }} />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
