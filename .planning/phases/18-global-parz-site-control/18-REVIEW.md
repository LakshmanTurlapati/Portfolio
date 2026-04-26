---
status: findings_fixed
phase: 18-global-parz-site-control
reviewed: 2026-04-26
---

# Phase 18 Code Review

## Findings

### Medium: VoiceBus success state could be wrong for failed control actions

- Files: `src/lib/voice-controller.ts`, `src/providers/voice-session-provider.tsx`
- Issue: `openProject` and `scrollTo` callbacks returned `ControlResult` from `SiteControlProvider`, but `ToolCallbacks` typed them as `void` and `dispatchToolCall` always emitted `tool-success` when a callback existed.
- Impact: Unknown project aliases or invalid section requests could show a successful voice-control state even though the provider rejected the action.
- Fix: Updated `ToolCallbacks.openProject` and `ToolCallbacks.scrollTo` to return `ControlResult | void`, returned the provider result from `VoiceSessionProvider`, and emitted `tool-error` when `result.ok === false`.

## Verification

- `npm run build` passes after the fix with existing warnings only.

## Status

All review findings were fixed.
