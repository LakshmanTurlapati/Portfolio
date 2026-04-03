'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { useMounted } from '@/hooks/use-mounted';
import { PortfolioButton } from '@/components/portfolio-button';

const SOCIAL_LINKS = [
  { icon: FaGithub, url: 'https://github.com/LakshmanTurlapati', label: 'GitHub profile' },
  { icon: FaLinkedin, url: 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/', label: 'LinkedIn profile' },
  { icon: FaXTwitter, url: 'https://x.com/parzival1213', label: 'X (Twitter) profile' },
] as const;

export function MobileNavbar() {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
      className="fixed bottom-[20px] left-[20px] right-[20px] h-[70px] rounded-[25px] z-50 flex items-center"
      style={{ backgroundColor: 'var(--color-navbar-bg)' }}
    >
      {/* Left (flex: 2): Portfolio button with image */}
      <PortfolioButton variant="mobile" isDark={isDark} />

      {/* Center (flex: 2): About Me link */}
      <div className="flex-[2] flex items-center justify-center">
        <Link
          href="/about"
          className="text-[16px] font-bold no-underline"
          style={{ color: 'var(--color-navbar-text)' }}
        >
          About Me
        </Link>
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
    </nav>
  );
}
