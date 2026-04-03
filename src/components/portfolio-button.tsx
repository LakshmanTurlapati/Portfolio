'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/cn';

interface PortfolioButtonProps {
  variant: 'desktop' | 'mobile';
  isDark: boolean;
  className?: string;
}

export function PortfolioButton({ variant, isDark, className }: PortfolioButtonProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const isDesktop = variant === 'desktop';

  // Animated gradient glow with 3 rotating box-shadows
  useEffect(() => {
    const angleRef = { current: 0 };
    let frameId: number;

    const animate = () => {
      angleRef.current += (2 * Math.PI) / (3 * 60);
      const t = angleRef.current;
      const r = 4;

      const shadows = [
        `${r * Math.cos(t)}px ${r * Math.sin(t)}px 18px 1px rgba(0, 43, 255, 0.4)`,
        `${r * Math.cos(t + 2.094)}px ${r * Math.sin(t + 2.094)}px 18px 1px rgba(0, 255, 204, 0.4)`,
        `${r * Math.cos(t + 4.189)}px ${r * Math.sin(t + 4.189)}px 18px 1px rgba(255, 74, 213, 0.4)`,
      ].join(', ');

      if (glowRef.current) {
        glowRef.current.style.boxShadow = shadows;
      }
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (isDesktop) {
    return (
      <div
        ref={glowRef}
        className={cn(
          'w-[200px] h-full rounded-[25px] flex items-center justify-center',
          className
        )}
      >
        <Link
          href="/portfolio"
          className="flex items-center justify-center w-[95%] h-[80%] rounded-[20px] no-underline"
          style={{ backgroundColor: 'var(--color-portfolio-btn-bg)' }}
        >
          <span
            className="text-[18px] font-semibold"
            style={{ color: 'var(--color-portfolio-btn-text)' }}
          >
            Portfolio
          </span>
        </Link>
      </div>
    );
  }

  // Mobile variant -- uses image instead of text
  return (
    <div
      ref={glowRef}
      className={cn(
        'flex-[2] h-full rounded-[25px] flex items-center justify-center',
        className
      )}
    >
      <Link
        href="/portfolio"
        className="flex items-center justify-center w-[90%] h-[80%] rounded-[20px] no-underline"
        style={{ backgroundColor: 'var(--color-portfolio-btn-bg)' }}
      >
        <Image
          src={isDark ? '/icons/portfolio_light.png' : '/icons/portfolio.png'}
          alt="Portfolio"
          width={112}
          height={28}
          className="scale-[1.4]"
          priority
        />
      </Link>
    </div>
  );
}
