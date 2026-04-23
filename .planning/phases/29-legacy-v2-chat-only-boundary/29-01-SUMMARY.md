---
phase: 29-legacy-v2-chat-only-boundary
plan: 01
subsystem: ai-chat-boundary
tags: [nextjs, ai-sdk, vitest, chat, voice, site-control]

requires:
  - phase: 28-chat-ui-redesign
    provides: DART-refined Legacy V2 chat popup/page visual baseline
provides:
  - Server-authoritative `/api/chat` site-control tools gated only by `isVoice: true`
  - Legacy V2 popup and full `/chat` text clients with default `useChat` transport and no site-control dispatch
  - Vitest source-contract coverage for server boundary, text no-tool clients, and voice preservation
affects: [legacy-v2-chat, voice-mode, site-control, parz-contracts]

tech-stack:
  added: []
  patterns:
    - Server-side capability gate ignores stale text-client capability fields
    - Text chat clients render text only and do not parse assistant tool parts
    - Vitest source-contract assertions for security and behavior boundaries

key-files:
  created:
    - .planning/phases/29-legacy-v2-chat-only-boundary/deferred-items.md
  modified:
    - src/app/api/chat/route.ts
    - src/components/chat-popup.tsx
    - src/app/chat/page.tsx
    - tests/voice-barge-in.test.ts

key-decisions:
  - "Treat `enableSiteControl` as accepted legacy input only; it no longer grants `/api/chat` tools."
  - "Keep Legacy V2 text chat visually unchanged and remove invisible client-side tool execution instead of adding UI warnings."
  - "Preserve the existing voice-owned tool path through `isVoice: true`, streamed tool events, and `VoiceSessionProvider` callbacks."

patterns-established:
  - "Voice-only tool exposure: `const isVoiceRequest = guarded.body.isVoice === true` plus `toolsEnabled = isVoiceRequest`."
  - "Legacy V2 text clients call `useChat({ onError })` with no custom transport/body and no SiteControl imports."

requirements-completed: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, VOICE-01, TEST-01]

duration: 4 min
completed: 2026-04-29
---

# Phase 29 Plan 01: Voice-Only Legacy V2 Chat Boundary Summary

**Legacy V2 text chat is now conversation-only, while voice remains the sole site-control surface.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-29T20:44:14Z
- **Completed:** 2026-04-29T20:47:38Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added source-contract tests proving `/api/chat` exposes tools only for voice, text clients contain no tool dispatch, and voice tool inventory remains intact.
- Updated `/api/chat` so text requests keep the normal Parz system prompt plus concise voice-mode guidance, but only `guarded.body.isVoice === true` receives `siteControlTools`.
- Removed `DefaultChatTransport`, `enableSiteControl`, `useSiteControl`, tool-part parsing, handled-tool refs, and assistant tool dispatch effects from both Legacy V2 text clients without changing visible JSX.

## Task Commits

1. **Task 1: Lock Phase 29 regression contracts before implementation** - `6f3d5cf` (test)
2. **Task 2: Make /api/chat expose site-control tools only for voice requests** - `1da729d` (feat)
3. **Task 3: Delete Legacy V2 text-client site-control transport and dispatch** - `0f937e0` (feat)

## Files Created/Modified

- `src/app/api/chat/route.ts` - Added text boundary prompt and made tool exposure depend only on `isVoiceRequest`.
- `src/components/chat-popup.tsx` - Removed text-client site-control transport, parser, refs, imports, and dispatch effect.
- `src/app/chat/page.tsx` - Removed the same text-client site-control transport and dispatch path from the full chat page.
- `tests/voice-barge-in.test.ts` - Added server, text-client, and voice-preservation source contracts.
- `.planning/phases/29-legacy-v2-chat-only-boundary/deferred-items.md` - Records out-of-scope verification findings.

## Verification

- `npx vitest run tests/voice-barge-in.test.ts` - PASS, 25 tests.
- `npx vitest run tests/voice-barge-in.test.ts tests/parz-contracts.test.ts` - FAILS only in `tests/parz-contracts.test.ts` current-work parity: `bioText` says "AI first hotel discovery platform" while the test expects "AI-first hotel booking platform".
- `npm run lint` - PASS with 3 existing warnings in untouched files: `particle-background.tsx`, `portfolio-card.tsx`, and `use-canvas.ts`.
- `! rg -n "enableSiteControl|DefaultChatTransport|siteControlChatTransport|transport:|useSiteControl|ControlPage|ToolPart|getToolCall|handledToolCallsRef|toolCall\.name" src/components/chat-popup.tsx src/app/chat/page.tsx` - PASS, no matches.
- `rg -n "const isVoiceRequest = guarded\.body\.isVoice === true|const toolsEnabled = isVoiceRequest|const textChatBoundaryInstructions|use voice mode for navigation and site-control actions" src/app/api/chat/route.ts` - PASS, all boundary strings present.

## Decisions Made

- Kept `enableSiteControl?: boolean` in the request generic for stale client compatibility, but removed all reads/destructuring so it cannot grant capabilities.
- Used server prompt guidance instead of visible UI copy, matching the no-visual-change contract.
- Left voice controller, voice session provider, and site-control provider behavior untouched; tests verify the voice path remains present.

## Deviations from Plan

None - plan implementation executed exactly as written.

## Known Stubs

None. Stub scan only found existing input placeholder attributes and CSS custom property names, not data-source stubs.

## Issues Encountered

- The plan-level Vitest command includes a pre-existing persona parity failure in `tests/parz-contracts.test.ts`. This phase did not touch persona, bio, experience, or public profile content, so the issue is deferred in `deferred-items.md`.
- Lint exits successfully but reports pre-existing warnings in untouched files; also deferred in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 29 boundary work is complete. The only remaining verification caveat is unrelated persona current-work copy drift, which should be handled as a separate content/test alignment task.

## Self-Check: PASSED

- Summary file exists.
- Deferred items file exists.
- Task commits found: `6f3d5cf`, `1da729d`, `0f937e0`.

---
*Phase: 29-legacy-v2-chat-only-boundary*
*Completed: 2026-04-29*
