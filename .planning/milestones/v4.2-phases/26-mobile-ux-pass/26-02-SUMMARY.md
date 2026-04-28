---
phase: 26
plan: 02
subsystem: chat / mobile-ux
tags: [mobile, ios, chat, safari, accessibility, MOB-02]
requirements: [MOB-02]
dependency-graph:
  requires: []
  provides:
    - "iOS-aware chat input baseline (inputMode/enterKeyHint/autoComplete + focus-scroll + safe-area inset) consumed by Phase 28 CHAT-UI-01 redesign"
  affects:
    - src/components/chat-popup.tsx
tech-stack:
  added: []
  patterns:
    - "onFocus + setTimeout(300ms) + scrollIntoView({block:'center', behavior:'smooth'}) for iOS keyboard slide-up handling"
    - "paddingBottom: max(16px, env(safe-area-inset-bottom)) for home-indicator safe area on bottom-anchored input wrappers"
key-files:
  created: []
  modified:
    - src/components/chat-popup.tsx
decisions:
  - "Used `inputMode=\"text\"` per CONTEXT.md D-MOB-02 lock (generic text keyboard, not numeric/email/url)"
  - "300ms setTimeout delay for focus-scroll (UI-SPEC: iOS keyboard slide-up ~250ms; 300ms gives final viewport bite time)"
  - "scrollIntoView options locked to `{block: 'center', behavior: 'smooth'}` per CONTEXT.md"
  - "Bottom-only safe-area inset (left/right deferred per UI-SPEC out-of-scope)"
  - "VisualViewport API NOT used (LOCKED deferred per CONTEXT.md and UI-SPEC)"
  - "enterKeyHint=\"send\" and autoComplete=\"off\" — Claude's discretion within UI-SPEC MOB-02 table"
metrics:
  duration: "~1 minute"
  completed: 2026-04-26
  tasks-completed: 2
  files-touched: 1
  lines-added: 9
  lines-removed: 0
---

# Phase 26 Plan 02: iOS Keyboard Fix for Chat Input (MOB-02) Summary

**One-liner:** iOS-aware chat input with `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"`, 300ms focus-scroll-into-view, and `env(safe-area-inset-bottom)` wrapper padding — surgical edit to `chat-popup.tsx` that lands the MOB-02 baseline ahead of the Phase 28 redesign.

## What Was Built

Four locked changes scoped to the chat input element (line ~506) and its wrapper `<div>` (line ~498) in `src/components/chat-popup.tsx`:

1. **Three iOS-friendly attributes added to `<input>`:**
   - `inputMode="text"` (line 509) — hints generic text keyboard
   - `enterKeyHint="send"` (line 510) — return key shows "send" on iOS
   - `autoComplete="off"` (line 511) — suppresses autocomplete suggestion bar

2. **`onFocus` handler added to `<input>`** (lines 515-519):
   ```tsx
   onFocus={() => {
     setTimeout(() => {
       inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
     }, 300);
   }}
   ```
   Rationale: iOS keyboard slide-up is ~250ms; 300ms ensures the keyboard has taken its final viewport bite before we measure scroll position.

3. **Wrapper `<div>` paddingBottom override** (line 501):
   ```tsx
   padding: '8px 16px 16px',
   paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
   ```
   The shorthand `padding` is preserved for top/left/right (`8px 16px 16px`); the explicit `paddingBottom` later-property wins, giving home-indicator devices extra bottom space.

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/components/chat-popup.tsx` | 3 input attrs + onFocus handler + wrapper paddingBottom override | +9 / -0 |

## Verification Results

### Automated (Task 1 acceptance criteria)

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| `grep -c 'inputMode="text"'` | 1 | 1 | yes |
| `grep -c 'enterKeyHint="send"'` | 1 | 1 | yes |
| `grep -c 'autoComplete="off"'` | 1 | 1 | yes |
| `grep -c "scrollIntoView"` | >= 1 | 2 (existing + new) | yes |
| `grep -c "block: 'center'"` | >= 1 | 1 (in onFocus) | yes |
| `grep -c "behavior: 'smooth'"` | >= 1 | 2 (existing + new) | yes |
| `setTimeout` wrapping `scrollIntoView` with 300ms delay | 1 | 1 (lines 515-519) | yes |
| `grep -c "max(16px, env(safe-area-inset-bottom))"` | 1 | 1 | yes |
| `grep -c "VisualViewport"` (forbidden) | 0 | 0 | yes |
| `grep -c "safe-area-inset-left"` (forbidden) | 0 | 0 | yes |
| `grep -c "safe-area-inset-right"` (forbidden) | 0 | 0 | yes |
| `grep -c 'placeholder="Talk to my persona!"'` (preserved) | 1 | 1 | yes |
| `npx tsc --noEmit -p .` | exit 0 | exit 0 | yes |

All automated checks pass. TypeScript compiles cleanly.

### Manual Checkpoint (Task 2)

Auto-approved per autonomous mode — manual mobile validation deferred to phase HUMAN-UAT.md.

The Task 2 `checkpoint:human-verify` gate prescribes a multi-device manual verification (iPhone Safari real-device or Simulator, Android Chrome, desktop regression, reduced-motion). Under `/gsd-autonomous` the locked decisions in CONTEXT.md and UI-SPEC.md are pre-accepted, so the executor auto-approved the checkpoint and continued. The human-verify steps prescribed in the plan remain on file and should be executed during HUMAN-UAT before the milestone-v4.2 release.

## Forbidden Patterns Confirmed Absent

- VisualViewport API usage — 0 occurrences (LOCKED deferred)
- `safe-area-inset-left` — 0 occurrences (LOCKED — landscape notch deferred)
- `safe-area-inset-right` — 0 occurrences (LOCKED — landscape notch deferred)
- New copy strings — none introduced; placeholder `Talk to my persona!` preserved exactly
- `aria-label="Send message"` preserved on send button
- `handleKeyDown` (Enter-to-send) preserved exactly
- Mount-focus `inputRef.current?.focus()` on line 185 preserved
- `autoCorrect` / `spellCheck` left at browser defaults (UI-SPEC contract)

## Deviations from Plan

None — plan executed exactly as written. The two locked code edits applied byte-for-byte from the `<action>` blocks; no auto-fixes (Rules 1-3) and no architectural changes (Rule 4) needed.

## Phase 25 Coexistence Note

`chat-popup.tsx` already had the `inputRef` declaration (line 108), the mount-focus effect (line 185), and the `messagesEndRef.current?.scrollIntoView` call (line 134) from prior phases. Phase 25's `voice-session-provider.tsx` and `transition-provider.tsx` edits live in ancestor files, not in `chat-popup.tsx` itself. The Phase 26-02 edits were strictly additive to the input element and its wrapper; nothing from Phase 25 was disturbed.

## Note for Phase 28 (CHAT-UI-01)

MOB-02 baseline landed at line ~506 (input element) and line ~498 (input wrapper). When CHAT-UI-01 redesigns the chat popup, it must preserve:

- `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"` on whatever input element replaces the current one
- The `onFocus` -> `setTimeout(300ms)` -> `scrollIntoView({block:'center', behavior:'smooth'})` pattern (or an equivalent VisualViewport-based replacement if Phase 28 chooses to upgrade)
- `paddingBottom: 'max(16px, env(safe-area-inset-bottom))'` on the bottom-anchored input wrapper (or equivalent)

If the redesign moves the input out of a flexShrink:0 wrapper, the safe-area inset must follow it.

## Commits

| Task | Description | Hash |
|------|-------------|------|
| 1 | iOS-aware chat input attributes, focus-scroll, safe-area inset | `2caa210` |
| 2 | (no commit — checkpoint auto-approved per autonomous mode) | -- |

## Self-Check: PASSED

- File `src/components/chat-popup.tsx`: FOUND
- Commit `2caa210`: FOUND in `git log`
- All Task 1 grep acceptance criteria: PASS
- TypeScript compile: PASS (exit 0)
- Forbidden patterns: 0 occurrences each
- Placeholder copy preserved: yes
