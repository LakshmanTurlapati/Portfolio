# Phase 7: Circular Reveal Transition - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 07-circular-reveal-transition
**Areas discussed:** Reveal strategy, Browser fallback, Back navigation, Animation tuning

---

## Reveal Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| View Transitions API | Use document.startViewTransition + clip-path circle on ::view-transition-new(root). Closest to Flutter. Fall back to current solid-color overlay for unsupported browsers. | ✓ |
| Keep solid-color overlay | Keep existing GSAP overlay -- doesn't show real page content inside circle but works everywhere | |
| Portal dual-render | Mount destination in portal, clip-path, then router.push. High complexity, architecturally fragile. | |

**User's choice:** View Transitions API (Recommended)
**Notes:** Research confirmed this is structurally equivalent to Flutter's ClipPath behavior -- browser snapshots old page, renders new page inside expanding circle.

---

## Browser Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Progressive enhancement | View Transitions primary; fall back to existing GSAP solid-color overlay via feature detection. Two code paths but both already exist. | ✓ |
| View Transitions only | No fallback -- accept Safari may have imperfect clip-path animations. Simplest code. | |
| Framer Motion fallback | Use Framer Motion AnimatePresence for cross-browser clip-path. Adds ~40KB dependency. | |

**User's choice:** Progressive enhancement (Recommended)
**Notes:** Research revealed View Transitions API (SPA) is now Baseline Newly Available (Oct 2025) with full cross-browser support. Fallback is safety net, not primary path.

---

## Back Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Reveal from center | Intercept popstate, trigger navigateWithReveal from screen center. Symmetric UX, reuses existing code, no history hacking. | ✓ |
| Instant back | Browser back just navigates instantly -- no reveal. Asymmetric but zero risk. | |
| True reverse animation | Intercept popstate, re-push, play reverse from original origin. Fragile history manipulation. | |

**User's choice:** Reveal from center (Recommended)
**Notes:** Track previousPath in useRef, listen to popstate read-only, call navigateWithReveal with screen center as origin.

---

## Animation Tuning

| Option | Description | Selected |
|--------|-------------|----------|
| Keep all, upgrade guard | 500ms, power2.inOut, center-of-element origin. Upgrade isTransitioning from useState to useRef. | ✓ |
| Shorten to 400ms | Slightly snappier feel | |
| Try power3.out easing | Faster initial burst, gentle settle | |

**User's choice:** Keep all, upgrade guard (Recommended)
**Notes:** All current values match Flutter source and sit within industry-recommended ranges. Only change: useRef for race-condition safety.

---

## Claude's Discretion

- Web Animations API keyframe structure for ::view-transition-new(root) clip-path
- CSS styling for view-transition pseudo-elements
- GSAP fallback code organization alongside View Transitions path
- Whether to use view-transition-name for per-element transitions

## Deferred Ideas

None -- discussion stayed within phase scope.
