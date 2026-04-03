'use client';

import { cn } from '@/lib/cn';

interface AuthorNameProps {
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export function AuthorName({ className, variant = 'desktop' }: AuthorNameProps) {
  const isDesktop = variant === 'desktop';

  return (
    <span
      className={cn(
        'text-[20px] text-[var(--color-text)] select-none',
        isDesktop
          ? 'font-semibold cursor-pointer author-text-shadow transition-all duration-300'
          : 'font-medium',
        className
      )}
    >
      Lakshman Turlapati
    </span>
  );
}
