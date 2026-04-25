---
phase: "12-persistent-voice-overlay"
plan: "02"
subsystem: "voice"
tags: ["overlay", "layout", "voice", "provider-nesting"]
dependency_graph:
  requires:
    - src/providers/voice-session-provider.tsx
    - src/providers/voice-bus-provider.tsx
    - src/components/voice-panel.tsx
    - src/hooks/use-mounted.ts
  provides:
    - src/components/voice-overlay.tsx
  affects:
    - src/app/layout.tsx
tech_stack:
  added: []
  patterns:
    - "Three-condition early return guard (!mounted || !voiceActive || pathname === '/') for SSR safety and home-page exclusion"
    - "sm:block/sm:hidden breakpoint split for desktop/mobile layout variants in a single component"
    - "CSS variable var(--color-navbar-bg) for theme-aware background matching navbar"
    - "relative overflow-hidden wrapper pattern for VoicePanel absolute-inset containment"
key_files:
  created:
    - src/components/voice-overlay.tsx
  modified:
    - src/app/layout.tsx
decisions:
  - "VoiceOverlay returns null on pathname === '/' to prevent double panel — home page renders its own VoicePanel inside the navbar morph"
  - "overflow-hidden on inner capsule div is mandatory — VoicePanel uses position:absolute inset-0 internally and overflows without it"
  - "VoiceSessionProvider placed inside VoiceBusProvider (not outside) — useVoiceController uses window.VoiceBus which VoiceBusProvider initializes"
  - "Mobile height h-[72px] not h-[140px] — 140px is the home-page expanded navbar row; overlay bar only shows the voice panel row"
metrics:
  duration: "~1m"
  completed: "2026-04-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 12 Plan 02: VoiceOverlay + Layout Wiring Summary

**One-liner:** Fixed-position VoiceOverlay capsule created for non-home pages and wired into layout.tsx alongside VoiceSessionProvider to complete the layout-level voice rendering chain.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create VoiceOverlay component | `62782ef` | src/components/voice-overlay.tsx (created, 42 lines) |
| 2 | Update layout.tsx provider nesting | `9eeb24e` | src/app/layout.tsx (modified, +6 lines) |

## What Was Built

### src/components/voice-overlay.tsx

A `'use client'` component that:

1. **Guards rendering with three conditions** — returns null when `!mounted` (SSR safety), `!voiceActive` (voice is closed), or `pathname === '/'` (home page has its own navbar-embedded panel, Pitfall 1 from RESEARCH.md)
2. **Desktop capsule** — `fixed top-[10px] left-1/2 -translate-x-1/2 w-[760px] h-[72px] rounded-[25px] z-50`, hidden on mobile via `hidden sm:block`
3. **Mobile capsule** — `fixed bottom-[20px] left-[20px] right-[20px] h-[72px] rounded-[25px] z-50`, hidden on desktop via `sm:hidden`
4. **Theme-aware background** — `var(--color-navbar-bg)` CSS variable matches the navbar background in both dark and light modes
5. **VoicePanel containment** — `relative overflow-hidden` on both inner wrappers prevents VoicePanel's `absolute inset-0` from escaping the capsule bounds
6. **Accessibility** — outer wrapper has `role="complementary"` and `aria-label="Voice assistant panel"` per UI-SPEC.md contract

### src/app/layout.tsx

Updated provider nesting from:
```
ThemeProvider > TransitionProvider > VoiceBusProvider > {children}
```
to:
```
ThemeProvider > TransitionProvider > VoiceBusProvider > VoiceSessionProvider > {children} + VoiceOverlay
```

`VoiceSessionProvider` is placed inside `VoiceBusProvider` (per Pitfall 4: `useVoiceController` relies on `window.VoiceBus` which `VoiceBusProvider` initializes). `VoiceOverlay` is a sibling to `{children}` inside `VoiceSessionProvider` so it can consume `useVoiceSession()`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. `VoiceOverlay` delegates all rendering to `VoicePanel` (fully implemented in Phase 8). No placeholder content or hardcoded empty values.

## Threat Flags

No new security-relevant surfaces introduced beyond what the threat model covers:
- T-12-03 (double panel spoofing): mitigated by `pathname === '/'` null return in VoiceOverlay
- T-12-04 (incorrect nesting order): mitigated by VoiceSessionProvider placed inside VoiceBusProvider in layout.tsx

## Self-Check: PASSED

- [x] `src/components/voice-overlay.tsx` exists (42 lines, created)
- [x] `src/app/layout.tsx` updated with correct nesting
- [x] Commit `62782ef` exists in git log (Task 1)
- [x] Commit `9eeb24e` exists in git log (Task 2)
- [x] TypeScript compiles clean (npx tsc --noEmit exits 0)
- [x] `pathname === '/'` guard present (1 match)
- [x] `role="complementary"` and `aria-label="Voice assistant panel"` present
- [x] `overflow-hidden` present on both desktop and mobile inner divs (2 matches)
- [x] `var(--color-navbar-bg)` present on both desktop and mobile (2 matches)
- [x] `z-50` present on both capsules (2 matches)
- [x] `w-[760px]` desktop width present (1 match)
- [x] `top-[10px]` desktop position present (1 match)
- [x] `bottom-[20px]` mobile position present (1 match)
- [x] VoiceSessionProvider in layout.tsx: 3 matches (import + open + close)
- [x] VoiceOverlay in layout.tsx: 2 matches (import + JSX)
- [x] VoiceBusProvider in layout.tsx: 3 matches (import + open + close)
