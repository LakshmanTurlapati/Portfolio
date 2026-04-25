---
phase: "12-persistent-voice-overlay"
plan: "03"
subsystem: "voice"
tags: ["context-consumer", "page", "voice", "customevent"]
dependency_graph:
  requires:
    - src/providers/voice-session-provider.tsx
  provides:
    - src/app/page.tsx (voice state consumed from context)
  affects: []
tech_stack:
  added: []
  patterns:
    - "useVoiceSession() context consumer replacing local useVoiceController call"
    - "CustomEvent listener useEffect for cross-boundary signal (parz:open-text-chat)"
key_files:
  created: []
  modified:
    - src/app/page.tsx
decisions:
  - "useEffect added to React import alongside existing useState and useCallback — all three hooks now used"
  - "parz:open-text-chat listener registered with empty dep array — handler only calls setChatOpen(true) which is stable via useState setter"
  - "handleAskParz callback unchanged — reads openVoice/closeVoice from context destructure, same behavior as before"
metrics:
  duration: "~1m"
  completed: "2026-04-25"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 12 Plan 03: page.tsx Context Consumer Summary

**One-liner:** Stripped `useVoiceController` from `page.tsx` and replaced it with `useVoiceSession()` context consumption plus a `parz:open-text-chat` CustomEvent listener to complete the architecture lift.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Refactor page.tsx to consume VoiceSessionContext | `19437f5` | src/app/page.tsx (modified, -28/+10 lines) |

## What Was Built

Three surgical changes to `src/app/page.tsx`:

**Change 1 — Import swap:**
Removed `useVoiceController` from `@/lib/voice-controller` and `useTransition` from `@/providers/transition-provider`. Added `useVoiceSession` from `@/providers/voice-session-provider`. Added `useEffect` to the existing React import.

**Change 2 — Hook call block replacement:**
Removed the entire `goPage` + `openTextChat` + `useVoiceController({...})` block (26 lines). Replaced with a single destructure:
```typescript
const { voiceActive, voiceProps, micDenied, openVoice, closeVoice } = useVoiceSession();
```

**Change 3 — CustomEvent listener:**
Added `useEffect` that registers a `parz:open-text-chat` window event listener. When the provider's `openTextChat` dispatches this event (after navigating home and waiting 400ms), the handler calls `setChatOpen(true)` to open ChatPopup on the home page.

## Architecture Impact

Before Plan 03: TWO `useVoiceController` calls existed — one in `voice-session-provider.tsx` (Plans 01-02) and one still in `page.tsx`. This would have created two independent voice sessions with two STT instances, two TTS chains, two message histories.

After Plan 03: `useVoiceController` has exactly ONE call site — `src/providers/voice-session-provider.tsx`. The architecture lift is complete.

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "useVoiceController" src/app/page.tsx` | 0 matches |
| `grep -c "useTransition" src/app/page.tsx` | 0 matches |
| `grep -c "navigateWithReveal" src/app/page.tsx` | 0 matches |
| `grep -c "goPage" src/app/page.tsx` | 0 matches |
| `grep -c "useVoiceSession" src/app/page.tsx` | 2 matches (import + destructure) |
| `grep -c "parz:open-text-chat" src/app/page.tsx` | 3 matches (addEventListener + removeEventListener + comment) |
| `grep -c "setChatOpen" src/app/page.tsx` | 3 matches |
| `grep -c "handleAskParz" src/app/page.tsx` | 3 matches |
| `grep -c "openVoice\|closeVoice" src/app/page.tsx` | 4 matches |
| `grep -rn "useVoiceController" src/` | 3 matches (definition + import + call in voice-session-provider only) |
| `npx tsc --noEmit` | Exit 0, no errors |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. `page.tsx` wires live context state to existing components with no placeholder data.

## Threat Flags

No new security surfaces beyond the plan's threat model:
- T-12-05 (dual useVoiceController DoS): mitigated — grep confirms zero matches in page.tsx
- T-12-06 (CustomEvent setChatOpen tampering): accepted — event carries no payload; consequence is only opening ChatPopup (non-destructive)

## Self-Check: PASSED

- [x] `src/app/page.tsx` modified (0 useVoiceController matches, 2 useVoiceSession matches)
- [x] Commit `19437f5` exists in git log
- [x] TypeScript compiles clean (npx tsc --noEmit exits 0)
- [x] parz:open-text-chat listener present (addEventListener + removeEventListener)
- [x] handleAskParz unchanged — still reads openVoice/closeVoice, still present in JSX for both navbars
- [x] All JSX unchanged: DesktopNavbar, MobileNavbar, ChatPopup, all layers identical
