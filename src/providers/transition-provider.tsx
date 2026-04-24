'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // D-13: useRef for synchronous guard — no render-cycle gap on rapid clicks
  const isTransitioningRef = useRef(false);
  // Shadow useState so context consumers receive reactive boolean updates
  const [isTransitioningState, setIsTransitioningState] = useState(false);

  // D-08: track previous path for popstate back navigation
  const previousPathRef = useRef<string>(pathname);

  // Keep overlayRef for GSAP fallback path (D-05)
  const overlayRef = useRef<HTMLDivElement>(null);

  const navigateWithReveal = useCallback(
    (path: string, originX: number, originY: number) => {
      // D-13: synchronous guard — ref fires immediately, no render cycle gap
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsTransitioningState(true);

      // D-08: capture pathname BEFORE router.push changes it
      previousPathRef.current = pathname;

      // D-04: circle math unchanged — identical to Flutter sqrt(maxX^2 + maxY^2)
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(originX, vw - originX);
      const maxY = Math.max(originY, vh - originY);
      const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

      if (document.startViewTransition) {
        // D-01: PRIMARY PATH — View Transitions API
        // router.push MUST be inside the callback (not before/after) — see RESEARCH.md Pitfall 1
        const transition = document.startViewTransition(() => {
          router.push(path);
        });

        // D-01: Web Animations API is the only way to animate pseudo-elements with computed values
        // transition.ready fires when both old snapshot and new page are ready to animate
        transition.ready.then(() => {
          // T-07-04: safety reset in case transition.finished never fires (browser bug mitigation)
          const safetyTimer = setTimeout(() => {
            isTransitioningRef.current = false;
            setIsTransitioningState(false);
          }, 600); // 500ms duration + 100ms buffer

          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${originX}px ${originY}px)`,
                `circle(${maxRadius}px at ${originX}px ${originY}px)`,
              ],
            },
            {
              duration: 500, // D-10: matches Flutter Duration(milliseconds: 500)
              easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)', // D-11: power2.inOut
              pseudoElement: '::view-transition-new(root)',
            }
          );

          transition.finished.then(() => {
            clearTimeout(safetyTimer);
            isTransitioningRef.current = false;
            setIsTransitioningState(false);
          });
        });
      } else {
        // D-05: FALLBACK PATH — GSAP solid-color overlay (existing behavior preserved)
        const overlay = overlayRef.current;
        if (!overlay) {
          router.push(path);
          isTransitioningRef.current = false;
          setIsTransitioningState(false);
          return;
        }

        const isDark = resolvedTheme === 'dark';
        const bgColor = getDestinationBgColor(path, isDark);

        overlay.style.backgroundColor = bgColor;
        overlay.style.display = 'block';
        overlay.style.clipPath = `circle(0px at ${originX}px ${originY}px)`;

        gsap.to(overlay, {
          clipPath: `circle(${maxRadius}px at ${originX}px ${originY}px)`,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            router.push(path);
            setTimeout(() => {
              overlay.style.display = 'none';
              overlay.style.clipPath = 'circle(0px at 0px 0px)';
              isTransitioningRef.current = false;
              setIsTransitioningState(false);
            }, 100);
          },
        });
      }
    },
    [pathname, resolvedTheme, router]
  );

  // D-07, D-09: intercept browser back button via popstate
  // Reveal from screen center on back navigation (D-07)
  // No history.pushState re-push — read-only listener (D-09)
  useEffect(() => {
    const handlePopstate = () => {
      const prevPath = previousPathRef.current;
      navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2);
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [navigateWithReveal]);

  return (
    <TransitionContext.Provider value={{ navigateWithReveal, isTransitioning: isTransitioningState }}>
      {children}
      {/* Overlay kept for GSAP fallback (D-05). Never visible when View Transitions is available. */}
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
