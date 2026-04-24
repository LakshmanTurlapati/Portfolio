---
phase: 07-circular-reveal-transition
reviewed: 2026-04-23T12:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/providers/transition-provider.tsx
  - src/app/globals.css
  - next.config.ts
  - src/components/data-grid.tsx
findings:
  critical: 0
  high: 1
  medium: 2
  low: 1
  info: 1
  total: 5
status: issues_found
---

# Phase 07: Circular Reveal Transition - Code Review

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 07 replaces a GSAP solid-color overlay with the View Transitions API for circular reveal page transitions. The implementation is well-structured with progressive enhancement (View Transitions primary, GSAP fallback), a synchronous useRef guard against rapid clicks, and proper CSS resets for the view-transition pseudo-elements. The code is clearly commented with design-decision references (D-01 through D-13).

Three areas require attention: unhandled promise rejections on `transition.ready` and `transition.finished` that can permanently lock navigation, a popstate handler that may desync browser URL and app content when the transition guard blocks back-navigation, and an incomplete `prefers-reduced-motion` implementation that only covers CSS animations but not the JavaScript-driven Web Animations API call.

The `data-grid.tsx` change is a trivial lint fix and introduces no issues. The `next.config.ts` and `globals.css` changes are correct.

---

## High

### HI-01: Unhandled promise rejections on transition.ready / transition.finished can permanently lock navigation

**File:** `src/providers/transition-provider.tsx:86-112`
**Issue:** Both `transition.ready.then(...)` and `transition.finished.then(...)` lack `.catch()` handlers. If the `startViewTransition` callback throws, or if the transition is skipped/aborted by the browser (e.g., a second `startViewTransition` call cancels the first, or the DOM update callback rejects), `transition.ready` rejects. When `transition.ready` rejects:

1. The `.then()` block on line 86 never executes, so `isTransitioningRef.current` remains `true`.
2. The safety timer on line 88 never starts.
3. All subsequent calls to `navigateWithReveal` are permanently blocked by the guard on line 63.

The user would be unable to navigate until a full page refresh.

Similarly, if `transition.ready` resolves but `transition.finished` rejects (which the spec allows), the safety timer runs but the `.then()` on line 107 never executes. The safety timer at 600ms mitigates this specific case, but unhandled rejection warnings will appear in the console.

**Fix:** Add `.catch()` handlers to reset the transition state on both promises:

```typescript
const transition = document.startViewTransition(() => {
  router.push(path);
});

transition.ready
  .then(() => {
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
        pseudoElement: '::view-transition-new(root)',
      }
    );

    transition.finished.then(() => {
      clearTimeout(safetyTimer);
      isTransitioningRef.current = false;
      setIsTransitioningState(false);
    }).catch(() => {
      clearTimeout(safetyTimer);
      isTransitioningRef.current = false;
      setIsTransitioningState(false);
    });
  })
  .catch(() => {
    // Transition was skipped/aborted — unlock navigation
    isTransitioningRef.current = false;
    setIsTransitioningState(false);
  });
```

---

## Medium

### ME-01: Popstate handler blocked by isTransitioning guard can desync URL and content

**File:** `src/providers/transition-provider.tsx:152-159`
**Issue:** When `popstate` fires (browser back button), the browser has already changed the URL bar. The handler calls `navigateWithReveal(prevPath, ...)`, which checks `isTransitioningRef.current` on line 63. If a transition is currently in progress (e.g., the user clicked back during an active transition), the guard returns early -- the navigation is silently dropped. The browser URL now shows the previous page's path, but the app still renders the current page's content. The user sees a mismatch between URL and content.

**Fix:** Either (a) skip the `isTransitioning` guard for popstate-originated calls by adding a `force` parameter:

```typescript
const navigateWithReveal = useCallback(
  (path: string, originX: number, originY: number, force = false) => {
    if (!force && isTransitioningRef.current) return;
    // ...
  },
  [pathname, resolvedTheme, router]
);

// In handlePopstate:
navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2, true);
```

Or (b) when the guard blocks a popstate navigation, use `history.pushState` to restore the URL to match the current content:

```typescript
const handlePopstate = () => {
  const prevPath = previousPathRef.current;
  if (isTransitioningRef.current) {
    // Re-push current URL to keep URL/content in sync
    window.history.pushState(null, '', pathname);
    return;
  }
  navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2);
};
```

---

### ME-02: prefers-reduced-motion CSS does not affect the primary clip-path animation

**File:** `src/app/globals.css:246-253` and `src/providers/transition-provider.tsx:93-105`
**Issue:** The CSS `@media (prefers-reduced-motion: reduce)` block sets `animation-duration: 0s` on `::view-transition-old(root)` and `::view-transition-new(root)`. However, the custom circular reveal is applied via `document.documentElement.animate()` (Web Animations API) in JavaScript, not via CSS `@keyframes`. The Web Animations API animation is not affected by CSS `animation-duration` overrides. Users who have enabled reduced-motion accessibility preferences will still see the 500ms expanding circle animation.

The CSS rule is not wrong -- it correctly suppresses any residual browser-default animations -- but it does not cover the primary animation path, which may be misleading.

**Fix:** Check `prefers-reduced-motion` in JavaScript and skip or shorten the animation:

```typescript
transition.ready.then(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReducedMotion ? 0 : 500;

  // Safety timer adjusted to match
  const safetyTimer = setTimeout(() => {
    isTransitioningRef.current = false;
    setIsTransitioningState(false);
  }, duration + 100);

  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${originX}px ${originY}px)`,
        `circle(${maxRadius}px at ${originX}px ${originY}px)`,
      ],
    },
    {
      duration,
      easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      pseudoElement: '::view-transition-new(root)',
    }
  );
  // ...
});
```

---

## Low

### LO-01: Popstate back navigation pushes duplicate history entries

**File:** `src/providers/transition-provider.tsx:152-155`
**Issue:** When the user presses the browser back button, `popstate` fires after the browser has already navigated back. `previousPathRef.current` holds the path before the forward navigation (e.g., `/`). The handler calls `navigateWithReveal('/', ...)` which calls `router.push('/')`. Since the browser already navigated back to `/`, this pushes a duplicate `/` entry onto the history stack.

Example sequence starting at `/`:
1. User clicks to `/about` -- history: `[/, /about]`, `previousPathRef = /`
2. User presses back -- browser pops to `/`, then `router.push('/')` pushes again -- history: `[/, /, /about_orphan?]`
3. Pressing back again requires two presses to get past the duplicates

This is acknowledged as intentional per D-09 (no `history.pushState` re-push), and the severity depends on how Next.js App Router handles `router.push` to the current path. Next.js may deduplicate in some cases, but the behavior is not guaranteed by the framework.

**Fix:** Before calling `navigateWithReveal` in the popstate handler, check if the destination matches the current URL to avoid duplicate pushes:

```typescript
const handlePopstate = () => {
  const prevPath = previousPathRef.current;
  // Browser already navigated -- only animate if path differs
  if (prevPath === window.location.pathname) {
    // Already at the right URL; just need to trigger re-render with animation
    // Consider using router.replace instead of router.push
    return;
  }
  navigateWithReveal(prevPath, window.innerWidth / 2, window.innerHeight / 2);
};
```

Alternatively, use `router.replace(path)` instead of `router.push(path)` for popstate-triggered navigations to avoid growing the history stack.

---

## Info

### IN-01: Unused import -- gsap imported but only used in fallback path

**File:** `src/providers/transition-provider.tsx:14`
**Issue:** The `gsap` import is unconditionally loaded but only used inside the `else` fallback branch (line 130) for browsers that lack View Transitions API support. All modern browsers (Chrome 111+, Edge 111+, Firefox 133+, Safari 18+) support the API. This means most users download and parse the GSAP library bundle without ever executing the fallback code path.

This is not a bug and the import is necessary for the progressive enhancement guarantee. Noted as info for potential future optimization via dynamic `import()` if bundle size becomes a concern.

**Fix (optional, future optimization):**

```typescript
} else {
  // Dynamically import GSAP only when needed
  const { default: gsap } = await import('gsap');
  // ... rest of fallback
}
```

This would require making `navigateWithReveal` async or restructuring the fallback.

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
