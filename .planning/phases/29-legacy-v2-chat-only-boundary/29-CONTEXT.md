# Phase 29: Legacy V2 Chat-Only Boundary - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes Legacy V2 text chat conversational-only while preserving voice mode as the tool-capable site-control surface. Text chat must still answer ordinary Parz/persona, portfolio, project, and broad-topic questions normally, but navigation, project opening, page scrolling, theme changes, browser control, external-open actions, and tour-style shell control must not be exposed through the popup or full `/chat` page. Voice mode must keep the existing `/api/chat` tool path and client dispatch behavior.

</domain>

<decisions>
## Implementation Decisions

### Text Chat Server Boundary
- Text chat requests should not enable server-side site-control tools, even if a client sends `enableSiteControl`; tool exposure should be reserved for `isVoice: true`.
- Text chat should get concise prompt guidance that advanced navigation, project/browser control, tours, scrolling, and theme/browser actions belong in voice mode.
- Ordinary text-chat questions must continue through the normal Parz system prompt with no refusal for broad-topic conversation.
- The fallback for text site-control requests should be helpful and brief, steering users to voice mode rather than pretending an action was performed.

### Client Tool Execution Boundary
- `src/components/chat-popup.tsx` and `src/app/chat/page.tsx` should use the default chat transport with no `enableSiteControl` request body.
- Legacy V2 text-chat clients should not import or call `useSiteControl`, should not parse assistant tool parts, and should not dispatch `navigate`, `openProject`, `scrollTo`, `scrollProjectPreview`, `closeBrowser`, `openCurrentProjectExternal`, or `unsupportedIframeControl`.
- Voice-to-text handoff should remain a UI handoff only; opening the text popup from voice must not make the text popup tool-capable.
- Existing text-chat visual design and message UX should stay intact unless a small code cleanup is required by the boundary.

### Voice Preservation
- Voice mode should continue sending `isVoice: true` to `/api/chat`.
- `/api/chat` should still include voice response instructions and `siteControlTools` for voice calls.
- `src/lib/voice-controller.ts` should continue collecting tool calls from streamed events and dispatching them through the existing voice callback path.
- `src/providers/voice-session-provider.tsx` should remain the voice-owned bridge to `SiteControlProvider` for navigation, project opening, scrolling, browser control, theme toggling, and link opening.

### Regression Coverage
- Tests should prove text chat no longer sends `enableSiteControl`, no longer imports `useSiteControl`, and no longer contains text-client tool-dispatch branches.
- Tests should prove `/api/chat` gates `toolsEnabled` on `isVoice` only and includes text-chat guidance for advanced control requests.
- Existing tests should be updated so project-preview scrolling is expected through voice and preview surfaces, not Legacy V2 text chat.
- Tests should continue proving voice tool preservation through `/api/chat`, `voice-controller`, and `voice-session-provider`.

### the agent's Discretion
The agent may choose the smallest implementation shape that satisfies the boundary and matches current code conventions. Prefer deletion of obsolete text-client tool wiring over adding new abstractions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/ROADMAP.md` — Phase 29 goal, scope, requirements, and success criteria.
- `.planning/PROJECT.md` — v4.3 milestone context and the locked decision that Legacy V2 text chat is conversation-only.
- `.planning/STATE.md` — current milestone status and accumulated v4.3 scope decision.

### Current Implementation
- `src/app/api/chat/route.ts` — server prompt and tool exposure boundary.
- `src/components/chat-popup.tsx` — Legacy V2 popup text-chat client and current client-side tool execution path.
- `src/app/chat/page.tsx` — full `/chat` Legacy V2 page and current client-side tool execution path.
- `src/lib/voice-controller.ts` — voice request body, streamed tool-call parsing, and voice dispatch path.
- `src/providers/voice-session-provider.tsx` — voice-owned SiteControlProvider bridge.
- `tests/voice-barge-in.test.ts` — current string-contract tests for voice prompt routing and site-control wiring.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `siteControlTools` in `src/app/api/chat/route.ts` already centralizes all site-control tool definitions; the phase can preserve this object for voice while changing the gate that exposes it.
- `voiceResponseInstructions` and `siteControlToolInstructions` are already separated, making it straightforward to add text-chat guidance independently from voice tooling.
- `useChat` with `DefaultChatTransport` is already used in both text surfaces; removing the custom body is the natural client-side boundary.

### Established Patterns
- Regression tests often use source-contract assertions in Vitest to lock critical boundaries and avoid browser-heavy setup.
- Voice uses `isVoice: true` in `src/lib/voice-controller.ts`, while text chat currently uses a custom transport body with `enableSiteControl: true`.
- Voice dispatch is intentionally centralized in `src/lib/voice-controller.ts` and bridged to shell controls through `src/providers/voice-session-provider.tsx`.

### Integration Points
- `/api/chat` must decide whether tools are present and which prompt instructions are included.
- `ChatPopup` and `/chat` should remain pure text clients: message rendering, input state, loading/error UI, suggestions, and no shell-control side effects.
- Existing source-contract tests need updates where they currently assert text-chat project-preview tool wiring.

</code_context>

<specifics>
## Specific Ideas

- Keep the user-facing redirect phrasing concise, along the lines of: "I can talk through that here, but use voice mode for navigation and site-control actions."
- Do not reopen the v4.2 chat popup visual design baseline; this is a behavior boundary phase.
- Do not remove `SiteControlProvider` globally from layout; voice mode still depends on it.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 29-legacy-v2-chat-only-boundary*
*Context gathered: 2026-04-29*
