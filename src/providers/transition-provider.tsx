'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import gsap from 'gsap';

interface TransitionContextType {
  navigateWithReveal: (path: string, originX: number, originY: number) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithReveal: () => {},
  isTransitioning: false,
});

export function useTransition() {
  return useContext(TransitionContext);
}

// Map destination path to its background color CSS variable
function getDestinationBgColor(path: string, isDark: boolean): string {
  if (path === '/portfolio' || path === '/about') {
    // Inverted pages use --color-page-inverted-bg
    return isDark ? '#DBDBDB' : '#2A2A2A';
  }
  if (path === '/chat' || path === '/') {
    // Home and chat use --color-bg
    return isDark ? '#000000' : '#FFFFFF';
  }
  // Default fallback
  return isDark ? '#000000' : '#FFFFFF';
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const navigateWithReveal = useCallback(
    (path: string, originX: number, originY: number) => {
      if (isTransitioning) return;

      const overlay = overlayRef.current;
      if (!overlay) {
        // Fallback: navigate without animation
        router.push(path);
        return;
      }

      setIsTransitioning(true);

      const isDark = resolvedTheme === 'dark';
      const bgColor = getDestinationBgColor(path, isDark);

      // Calculate max radius to cover entire viewport from origin
      // Matching Flutter formula: sqrt(maxX^2 + maxY^2)
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(originX, vw - originX);
      const maxY = Math.max(originY, vh - originY);
      const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

      // Set overlay color and make visible
      overlay.style.backgroundColor = bgColor;
      overlay.style.display = 'block';
      overlay.style.clipPath = `circle(0px at ${originX}px ${originY}px)`;

      // Animate the circle expanding using GSAP
      gsap.to(overlay, {
        clipPath: `circle(${maxRadius}px at ${originX}px ${originY}px)`,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          // Navigate once the reveal covers the viewport
          router.push(path);

          // After a short delay to let the new page render, hide the overlay
          setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.clipPath = 'circle(0px at 0px 0px)';
            setIsTransitioning(false);
          }, 100);
        },
      });
    },
    [isTransitioning, resolvedTheme, router]
  );

  return (
    <TransitionContext.Provider value={{ navigateWithReveal, isTransitioning }}>
      {children}
      {/* Fixed overlay for circular reveal animation */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'none',
          clipPath: 'circle(0px at 0px 0px)',
        }}
      />
    </TransitionContext.Provider>
  );
}
