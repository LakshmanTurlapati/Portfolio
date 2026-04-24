---
phase: 13-tool-callbacks-and-visual-feedback
plan: "02"
subsystem: voice
tags: [voice, visual-feedback, voiceglow, voicebus, css-animations, monochrome, typescript]
dependency_graph:
  requires:
    - VoiceBus tool-executing/tool-success/tool-error signals (Plan 01)
  provides:
    - VoiceGlow component — viewport border glow driven by VoiceBus state
    - voiceGlowBreath and voiceGlowSuccess CSS keyframes in globals.css
    - voice-glow-* utility classes using --glow-color CSS custom property
  affects:
    - src/components/voice-glow.tsx
    - src/app/globals.css
    - src/app/layout.tsx
tech_stack:
  added: []
  patterns:
    - CSS custom property (--glow-color) set via inline style for theme-aware monochrome glow
    - useMounted guard before VoiceBus subscription (matches voice-overlay.tsx pattern)
    - functional state update (prev => ...) to preserve executing/error glow during VoiceState transitions
    - setTimeout-based one-shot success animation reset (1000ms matching keyframe duration)
key_files:
  created:
    - src/components/voice-glow.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
decisions:
  - --glow-color CSS custom property set on the div via inline style from resolvedTheme — avoids duplicating dark/light logic in CSS; single source of truth in component
  - functional setGlowState callback for VoiceBus 'state' event — prevents executing/error glow from being wiped by intermediate thinking/speaking VoiceState transitions
  - success reset timer (1000ms setTimeout) matches voiceGlowSuccess keyframe duration exactly — clean handoff from animation end to idle
  - aria-hidden on glow div — purely decorative, no ARIA announcement needed
metrics:
  duration: 98s
  completed: "2026-04-24"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 13 Plan 02: VoiceGlow Visual Feedback Layer Summary

**One-liner:** Monochrome viewport-border glow component driven by VoiceBus state — breathing pulse for listening, steady glow for executing, one-shot flash for success, persistent glow for error — all using a single `--glow-color` CSS custom property for theme-aware monochrome rendering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add VoiceGlow CSS keyframes and utility classes to globals.css | 901e066 | src/app/globals.css |
| 2 | Create VoiceGlow component and mount in layout.tsx | 34709a9 | src/components/voice-glow.tsx, src/app/layout.tsx |

## What Was Built

### Task 1 — globals.css Phase 13 section

`src/app/globals.css` received a new append-only Phase 13 section (lines 256–297):

1. `@keyframes voiceGlowBreath` — breathing pulse with 0%/100% at 0.15 opacity and 50% at 0.35 opacity, all using `rgba(var(--glow-color), ...)`.
2. `@keyframes voiceGlowSuccess` — one-shot flash with 0%/15%/60%/100% stops, fades in and back out over 1000ms.
3. `.voice-glow-listening` — applies `voiceGlowBreath 2s ease-in-out infinite`.
4. `.voice-glow-executing` — steady `box-shadow` at 0.25 opacity with 200ms transition.
5. `.voice-glow-success` — applies `voiceGlowSuccess 1000ms ease forwards`.
6. `.voice-glow-error` — steady `box-shadow` at 0.35 opacity with 200ms transition.
7. `prefers-reduced-motion` block — disables animation on `.voice-glow-listening`, applies static 0.25 opacity glow instead.

No existing CSS was modified — append only.

### Task 2 — VoiceGlow component and layout mount

`src/components/voice-glow.tsx` created as a `'use client'` component:

- `useMounted()` guard prevents SSR mismatch (same pattern as `VoiceOverlay`).
- `useTheme()` reads `resolvedTheme` to compute `glowColor`: `'255,255,255'` (dark mode) or `'0,0,0'` (light mode).
- Four `window.VoiceBus.on(...)` subscriptions inside a single `useEffect([mounted])`:
  - `'state'` → sets `'listening'` on listening state; uses functional update to preserve `'executing'`/`'error'` during thinking/speaking transitions; otherwise resets to `'idle'`.
  - `'tool-executing'` → sets `'executing'`.
  - `'tool-success'` → sets `'success'`.
  - `'tool-error'` → sets `'error'`.
- All four unsub callbacks cleaned up in `useEffect` return.
- Separate `useEffect([glowState])` fires a 1000ms `setTimeout` when `glowState === 'success'` to reset to `'idle'`, matching the `voiceGlowSuccess` keyframe duration.
- Returns `null` when `!mounted || glowState === 'idle'`.
- Rendered div: `aria-hidden="true"`, `style={{ '--glow-color': glowColor }}`, `className="fixed inset-0 pointer-events-none z-[60] voice-glow-${glowState}"`.

`src/app/layout.tsx` received two targeted changes:
1. `import { VoiceGlow } from '@/components/voice-glow';` added after `VoiceOverlay` import.
2. `<VoiceGlow />` added as last sibling inside `<VoiceSessionProvider>`, after `<VoiceOverlay />`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — VoiceGlow is fully wired to VoiceBus events. The glow will activate as soon as Plan 01's `dispatchToolCall` emits `tool-executing`/`tool-success`/`tool-error`.

## Threat Flags

None. `className` is `voice-glow-${glowState}` where `glowState` is typed as `'idle'|'listening'|'executing'|'success'|'error'` — all compile-time constants, no user input reaches className (T-13-05 accepted). VoiceGlow rerenders only on `glowState` change with no infinite loop path (T-13-04 accepted).

## Self-Check: PASSED

- `src/components/voice-glow.tsx` — exists and exports `VoiceGlow`
- `src/app/globals.css` — contains `voiceGlowBreath`, `voiceGlowSuccess`, `voice-glow-listening`, `voice-glow-executing`, `voice-glow-success`, `voice-glow-error`, `--glow-color`
- `src/app/layout.tsx` — imports `VoiceGlow` and renders `<VoiceGlow />` after `<VoiceOverlay />`
- Commit `901e066` — verified in git log (globals.css)
- Commit `34709a9` — verified in git log (voice-glow.tsx + layout.tsx)
- `npx tsc --noEmit` — exits 0, no errors
