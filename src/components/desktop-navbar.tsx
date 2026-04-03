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

export function DesktopNavbar() {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { navigateWithReveal } = useTransition();

  const handleAboutClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Use the center of the navbar as origin (matching Flutter behavior)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      navigateWithReveal('/about', originX, originY);
    },
    [navigateWithReveal]
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
      className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[630px] h-[60px] rounded-[25px] z-50 flex items-center"
      style={{ backgroundColor: 'var(--color-navbar-bg)' }}
    >
      {/* Left: Portfolio button */}
      <PortfolioButton variant="desktop" isDark={isDark} />

      {/* Center: About Me link */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={handleAboutClick}
          className="text-[16px] font-bold no-underline cursor-pointer border-none bg-transparent"
          style={{ color: 'var(--color-navbar-text)' }}
        >
          About Me
        </button>
      </div>

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
    </nav>
  );
}
