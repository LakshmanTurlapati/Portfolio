---
phase: 27-fsb-overlay-polish
plan: 01
subsystem: voice-controller
tags: [voice, fsb, tool-event, plumbing]
requirements: [FSB-04]
dependency-graph:
  requires: [VOICE-09]
  provides: [tool-executing-payload]
  affects: [voice-glow.tsx, fsb-control-overlay.tsx]
tech-stack:
  added: []
  patterns: [voice-bus-event-payload]
key-files:
  created: []
  modified:
    - src/lib/voice-controller.ts
decisions:
  - runTool signature extended to (name, args, fn) — args is the canonical
    second argument so call sites read left-to-right as "tool name + tool input"
  - tool-success / tool-error emits remain payload-less; caption layer (Plan 02)
    will persist last args from tool-executing
  - navigate case wrapped in runTool (was bare goPage call) so the caption layer
    sees the page arg and gets a tool-success ping
metrics:
  duration: ~6 minutes
  tasks: 1
  files-modified: 1
  completed: 2026-04-26
---

# Phase 27 Plan 01: Extend runTool for caption payload — Summary

**One-liner:** Extended `runTool` to emit a `{ name, args }` payload on every `tool-executing` VoiceBus event, unblocking FSB-04 caption rendering without altering VOICE-09's throw-isolation behavior.

## What Changed

`src/lib/voice-controller.ts` — two edits, surgical:

**Edit 1: `runTool` signature + emit (lines 131-147)**

Was:
```ts
const runTool = (name: string, fn: () => unknown): { ok: boolean } => {
  const hasBus = typeof window !== 'undefined' && !!window.VoiceBus;
  if (hasBus) window.VoiceBus.emit('tool-executing');
  // ... try/catch ...
};
```

Now:
```ts
const runTool = (
  name: string,
  args: Record<string, unknown>,
  fn: () => unknown,
): { ok: boolean } => {
  const hasBus = typeof window !== 'undefined' && !!window.VoiceBus;
  if (hasBus) window.VoiceBus.emit('tool-executing', { name, args });
  // ... try/catch unchanged ...
};
```

The try/catch, Promise unwrap, ok-flag inspection, and `tool-success` / `tool-error` emits remain byte-identical. JSDoc above runTool was extended with a Phase 27 / FSB-04 paragraph documenting the payload contract.

**Edit 2: Eight `runTool(...)` call sites in `dispatchToolCall` (lines 178-241)**

All seven existing tool wrappers now pass `args` as the new second arg:

| Tool case | Call site (line) |
|-----------|------------------|
| `openProject` | 183 |
| `scrollTo` | 191 |
| `openLink` | 199 |
| `closeBrowser` | 207 |
| `openCurrentProjectExternal` | 215 |
| `unsupportedIframeControl` | 223 |
| `toggleTheme` | 231 |
| `navigate` (new wrap) | 238 |

The `navigate` case previously called `goPage(...)` directly without going through runTool. It now wraps the call: `runTool('navigate', args, () => { goPage((args as { page: string }).page); })`. This is required for FSB-04 to receive `Navigating to {page}…` captions and matches CONTEXT-27's per-tool caption table. Because `goPage` returns void, runTool's optimistic-ok path (synchronous undefined → ok=true) emits `tool-success` after `goPage` runs.

`endCall` was deliberately NOT wrapped — it's an internal lifecycle event, not a captioned tool (CONTEXT lists 7 captioned tools, endCall is not one of them). Missing-handler `else` branches (raw `tool-error` emit) were also left untouched — Plan 02's caption logic treats `tool-error` without a preceding `tool-executing` as "no caption to show" and stays in idle.

## Verification Run

| Check | Result |
|-------|--------|
| `npx tsc --noEmit -p .` | Zero errors |
| `grep VoiceBus.emit\('tool-executing'` | 1 line, contains `{ name, args }` |
| `grep -cE "runTool\('[a-zA-Z]+',\s*args,"` | 8 matches (7 tools + navigate) |
| `tool-success` / `tool-error` emits payload-less | Confirmed (lines 154, 158, 164, 168) |
| VOICE-09 try/catch / Promise unwrap | Unchanged (lines 148-170) |
| voice-glow.tsx subscriber compatibility | Unchanged — ignores payload (line 45-47 of voice-glow.tsx) |

## Decisions Made

1. **Args as second positional arg, not third** — reads left-to-right as `runTool('toolName', toolInput, callback)` and matches the natural mental model of "this tool with these inputs".
2. **`Record<string, unknown>` typing** — accepts any args shape (matches `dispatchToolCall(name, args)` parameter type at line 169).
3. **Wrap navigate, not endCall** — navigate has a caption (`Navigating to {page}…`); endCall does not.
4. **`tool-success` / `tool-error` stay payload-less** — caption layer (Plan 02) persists the last args from `tool-executing` until a settle event arrives. No reason to duplicate the payload on settle.
5. **Missing-handler `else` branches untouched** — they emit raw `tool-error` without going through runTool. Plan 02 will treat such orphan errors as no-op for captions.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface

No new attack surface introduced. T-27-01 disposition (mitigate) is now Plan 02's responsibility: caption renderer must treat string args as untrusted text (no innerHTML). T-27-02 (rapid-fire DoS) is accepted: VoiceBus has no queue or buffer, latest event wins.

## Self-Check: PASSED

- FOUND: src/lib/voice-controller.ts (modified)
- FOUND commit: db20546 — `feat(27-01): emit { name, args } payload on tool-executing event`
- FOUND: 8 `runTool(name, args, fn)` call sites
- FOUND: 1 `tool-executing` emit with payload
- TypeScript clean (zero errors)
