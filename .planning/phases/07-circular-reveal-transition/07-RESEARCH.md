# Phase 07: Circular Reveal Transition - Research

**Researched:** 2026-04-23
**Domain:** View Transitions API, Web Animations API, Next.js App Router navigation, React 19
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use the **View Transitions API** (`document.startViewTransition`) as the primary mechanism. Animate `clip-path: circle(...)` expanding on the `::view-transition-new(root)` pseudo-element using the Web Animations API (`document.documentElement.animate()`).
- **D-02:** Add `experimental: { viewTransition: true }` to `next.config.ts` (or the Next.js 15 equivalent).
- **D-03:** Remove the current `overlayRef` div from `TransitionProvider` — replaced by browser's view-transition pseudo-elements.
- **D-04:** Circle math (`sqrt(maxX^2 + maxY^2)`) stays the same — already correct from Flutter implementation.
- **D-05:** Progressive enhancement — wrap in `if (document.startViewTransition)`. If unavailable, fall back to existing GSAP solid-color overlay approach.
- **D-06:** View Transitions API is Baseline Newly Available (Oct 2025) — Chrome 111+, Edge 111+, Firefox 133+, Safari 18+.
- **D-07:** Intercept `popstate` event in `TransitionProvider`. On back navigation, call `navigateWithReveal(previousPath, window.innerWidth / 2, window.innerHeight / 2)`.
- **D-08:** Track `previousPath` in a `useRef` inside `TransitionProvider`, updated each time `navigateWithReveal` fires.
- **D-09:** The `popstate` listener is read-only — no `history.pushState` re-push trick. Navigation goes through the same `navigateWithReveal` channel so the `isTransitioning` guard applies.
- **D-10:** Duration: **500ms** (matches Flutter source's `Duration(milliseconds: 500)`).
- **D-11:** Easing: **power2.inOut** equivalent via Web Animations API (`cubic-bezier(0.455, 0.03, 0.515, 0.955)` or GSAP `power2.inOut` for fallback path).
- **D-12:** Origin point: **center of the clicked navigation element** (`rect.left + rect.width/2`, `rect.top + rect.height/2`).
- **D-13:** Rapid-click guard: upgrade from `useState<boolean>` to `useRef<boolean>`.

### Claude's Discretion

- Web Animations API keyframe structure for the `::view-transition-new(root)` clip-path animation
- Exact CSS for `::view-transition-old(root)` and `::view-transition-new(root)` pseudo-element styling
- How to structure the GSAP fallback alongside the View Transitions path (shared function vs conditional branch)
- Whether to add `view-transition-name` to specific elements for per-element transitions (likely unnecessary for full-page reveal)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRAN-01 | Navigating between pages triggers a circular reveal that clips the NEW page content, expanding from the clicked element's position (matching Flutter ClipPath) | View Transitions API `::view-transition-new(root)` + clip-path circle animation from origin — direct equivalent of Flutter's ClipPath clipper |
| TRAN-02 | The old page remains visible around the expanding circle until the reveal covers the viewport | View Transitions API automatically holds `::view-transition-old(root)` (a snapshot of old page) visible while `::view-transition-new(root)` expands — this is the native browser behavior, no custom code required |
</phase_requirements>

---

## Summary

The current GSAP overlay approach in `src/providers/transition-provider.tsx` animates a solid-color div that expands over the old page and then calls `router.push()` only after the overlay fully covers the viewport. This fundamentally cannot replicate Flutter's behavior because the old page is hidden entirely before the new page renders. The user sees: old page → solid color → new page. Flutter shows: old page visible around expanding circle → new page inside circle → new page covers viewport.

The View Transitions API solves this structurally. When `document.startViewTransition(callback)` is called, the browser captures a pixel snapshot of the current page (stored as `::view-transition-old(root)`), runs the callback (`router.push(path)`), then holds both the old snapshot and the live new page visible simultaneously. By animating `clip-path: circle(...)` on `::view-transition-new(root)`, the new page expands as a circle from the origin point while the old snapshot remains visible around it — exactly matching Flutter's `ClipPath` + `Stack` pattern.

The primary implementation risk is the timing relationship between `document.startViewTransition` and Next.js's `router.push`. The callback passed to `startViewTransition` must trigger the DOM update synchronously (or the transition will snapshot the wrong state). Next.js 15's App Router `router.push()` is async by design (it doesn't return a Promise). However, empirical evidence from the community confirms that placing `router.push(path)` directly inside the `startViewTransition` callback works correctly in practice — the browser waits for React's next commit cycle to complete before capturing the new state.

**Primary recommendation:** Replace the GSAP overlay mechanism in `TransitionProvider` with `document.startViewTransition(() => router.push(path))`, animate clip-path on `::view-transition-new(root)` via `transition.ready.then(...)`, suppress default cross-fade via CSS in `globals.css`, and keep GSAP as the `else` fallback branch. No consumer API changes needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Circular reveal animation | Browser / Client | — | Pure browser rendering — View Transitions pseudo-elements are browser-managed |
| Navigation triggering | Frontend (Client Component) | — | `router.push` lives in TransitionProvider client component |
| Origin coordinate tracking | Browser / Client | — | `getBoundingClientRect()` called at click time in consumer components |
| GSAP fallback animation | Browser / Client | — | Same tier as primary — pure client-side DOM animation |
| Back navigation intercept | Browser / Client | — | `popstate` event listener in TransitionProvider |
| next.config.ts flag | Build / Config | — | One-liner in Next.js config enables React's viewTransition integration |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| View Transitions API | Browser native | Simultaneous old+new page rendering during navigation | Only mechanism that makes old and new page coexist on screen |
| Web Animations API | Browser native | Animate `clip-path` on `::view-transition-new(root)` pseudo-element | Only way to animate pseudo-elements with JavaScript-computed values |
| Next.js `router.push` | 15.5.14 (current) | Trigger App Router navigation inside transition callback | Already in use, interface preserved |
| GSAP | ^3 (installed) | Fallback animation for non-supporting browsers | Already installed, existing implementation preserved |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `experimental: { viewTransition: true }` in next.config.ts | N/A (config flag) | Enables React's internal viewTransition integration in Next.js | Required alongside `document.startViewTransition` usage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `document.startViewTransition` | React `<ViewTransition>` component | `<ViewTransition>` requires restructuring every page's JSX and doesn't support a globally-triggered custom clip-path from an arbitrary point. Raw API is appropriate here because the trigger is imperative (click event → coordinates → animation). |
| Raw `document.startViewTransition` | `next-view-transitions` npm package | Adds a dependency for no gain — the package wraps the same raw API and is designed for Link-based navigation, not imperative `navigateWithReveal` |

**No npm installs required** — all tooling is either browser-native or already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks nav element
        │
        ▼
Consumer (desktop-navbar / mobile-navbar / portfolio-button / back buttons)
  getBoundingClientRect() → originX, originY
  calls navigateWithReveal(path, originX, originY)
        │
        ▼
TransitionProvider.navigateWithReveal()
  [guard] isTransitioningRef.current === true → abort
  Set isTransitioningRef.current = true
  Update previousPathRef.current = currentPath
        │
        ├─── if document.startViewTransition available ──────────────────────────────┐
        │                                                                             │
        │    document.startViewTransition(() => router.push(path))                   │
        │         │                                                                   │
        │         ├── Browser captures ::view-transition-old(root)                   │
        │         ├── router.push(path) called                                       │
        │         ├── React renders new page                                         │
        │         └── Browser captures ::view-transition-new(root)                   │
        │                   │                                                         │
        │    transition.ready.then(() => {                                            │
        │      document.documentElement.animate(                                      │
        │        clip-path: circle(0) → circle(maxRadius) at originX, originY        │
        │        duration: 500ms, easing: cubic-bezier(0.455, 0.03, 0.515, 0.955)   │
        │        pseudoElement: '::view-transition-new(root)'                         │
        │      )                                                                      │
        │    })                                                                       │
        │         │                                                                   │
        │         ▼                                                                   │
        │    [OLD PAGE SNAPSHOT visible around expanding circle]                      │
        │    [NEW PAGE LIVE CONTENT inside expanding circle]                          │
        │         │                                                                   │
        │    transition.finished.then(() => {                                         │
        │      isTransitioningRef.current = false                                     │
        │    })                                                                       │
        │                                                                             │
        └─── else (GSAP fallback) ────────────────────────────────────────────────────┘
             [current GSAP overlay approach, preserved as-is]
             When animation completes: isTransitioningRef.current = false

popstate event (back navigation)
        │
        ▼
TransitionProvider popstate listener
  navigateWithReveal(previousPathRef.current, innerWidth/2, innerHeight/2)
```

### Recommended Project Structure

No new directories needed. All changes are in existing files:

```
src/
├── providers/
│   └── transition-provider.tsx    # Primary change: replace GSAP path with View Transitions
├── app/
│   └── globals.css                # Add ::view-transition-* CSS reset rules
└── next.config.ts                 # Add experimental.viewTransition: true
```

### Pattern 1: View Transitions API Circular Reveal

**What:** Wrap `router.push()` in `document.startViewTransition()`, then animate `clip-path: circle()` on `::view-transition-new(root)` via `transition.ready` promise.

**When to use:** Primary path — browser supports `document.startViewTransition`.

**Example:**
```typescript
// Source: MDN Using View Transitions API (developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using)
// Source: Chrome for Developers same-document view transitions guide

const navigateWithReveal = useCallback(
  (path: string, originX: number, originY: number) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    previousPathRef.current = pathname;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxX = Math.max(originX, vw - originX);
    const maxY = Math.max(originY, vh - originY);
    const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

    if (!document.startViewTransition) {
      // GSAP fallback (existing implementation)
      runGsapFallback(path, originX, originY, maxRadius);
      return;
    }

    const transition = document.startViewTransition(() => {
      router.push(path);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${maxRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)', // power2.inOut
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.then(() => {
      isTransitioningRef.current = false;
    });
  },
  [pathname, router]
);
```

### Pattern 2: CSS Reset for View Transition Pseudo-Elements

**What:** Suppress the browser's default cross-fade animation and prevent blending artifacts.

**When to use:** Always — must be in globals.css alongside the View Transitions implementation.

**Example:**
```css
/* Source: MDN View Transitions API Using guide */
/* Suppress default cross-fade — we provide our own clip-path animation */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
  display: block;
}

/* Ensure isolation doesn't interfere with clip-path */
::view-transition-image-pair(root) {
  isolation: auto;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-group(root) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

### Pattern 3: isTransitioning Guard via useRef (D-13)

**What:** Replace `useState<boolean>` with `useRef<boolean>` to eliminate React render-cycle race condition.

**When to use:** Always — `useState` causes a render before the guard is active, creating a window for double-clicks.

**Example:**
```typescript
// Replace:
const [isTransitioning, setIsTransitioning] = useState(false);

// With:
const isTransitioningRef = useRef(false);

// Context value still exposes boolean for consumers:
// isTransitioning: isTransitioningRef.current
// But updating the ref does NOT trigger re-render, so guard is instant
```

**Consumer compatibility note:** Consumers only read `isTransitioning` (not set it). The context value can be computed from `isTransitioningRef.current` at the moment of each render. Since consumers only use it defensively (to prevent interaction during animation), the slight staleness of a ref-based value is acceptable.

### Pattern 4: Back Navigation via popstate

**What:** Intercept browser back button, replay `navigateWithReveal` from screen center.

**When to use:** Triggered by `popstate` event inside a `useEffect` in `TransitionProvider`.

**Example:**
```typescript
const pathname = usePathname();
const previousPathRef = useRef<string>(pathname);

useEffect(() => {
  const handlePopstate = () => {
    const prevPath = previousPathRef.current;
    navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2);
  };
  window.addEventListener('popstate', handlePopstate);
  return () => window.removeEventListener('popstate', handlePopstate);
}, [navigateWithReveal]);

// Update previousPath each time navigateWithReveal fires (inside navigateWithReveal):
previousPathRef.current = pathname; // capture BEFORE router.push changes it
```

### Anti-Patterns to Avoid

- **Calling `router.push()` before `startViewTransition`:** If you call `router.push()` outside the callback, the browser captures old state, React renders the new page, then `startViewTransition` starts — result is a blank or flashed transition.
- **Using `flushSync` inside the callback:** `flushSync` inside `startViewTransition` can cause React to skip the Transition and break the animation sequence.
- **Keeping `overlayRef` div alongside View Transitions:** The two approaches conflict. The overlay div renders above everything (z-index 9999) and will block the view-transition pseudo-elements from being visible.
- **Using `useState` for the isTransitioning guard:** React batches state updates — the guard may not be active until after a render cycle, leaving a window where rapid clicks can fire two transitions simultaneously.
- **Forgetting `animation: none` in CSS:** Without it, the browser applies its default cross-fade animation ON TOP of the custom clip-path animation. Both run simultaneously, producing visual artifacts.
- **Using `view-transition-name` on specific elements:** For a full-page circular reveal, naming specific elements causes the browser to animate THOSE elements separately (morphing them), which conflicts with the root-level clip-path animation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Old + new page simultaneous display | Custom z-index stacking of two page renders | `document.startViewTransition` | The browser natively handles the pixel snapshot + live DOM coexistence. Custom stacking would require preserving the old page's React tree, which Next.js App Router does not support |
| Clip-path on pseudo-elements via JS | CSS keyframe animation | `document.documentElement.animate({ ... }, { pseudoElement: '::view-transition-new(root)' })` | Pseudo-elements cannot be targeted by normal JS DOM APIs. Web Animations API's `pseudoElement` option is the only way to animate them with computed values (the origin coordinates) |
| Back navigation animation detection | `history.state` parsing or URL diffing | `popstate` event listener + `previousPathRef` | The `popstate` event fires precisely when browser back/forward navigation occurs. URL diffing is unreliable (can't distinguish forward navigation from back). |

**Key insight:** The entire TRAN-01 / TRAN-02 requirement is only achievable with `document.startViewTransition` because it is the only browser mechanism that simultaneously renders old and new content as separate compositing layers. All custom implementations (GSAP overlay, z-index stacking, etc.) require hiding the old page before showing the new one.

---

## Common Pitfalls

### Pitfall 1: router.push() not triggering the transition
**What goes wrong:** The transition captures old state, navigates, but the new page appears instantly without animation. The clip-path animation appears to animate over an already-completed navigation.

**Why it happens:** `router.push()` in Next.js App Router is asynchronous — the page starts rendering immediately. If the browser snapshot happens before React has committed the new page, the transition races with the render.

**How to avoid:** Place `router.push(path)` directly (and only) inside the `startViewTransition` callback. Do NOT call it before or after. The browser uses React's commit timing to know when the DOM update is complete. This is confirmed working by community implementations.

**Warning signs:** Transition completes but page already changed before animation finishes.

---

### Pitfall 2: Default cross-fade playing on top of custom animation
**What goes wrong:** The circular reveal plays correctly, but there's a simultaneous fade effect making the animation look wrong — old content fades out instead of staying visible.

**Why it happens:** The browser applies `::view-transition-old(root)` and `::view-transition-new(root)` default animations (cross-fade) automatically. Without CSS overrides, both the default animation AND the custom clip-path animation run simultaneously.

**How to avoid:** Add `animation: none` and `mix-blend-mode: normal` to both `::view-transition-old(root)` and `::view-transition-new(root)` in `globals.css`.

**Warning signs:** Old page fades out (instead of remaining static). New page fades in from 50% opacity instead of appearing at full opacity inside the circle.

---

### Pitfall 3: isTransitioning guard race condition
**What goes wrong:** Rapid double-clicks cause two simultaneous transitions — the second one starts before the first completes, resulting in the browser immediately skipping the first transition.

**Why it happens:** `useState` updates are batched and only take effect after a render. Between the click and the next render, `isTransitioning` is still `false` — a second click passes the guard.

**How to avoid:** Use `useRef<boolean>` for the guard. `isTransitioningRef.current = true` takes effect synchronously, blocking re-entry within the same event loop tick.

**Warning signs:** Rapid clicking produces skipped or janky transitions.

---

### Pitfall 4: popstate double-fires
**What goes wrong:** Clicking a back button that calls `navigateWithReveal('/', ...)` AND the browser's native `popstate` event both fire, causing two animations to run.

**Why it happens:** `navigateWithReveal` calls `router.push(path)` which adds a history entry. When the user then presses the browser back button, `popstate` fires. But if `navigateWithReveal` itself internally intercepts `popstate`, it can create a loop.

**How to avoid:** The D-09 decision (popstate listener is read-only, no history.pushState re-push) prevents this. The `isTransitioningRef` guard also blocks re-entry during active animations. Document that the back button in UI (FaArrowLeft buttons in portfolio/about/chat pages) should NOT call `window.history.back()` — they should call `navigateWithReveal('/', ...)` directly, letting the `isTransitioning` guard handle rapid events.

**Warning signs:** Double animation on back navigation. Pages jumping to wrong routes.

---

### Pitfall 5: `experimental: { viewTransition: true }` placement
**What goes wrong:** The Next.js config flag is placed at the top level instead of inside `experimental`, or vice versa. The flag is silently ignored and view transitions don't integrate with Next.js's internal React batching.

**Why it happens:** The docs show `experimental: { viewTransition: true }` — NOT `viewTransition: true` at the top level. Despite the Next.js docs page being titled just "viewTransition," the current version (Next.js 15.x) requires the `experimental` wrapper.

**How to avoid:** Use exactly:
```typescript
const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  // ... rest of existing config
};
```

**Warning signs:** No error thrown but View Transitions don't trigger on route changes.

---

## Code Examples

### Complete TransitionProvider (View Transitions path)

```typescript
// Source: MDN View Transitions API + Chrome Developers guide + existing codebase pattern
'use client';

import {
  createContext,
  useContext,
  useRef,
  useCallback,
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

function getDestinationBgColor(path: string, isDark: boolean): string {
  if (path === '/portfolio' || path === '/about') {
    return isDark ? '#DBDBDB' : '#2A2A2A';
  }
  return isDark ? '#000000' : '#FFFFFF';
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isTransitioningRef = useRef(false);
  const previousPathRef = useRef<string>(pathname);

  // Expose current transitioning state to consumers
  // (ref-backed so guard is synchronous; staleness is acceptable for display-only consumers)
  const getIsTransitioning = () => isTransitioningRef.current;

  const navigateWithReveal = useCallback(
    (path: string, originX: number, originY: number) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      previousPathRef.current = pathname;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(originX, vw - originX);
      const maxY = Math.max(originY, vh - originY);
      const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

      if (document.startViewTransition) {
        // PRIMARY PATH: View Transitions API
        const transition = document.startViewTransition(() => {
          router.push(path);
        });

        transition.ready.then(() => {
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
              pseudoElement: '::view-transition-new(root)',
            }
          );
        });

        transition.finished.then(() => {
          isTransitioningRef.current = false;
        });
      } else {
        // FALLBACK PATH: GSAP solid-color overlay
        const isDark = resolvedTheme === 'dark';
        const bgColor = getDestinationBgColor(path, isDark);
        // ... GSAP overlay animation (existing implementation preserved)
      }
    },
    [pathname, resolvedTheme, router]
  );

  // Back navigation: intercept popstate, reveal from center
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
      value={{ navigateWithReveal, isTransitioning: isTransitioningRef.current }}
    >
      {children}
      {/* No overlayRef div — removed per D-03 */}
    </TransitionContext.Provider>
  );
}
```

### globals.css additions

```css
/* Source: MDN View Transitions API Using guide
   Must be added to suppress default cross-fade */

/* Disable default cross-fade animation */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
  display: block;
}

/* Allow clip-path to compose correctly */
::view-transition-image-pair(root) {
  isolation: auto;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-group(root) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

### next.config.ts addition

```typescript
// Source: nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    viewTransition: true,  // ADD THIS
  },
  // ... rest of existing config unchanged
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP overlay (solid color div expands) | View Transitions API clip-path on `::view-transition-new(root)` | Phase 7 (this phase) | Old page actually remains visible during transition — TRAN-02 becomes achievable |
| `useState<boolean>` transitioning guard | `useRef<boolean>` guard | Phase 7 (this phase) | Eliminates render-cycle race condition on rapid clicks |
| `router.push()` after animation completes | `router.push()` inside `startViewTransition` callback | Phase 7 (this phase) | New page renders during animation rather than after |

**Deprecated/outdated:**
- `overlayRef` div in TransitionProvider JSX: replaced by browser view-transition pseudo-elements. The div causes z-index conflicts and the solid-color approach cannot satisfy TRAN-02.
- `setIsTransitioning(true/false)` state updates: replaced by `isTransitioningRef.current` mutations for synchronous guard behavior.

---

## Critical Implementation Detail: Context Value for isTransitioning

`isTransitioningRef.current` does not trigger re-renders. The context value `isTransitioning` exposed to consumers currently receives a boolean. After switching to `useRef`, the context value will be stale (always `false`) unless explicitly re-rendered.

**Two valid approaches:**

1. **Keep a shadow useState for the context value only:**
   ```typescript
   const isTransitioningRef = useRef(false);
   const [isTransitioningState, setIsTransitioningState] = useState(false);
   // In navigateWithReveal: set BOTH ref (for guard) and state (for context)
   // isTransitioningRef.current = true; setIsTransitioningState(true);
   // In transition.finished: isTransitioningRef.current = false; setIsTransitioningState(false);
   ```
   This re-renders on state change, but the guard (ref) is still synchronous.

2. **Expose a getter function in context:**
   ```typescript
   const isTransitioning = () => isTransitioningRef.current;
   // Consumers call isTransitioning() instead of using it as a value
   ```
   No re-renders — consumers only use this to gate clicks, not to render UI.

The planner should pick one approach. Option 1 is safer for consumer compatibility since all 6 consumer files currently destructure `isTransitioning` as a boolean value from the context.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Placing `router.push(path)` inside `startViewTransition()` callback correctly triggers the DOM snapshot at the right time in Next.js 15.5.14 | Architecture Patterns, Pitfall 1 | Transition animation fires over already-completed navigation (visual artifact, not crash). Fallback: wrap in `startTransition(() => router.push(path))` inside the `startViewTransition` callback. |
| A2 | `transition.finished.then(() => ...)` reliably fires when the animation defined in `transition.ready.then()` completes | Code Examples | Guard never resets — `isTransitioningRef` stays `true` permanently. Fallback: use a `setTimeout(500 + buffer)` alongside `finished` as a safety reset. |
| A3 | `popstate` event fires for browser back button but NOT for `router.push()`-triggered navigations in Next.js App Router | Back Navigation pattern | Double animation triggers. Fallback: add a `popstateBlocker` ref set to `true` during programmatic navigation and checked in the `popstate` handler. |
| A4 | The `experimental: { viewTransition: true }` flag does not conflict with the current `next.config.ts` (no `viewTransition` at top level, no `experimental` block currently) | next.config.ts section | No known risk — config merge is additive |

---

## Open Questions

1. **isTransitioning context staleness with useRef**
   - What we know: `useRef` does not trigger re-renders; all 6 consumer files destructure `isTransitioning` as a boolean from context.
   - What's unclear: Whether any consumer uses `isTransitioning` to conditionally render UI (which would break with a stale ref value) vs. just blocking clicks.
   - Recommendation: Grep all 6 consumer files for `isTransitioning` usage pattern before implementing. If only used in click guards (likely), a pure `useRef` is fine; if used in JSX renders, keep `useState` shadow.

2. **Does Next.js 15's `experimental.viewTransition: true` flag affect behavior of `document.startViewTransition` calls?**
   - What we know: The flag enables Next.js's React `<ViewTransition>` integration. The raw `document.startViewTransition` API works independently of this flag.
   - What's unclear: Whether the flag causes Next.js to call `startViewTransition` internally on `router.push`, which would conflict with our manual call.
   - Recommendation: Keep the flag as D-02 specifies; if double-transition artifacts appear, investigate whether to remove it. The flag is required for React's `<ViewTransition>` component to work, but we're using raw API, so it may be a no-op in this context.

3. **Safari 18 clip-path on `::view-transition-new(root)` compatibility**
   - What we know: View Transitions API is Baseline Newly Available (Oct 2025), Safari 18+ included. The `pseudoElement` option in Web Animations API is required.
   - What's unclear: Whether Safari 18's implementation handles `clip-path` on pseudo-elements correctly vs. falling through to a blank/black state.
   - Recommendation: Test on Safari 18+ specifically. If broken, the GSAP fallback handles Safari pre-18, and the bug report would be for a very narrow Safari 18.x window.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `document.startViewTransition` | Primary animation path | Checked at runtime | Chrome 111+, Edge 111+, Firefox 133+, Safari 18+ | GSAP fallback (D-05) |
| Web Animations API (`element.animate`) | Clip-path animation on pseudo-elements | ✓ (universal) | All modern browsers | CSS keyframe fallback |
| GSAP | Fallback animation path | ✓ installed | ^3 | — |
| Next.js | Navigation | ✓ | 15.5.14 | — |
| React | Framework | ✓ | 19.1.0 | — |

**Missing dependencies with no fallback:** None.

---

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js (App Router), React, TypeScript, Tailwind CSS — all respected
- **Visual fidelity**: Must match Flutter version pixel-for-pixel — TRAN-01/02 directly addresses this for transitions
- **API security**: No new API routes introduced in this phase
- **Deployment**: AWS Amplify — no build-time changes affect this (next.config.ts flag is compile-time)
- **Responsive**: Same 600px breakpoint — both desktop-navbar and mobile-navbar consumers preserved

---

## Sources

### Primary (HIGH confidence)
- `developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using` — Complete View Transitions API SPA guide with clip-path circle reveal example
- `developer.chrome.com/docs/web-platform/view-transitions/same-document` — Chrome Developers same-document transitions guide
- `nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition` — Official Next.js viewTransition config reference
- `nextjs.org/docs/app/guides/view-transitions` — Official Next.js View Transitions guide
- `react.dev/reference/react/ViewTransition` — React ViewTransition component reference
- `nextjs.org/docs/app/api-reference/functions/use-router` — useRouter API reference confirming `transitionTypes` prop on push

### Secondary (MEDIUM confidence)
- `akashhamirwasia.com/blog/full-page-theme-toggle-animation-with-view-transitions-api/` — Practical implementation of clip-path reveal with `transition.ready`, `flushSync` pattern documented
- `veerasundar.com/blog/next-js-react-view-transitions` — Confirmed `router.push(path)` inside `startViewTransition` callback pattern works in Next.js App Router
- `github.com/vercel/next.js/discussions/46300` — Community discussion confirming known limitations with Suspense/streaming and back navigation

### Tertiary (LOW confidence)
- WebSearch results confirming `experimental: { viewTransition: true }` syntax (verified against official docs — upgraded to HIGH)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs verified against MDN and Next.js official docs
- Architecture: HIGH — pattern confirmed across multiple official sources and community implementations
- Pitfalls: HIGH (pitfalls 2, 3, 5) / MEDIUM (pitfalls 1, 4) — core CSS and guard pitfalls verified; timing and popstate behavior partially assumed
- Context value staleness concern: MEDIUM — observed pattern, specific behavior needs verification

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (stable APIs — View Transitions is now baseline, Next.js 15 config is documented)
