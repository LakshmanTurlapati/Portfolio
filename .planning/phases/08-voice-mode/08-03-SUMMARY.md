---
phase: 08-voice-mode
plan: 03
subsystem: ui
tags: [voice, gsap, flip, animation, navbar-morph, react, typescript, web-speech-api, voice-wave, voice-panel]

# Dependency graph
requires:
  - phase: 08-voice-mode
    plan: 01
    provides: window.VoiceBus singleton (pub/sub, level events, state machine)
  - phase: 08-voice-mode
    plan: 02
    provides: useVoiceController hook (voiceProps, active, open, close, micDenied)
provides:
  - VoiceWave component — 5-bar rAF-driven waveform with exact prototype formula subscribed to VoiceBus.level
  - VoicePanel component — navbar capsule content with state chip, caption, mic button, action buttons
  - Desktop navbar with GSAP Flip morph (630x60 -> 760x72) when voiceActive
  - Mobile navbar with CSS height transition (70px -> 140px) when voiceActive
  - page.tsx wired to useVoiceController — AskParz button opens/closes voice mode
affects:
  - 08-04 (particle breathing rAF reads VoiceBus.level, VoiceWave already driving it)
  - 08-05 (end-to-end voice flow testing depends on VoicePanel + navbar morph)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GSAP Flip morph pattern: Flip.getState() before class toggle, Flip.from() to animate — captures layout before DOM change"
    - "VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'> — navbar injects theme/mic fields so controller voiceProps type matches cleanly"
    - "gsap/all import for Flip — avoids macOS case-insensitive filesystem TS2306 error with gsap/Flip vs gsap/flip casing conflict"
    - "rAF + VoiceBus.level dual subscription in VoiceWave — t state drives animation timing, level state drives amplitude"

key-files:
  created:
    - src/components/voice-wave.tsx
    - src/components/voice-panel.tsx
  modified:
    - src/components/desktop-navbar.tsx
    - src/components/mobile-navbar.tsx
    - src/app/page.tsx

key-decisions:
  - "Import Flip from 'gsap/all' instead of 'gsap/Flip' — macOS case-insensitive FS caused TS1149 casing conflict between gsap/types/Flip.d.ts and flip.d.ts; gsap/all exports Flip cleanly without the casing ambiguity"
  - "VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'> in both navbars — useVoiceController.voiceProps doesn't carry isDark/micDenied (those come from the navbar's own context), so the navbar prop type must exclude them"
  - "voiceActive ? 'w-[760px] h-[72px]' : 'w-[630px] h-[60px]' Tailwind conditional classes on nav element in addition to GSAP Flip — ensures correct final state even if GSAP is skipped (prefers-reduced-motion)"

patterns-established:
  - "Pattern: GSAP Flip + CSS fallback dual approach — GSAP Flip.from() handles animated morph, CSS classes define final dimensions for both animated and jump-cut paths"
  - "Pattern: navbar voice overlay — absolute inset-0 VoicePanel overlays default content; default content fades via opacity transition; both exist in DOM simultaneously"

requirements-completed: [VOIC-01, VOIC-02, VOIC-03, VOIC-04, VOIC-05]

# Metrics
duration: 8min
completed: 2026-04-24
---

# Phase 8 Plan 03: Voice UI Layer Summary

**VoiceWave 5-bar rAF waveform + VoicePanel state capsule wired into GSAP Flip desktop navbar morph (630x60 to 760x72) and CSS height mobile navbar expansion (70px to 140px), with AskParz button toggling useVoiceController**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-24T06:37:00Z
- **Completed:** 2026-04-24T06:45:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- VoiceWave renders 5 bars with exact prototype formula (baseHeights [0.32, 0.62, 1.0, 0.62, 0.32], phase/wobble math, transform-origin bottom), driven by window.VoiceBus.level via pub/sub subscription
- VoicePanel shows state chip with prototype colors (idle=#8fbcff, listening=#ff8f8f, thinking=#ffd58f, speaking=#8fffb6), vmDotBlink keyframes, mic button with listening glow, caption text, and 3 action buttons (chat/stop/close)
- Desktop navbar morphs from 630x60px pill to 760x72px capsule via GSAP Flip with prefers-reduced-motion jump-cut fallback; default content fades out via opacity transition
- Mobile navbar expands from h-[70px] to h-[140px] via CSS height transition; VoicePanel fills expanded area
- page.tsx wired: useVoiceController receives goPage (navigateWithReveal), openTextChat (setChatOpen), currentPage='home'; AskParz button now toggles voice mode open/close

## Task Commits

Each task was committed atomically:

1. **Task 1: VoiceWave and VoicePanel components** - `afae43d` (feat)
2. **Task 2: Wire navbars and page.tsx** - `705f82e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/voice-wave.tsx` - 5-bar rAF waveform with exact prototype formula, VoiceBus.level subscription
- `src/components/voice-panel.tsx` - State capsule with mic button, waveform, state chip, caption, action buttons, mic-denied CTA
- `src/components/desktop-navbar.tsx` - Added GSAP Flip morph (760x72 voice-active), VoicePanel overlay, new voiceActive/voiceProps/micDenied props
- `src/components/mobile-navbar.tsx` - Added CSS height transition (h-[140px] voice-active), VoicePanel in expanded area, new voice props
- `src/app/page.tsx` - useVoiceController wired with goPage/openTextChat/currentPage; handleAskParz toggles voice mode

## Decisions Made
- Imported `Flip` from `'gsap/all'` instead of `'gsap/Flip'` — macOS case-insensitive filesystem caused TS1149 error (Flip.d.ts vs flip.d.ts casing conflict); `gsap/all` exports Flip with correct typing and no casing ambiguity
- Defined `VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>` in both navbar files — the controller's `voiceProps` shape does not include `isDark` or `micDenied` (those are injected by the navbar from its own theme context and prop), so the navbar prop interface must use this reduced type to satisfy TypeScript

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GSAP Flip import casing conflict (TS1149)**
- **Found during:** Task 2 (TypeScript verification after adding desktop-navbar imports)
- **Issue:** `import { Flip } from 'gsap/Flip'` triggered TS1149 — macOS case-insensitive FS sees `gsap/types/Flip.d.ts` and `gsap/types/flip.d.ts` as the same file; TypeScript raises a casing conflict error
- **Fix:** Changed import to `from 'gsap/all'` which declares and exports `Flip` without the conflicting path
- **Files modified:** src/components/desktop-navbar.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 705f82e (Task 2 commit)

**2. [Rule 1 - Bug] VoicePanelProps mismatch on voiceProps navbar prop**
- **Found during:** Task 2 (TypeScript verification after wiring page.tsx)
- **Issue:** Navbar props typed `voiceProps?: VoicePanelProps` but useVoiceController returns voiceProps without `isDark` and `micDenied` (the navbar supplies those itself) — TS2739 missing properties error
- **Fix:** Defined `VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>` in both navbars; the navbar spreads voiceProps then adds isDark and micDenied when rendering VoicePanel
- **Files modified:** src/components/desktop-navbar.tsx, src/components/mobile-navbar.tsx
- **Verification:** `npx tsc --noEmit` exits 0, `npm run build` succeeds
- **Committed in:** 705f82e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2x Rule 1 — TypeScript type/import correctness)
**Impact on plan:** Both fixes required for TypeScript correctness. Runtime behavior identical to plan intent. No scope creep.

## Issues Encountered
- GSAP Flip import path has a macOS-specific casing issue that does not appear on Linux. Future plans should use `gsap/all` for Flip imports on this project to avoid the issue.

## User Setup Required
None — all voice UI components depend only on window.VoiceBus (Plan 01) and useVoiceController (Plan 02). No new environment variables or external services.

## Known Stubs
None — all voice UI features are fully wired. VoiceWave drives from live VoiceBus.level. VoicePanel state chip colors match prototype exactly. Navbar morphs are functional. AskParz button wired to useVoiceController.

## Next Phase Readiness
- Voice UI layer is complete: VoiceWave + VoicePanel render correctly inside morphed navbars
- useVoiceController is wired in page.tsx with goPage, openTextChat, currentPage
- Plans 04 and 05 can proceed: particle breathing (reads VoiceBus.level already available), end-to-end testing

---
*Phase: 08-voice-mode*
*Completed: 2026-04-24*
