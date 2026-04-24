# Phase 7: Circular Reveal Transition - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 3 (modified files)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/providers/transition-provider.tsx` | provider | event-driven | `src/providers/transition-provider.tsx` (current impl) | exact — same file, internals replaced |
| `src/app/globals.css` | config/style | — | `src/app/globals.css` (current impl) | exact — same file, CSS rules appended |
| `next.config.ts` | config | — | `next.config.ts` (current impl) | exact — same file, one key added |

---

## Pattern Assignments

### `src/providers/transition-provider.tsx` (provider, event-driven)

**Analog:** `src/providers/transition-provider.tsx` (current file, full rewrite of internals)

This is the primary file changed in this phase. The shell (context type, export names, provider JSX wrapper) is preserved. Only the internals of `navigateWithReveal` and state management change.

**Imports pattern** (lines 1-13 of current file — keep, add `useEffect` and `usePathname`):
```typescript
'use client';

import {
  createContext,
  useContext,
  useState,       // keep for shadow state (see isTransitioning section below)
  useCallback,
  useRef,
  useEffect,      // ADD — needed for popstate listener
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';  // ADD usePathname
import { useTheme } from 'next-themes';
import gsap from 'gsap';
```

**Context interface — unchanged** (lines 15-23 of current file):
```typescript
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
```

**getDestinationBgColor helper — unchanged** (lines 30-41 of current file):
```typescript
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
```

**isTransitioning guard — replace useState with dual ref+state pattern** (replaces lines 46-47):
```typescript
// D-13: useRef for synchronous guard (no render-cycle gap on rapid clicks)
// Shadow useState keeps context value reactive for consumers
const isTransitioningRef = useRef(false);
const [isTransitioningState, setIsTransitioningState] = useState(false);

// Also track previous path for popstate back navigation (D-08)
const pathname = usePathname();
const previousPathRef = useRef<string>(pathname);
```
Note: all 6 consumer files destructure `isTransitioning` as a boolean from context (confirmed by Grep — none render it in JSX, but the interface is `boolean` so keep the shadow state for compatibility).

**Core navigateWithReveal function — replace GSAP-only with View Transitions primary + GSAP fallback** (replaces lines 49-97):
```typescript
const navigateWithReveal = useCallback(
  (path: string, originX: number, originY: number) => {
    // D-13: ref-backed guard fires synchronously — no render cycle gap
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioningState(true);

    // D-08: capture pathname BEFORE router.push changes it
    previousPathRef.current = pathname;

    // D-04: circle math unchanged from Flutter sqrt(maxX^2 + maxY^2)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxX = Math.max(originX, vw - originX);
    const maxY = Math.max(originY, vh - originY);
    const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

    if (document.startViewTransition) {
      // D-01: PRIMARY PATH — View Transitions API
      const transition = document.startViewTransition(() => {
        router.push(path);
        // NOTE: router.push is async but placing it here (not before/after) is correct.
        // Browser waits for React's next commit cycle. See RESEARCH.md Pitfall 1.
      });

      // D-12: animate clip-path on ::view-transition-new(root) from origin
      // Web Animations API is the ONLY way to animate pseudo-elements with computed values
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${originX}px ${originY}px)`,
              `circle(${maxRadius}px at ${originX}px ${originY}px)`,
            ],
          },
          {
            duration: 500,                                        // D-10: 500ms matches Flutter
            easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',  // D-11: power2.inOut equivalent
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });

      transition.finished.then(() => {
        isTransitioningRef.current = false;
        setIsTransitioningState(false);
      });
    } else {
      // D-05: FALLBACK PATH — GSAP solid-color overlay (existing implementation preserved)
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
  // NOTE: isTransitioningRef and setIsTransitioningState are stable refs/setters — omit from deps
);
```

**Back navigation intercept — new useEffect** (D-07, D-08, D-09; add after navigateWithReveal):
```typescript
useEffect(() => {
  const handlePopstate = () => {
    // D-07: use screen center as origin for back navigation
    const prevPath = previousPathRef.current;
    navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2);
  };
  window.addEventListener('popstate', handlePopstate);
  return () => window.removeEventListener('popstate', handlePopstate);
}, [navigateWithReveal]);
```

**Provider JSX — remove overlayRef div from View Transitions path, keep for GSAP fallback** (D-03):
```typescript
// overlayRef div is ONLY needed for the GSAP fallback path.
// Keep it in the DOM but it is never visible during View Transitions.
// The browser's ::view-transition-* pseudo-elements replace it for primary path.
const overlayRef = useRef<HTMLDivElement>(null);

return (
  <TransitionContext.Provider value={{ navigateWithReveal, isTransitioning: isTransitioningState }}>
    {children}
    {/* Overlay kept for GSAP fallback (D-05). Hidden when View Transitions is available. */}
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
```

**Anti-patterns to avoid (from RESEARCH.md):**
- Do NOT call `router.push(path)` before or outside the `startViewTransition` callback
- Do NOT use `flushSync` inside the `startViewTransition` callback
- Do NOT add `view-transition-name` to specific elements (full-page reveal uses root only)
- Do NOT use `useState` alone for the guard (render-cycle race condition)

---

### `src/app/globals.css` (config/style, CSS additions)

**Analog:** `src/app/globals.css` (current file — append at end)

The current file ends at line 227. The View Transitions CSS rules must be appended. They suppress the browser's default cross-fade animation which would otherwise run simultaneously with the custom clip-path animation (RESEARCH.md Pitfall 2).

**Pattern: view-transition reset rules — append after line 227**:
```css
/* ─── Phase 7: View Transitions API ───────────────────────────────────────── */

/* Suppress browser default cross-fade — custom clip-path animation takes over */
/* Without animation:none, default AND custom animations run simultaneously    */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
  display: block;
}

/* Allow clip-path to compose correctly without isolation interference */
::view-transition-image-pair(root) {
  isolation: auto;
}

/* Respect reduced motion preference (accessibility) */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-group(root) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

**Existing CSS conventions to follow** (from current `globals.css`):
- Section comments use `/* Section description */` format, placed above the block
- No Tailwind `@apply` for these rules (pure CSS pseudo-element selectors can't use @apply)
- `!important` is acceptable for `prefers-reduced-motion` overrides (pattern: `animation-duration: 0s !important` already used elsewhere implicitly)

---

### `next.config.ts` (config, one-liner addition)

**Analog:** `next.config.ts` (current file — additive change only)

**Current structure** (lines 1-38 of current file):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { ... },
  async headers() { ... },
};

export default nextConfig;
```

**Pattern: add experimental.viewTransition** (insert after line 5, before `images`):
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // D-02: Enable React's viewTransition integration for View Transitions API
  // Must be inside `experimental` — top-level `viewTransition: true` is silently ignored
  // See: nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition
  experimental: {
    viewTransition: true,
  },

  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  // ... rest unchanged
};
```

**Note on A4 assumption (RESEARCH.md):** The current `next.config.ts` has no existing `experimental` block, so this is a pure additive merge — no conflict risk.

---

## Shared Patterns

### `navigateWithReveal` Call Signature — Preserved Across All 6 Consumers

**Source:** `src/providers/transition-provider.tsx` (current interface)
**Applies to:** `desktop-navbar.tsx`, `mobile-navbar.tsx`, `portfolio-button.tsx`, `src/app/portfolio/page.tsx`, `src/app/about/page.tsx`, `src/app/chat/page.tsx`

The function signature `navigateWithReveal(path: string, originX: number, originY: number)` is unchanged. No consumer files require modification. Confirmed by reading:
- `desktop-navbar.tsx` line 34: `navigateWithReveal('/about', originX, originY)`
- `mobile-navbar.tsx` line 33: `navigateWithReveal('/about', originX, originY)`
- `portfolio-button.tsx` line 52: `navigateWithReveal('/portfolio', originX, originY)`
- `portfolio/page.tsx` line 84: `navigateWithReveal('/', rect.left + rect.width / 2, rect.top + rect.height / 2)`
- `about/page.tsx` line 166: `navigateWithReveal('/', originX, originY)`

### Origin Coordinate Pattern — `getBoundingClientRect()` at Click Time

**Source:** `src/components/desktop-navbar.tsx` lines 27-34
**Applies to:** All callsites

```typescript
const handleAboutClick = useCallback(
  (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const originX = rect.left + rect.width / 2;   // D-12: center of clicked element
    const originY = rect.top + rect.height / 2;
    navigateWithReveal('/about', originX, originY);
  },
  [navigateWithReveal]
);
```
This pattern is already correct in all 6 consumers — no changes needed there.

### `isTransitioning` Consumer Usage

**Grep result across entire `src/` tree:** `isTransitioning` from the transition context is only referenced in `transition-provider.tsx` itself. The `scrolling-text.tsx` `isTransitioning` is a local state variable, unrelated to the provider. No consumer renders `isTransitioning` in JSX — all 6 consumers only destructure `navigateWithReveal`. The shadow `useState` for context compatibility is a safety measure.

### Flutter Circle Math — Identical in Both Paths

**Source:** `lib/circular_reveal_page_route.dart` lines 40-42 (Flutter reference)
```dart
final maxX = max(startOffset.dx, screenSize.width - startOffset.dx);
final maxY = max(startOffset.dy, screenSize.height - startOffset.dy);
final maxRadius = sqrt(maxX * maxX + maxY * maxY);
```

**Current implementation** (`transition-provider.tsx` lines 67-71) already matches exactly:
```typescript
const maxX = Math.max(originX, vw - originX);
const maxY = Math.max(originY, vh - originY);
const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);
```
D-04 decision: this math is correct — do not change it.

---

## No Analog Found

No files in this phase lack analogs — all three files already exist and are being modified, not created from scratch.

---

## Metadata

**Analog search scope:** `src/providers/`, `src/components/`, `src/app/`, root config files, `lib/` (Flutter reference)
**Files read:** 9 (`transition-provider.tsx`, `globals.css`, `next.config.ts`, `desktop-navbar.tsx`, `mobile-navbar.tsx`, `portfolio-button.tsx`, `portfolio/page.tsx` partial, `about/page.tsx` partial via Grep, `circular_reveal_page_route.dart`)
**Pattern extraction date:** 2026-04-23
