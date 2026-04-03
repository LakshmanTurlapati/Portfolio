'use client';

import { useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMounted } from '@/hooks/use-mounted';
import { DesktopNavbar } from '@/components/desktop-navbar';
import { MobileNavbar } from '@/components/mobile-navbar';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthorName } from '@/components/author-name';
import { ParticleBackground } from '@/components/particle-background';
import { SnowfallEffect } from '@/components/snowfall';
import { DotMatrix } from '@/components/dot-matrix';
import { RotatingCircularText } from '@/components/rotating-circular-text';
import { SpotlightEffect } from '@/components/spotlight';
import { ScrollingText } from '@/components/scrolling-text';

export default function Home() {
  const [clickCount, setClickCount] = useState(0);
  const isMobile = useMediaQuery('(max-width: 599px)');
  const mounted = useMounted();

  if (!mounted) {
    // SSR placeholder - render minimal structure to prevent hydration mismatch
    return <main className="bg-gradient-main min-h-screen relative overflow-hidden" />;
  }

  return (
    <main className="bg-gradient-main min-h-screen relative overflow-hidden">
      {/* Layer 2: z-10 -- Particle Background */}
      <ParticleBackground />

      {/* Layer 3: z-15 -- Snowfall */}
      <SnowfallEffect />

      {/* Layer 4: z-20 -- Scrolling Text (focal point) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <div
          style={{ marginTop: isMobile ? '-80px' : '-40px' }}
          className="pointer-events-auto"
        >
          <ScrollingText isMobile={isMobile} clickCount={clickCount} />
        </div>
      </div>

      {/* Layer 5: z-25 -- Rotating Circular Text (desktop only, conditional) */}
      {!isMobile && (
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 25,
            left: 'calc(50% - 270px - 1vw)',
            top: 'calc(10px - 5vh)',
          }}
        >
          <RotatingCircularText visible={clickCount === 1} />
        </div>
      )}

      {/* Layer 6: z-30 -- Dot Matrix */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{
          zIndex: 30,
          bottom: isMobile ? '140px' : '160px',
        }}
      >
        <DotMatrix isMobile={isMobile} />
      </div>

      {/* Layer 7: z-30/z-50 -- Navbar */}
      {/* Desktop navbar: visible >= 600px */}
      <div
        className="hidden sm:block"
        onClick={() => setClickCount((prev) => prev + 1)}
      >
        <DesktopNavbar />
      </div>

      {/* Mobile navbar: visible < 600px */}
      <div
        className="sm:hidden"
        onClick={() => setClickCount((prev) => prev + 1)}
      >
        <MobileNavbar />
      </div>

      {/* Layer 8: z-30 -- Chat placeholder (Phase 3 scope, position only) */}
      {!isMobile && (
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ zIndex: 30, bottom: '20px' }}
        >
          {/* Phase 3 will add ChatPlaceholder component here */}
          <div style={{ width: 200 }} />
        </div>
      )}

      {/* Layer 9: z-35 -- Spotlight */}
      <SpotlightEffect />

      {/* Layer 10: z-40 -- Theme Toggle */}
      {/* Desktop: bottom-left */}
      <div className="hidden sm:block fixed bottom-5 left-5 z-40">
        <ThemeToggle />
      </div>
      {/* Mobile: top-right */}
      <div className="sm:hidden fixed top-5 right-5 z-40">
        <ThemeToggle />
      </div>

      {/* Layer 11: z-40 -- Author Name */}
      {/* Desktop: bottom-right */}
      <div className="hidden sm:block fixed bottom-5 right-[30px] z-40">
        <AuthorName variant="desktop" />
      </div>
      {/* Mobile: top-left */}
      <div className="sm:hidden fixed top-5 left-5 z-40">
        <AuthorName variant="mobile" />
      </div>
    </main>
  );
}
