---
phase: 06-home-page-and-ambient-backgrounds
plan: "02"
subsystem: home-page
tags: [chat, popup, overlay, particles, navbar]
dependency_graph:
  requires: []
  provides: [ChatPopup overlay, chatOpen state wiring, onAskParz prop chain, particle cleanup audit]
  affects: [src/app/page.tsx, src/components/desktop-navbar.tsx, src/components/mobile-navbar.tsx, src/components/particle-background.tsx]
tech_stack:
  added: []
  patterns: [useChat from @ai-sdk/react, chatOpen state gate, mounted && chatOpen hydration guard, popupIn/fadeIn keyframe animations, inline style popup panel]
key_files:
  created:
    - src/components/chat-popup.tsx
  modified:
    - src/app/page.tsx
    - src/components/desktop-navbar.tsx
    - src/components/mobile-navbar.tsx
    - src/components/particle-background.tsx
decisions:
  - ChatPopup uses same useChat + sanitizeText + linkifyText infrastructure as chat/page.tsx to avoid duplicate API integration code
  - ChatPopup keyframes injected via <style> tag (not globals.css) to avoid scope conflicts with other components
  - AskParzButton on mobile rendered in a new flex-[2] slot between About Me and social icons — label hidden at mobile width via existing max-[760px]:hidden class on the button itself
  - Particle cleanup audit: all three steps (destroypJS → clear pJSDom → remove canvas) confirmed present and in correct order — comment added, no code changes needed
metrics:
  duration: "~3 minutes"
  completed: "2026-04-24"
  tasks_completed: 2
  files_changed: 5
---

# Phase 06 Plan 02: ChatPopup Overlay and Particle Cleanup Audit Summary

**One-liner:** ChatPopup overlay with useChat streaming, suggestion chips, and popupIn animation wired to Ask Parz button on both desktop and mobile navbars.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create ChatPopup component and wire chatOpen state through page.tsx + navbars | e343fe0 | src/components/chat-popup.tsx (new), src/app/page.tsx, src/components/desktop-navbar.tsx, src/components/mobile-navbar.tsx |
| 2 | Audit particle-background.tsx for theme-change canvas cleanup correctness | 61b350c | src/components/particle-background.tsx |

## What Was Built

### Task 1: ChatPopup Overlay + Navbar Wiring

**ChatPopup component** (`src/components/chat-popup.tsx`):
- Props: `{ isDark: boolean, onClose: () => void }`
- Uses `useChat` from `@ai-sdk/react` — same hook as `chat/page.tsx`, routes to `/api/chat`
- Suggestion chips: 1 random small question + 1 random big question from existing data arrays, hidden after `userMessageCount >= 2` or after a chip is clicked
- Loading state: three-dot wave animation (`dot-wave-popup` keyframe) + rotating `loadingMessages[loadingMsgIndex]` with shimmer text effect
- AI responses sanitized via `sanitizeText()` (T-06-04 XSS mitigation), then linkified via `linkifyText()`
- User messages rendered as plain text strings (no XSS risk)
- Backdrop: `position: fixed; inset: 0; z-index: 40; background: rgba(42,42,42,0.3); backdrop-filter: blur(2px)` — clicking closes popup
- Panel: `position: fixed; left: 50%; bottom: 20px; width: min(720px, calc(100vw - 40px)); max-height: 70vh; backdrop-filter: blur(14px)` with `popupIn` animation
- Keyframes (`popupIn`, `fadeIn`, `dot-wave-popup`, `popup-shimmer`) injected via `<style>` tag scoped to this component

**page.tsx updates**:
- Added `chatOpen` state
- Passes `onAskParz={() => setChatOpen(true)}` to both `DesktopNavbar` and `MobileNavbar`
- Renders `{mounted && chatOpen && <ChatPopup isDark={isDark} onClose={() => setChatOpen(false)} />}` — gated on `mounted` to prevent SSR hydration mismatch (T-06-07 mitigation)

**DesktopNavbar**: Added `onAskParz: () => void` prop to interface, replaced `onClick={() => { /* voice mode placeholder */ }}` with `onClick={onAskParz}` on `AskParzButton`.

**MobileNavbar**: Added `onAskParz` prop, imported `AskParzButton`, inserted in new `flex-[2]` slot between About Me center section and social icons. The button's label (`Parz`) is already hidden at mobile widths via `max-[760px]:hidden` — only the green dot shows in the compact navbar.

### Task 2: Particle Background Cleanup Audit

Confirmed all three required cleanup steps exist in the correct order before `particlesJS()` call:
1. `window.pJSDom.forEach(p => p.pJS.fn.vendors.destroypJS())` — destroys all existing pJS instances
2. `window.pJSDom = []` — clears the pJSDom array
3. `containerRef.current.querySelector('canvas')?.remove()` — removes stale canvas element

`useEffect` dependency array `[isDark, mounted]` confirmed correct — both values trigger re-init on change.

Particles config values unchanged: 90 nodes, speed 1.2, line distance 150, grab distance 200.

Added comment `// Verified: cleanup correct per Phase 6 audit` above the cleanup block. No functional changes needed.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-06-04 (XSS in ChatPopup) | Mitigated | `sanitizeText()` applied to all assistant messages before rendering |
| T-06-05 (ElevenLabs key disclosure) | Accepted | No ElevenLabs code introduced in this plan |
| T-06-06 (DoS via /api/chat) | Accepted | Existing rate limiting at xAI layer, no changes needed |
| T-06-07 (ChatPopup hydration) | Mitigated | `mounted && chatOpen` conditional gate prevents SSR hydration mismatch |

## Known Stubs

None — ChatPopup connects directly to `/api/chat` via `useChat` hook.

## Self-Check: PASSED

- `src/components/chat-popup.tsx` exists and exports `ChatPopup` — FOUND
- `src/app/page.tsx` contains `chatOpen` state — FOUND (line 22)
- `src/app/page.tsx` renders ChatPopup — FOUND (lines 120-122)
- `src/components/desktop-navbar.tsx` accepts `onAskParz` prop — FOUND (line 18)
- `src/components/mobile-navbar.tsx` renders `AskParzButton` — FOUND (line 68)
- Particle cleanup verified — FOUND (destroypJS line 56, pJSDom=[] line 58)
- TypeScript compiles without errors — PASSED
- Commit e343fe0 exists — CONFIRMED
- Commit 61b350c exists — CONFIRMED
