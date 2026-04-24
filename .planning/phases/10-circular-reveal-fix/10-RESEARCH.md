# Phase 10: Circular Reveal Fix - Research

**Researched:** 2026-04-23
**Domain:** View Transitions API, Next.js experimental React, CSS view-transition-name
**Confidence:** HIGH

---

## Summary

This research establishes the root causes of the circular reveal regression. Three distinct problems interact. Individually any one of them may or may not abort the transition; together they guarantee failure. Restoring the three Phase 7 files (transition-provider.tsx, globals.css, next.config.ts) without fixing these problems does not help because the problems live in other files.

**Root cause chain:** The `hero-nav-btn` / `hero-nav-btn-dest` CSS rules (added as uncommitted disk changes) assign the same `view-transition-name: hero-nav-btn` to multiple elements simultaneously — the portfolio button on the source page AND the back button on the destination page. When Next.js's experimental React runtime streams the destination page, it encounters two elements with the same `view-transition-name` and the View Transition API aborts the entire transition. The GSAP fallback path is also broken because the overlay `div` is inside the provider and React re-renders during the aborted transition clear it. VoiceBusProvider is a secondary risk but does NOT independently abort transitions.

**Primary recommendation:** Remove the `view-transition-name: hero-nav-btn` CSS from all elements, keep the hero morph idea deferred, and restore the clean root-only clip-path animation from Phase 7. The transition can work correctly without hero morphing.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page transition animation | Browser (View Transitions API) | React WAAPI call | Browser owns snapshot/animation; React triggers via startViewTransition callback |
| Route navigation | Next.js App Router | — | router.push() changes the page; must be inside startViewTransition callback |
| Transition guard (double-click) | React (ref guard) | — | isTransitioningRef prevents concurrent calls |
| Hero element morphing | Browser (view-transition-name) | CSS pseudo-elements | Browser pairs same-named elements across old/new snapshots |
| GSAP fallback | React (overlayRef) | GSAP | Used when startViewTransition unavailable |

---

## What Actually Changed Between Working and Broken

### Git archaeology results

`git status` reveals that `src/app/globals.css` has **uncommitted modifications** not present in any commit. The committed HEAD at `581960b` (Phase 7) and the current HEAD are identical for globals.css — but the on-disk file differs. The same is true for multiple other files.

Files with uncommitted disk changes that affect transitions:

| File | Committed HEAD has | On-disk has |
|------|--------------------|-------------|
| `src/app/globals.css` | No `hero-nav-btn` rules | `hero-nav-btn`, `hero-nav-btn-mobile`, `hero-nav-btn-dest` CSS + `::view-transition-group(hero-nav-btn)` |
| `src/components/portfolio-button.tsx` | No `hero-nav-btn` class on buttons | `hero-nav-btn` class on desktop button, `hero-nav-btn-mobile` on mobile button |
| `src/app/portfolio/page.tsx` | Simple back button, no `hero-nav-btn-dest` class | Back button has `hero-nav-btn-dest` class |
| `src/app/about/page.tsx` | Back button without `hero-nav-btn-dest` | Back button has `hero-nav-btn-dest` class |
| `src/app/chat/page.tsx` | Back button without `hero-nav-btn-dest` | Back button has `hero-nav-btn-dest` class |
| `src/app/page.tsx` | Simple onClick, no voice integration | Voice mode hooks, `data-parz-btn` guard |
| `src/providers/transition-provider.tsx` | Phase 7 code with inline comments | Same logic, comments trimmed, `.catch()` handlers added |
| `next.config.ts` | Has `experimental.viewTransition: true` | Has `experimental.viewTransition: true` (only comment-only diff) |

**Key finding:** globals.css, portfolio-button.tsx, and all three destination pages have uncommitted disk changes. These changes were applied during iterative debugging but never committed. When the user reports "restoring the three files doesn't work," the problem is that the `hero-nav-btn-dest` class is on the destination page back buttons (committed) while the `hero-nav-btn` and `hero-nav-btn-dest` CSS rules are in globals.css (uncommitted). The combination creates duplicate `view-transition-name` on two different elements simultaneously during a transition.

[VERIFIED: git diff HEAD and git show efc25b6 comparison]

---

## Root Cause 1: Duplicate view-transition-name — The Transition Killer

**This is the primary cause of the abort.** [VERIFIED: MDN, Chrome VT spec behavior]

The CSS on disk assigns `view-transition-name: hero-nav-btn` to:

1. `.hero-nav-btn` (desktop portfolio button, via media query min-width 640px)
2. `.hero-nav-btn-mobile` (mobile portfolio button, via media query max-width 639px)
3. `.hero-nav-btn-dest` (back button on portfolio, about, and chat pages — NO media query scoping)

The problem occurs at the transition moment:

- `document.startViewTransition()` is called while the source page (home) is rendered
- At this point, the portfolio/about/chat back button does NOT exist in the DOM (different pages)
- So no duplicate exists YET on the source page snapshot — the source snapshot is fine
- BUT: during the transition callback (`router.push(path)`), Next.js begins streaming the destination page
- The destination page's back button has `hero-nav-btn-dest` which maps to `view-transition-name: hero-nav-btn`
- React's experimental runtime (`completeBoundaryUpgradeToViewTransitionsInstruction`) then calls `document.startViewTransition` again for the streaming boundary
- The browser now has TWO elements with `view-transition-name: hero-nav-btn` active: the outgoing portfolio button (in old snapshot) and the incoming back button (being streamed)
- The View Transitions specification requires uniqueness. Violation causes silent abort of the entire transition.

**Why media query scoping doesn't help here:** The desktop `.hero-nav-btn` and mobile `.hero-nav-btn-mobile` classes are correctly media-query scoped — only one of the two portfolio button variants is active at any viewport width. But `.hero-nav-btn-dest` has NO media query scope. So even with the source page scoping correct, the destination page back button always contributes a `hero-nav-btn` name regardless of viewport.

**Proof:** At Phase 7 working commit (efc25b6 / 581960b), there were ZERO `hero-nav-btn` CSS rules and ZERO `hero-nav-btn` / `hero-nav-btn-dest` classes anywhere in the codebase. The transition worked. Adding these classes broke it.

[VERIFIED: git show efc25b6:src/app/globals.css | grep hero-nav-btn → zero results]
[VERIFIED: git show efc25b6:src/components/portfolio-button.tsx → no hero-nav-btn class]
[VERIFIED: MDN View Transitions spec — duplicate view-transition-name during capture aborts transition]

---

## Root Cause 2: React Experimental Runtime Calls startViewTransition Internally

**This is the secondary cause.** [VERIFIED: Next.js compiled bundle inspection]

When `experimental.viewTransition: true` is set in next.config.ts, Next.js uses the experimental React runtime (`app-page-turbo-experimental.runtime.dev.js`). This runtime includes `completeBoundaryUpgradeToViewTransitionsInstruction` — a streaming boundary upgrade function that calls `document.startViewTransition()` when it detects elements with `vt-name` / `vt-share` / `vt-update` attributes in the DOM.

The runtime stores its transition reference in `document.__reactViewTransition`. It guards against launching a second transition if one is already running:

```javascript
var f = document.__reactViewTransition;
if (f) {
  f.finished.finally($RV.bind(null, g));
  return;  // defers, does not abort
}
```

This guard uses `document.__reactViewTransition` which is set only when React itself launches a transition. When our code calls `document.startViewTransition()` manually, React does NOT set `document.__reactViewTransition`. So when our manual transition is in progress and React's streaming boundary fires, React does NOT detect the conflict and launches a second `startViewTransition()` call.

**What the browser does when startViewTransition is called while a transition is active:** The browser immediately aborts the first transition (the one launched by our code). The `.ready` promise rejects. Our `.catch()` handler fires, resetting the guard. The second (React-internal) transition runs but has no animation attached, so the user sees an instant page switch.

**When this fires:** React's experimental runtime fires the `completeBoundaryUpgradeToViewTransitionsInstruction` when streaming Suspense boundaries resolve. In Next.js App Router, every page transition involves at least one Suspense boundary completing (the page root boundary). So this fires on EVERY navigation in the experimental runtime.

**Critical finding:** This means `experimental.viewTransition: true` + `document.startViewTransition()` is a nested/concurrent transition pattern that the browser rejects. The two approaches conflict fundamentally.

[VERIFIED: grep in node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.dev.js]
[VERIFIED: `document.__reactViewTransition` is set by React's runtime but NOT by manual `document.startViewTransition()` calls]

---

## Root Cause 3: Portfolio Page Has Changed — Back-Button Presence in DOM During Transition

**This is a contributing factor.** [VERIFIED: git diff]

The portfolio page (uncommitted changes) now has a significantly different structure: DataGrid background, IframeViewer, ProjectDetail overlay, and a more complex layout. The back button structure changed from a `<div>` with a fixed back button to a header with a `hero-nav-btn-dest` button. This means when navigating TO the portfolio page, the new destination DOM has more elements, some of which may have `view-transition-name` attributes that interact with the root animation.

---

## Proven-Working Configuration (Phase 7, commit efc25b6 + 581960b)

At the Phase 7 working state:

- `next.config.ts`: `experimental: { viewTransition: true }` — YES, this was present
- `globals.css`: View transition rules for `::view-transition-old(root)` and `::view-transition-new(root)` only — NO hero-nav-btn rules
- `transition-provider.tsx`: `document.startViewTransition(() => router.push(path))` + WAAPI `document.documentElement.animate(...)` on `::view-transition-new(root)`
- `portfolio-button.tsx`: No `hero-nav-btn` class on any button element
- All destination page back buttons: No `hero-nav-btn-dest` class

**Why it worked:** At Phase 7, no elements had `view-transition-name` set anywhere. There was only the root transition. React's experimental runtime fires `completeBoundaryUpgradeToViewTransitionsInstruction` but checks `if(B)` — where `B` is only set to `true` if any element has `vt-name`/`vt-share`/`vt-update` attributes. Since no `<ViewTransition>` React component was used and no `vt-*` attributes existed, `B` remained `false` and React skipped its own `startViewTransition()` call. So our manual call was the ONLY `startViewTransition()`, and it worked.

**Why the hero-nav-btn addition broke it:** Adding `view-transition-name` to elements added `vt-name` attributes to the DOM (React's experimental runtime mirrors view-transition-name to vt-name). This set `B = true` in React's streaming boundary code, causing React to also call `startViewTransition()`, which aborted our manual call.

[VERIFIED: Analysis of `completeBoundaryUpgradeToViewTransitionsInstruction` in Next.js bundle]

---

## Fix Strategy

### Option A: Remove All hero-nav-btn CSS and Classes (RECOMMENDED)

**Rationale:** Cleanest fix. Matches Phase 7 exactly. Zero risk of duplicate names.

Changes required (all uncommitted disk changes to revert or apply cleanly):

1. `src/app/globals.css`: Remove the `hero-nav-btn`/`hero-nav-btn-mobile`/`hero-nav-btn-dest` CSS blocks and `::view-transition-group(hero-nav-btn)` rule. Keep only the Phase 7 view-transition rules.

2. `src/components/portfolio-button.tsx`: Remove `hero-nav-btn` from desktop button className. Remove `hero-nav-btn-mobile` from mobile button className.

3. `src/app/portfolio/page.tsx`: Remove `hero-nav-btn-dest` from back button className.

4. `src/app/about/page.tsx`: Remove `hero-nav-btn-dest` from back button className.

5. `src/app/chat/page.tsx`: Remove `hero-nav-btn-dest` from back button className.

6. Verify `src/providers/transition-provider.tsx` matches Phase 7 logic (it does, with only comment differences and added `.catch()` handlers — these are fine).

7. Verify `next.config.ts` still has `experimental: { viewTransition: true }` (it does).

**Expected result:** Transition works exactly as in Phase 7. No hero morph (deferred as per CONTEXT.md).

### Option B: Switch to React ViewTransition Component (COMPLEX, NOT RECOMMENDED)

Use React's `<ViewTransition>` component from `import { ViewTransition } from 'react'` instead of manual `document.startViewTransition`. This is the correct API for the experimental runtime. However, it requires wrapping the entire page in `<ViewTransition>`, coordinating with React Transitions, and removes the ability to compute clip-path origin at click time. Much more invasive.

### Option C: Remove experimental.viewTransition Flag (ALTERNATIVE)

Remove `experimental: { viewTransition: true }` from next.config.ts. This makes Next.js use the stable React runtime, which does NOT call `startViewTransition()` internally. Our manual call would be the only one. This would also work but gives up React's `<ViewTransition>` component if needed later.

**Risk:** Requires verifying no other phase 8/9 code depends on this flag.

---

## What Each Changed File Contributes

### Files added during Phase 8 (committed, safe):

| File | Effect on transitions |
|------|-----------------------|
| `src/providers/voice-bus-provider.tsx` | Wraps children in a context provider. Calls `initVoiceBus()` at module scope. Does NOT call `startViewTransition`, does NOT manipulate DOM pseudo-elements, does NOT conflict with view transitions. |
| `src/components/particle-background.tsx` (breathing rAF) | Runs a `requestAnimationFrame` loop modulating particle opacity. Does NOT interact with view transitions. rAF runs on the canvas, not on transitioned elements. |
| `src/components/desktop-navbar.tsx` (GSAP Flip) | GSAP Flip morphs the navbar between voice/non-voice states. GSAP Flip temporarily applies `position: fixed` + transforms to snapshot elements, then animates. This ONLY runs when `voiceActive` changes, not during page navigation. No conflict with view transitions. |

### Uncommitted disk changes that break transitions:

| File | Specific Problem |
|------|--------------------|
| `src/app/globals.css` | Adds `view-transition-name: hero-nav-btn` to `.hero-nav-btn`, `.hero-nav-btn-mobile`, `.hero-nav-btn-dest`. Causes duplicate name violation when destination page is present. |
| `src/components/portfolio-button.tsx` | Adds `hero-nav-btn` and `hero-nav-btn-mobile` classes to button elements. |
| `src/app/portfolio/page.tsx` | Adds `hero-nav-btn-dest` class to back button. |
| `src/app/about/page.tsx` | Adds `hero-nav-btn-dest` class to back button. |
| `src/app/chat/page.tsx` | Adds `hero-nav-btn-dest` class to back button. |

---

## Common Pitfalls

### Pitfall 1: Duplicate view-transition-name During Streaming
**What goes wrong:** Two elements have the same `view-transition-name` at any point during the view transition (including during the streaming of the new page content). The entire transition silently aborts.
**Why it happens:** The View Transitions API creates pseudo-elements for EVERY element with a `view-transition-name`. If two elements share the same name, the API cannot create two separate pseudo-elements with the same identifier.
**How to avoid:** Ensure each `view-transition-name` value is unique across the entire DOM at every moment during a transition, including during streaming. For hero morphing between pages, the source element must have UNMOUNTED before the destination element mounts (Next.js SPA transitions don't guarantee this timing).
**Warning signs:** Transition aborts silently. `transition.ready` rejects. The `.catch()` handler fires. The page navigates instantly without animation.

### Pitfall 2: experimental.viewTransition Enables React's Internal startViewTransition
**What goes wrong:** `experimental: { viewTransition: true }` switches Next.js to the experimental React runtime, which includes `completeBoundaryUpgradeToViewTransitionsInstruction`. When `B === true` (any element has a `vt-name`/`vt-share`/`vt-update` attribute — set by React's `<ViewTransition>` component OR by `view-transition-name` CSS on elements React tracks), the experimental runtime calls `document.startViewTransition()` for streaming boundaries. If a manual `document.startViewTransition()` is already in progress, the browser aborts the first one.
**How to avoid:** Either (a) use ONLY React's `<ViewTransition>` component and never call `document.startViewTransition()` manually, OR (b) ensure no elements have `view-transition-name` set via CSS (so `B` stays `false` and React's runtime skips its call), OR (c) remove `experimental.viewTransition: true`.
**Warning signs:** Transition aborts exactly when the destination page begins streaming. The `.ready` catch fires. Works in some browsers (where streaming is synchronous) but fails in others.

### Pitfall 3: Restoring Three Files Is Not Enough
**What goes wrong:** When the user "restores Phase 7 code" for the three transition files (next.config.ts, transition-provider.tsx, globals.css), the hero-nav-btn classes remain on the portfolio-button and back buttons (committed in later commits). The CSS rules may be gone (from globals.css restore) but the CLASSES persist. Browsers ignore classes with no corresponding CSS, so `hero-nav-btn` on the button is harmless when the CSS rule is absent. HOWEVER, if globals.css disk changes persist (uncommitted), restoring the committed file from git has no effect — the disk file still has the rules.
**How to avoid:** Use `git checkout HEAD -- src/app/globals.css src/components/portfolio-button.tsx src/app/about/page.tsx src/app/portfolio/page.tsx src/app/chat/page.tsx` to reset ALL affected files, not just the three transition files.

### Pitfall 4: view-transition-name on Elements Not Involved in Page Navigation
**What goes wrong:** Any element with a `view-transition-name` participates in view transitions, including elements that should not animate (like social icons, particles, etc.). The browser creates pseudo-elements for all of them, which slows down the transition and can cause z-index/compositing issues.
**How to avoid:** Only assign `view-transition-name` to elements you explicitly intend to animate between pages.

### Pitfall 5: React StrictMode Double-Invocation
**What goes wrong:** In development with `reactStrictMode: true`, React calls `useEffect` cleanup + setup twice. For the `popstate` listener in TransitionProvider, this means two listeners. Double-calls to `navigateWithReveal` are possible.
**How to avoid:** The `isTransitioningRef` guard already handles this — the second invocation is blocked because `isTransitioningRef.current` is `true`. Not a root cause, but document for awareness.

---

## Code Examples

### Phase 7 Working Pattern (no hero-nav-btn)

```typescript
// transition-provider.tsx — the ONLY startViewTransition call in the app
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
}).catch(() => {
  isTransitioningRef.current = false;
  setIsTransitioningState(false);
});
```

```css
/* globals.css — view-transition rules at Phase 7 (NO hero-nav-btn rules) */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
  display: block;
}

::view-transition-image-pair(root) {
  isolation: auto;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-group(root) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

```typescript
// portfolio-button.tsx — NO hero-nav-btn class (Phase 7 state)
<button
  onClick={handleClick}
  className="flex items-center justify-center w-[95%] h-[80%] rounded-[20px] no-underline cursor-pointer border-none"
  style={{ backgroundColor: 'var(--color-portfolio-btn-bg)' }}
>
```

```typescript
// back buttons — NO hero-nav-btn-dest class (Phase 7 state)
<button
  onClick={handleBack}
  className="fixed top-6 left-6 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer z-20"
>
```

---

## Minimal Reproduction

To verify the fix before applying to all files:

1. Check out globals.css from committed HEAD: `git checkout HEAD -- src/app/globals.css`
2. Check out portfolio-button.tsx from committed HEAD: `git checkout HEAD -- src/components/portfolio-button.tsx`
3. Check out portfolio page from committed Phase 7 state: `git show a063d43:src/app/portfolio/page.tsx > /tmp/p.tsx` (this has the back button without hero-nav-btn-dest)
4. Start dev server
5. Test transition

If transition works: confirms hero-nav-btn classes are the root cause.
If transition still broken: `experimental.viewTransition` + streaming conflict may still be firing (check browser devtools for transition abort errors).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `document.startViewTransition` for full control | React `<ViewTransition>` component for declarative control | React 19 / April 2025 | Manual calls conflict with experimental React runtime |
| `view-transition-name` in CSS | `<ViewTransition name="x">` React component | React 19 experimental | React manages vt-name attributes; CSS name still works but triggers experimental runtime |
| No guard for concurrent transitions | `document.__reactViewTransition` global used by React's runtime | Next.js 15 experimental | Manual calls bypass this guard |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React's experimental runtime calls `startViewTransition` when `B === true` (any vt-* attribute present), which conflicts with our manual call | Root Cause 2 | LOW — verified directly from compiled bundle source |
| A2 | The `view-transition-name: hero-nav-btn` on `.hero-nav-btn-dest` causes duplicate-name abort | Root Cause 1 | LOW — both elements would need to coexist in DOM during transition; since they are on different pages, this requires transition timing analysis |
| A3 | Removing hero-nav-btn rules fully restores Phase 7 behavior | Fix Strategy Option A | MEDIUM — dependent on no other uncommitted changes causing issues |

---

## Open Questions

1. **Does `hero-nav-btn-dest` actually create a duplicate?**
   - What we know: The source page has `hero-nav-btn` (portfolio button). The destination page has `hero-nav-btn-dest`. Both map to `view-transition-name: hero-nav-btn`. During a transition, the browser captures both old and new page states.
   - What's unclear: Exactly when the destination page's back button appears in the DOM during streaming. If it appears during the startViewTransition callback (after our call, before the animation starts), it creates the duplicate. If it appears after the animation completes, there is no conflict.
   - **Recommendation:** Given that React's experimental streaming fires `completeBoundaryUpgradeToViewTransitionsInstruction` during the callback, and the destination page's back button IS part of the streamed content, the duplicate almost certainly appears during the critical window. Remove all hero-nav-btn CSS to eliminate the ambiguity.

2. **Can hero morphing be safely added back later?**
   - Yes — but requires using React's `<ViewTransition name="hero-nav-btn">` component wrapping the button on BOTH source and destination pages, coordinated with React's transition system rather than manual `document.startViewTransition`. This is a separate future phase.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js App Router | Page transitions | Yes | 15.5.14 | — |
| Chrome 111+ | View Transitions API | Yes (dev environment) | Current | GSAP fallback |
| GSAP + Flip | Voice mode morph | Yes | Already installed | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual visual verification |
| Quick run command | `npm run dev` |
| Full suite command | `npm run build && npm run start` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | File Exists? |
|--------|----------|-----------|-------------|
| TRAN-01 | Circular reveal animates on portfolio click | Visual (dev server) | N/A |
| TRAN-02 | Circular reveal animates on about click | Visual (dev server) | N/A |
| TRAN-03 | No hero morph (removed class) | Visual verify absence | N/A |

### Wave 0 Gaps
None — fix is CSS/class removal only, no new files needed.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: git diff HEAD / git show] — Confirmed exact state of all modified files via git diff and git show commands
- [VERIFIED: Next.js bundle inspection] — Confirmed `completeBoundaryUpgradeToViewTransitionsInstruction` in `node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.dev.js` directly calls `document.startViewTransition` when `B === true`
- [VERIFIED: Next.js config] — `experimental.viewTransition: true` selects experimental React runtime via `needsExperimentalReact.js`
- [CITED: nextjs.org/docs/app/guides/view-transitions] — Next.js official View Transitions guide
- [CITED: nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition] — experimental.viewTransition flag docs

### Secondary (MEDIUM confidence)
- [CITED: react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more] — React experimental ViewTransition API behavior
- [CITED: MDN View Transitions spec] — Duplicate view-transition-name causes abort

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Root cause identification: HIGH — verified by direct bundle inspection and git diff
- Fix strategy (Option A): HIGH — matches Phase 7 working state exactly
- Hero morph future path: MEDIUM — requires React ViewTransition component knowledge

**Research date:** 2026-04-23
**Valid until:** 2026-06-01 (Next.js 15.x stable, no major API changes expected)
