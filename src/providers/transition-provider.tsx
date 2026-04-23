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
  navigatePlain: (path: string) => void;
  navigateWithSlide: (path: string, direction: 'forward' | 'back') => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithReveal: () => {},
  navigatePlain: () => {},
  navigateWithSlide: () => {},
  isTransitioning: false,
});

export function useTransition() {
  return useContext(TransitionContext);
}

// Map destination path to its background color CSS variable
function getDestinationBgColor(path: string, isDark: boolean): string {
  if (path === '/portfolio' || path === '/about') {
    return isDark ? '#DBDBDB' : '#2A2A2A';
  }
  if (path === '/chat' || path === '/') {
    return isDark ? '#000000' : '#FFFFFF';
  }
  return isDark ? '#000000' : '#FFFFFF';
}

function emitPageReady(path: string) {
  if (typeof window === 'undefined' || !window.VoiceBus) return;
  const slug = path === '/' ? 'home' : path.replace(/^\//, '');
  window.VoiceBus.emit('page-ready', slug);
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // D-13: useRef for synchronous guard — no render-cycle gap on rapid clicks
  const isTransitioningRef = useRef(false);
  const [isTransitioningState, setIsTransitioningState] = useState(false);

  // D-08: track previous path for popstate back navigation
  const previousPathRef = useRef<string>(pathname);

  // Keep overlayRef for GSAP fallback path (D-05)
  const overlayRef = useRef<HTMLDivElement>(null);

  const navigateWithReveal = useCallback(
    (path: string, originX: number, originY: number) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsTransitioningState(true);

      previousPathRef.current = pathname;

      // VOICE-05: derive page slug from destination path and emit page-ready on
      // VoiceBus so coordinators (e.g. openTextChat) can act after the destination
      // page actually mounts. '/' becomes 'home'; other paths strip the leading
      // slash. Listeners are gated with a `fired` flag so duplicate emits (per-page
      // mount emits on /portfolio and /about) are no-ops.
      const signalPageReady = () => emitPageReady(path);

      // D-04: circle math — identical to Flutter sqrt(maxX^2 + maxY^2)
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(originX, vw - originX);
      const maxY = Math.max(originY, vh - originY);
      const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

      if (document.startViewTransition) {
        // PRIMARY PATH — View Transitions API
        const transition = document.startViewTransition(() => {
          router.push(path);
        });

        transition.ready.then(() => {
          const safetyTimer = setTimeout(() => {
            isTransitioningRef.current = false;
            setIsTransitioningState(false);
          }, 600);

          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${originX}px ${originY}px)`,
                `circle(${maxRadius}px at ${originX}px ${originY}px)`,
              ],
            },
            {
              duration: 500,
              easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
              fill: 'both',
              pseudoElement: '::view-transition-new(root)',
            }
          );

          transition.finished.then(() => {
            clearTimeout(safetyTimer);
            isTransitioningRef.current = false;
            setIsTransitioningState(false);
            signalPageReady();
          }).catch(() => {
            // Already handled by safety timer
          });
        }).catch(() => {
          // Transition aborted — reset guard so nav isn't permanently locked
          isTransitioningRef.current = false;
          setIsTransitioningState(false);
        });
      } else {
        // FALLBACK PATH — GSAP solid-color overlay
        const overlay = overlayRef.current;
        if (!overlay) {
          router.push(path);
          isTransitioningRef.current = false;
          setIsTransitioningState(false);
          signalPageReady();
          return;
        }

        const isDark = resolvedTheme === 'dark';
        const bgColor = getDestinationBgColor(path, isDark);

        gsap.killTweensOf(overlay);
        overlay.style.backgroundColor = bgColor;
        overlay.style.display = 'block';
        overlay.style.opacity = '1';
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
              signalPageReady();
            }, 100);
          },
        });
      }
    },
    [pathname, resolvedTheme, router]
  );

  const navigatePlain = useCallback(
    (path: string) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsTransitioningState(true);
      previousPathRef.current = pathname;

      const finalize = () => {
        isTransitioningRef.current = false;
        setIsTransitioningState(false);
        emitPageReady(path);
      };

      router.push(path);
      requestAnimationFrame(finalize);
    },
    [pathname, router]
  );

  const navigateWithSlide = useCallback(
    (path: string, direction: 'forward' | 'back') => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      setIsTransitioningState(true);

      previousPathRef.current = pathname;

      let finalized = false;
      const finalize = () => {
        if (finalized) return;
        finalized = true;
        isTransitioningRef.current = false;
        setIsTransitioningState(false);
        emitPageReady(path);
      };

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || prefersReducedMotion) {
        router.push(path);
        finalize();
        return;
      }

      const transition = document.startViewTransition(() => {
        router.push(path);
      });

      transition.ready.then(() => {
        const safetyTimer = setTimeout(finalize, 650);
        const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
        const duration = 420;
        const oldTransform = direction === 'forward'
          ? ['translateX(0)', 'translateX(32%)']
          : ['translateX(0)', 'translateX(-100%)'];
        const newTransform = direction === 'forward'
          ? ['translateX(-100%)', 'translateX(0)']
          : ['translateX(100%)', 'translateX(0)'];

        document.documentElement.animate(
          { transform: oldTransform },
          {
            duration,
            easing,
            fill: 'both',
            pseudoElement: '::view-transition-old(root)',
          }
        );

        document.documentElement.animate(
          { transform: newTransform },
          {
            duration,
            easing,
            fill: 'both',
            pseudoElement: '::view-transition-new(root)',
          }
        );

        transition.finished.then(() => {
          clearTimeout(safetyTimer);
          finalize();
        }).catch(() => {
          // Already handled by safety timer
        });
      }).catch(finalize);
    },
    [pathname, router]
  );

  // D-07: intercept browser back button via popstate
  useEffect(() => {
    const handlePopstate = () => {
      const prevPath = previousPathRef.current;
      navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2);
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [navigateWithReveal]);

  return (
    <TransitionContext.Provider
      value={{ navigateWithReveal, navigatePlain, navigateWithSlide, isTransitioning: isTransitioningState }}
    >
      {children}
      {/* Overlay for GSAP circular reveal fallback (D-05) */}
      <div
        data-testid="route-reveal-overlay"
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
