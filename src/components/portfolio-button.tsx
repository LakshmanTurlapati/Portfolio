'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import { useTransition } from '@/providers/transition-provider';

interface PortfolioButtonProps {
  variant: 'desktop' | 'mobile';
  isDark: boolean;
  className?: string;
}

export function PortfolioButton({ variant, isDark, className }: PortfolioButtonProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const isDesktop = variant === 'desktop';
  const { navigateWithReveal } = useTransition();

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

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Use the center of the button element as origin for the reveal
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      navigateWithReveal('/portfolio', originX, originY);
    },
    [navigateWithReveal]
  );

  if (isDesktop) {
    return (
      <div
        ref={glowRef}
        className={cn(
          'w-[200px] h-full rounded-[25px] flex items-center justify-center',
          className
        )}
      >
        <button
          onClick={handleClick}
          className="flex items-center justify-center w-[95%] h-[80%] rounded-[20px] no-underline cursor-pointer border-none"
          style={{ backgroundColor: 'var(--color-portfolio-btn-bg)' }}
        >
          <span
            className="text-[18px] font-semibold"
            style={{ color: 'var(--color-portfolio-btn-text)' }}
          >
            Portfolio
          </span>
        </button>
      </div>
    );
  }

  // Mobile variant -- uses image instead of text.
  // Sized so the image (after scale-[1.4]) fits inside its flex slot on the
  // smallest expected phones (320px viewport → 56px button); overflow-hidden
  // is a belt-and-suspenders guard so any future scaling can't bleed into
  // adjacent navbar slots.
  return (
    <div
      ref={glowRef}
      className={cn(
        'flex-[2] h-full rounded-[25px] flex items-center justify-center',
        className
      )}
    >
      <button
        onClick={handleClick}
        className="flex items-center justify-center w-[90%] h-[80%] rounded-[20px] no-underline cursor-pointer border-none overflow-hidden"
        style={{ backgroundColor: 'var(--color-portfolio-btn-bg)' }}
      >
        <Image
          src={isDark ? '/icons/portfolio_light.png' : '/icons/portfolio.png'}
          alt="Portfolio"
          width={64}
          height={16}
          className="scale-[1.4]"
          priority
        />
      </button>
    </div>
  );
}
