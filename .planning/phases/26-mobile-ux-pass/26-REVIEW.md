---
phase: 26-mobile-ux-pass
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/particle-background.tsx
  - src/components/chat-popup.tsx
  - src/components/project-detail.tsx
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed three components touched by the Mobile UX Pass (MOB-01/02/03). The implementation cleanly follows the locked decisions in `26-CONTEXT.md` and `26-UI-SPEC.md`:

- `particle-background.tsx` correctly integrates `useMediaQuery('(max-width: 768px)')`, gates particle count to 45 on mobile / 90 elsewhere, threads `isMobile` into the `useEffect` dep array, and reuses the existing destroy/reinit teardown (lines 73-80) on breakpoint cross. The breathing rAF loop is unchanged and inherits the new lower count, matching the LOCKED "no fps cap on mobile" decision.
- `chat-popup.tsx` adds `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"`, the `onFocus` handler with the 300 ms `setTimeout` calling `scrollIntoView({ block: 'center', behavior: 'smooth' })`, and `paddingBottom: 'max(16px, env(safe-area-inset-bottom))'` on the input wrapper -- all per spec, no left/right safe-area inset (matches landscape-deferred decision).
- `project-detail.tsx` applies the `px-4 md:px-8 lg:px-14` ladder on header/body/footer, full-bleed cover image with `-mx-4 md:mx-8 lg:mx-14` and `rounded-none md:rounded-[14px]`, replaces the inline `gridTemplateColumns` with `grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]`, and steps display sizes (`text-[40px] md:text-[44px] lg:text-[56px]`, etc.). At `lg+` every numeric value matches the prior desktop layout, satisfying the pixel-identical desktop mandate.

No critical bugs or security issues were found. The findings below are pre-existing concerns mostly outside the strict phase scope (kept for the executor's awareness) and a small number of low-impact issues introduced or untouched by this phase's changes.

## Warnings

### WR-01: Stale `containerRef.current` snapshot in `useEffect` cleanup

**File:** `src/components/particle-background.tsx:201-204`
**Issue:** The cleanup function reads `containerRef.current` directly at teardown time. By the time the cleanup runs (when `isMobile`/`isDark` changes, or on unmount), React may have already detached the ref (especially on unmount), so `__vmTick?.()` can no-op and leak the rAF that was attached to that container instance. This is a classic React effect-cleanup pitfall; the ESLint `react-hooks/exhaustive-deps` rule warns about this pattern. The phase's MOB-01 changes add `isMobile` as a new dep, increasing how often this effect tears down -- so the latent issue gets exercised more on mobile breakpoint crosses.
**Fix:** Capture the container into a local variable inside the effect body before scheduling work, then close over that local in cleanup:
```tsx
useEffect(() => {
  if (!mounted) return;
  const container = containerRef.current; // snapshot
  let destroyed = false;

  const init = () => {
    if (destroyed || !container || !window.particlesJS) return;
    // ... use `container` instead of `containerRef.current` throughout
  };

  ensureParticlesScript().then(init).catch(() => {});

  return () => {
    destroyed = true;
    try { (container as ParticleContainer | null)?.__vmTick?.(); } catch {}
  };
}, [isDark, mounted, isMobile]);
```
Also pass `container` into the inner `waitForInst` closure rather than re-reading `containerRef.current` at line 191 -- on a fast breakpoint flip the ref may be pointing at a re-mounted node.

### WR-02: `setTimeout` inside `waitForInst` is never cancelled on dep change

**File:** `src/components/particle-background.tsx:115-120`
**Issue:** `waitForInst` polls via `setTimeout(..., 50)` up to 40 times. When the effect re-runs (e.g. `isMobile` flips on a viewport rotation while particlesJS is still loading), `breathCancelled` from the new closure is a different variable -- the old chain keeps polling and may eventually bind a `tick()` to a destroyed instance, racing with the new effect's `waitForInst`. The destroyed flag prevents `init` from doing damage on the stale path, but `waitForInst` does not check `destroyed`; it only checks the local `breathCancelled` (which is set by `__vmTick`, but only AFTER the first `tick()` has run -- before the rAF starts the cancellation handle is not yet exposed at line 192-194).
**Fix:** Track the timeout id and clear it from the cleanup, and make `waitForInst` honor `destroyed` too:
```tsx
let breathCancelled = false;
let waitTimer: ReturnType<typeof setTimeout> | undefined;
const waitForInst = (tries = 0) => {
  if (breathCancelled || destroyed) return;
  // ...
  if (!inst?.particles?.array?.length) {
    if (tries < 40) {
      waitTimer = setTimeout(() => waitForInst(tries + 1), 50);
      return;
    }
    return;
  }
  // ...
};
// inside cleanup, clear waitTimer too
return () => {
  destroyed = true;
  if (waitTimer) clearTimeout(waitTimer);
  try { (container as ParticleContainer | null)?.__vmTick?.(); } catch {}
};
```

### WR-03: `scrollIntoView` setTimeout has no cancellation if input unmounts

**File:** `src/components/chat-popup.tsx:515-519`
**Issue:** `onFocus` schedules a 300 ms `setTimeout` that calls `inputRef.current?.scrollIntoView(...)`. If the user closes the popup (e.g. taps the backdrop) within that window, the timeout still fires. The optional-chaining on `inputRef.current` makes this safe (the ref is null after unmount, so it short-circuits), but if the parent has already unmounted the popup and remounted a new chat instance, the old timer fires against whatever node the ref currently points at -- normally harmless, but on iOS this can briefly fight the keyboard dismissal animation. Not a crash, but worth tightening since the phase explicitly owns this codepath.
**Fix:** Track the timer and clear it in the input's `onBlur` or in a top-level effect cleanup:
```tsx
const focusScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// in onFocus:
onFocus={() => {
  if (focusScrollTimer.current) clearTimeout(focusScrollTimer.current);
  focusScrollTimer.current = setTimeout(() => {
    inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 300);
}}

// add cleanup effect:
useEffect(() => () => {
  if (focusScrollTimer.current) clearTimeout(focusScrollTimer.current);
}, []);
```
This is a minor hardening; if the executor is comfortable with the optional-chain guard the current code is acceptable.

## Info

### IN-01: Duplicate `Window` declaration creates a typing seam

**File:** `src/components/particle-background.tsx:9-27`
**Issue:** `declare global { interface Window { ... } }` augments the global `Window` interface with `particlesJS` and `pJSDom`. This works, but the same component-scope augmentation pattern is used in `src/providers/site-control-provider.tsx:45-47` and the canonical place for ambient declarations is `src/types/voice-bus.d.ts`. Keeping these inline makes the global type contract harder to find. Pre-existing -- this phase did not touch it -- but worth flagging for a future cleanup.
**Fix:** Move the `particlesJS` / `pJSDom` declarations into a new `src/types/particles.d.ts` (mirror the `voice-bus.d.ts` shape). No runtime impact; pure ergonomics.

### IN-02: `pJSDom` indexing assumes most-recent entry is ours

**File:** `src/components/particle-background.tsx:117`
**Issue:** `(window.pJSDom || []).slice(-1)[0]` grabs the last pJS instance globally. If any other particle-mounted component ever exists, this breaks. There is currently only one particle background in the app, so this is fine in practice, but the phase's reinit cycle on breakpoint cross briefly creates a window where `pJSDom` could contain a still-being-destroyed entry. Pre-existing -- not introduced by Phase 26.
**Fix:** Either track the index returned by `particlesJS()` (the library pushes onto `pJSDom` synchronously) or look up the entry whose canvas lives inside `containerRef.current`. Defer until a second particle instance is needed.

### IN-03: `<img>` instead of `next/image` on cover image

**File:** `src/components/project-detail.tsx:171`
**Issue:** `<img src={project.image} ...>` bypasses Next.js image optimization. On mobile (where MOB-03 makes the cover full-bleed at the device width), this is the most visible image on the screen -- sending an unoptimized PNG hurts mobile LCP. Pre-existing, but mobile UX phase is the natural place to flag it. Out of scope for this phase per CONTEXT.md ("interaction-and-layout-only").
**Fix:** Convert to `next/image` with explicit width/height or `fill`, sized via the parent `aspect-video` container. Defer to a perf pass.

### IN-04: 36x36 close button is below the 44x44 mobile touch-target ideal

**File:** `src/components/project-detail.tsx:64`
**Issue:** UI-SPEC dimension lists this as conditionally widenable to `w-11 h-11` on mobile if "visual review during execution shows it cramped" (line 230). The implementer left it at 36x36 -- which is acceptable per spec, but worth a manual visual pass on iPhone SE (375 px) where the panel chrome can feel tight near the rounded corner.
**Fix:** If visual QA flags cramping, swap to:
```tsx
className="absolute top-5 right-5 w-9 h-9 md:w-9 md:h-9 ... [or] w-11 h-11 md:w-9 md:h-9 ..."
```
No change needed if QA passes.

### IN-05: `onError` callback is empty on `useChat`

**File:** `src/components/chat-popup.tsx:124-126`
**Issue:** `onError: () => { /* Error handled via the error state from the hook */ }` is documented as intentional, and the side effect (random Parz error message) does happen via the `useEffect` watching `error`. The empty body is fine, but an empty function with only a comment can read as dead code to future readers. Pre-existing; phase did not introduce it.
**Fix (optional):** Drop the prop entirely; the hook's default no-op behavior is identical. Or replace with a single-line note like `// no-op: see useEffect on [error] below`.

### IN-06: `inputRef.current?.focus()` on mount can trigger iOS keyboard prematurely

**File:** `src/components/chat-popup.tsx:184-186`
**Issue:** The mount-time `focus()` call runs unconditionally. On iOS Safari, programmatic `focus()` outside a user-gesture frame is generally ignored for triggering the keyboard, but on Android Chrome it CAN open the keyboard the moment the popup mounts. Combined with the new 300 ms scroll-into-view in `onFocus`, this means the popup-open animation (`popupIn 0.4s`) overlaps with a keyboard slide-up plus a smooth scroll on Android. Pre-existing behavior -- the phase did not change it -- but the new `onFocus` handler now amplifies the sequence.
**Fix (optional):** Gate the auto-focus on `!isMobile`, or skip it when `useMediaQuery('(max-width: 768px)')` returns true:
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
useEffect(() => {
  if (!isMobile) inputRef.current?.focus();
}, [isMobile]);
```
Defer if visual QA shows the current behavior reads cleanly.

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
