# Phase 25: Voice Wave 2 Hardening - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Voice mode no longer hangs, races, or aborts mid-turn under the five known P1 conditions from `21-AUDIT.md` Wave 2 (VOICE-05..09). Strict polish/hardening — no new tools, no persona changes, no architectural rewrites. All edits target file:line evidence already captured in REQUIREMENTS.md and STATE.md (`src/providers/voice-session-provider.tsx`, `src/lib/voice-controller.ts`).

</domain>

<decisions>
## Implementation Decisions

### Voice Timing & Timeouts (VOICE-05/06/07)

- **VOICE-05 page-ready event**: Emit a VoiceBus `page-ready` event from `transition-provider` once the post-View-Transition pathname matches the navigation target. `openTextChat` listens with a one-shot subscription plus a 1500 ms safety timeout (falls back to existing 400 ms behavior). On fire (event or timeout), dispatch `parz:open-text-chat`.
- **VOICE-06 Scribe stall timeout**: Fixed 5000 ms guard armed when calling `connection.start()`, cleared on `SESSION_STARTED`. On fire → close the Scribe socket, fall back to Web Speech path, and surface the caption "Speech service slow — switching to fallback".
- **VOICE-07 Synth fallback worst-case timeout**: `Math.max(1000, text.length * 50)` ms with a hard cap of 30000 ms. On fire → invoke `finishSynth()` and `synth.cancel()` so the queue drains.
- **Timer cleanup**: Track all guard timer refs and clear them inside `cancelAllAudio` to prevent stale fires after a cancel.

### Tool Callback Contract (VOICE-08/09)

- **VOICE-08 deregister return shape**: `registerToolCallbacks(callbacks)` returns a `() => void` that deletes exactly the keys that were registered (captured from `Object.keys(callbacks)` at registration time). Consumers call it from a `useEffect` cleanup. Provider-owned defaults (`toggleTheme`, `openLink`, `openProject`, etc.) remain untouched.
- **VOICE-08 dispatcher behavior on missing handler**: Preserve existing semantics — `console.warn` + emit `tool-error`. No behavior change to the missing-handler path.
- **VOICE-09 `runTool()` signature**: `runTool(name, fn)` where `fn: () => unknown | Promise<unknown>`. Emits `tool-executing` before invocation, awaits if a Promise is returned, emits `tool-success` on resolve / `tool-error` on throw or rejection. Returns the unwrapped result so callers can inspect `.ok`.
- **VOICE-09 missing-handler emission**: `runTool` only wraps callback invocations; the missing-handler path still emits only `tool-error` (no `tool-executing`).

### Claude's Discretion

- Exact placement of the `page-ready` emitter inside `transition-provider` (post-callback hook vs `useEffect` keyed on pathname) — pick whichever cleanly mirrors existing transition completion semantics.
- Caption phrasing for VOICE-06 fallback may be tightened in implementation if a shorter form reads better in the existing caption UI.
- Whether to extract `runTool` into `voice-controller.ts` body or a small helper module — local file unless a clear test boundary emerges.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/voice-controller.ts` — owns `dispatchToolCall` (line 125), `streamTTS` synth fallback (line 343), Scribe `SESSION_STARTED` wiring (line 693), `cancelAllAudio` (line 214) — all targets for these fixes.
- `src/providers/voice-session-provider.tsx` — owns `registerToolCallbacks` (line 43) and `openTextChat` setTimeout race (line 82).
- `src/providers/transition-provider.tsx` — natural emission site for `page-ready` once View Transitions resolve (parallel to existing `navigateWithReveal`).
- `window.VoiceBus` — already supports `tool-executing`, `tool-success`, `tool-error` events; `page-ready` will be a new event on the same bus.

### Established Patterns

- Identity-checked refs guard async resolution (e.g., `audioSourceRef`, `speechUtteranceRef` in `streamTTS`) — same pattern works for guard timers.
- AbortController + generation counter pattern from Phase 22 (`speakAbortRef`, `cancelAllAudio`) — reuse for cancelling timers, no new abstractions.
- VoiceBus emits drive overlay state (Phase 13) — `tool-executing/success/error` semantics from `runTool` flow into `fsb-control-overlay.tsx`, which Phase 27 (FSB-04) consumes.

### Integration Points

- `transition-provider.tsx` emits `page-ready` → `voice-session-provider.tsx` `openTextChat` consumes.
- `voice-controller.ts` `runTool` emits → `fsb-control-overlay.tsx` (Phase 27) and existing voice-glow visuals consume.
- No public API surface changes outside `registerToolCallbacks` return value (additive).

</code_context>

<specifics>
## Specific Ideas

- All success criteria in REQUIREMENTS.md are user-observable behaviors — keep verification reads of `21-AUDIT.md` Wave 2 honest (each VOICE-NN should resolve a Wave 2 finding).
- Cross-phase soft dependency: VOICE-09's clean `tool-executing → tool-success/tool-error` semantics are what Phase 27 (FSB-04) subscribes to for action captions. Land the `runTool` pattern with that consumer in mind.
- No new tools, prompts, or persona changes — strict carry-forward hardening from v4.1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed inside Wave 2 scope. Wave 3+ voice findings, new voice tools, and any architectural rewrites stay out of v4.2.

</deferred>
