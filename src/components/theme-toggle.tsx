'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { IoMoonSharp } from 'react-icons/io5';
import { useMounted } from '@/hooks/use-mounted';
import { SunIcon } from '@/components/sun-icon';
import { cn } from '@/lib/cn';

interface ThemeToggleProps {
  className?: string;
}

function DashedSeparator() {
  return (
    <div
      className="h-[22px] w-[1px]"
      style={{
        background:
          'repeating-linear-gradient(to bottom, var(--color-separator) 0px, var(--color-separator) 3px, transparent 3px, transparent 6px)',
      }}
    />
  );
}

function MoonButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const size = hovered ? 26 : 24;

  return (
    <button
      type="button"
      aria-label="Switch to dark mode"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer flex items-center justify-center bg-transparent border-none p-0"
    >
      <IoMoonSharp
        style={{
          width: size,
          height: size,
          color: 'var(--color-moon)',
          transform: 'rotate(25deg)',
          transition: 'all 300ms ease-in-out',
        }}
      />
    </button>
  );
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    // SSR placeholder with approximate dimensions to prevent layout shift
    return <div className={cn('w-[106px] h-[30px]', className)} />;
  }

  return (
    <div className={cn('flex flex-row items-center gap-[12px]', className)}>
      {/* Sun button */}
      <button
        type="button"
        aria-label="Switch to light mode"
        onClick={() => {
          if (isDark) setTheme('light');
        }}
        className="cursor-pointer flex items-center justify-center bg-transparent border-none p-0"
      >
        <SunIcon active={!isDark} />
      </button>

      {/* Dashed separator */}
      <DashedSeparator />

      {/* Moon button */}
      <MoonButton
        onClick={() => {
          if (!isDark) setTheme('dark');
        }}
      />
    </div>
  );
}
