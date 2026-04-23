---
phase: 29-legacy-v2-chat-only-boundary
verified: 2026-04-29T20:56:07Z
status: human_needed
score: "6/6 must-haves verified"
overrides_applied: 0
human_verification:
  - test: "Live Legacy V2 text chat smoke"
    expected: "Ordinary persona/project/broad-topic questions answer normally; navigation/project/theme/browser/tour requests return concise voice-mode guidance and cause no site-control side effects."
    why_human: "Requires observing live xAI model output and browser side effects."
  - test: "Live voice site-control smoke"
    expected: "Voice still navigates, opens approved projects, scrolls supported surfaces, toggles theme, switches to text, and ends calls through the voice-owned path."
    why_human: "Requires microphone, ElevenLabs/xAI integration, and live browser action observation."
  - test: "Legacy V2 visual no-change check"
    expected: "Popup and full chat surfaces keep the established visual baseline with no persistent warning, banner, modal, badge, tooltip, or CTA added by this boundary."
    why_human: "Visual appearance and interaction feel cannot be fully verified by source contracts."
---

# Phase 29: Legacy V2 Chat-Only Boundary Verification Report

**Phase Goal:** Make Legacy V2 text chat answer normally while preventing navigation, project-opening, theme, browser, tour, and other site-control tool execution; preserve those advanced features in voice mode.  
**Verified:** 2026-04-29T20:56:07Z  
**Status:** human_needed  
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Legacy V2 text chat answers ordinary persona, portfolio, project, and broad-topic questions conversationally without site-control side effects. | VERIFIED | `/api/chat` keeps `systemPrompt` for all requests and text requests receive no tools ([route.ts:143](src/app/api/chat/route.ts)); text clients render only text parts ([chat-popup.tsx:45](src/components/chat-popup.tsx), [page.tsx:50](src/app/chat/page.tsx)); targeted broad-topic contract passed. |
| 2 | Text chat site-control requests receive concise voice-mode guidance instead of navigation, project opening, scrolling, theme toggling, tours, browser control, or external-open tool execution. | VERIFIED | Server text boundary guidance includes the required voice-mode phrase ([route.ts:23](src/app/api/chat/route.ts), [route.ts:28](src/app/api/chat/route.ts)); `toolsEnabled` is only `isVoiceRequest` ([route.ts:138](src/app/api/chat/route.ts), [route.ts:140](src/app/api/chat/route.ts), [route.ts:154](src/app/api/chat/route.ts)); text clients have no dispatcher patterns. |
| 3 | Popup text chat and full `/chat` text chat send requests without `enableSiteControl` and without `isVoice`. | VERIFIED | Both text clients use default `useChat({ onError })` ([chat-popup.tsx:182](src/components/chat-popup.tsx), [page.tsx:207](src/app/chat/page.tsx)); `rg` found no `enableSiteControl`, `DefaultChatTransport`, `transport:`, `body:`, or `isVoice` in `chat-popup.tsx` or `/chat` text code. |
| 4 | Popup text chat and full `/chat` cannot execute accidental assistant tool parts because text-client parsing and dispatch code is deleted. | VERIFIED | `rg` found no `useSiteControl`, `ControlPage`, `ToolPart`, `getToolCall`, `handledToolCallsRef`, or `toolCall.name` in text clients; rendered message text is filtered to `type === 'text'` ([chat-popup.tsx:45](src/components/chat-popup.tsx), [page.tsx:50](src/app/chat/page.tsx)). |
| 5 | Voice mode still sends `isVoice: true`, receives `siteControlTools`, parses streamed tool calls, and dispatches through `VoiceSessionProvider` into `SiteControlProvider`. | VERIFIED | Voice fetch body keeps `isVoice: true` ([voice-controller.ts:819](src/lib/voice-controller.ts)); streamed tool events are collected ([voice-controller.ts:840](src/lib/voice-controller.ts)); dispatch covers site-control cases ([voice-controller.ts:887](src/lib/voice-controller.ts)); provider callbacks bridge to `siteControl` ([voice-session-provider.tsx:66](src/providers/voice-session-provider.tsx)). |
| 6 | Automated Vitest source-contract coverage proves the server gate, text-client no-tool boundary, and voice preservation. | VERIFIED | `tests/voice-barge-in.test.ts` contains server, text-client, and voice-preservation contracts ([voice-barge-in.test.ts:205](tests/voice-barge-in.test.ts), [voice-barge-in.test.ts:252](tests/voice-barge-in.test.ts), [voice-barge-in.test.ts:270](tests/voice-barge-in.test.ts)); `npx vitest run tests/voice-barge-in.test.ts` passed 25/25. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/app/api/chat/route.ts` | Server-authoritative voice-only tool exposure and text-chat boundary prompt guidance | VERIFIED | Exists, substantive, and wired as the Next route handler. `enableSiteControl` remains accepted only in the request type ([route.ts:128](src/app/api/chat/route.ts)); no capability grant reads it. |
| `src/components/chat-popup.tsx` | Legacy V2 popup text client using default `useChat` transport and no SiteControl dispatch | VERIFIED | Exists, substantive, imported by home and current `/chat` mobile chat mode; no forbidden text-client tool patterns found. Ambient screen-mode props are present but do not reintroduce text tools. |
| `src/app/chat/page.tsx` | Full `/chat` text client using default `useChat` transport and no SiteControl dispatch | VERIFIED | Exists and substantive. Current filesystem has an ambient mobile voice wrapper, but the desktop text client and mobile chat mode remain no-tool text surfaces. |
| `tests/voice-barge-in.test.ts` | Regression contracts for text boundary and voice preservation | VERIFIED | Exists, substantive, and passing. It asserts server gate strings, text-client negative patterns, and voice-owned tool callbacks. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/app/api/chat/route.ts` | AI SDK `streamText` | `toolsEnabled` controls whether `siteControlTools` are passed | WIRED | Manual verification passes at [route.ts:148](src/app/api/chat/route.ts) and [route.ts:154](src/app/api/chat/route.ts). The gsd helper false-negative was caused by frontmatter regex escaping. |
| `src/components/chat-popup.tsx` | `/api/chat` | `useChat` default transport with no custom body | WIRED | `useChat({ onError })` is present and no custom transport/body is present ([chat-popup.tsx:182](src/components/chat-popup.tsx)). |
| `src/app/chat/page.tsx` | `/api/chat` | `useChat` default transport with no custom body | WIRED | Desktop text client uses `useChat({ onError })` and no custom transport/body ([page.tsx:207](src/app/chat/page.tsx)); mobile chat mode delegates to `ChatPopup`. |
| `src/lib/voice-controller.ts` | `src/app/api/chat/route.ts` | Voice fetch body remains `JSON.stringify({ messages, isVoice: true })` | WIRED | Verified at [voice-controller.ts:819](src/lib/voice-controller.ts). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `src/app/api/chat/route.ts` | `messages`, `isVoiceRequest`, `toolsEnabled` | `parseGuardedJson` + `validateChatMessages` from request body | Yes | FLOWING |
| `src/components/chat-popup.tsx` | `messages` | AI SDK `useChat` default transport; `sendMessage({ text })` | Yes | FLOWING |
| `src/app/chat/page.tsx` | `messages` | Desktop `useChat` default transport; mobile chat mode delegates to `ChatPopup` | Yes | FLOWING |
| `src/lib/voice-controller.ts` | `toolCalls` | `/api/chat` stream events with `tool-input-available` | Yes | FLOWING |
| `src/providers/voice-session-provider.tsx` | `toolCallbacksRef.current` | Provider effect wiring callbacks into `SiteControlProvider` actions | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Boundary source contracts pass | `npx vitest run tests/voice-barge-in.test.ts` | 25 tests passed | PASS |
| Broad-topic chat prompt contract remains present | `npx vitest run tests/parz-contracts.test.ts -t "allows broad-topic answers"` | 1 test passed, 4 skipped | PASS |
| Lint exits successfully | `npm run lint` | Exit 0 with three existing warnings outside Phase 29 files | PASS_WITH_WARNINGS |
| Full Parz contracts | `npx vitest run tests/parz-contracts.test.ts` | 4 passed, 1 failed on public-source current-work parity in `bioText` | NON_BLOCKING_CAVEAT |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| CHAT-01 | 29-01 | Normal text chat remains conversational with no site-control side effects | SATISFIED | `systemPrompt` remains in all prompt assemblies; text receives no tools; broad-topic contract passed. |
| CHAT-02 | 29-01 | Text site-control requests get concise voice-mode guidance | SATISFIED | Required guidance copy is present server-side and text tools are withheld. |
| CHAT-03 | 29-01 | Popup and `/chat` send no `enableSiteControl` | SATISFIED | No `enableSiteControl`, custom transport, `body:`, or text `isVoice` patterns in text clients. |
| CHAT-04 | 29-01 | Popup and `/chat` do not execute accidental tool parts | SATISFIED | Text clients no longer import/use `SiteControlProvider` or parse/dispatch assistant tool parts. |
| VOICE-01 | 29-01 | Voice keeps existing advanced site-control tools | SATISFIED | Route tool inventory, voice fetch body, stream parsing, switch/end cases, and provider callbacks are present. |
| TEST-01 | 29-01 | Automated tests prove the server, text, and voice boundary | SATISFIED | `tests/voice-barge-in.test.ts` source contracts pass 25/25. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `src/components/chat-popup.tsx` | 98, 381, 448, 852 | `placeholder` scan matches CSS variable/input placeholder only | Info | Not a stub; no user-visible incomplete implementation. |
| `src/app/chat/page.tsx` | 443, 444 | `placeholder` scan matches input placeholder/class name only | Info | Not a stub. |
| `tests/parz-contracts.test.ts` | 59 | Full suite fails on public-source current-work parity | Warning | Existing content/test drift outside Phase 29 chat boundary; targeted broad-topic prompt contract passes. |

### Human Verification Required

### 1. Live Legacy V2 Text Chat Smoke

**Test:** In the popup and `/chat` text mode, ask one ordinary question and one site-control request such as "open FSB" or "toggle theme."  
**Expected:** Ordinary chat answers normally; site-control request returns concise voice-mode guidance and does not navigate, open a project viewer, scroll, toggle theme, or open browser/external surfaces.  
**Why human:** Live model wording and browser side effects require observation.

### 2. Live Voice Site-Control Smoke

**Test:** Start voice mode and ask it to navigate, open an approved project, scroll a supported preview, toggle theme, switch to text, and end the call.  
**Expected:** Voice executes the advanced actions through the voice-owned tool path and text handoff remains a no-tool text chat.  
**Why human:** Requires microphone, ElevenLabs/xAI services, and live browser side-effect checks.

### 3. Legacy V2 Visual No-Change Check

**Test:** Inspect popup and full chat surfaces on desktop and mobile.  
**Expected:** No persistent warning/banner/modal/badge/tooltip/CTA was added; existing message, chip, loading, error, focus, and close behavior remains visually intact.  
**Why human:** Visual appearance and interaction feel are not fully provable through source grep.

### Gaps Summary

No Phase 29 goal-blocking gaps found. The only automated caveat is the existing `tests/parz-contracts.test.ts` public-source parity failure: `bioText` says "AI first hotel discovery platform" while the test expects "AI-first hotel booking platform." That failure is content/test drift outside the Phase 29 chat-only boundary and does not reintroduce text-chat tool capability.

Ambient worktree edits were present during verification. The current filesystem adds a mobile voice wrapper in `/chat` and screen-mode props in `ChatPopup`; these do not reintroduce `enableSiteControl`, text custom transport, text-side `SiteControlProvider` dispatch, or assistant tool-part execution in Legacy V2 text chat.

---

_Verified: 2026-04-29T20:56:07Z_  
_Verifier: Codex (gsd-verifier)_
