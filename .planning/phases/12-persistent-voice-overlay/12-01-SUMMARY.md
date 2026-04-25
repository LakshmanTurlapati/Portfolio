---
phase: "12-persistent-voice-overlay"
plan: "01"
subsystem: "voice"
tags: ["provider", "context", "voice", "layout-level"]
dependency_graph:
  requires:
    - src/lib/voice-controller.ts
    - src/providers/transition-provider.tsx
    - src/components/voice-panel.tsx
  provides:
    - src/providers/voice-session-provider.tsx
  affects:
    - src/app/layout.tsx (Plans 02+)
    - src/app/page.tsx (Plans 02+)
tech_stack:
  added: []
  patterns:
    - "createContext with null-guard for object-typed contexts"
    - "usePathname for dynamic currentPage derivation"
    - "CustomEvent dispatch for cross-boundary signals (parz:open-text-chat)"
key_files:
  created:
    - src/providers/voice-session-provider.tsx
  modified: []
decisions:
  - "openTextChat dispatches parz:open-text-chat CustomEvent with 400ms delay — gives View Transitions API time to mount home page"
  - "currentPage derived from usePathname() not hardcoded as 'home' — required for correct tour behavior on non-home pages"
  - "useVoiceSession null-guard throws clear error if used outside provider — explicit error contract"
metrics:
  duration: "1m"
  completed: "2026-04-25"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 12 Plan 01: VoiceSessionProvider Summary

**One-liner:** Layout-level React context provider that lifts `useVoiceController` out of `page.tsx` so voice session state persists across page navigation, using CustomEvent for cross-boundary chat opening.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create VoiceSessionProvider with useVoiceController lift | `0f8a2e2` | src/providers/voice-session-provider.tsx (created, 76 lines) |

## What Was Built

`src/providers/voice-session-provider.tsx` — a `'use client'` provider that:

1. **Calls `useVoiceController` once at layout level** — voice session state no longer resets on navigation since the hook no longer unmounts with `page.tsx`
2. **Exposes voice state + controls via `useVoiceSession()`** — typed context with `voiceActive`, `voiceProps`, `micDenied`, `openVoice`, `closeVoice`, `prefersReduced`
3. **Handles `openTextChat` via CustomEvent dispatch** — navigates to home first, then dispatches `parz:open-text-chat` after 400ms so the home page is mounted before the event fires
4. **Derives `currentPage` dynamically from `usePathname()`** — not hardcoded as `'home'` so the voice tour works correctly from any page

## Exports

- `VoiceSessionProvider` — layout-level provider component
- `useVoiceSession()` — hook that throws if used outside provider (null-guard pattern)
- `VoiceSessionContextType` — interface exported for type-safe consumers

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This file is a standalone provider with no UI rendering — no stubs possible.

## Threat Flags

No new security-relevant surfaces introduced beyond what the threat model covers:
- `parz:open-text-chat` CustomEvent carries no user data (T-12-01: accepted)
- Single `useVoiceController` call site established (T-12-02: mitigated by this plan)

## Self-Check: PASSED

- [x] `src/providers/voice-session-provider.tsx` exists
- [x] Commit `0f8a2e2` exists in git log
- [x] TypeScript compiles clean (npx tsc --noEmit exits 0)
- [x] All 3 exports present: VoiceSessionProvider, useVoiceSession, VoiceSessionContextType
- [x] No forbidden patterns: no `setChatOpen`, no `chatOpen`, no `initVoiceBus`
