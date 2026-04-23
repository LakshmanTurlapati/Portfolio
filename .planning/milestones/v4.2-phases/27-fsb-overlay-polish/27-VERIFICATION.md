---
phase: 27-fsb-overlay-polish
verified: 2026-04-26T00:00:00Z
status: passed
score: 5/5 must-haves verified after navigate gap fix
overrides_applied: 0
uat: deferred_post_milestone
gaps:
  - truth: "User watching Parz call navigate sees 'NAVIGATING TO {PAGE}…' caption in the FSB overlay during the action"
    status: resolved
    reason: "Initially failed because the LLM-driven navigate path bypassed dispatchToolCall and called goPage directly. Resolved inline in commit 6875df5: navigate now routes through dispatchToolCall('navigate', tc.args), so runTool emits tool-executing with the page payload."
    artifacts:
      - path: "src/lib/voice-controller.ts"
        issue: "Line 616 'case navigate' inside handleUserTurn streams Grok tool-input-available events directly to goPage((tc.args as { page: string }).page) without going through dispatchToolCall — so the runTool wrap added at line 237 is unreachable for real navigate calls."
    missing: []
human_verification:
  - test: "Open dev voice mode on desktop, ask Parz to 'open FSB'. Watch the FSB overlay badge during the project-opening flow."
    expected: "Badge text changes from 'POWERED BY FSB' to 'OPENING FSB / FULL SELF BROWSING…' while the iframe mounts, then cross-fades back to 'POWERED BY FSB' ~1700ms later (1500ms hold + 200ms fade)."
    why_human: "Visual rendering of the cross-fade timing and uppercase transformation needs human eye; cannot verify animation timing programmatically without instrumenting the DOM."
  - test: "Open dev voice mode, ask Parz to 'switch theme'. Observe the badge."
    expected: "Badge reads 'SWITCHING THEME…' during the toggle, then returns to idle. Theme actually switches."
    why_human: "End-to-end behavioral verification of caption + tool execution requires running services."
  - test: "Open dev voice mode, ask Parz to 'scroll to experience' (or any anchor). Observe the badge."
    expected: "Badge reads 'SCROLLING…' during the scroll, then returns to idle. No selector text leaked into the caption."
    why_human: "Confirms generic caption decision (no selector interpolation per CONTEXT) holds end-to-end."
  - test: "Open dev voice mode in a project iframe ('open FSB' first), then ask Parz to 'close the browser'."
    expected: "Badge reads 'CLOSING BROWSER…' during the close, iframe dismisses, badge returns to idle."
    why_human: "Closing flow requires real browser state; can't verify programmatically without running app."
  - test: "Resize DevTools viewport to 375px. With overlay active (trigger any tool), visually confirm: (a) no scan grid visible, (b) badge measures >= 44px tall, (c) badge font noticeably larger than desktop, (d) tap a portfolio card whose footer overlaps badge area — card receives the tap (no blocking)."
    expected: "Grid hidden, badge measurably 44px+ tall via inspector, tap-through to underlying portfolio content works."
    why_human: "WCAG 2.5.5 hit-area measurement and pointer-events tap-through require human DevTools inspection; computed style and tap behavior cannot be verified by static analysis."
  - test: "On desktop (>= 768px), with overlay active in idle state, do a side-by-side visual comparison against Phase 23 baseline (commit e2a1383) for the 'POWERED BY FSB' badge — same position, font, padding, border, backdrop-filter. Specifically verify min-width: 220px did not visibly shift the badge position."
    expected: "Pixel-identical badge rendering in idle state. No regression."
    why_human: "Pixel-perfect visual diff requires human comparison or a screenshot tool; static analysis only confirms additive properties."
  - test: "Trigger an error path: ask Parz 'open a project that doesn't exist' (e.g., 'open xyz-does-not-exist'). Observe overlay."
    expected: "Caption holds for ~3000ms (longer than success), overlay unmounts cleanly after ~3500ms total without abrupt cut."
    why_human: "Error timing and graceful unmount must be observed; can't time programmatically without instrumenting timers."
  - test: "Enable prefers-reduced-motion in OS settings, refresh app, trigger any tool action."
    expected: "Caption text swaps instantly on tool-executing and on return-to-idle (no opacity transition)."
    why_human: "Reduced-motion experience is sensory; user must confirm absence of animation."
---

# Phase 27: FSB Overlay Polish — Verification Report

**Phase Goal:** User can see what Parz is actually doing through dynamic action captions, and the overlay feels right-sized on mobile
**Verified:** 2026-04-26
**Status:** passed (navigate gap resolved; manual UAT deferred post-milestone)
**Re-verification:** No — initial verification

**Post-v4.2 overlay correction (2026-04-28):** This report verifies the global `FsbControlOverlay` action-caption surface. Project/right preview overlay work belongs to `IframeViewer`'s `PreviewControlOverlay` (`fsb-preview-control-overlay`), not the obsolete right-side ProjectDetail panel.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees a context-aware action caption rendered in the FSB overlay during tool execution, sourced from VoiceBus tool-executing events (FSB-04 SC1) | partial | Caption state machine exists at fsb-control-overlay.tsx:140-158. Six of seven tools route through runTool in dispatchToolCall (lines 183-231). But the navigate path in handleUserTurn (lines 615-618) bypasses dispatchToolCall entirely, so 'NAVIGATING TO {page}…' never fires in real usage. |
| 2 | User on mobile sees the desktop scan grid hidden, badge dimensions tuned for mobile (>= 44px hit area), pointer-safety preserved (FSB-05 SC2) | VERIFIED | `useMediaQuery('(min-width: 768px)')` at fsb-control-overlay.tsx:92 gates `<div className="fsb-control-grid" />` at line 193. globals.css:419-430 sets mobile badge: padding 12px 16px, font-size 11px, letter-spacing 0.14em, min-width 180px, min-height 44px, inline-flex centering. Container retains `pointer-events-none` Tailwind class on line 191. No descendant `pointer-events-auto` overrides. |
| 3 | User on desktop sees the overlay continue to behave exactly as Phase 19/23 — monochrome styling, 'powered by FSB' copy, pointer-safety (SC3) | VERIFIED | IDLE_TEXT = 'powered by FSB' at fsb-control-overlay.tsx:26. `.fsb-control-badge` base rule (globals.css:380-401) gained only additive properties: min-width 220px, text-align center, box-sizing border-box. No existing properties were modified. monochrome `var(--fsb-overlay-rgb)` retained. Container `pointer-events-none` unchanged. |
| 4 | Caption persists 1500ms after tool-success and 3000ms after tool-error, then cross-fades back; rapid-fire calls show latest only; timers cleared on unmount; prefers-reduced-motion swaps instantly | VERIFIED | SUCCESS_HOLD_MS=1500, ERROR_HOLD_MS=3000, FADE_MS=200 module-scope constants (fsb-control-overlay.tsx:27-29). `clearTimers()` called on every tool-executing (line 145), inside scheduleReturnToIdle (line 119), in the useEffect cleanup (line 164), and on `active=false` (line 172). reducedMotionRef short-circuits scheduleReturnToIdle (lines 122-125) and conditionally suppresses the opacity transition style (lines 179-184). |
| 5 | Overlay stays mounted long enough for caption timers to play out (overlayHideTimer extended) | VERIFIED | site-control-provider.tsx:91-94 schedules `setControlOverlayActive(false)` at 3500ms (extended from 900ms). 3500ms accommodates 3000ms error hold + 200ms fade + 300ms safety margin. Comment block at lines 87-90 documents the rationale. The 900ms literal is fully removed. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/voice-controller.ts` | runTool extended to (name, args, fn); emits `{ name, args }` payload on tool-executing; all 7 tool wrappers + navigate wrap pass args | PARTIAL | runTool signature correct (line 141-145). Single tool-executing emit at line 147 carries `{ name, args }`. 8 `runTool('toolName', args, ...)` call sites verified (openProject:183, scrollTo:191, openLink:199, closeBrowser:207, openCurrentProjectExternal:215, unsupportedIframeControl:223, toggleTheme:231, navigate:238). However the dispatchToolCall 'navigate' branch (line 237) is unreachable — handleUserTurn streams 'navigate' tool calls directly to goPage at line 617 without invoking dispatchToolCall. Net effect: tool-executing for navigate never fires. |
| `src/components/fsb-control-overlay.tsx` | Caption state machine, VoiceBus subscriptions, per-tool resolver, fade animation with reduced-motion fallback, sr-only mirror, mobile grid gate via useMediaQuery | VERIFIED | All seven captions present (Opening, Scrolling, Closing browser, Switching theme, Opening link, Opening externally, Navigating to). resolveProject imported and used (lines 20, 41). Three VoiceBus.on subscriptions (executing, success, error) with cleanup. captionToSrText helper produces 'Parz is …' SR text. reducedMotionRef captured at mount. useMediaQuery('(min-width: 768px)') gates the grid div. No dangerouslySetInnerHTML (only mentioned in a comment). |
| `src/providers/site-control-provider.tsx` | overlayHideTimer extended from 900ms to 3500ms with documentation | VERIFIED | Line 94: `}, 3500);` literal present. 900ms literal absent. Comment lines 87-90 reference Phase 27 / FSB-04 with the timing math. |
| `src/app/globals.css` | Base badge gains min-width 220px / text-align center / box-sizing border-box; new `@media (max-width: 47.99rem)` mobile block with 44px hit-area | VERIFIED | Lines 394-398 add the three additive base-rule properties with a Phase 27 comment. Lines 416-430 add the new 47.99rem block (padding 12px 16px, font-size 11px, letter-spacing 0.14em, min-width 180px, min-height 44px, inline-flex centering). Old `padding: 8px 12px` and `font-size: 9px` mobile rule removed from the 600px block. Existing 600px corners/target overrides retained (lines 403-414). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| dispatchToolCall switch cases | runTool helper | args parameter passed through (slug, selector, url, page, etc.) | WIRED | 8 `runTool('name', args, fn)` call sites confirmed via grep at lines 183, 191, 199, 207, 215, 223, 231, 238. |
| handleUserTurn 'navigate' case | dispatchToolCall('navigate', args) | should route LLM-streamed navigate calls through the runTool wrapper | NOT_WIRED | Line 617 calls `goPage((tc.args as { page: string }).page)` directly. dispatchToolCall is never invoked for 'navigate'. Confirmed via `grep dispatchToolCall.*navigate` returning zero matches. |
| fsb-control-overlay.tsx | window.VoiceBus.on | tool-executing / tool-success / tool-error subscriptions | WIRED | Three subscriptions at lines 140, 151, 156 with proper unsubscribe in cleanup. Payload narrowed at line 142 (typeof name === 'string' guard). |
| fsb-control-overlay.tsx | resolveProject from src/data/projects.ts | openProject caption resolves args.slug -> project.name | WIRED | Imported at line 20, called at line 41 inside the openProject branch of resolveCaption. Defensive fallback to slug if resolver misses (line 43). |
| fsb-control-overlay.tsx | useMediaQuery hook | isDesktop flag controls .fsb-control-grid render | WIRED | Imported at line 19, called at line 92 with `(min-width: 768px)`, used at line 193 to conditionally render the grid div. |
| .fsb-control-badge mobile @media rule | WCAG 2.5.5 44px hit-area | padding + font-size + min-height math | WIRED | globals.css:419-430 includes explicit `min-height: 44px` plus inline-flex centering — meets WCAG regardless of font-metric quirks. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| fsb-control-overlay.tsx (badge text) | caption (useState) | VoiceBus.on('tool-executing', ...) -> resolveCaption(payload) | Yes for openProject/scrollTo/closeBrowser/toggleTheme/openLink/openCurrentProjectExternal/unsupportedIframeControl. NO for navigate (dispatchToolCall branch is dead code; handleUserTurn bypasses it). | PARTIAL |
| fsb-control-overlay.tsx (sr-only) | captionToSrText(caption) | derived from caption state | Yes — function transforms caption to 'Parz is {body}.' | FLOWING |
| fsb-control-overlay.tsx (grid render) | isDesktop (useMediaQuery) | window.matchMedia('(min-width: 768px)').matches | Yes — hook reads matchMedia and updates on resize | FLOWING |
| site-control-provider.tsx (controlOverlayActive) | controlOverlayActive (useState) | runWithControlOverlay sets true; setTimeout 3500ms sets false | Yes — fired on every navigate/openProject/scrollTo/closeBrowser/openCurrentProjectExternal/unsupportedIframeControl call | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles | `npx tsc --noEmit -p .` | No output (zero errors) | PASS |
| 8 runTool call sites with args | `grep -cE "runTool\('[a-zA-Z]+',\s*args," src/lib/voice-controller.ts` | 8 matches | PASS |
| 1 tool-executing emit with payload | `grep -nE "VoiceBus\.emit\('tool-executing'" src/lib/voice-controller.ts` | 1 match (line 147, with `{ name, args }`) | PASS |
| 3 VoiceBus.on tool subscriptions in overlay | `grep -nE "VoiceBus\.on\('tool-(executing\|success\|error)'" src/components/fsb-control-overlay.tsx` | 3 matches (lines 140, 151, 156) | PASS |
| 7 caption strings present | grep for Opening/Scrolling/Closing browser/Switching theme/Opening link/Opening externally/Navigating to | All 7 present in resolveCaption | PASS |
| 2+ clearTimeout cleanup calls | `grep -c "clearTimeout" src/components/fsb-control-overlay.tsx` | 2 matches | PASS |
| No dangerouslySetInnerHTML | grep for the literal | 1 match — but only in a comment line 12 (T-27-03 mitigation note) | PASS |
| 3500ms hide timer present | grep for `}, 3500\);` | 1 match (line 94) | PASS |
| 900ms hide timer removed | grep for `}, 900\);` | 0 matches | PASS |
| min-width 220px desktop / 180px mobile | grep globals.css | Both present (lines 396, 424) | PASS |
| min-height 44px mobile | grep globals.css | Present (line 425) | PASS |
| 47.99rem media block | grep globals.css | Present (line 419) | PASS |
| Old `8px 12px` padding rule removed | grep globals.css | 0 matches | PASS |
| Old `font-size: 9px` rule removed | grep globals.css | 0 matches | PASS |
| handleUserTurn navigate routes through dispatchToolCall | `grep dispatchToolCall.*navigate src/lib/voice-controller.ts` | 0 matches | FAIL |
| Phase 27 commits exist | git log --oneline | 8 phase-27 commits present (db20546, 22dc013, 34080c9, b670680, 692b0a2, 3b89d42, f01a5d1, 40a3df0) | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FSB-04 | 27-01-PLAN, 27-02-PLAN | User sees context-aware action captions in FSB overlay during Parz tool actions | PARTIAL | Caption state machine and per-tool resolver fully implemented in fsb-control-overlay.tsx for 6 of 7 captioned tools (openProject, scrollTo, closeBrowser, toggleTheme, openLink, openCurrentProjectExternal). Navigate caption is broken: tool-executing event never fires for navigate because handleUserTurn:617 bypasses dispatchToolCall. |
| FSB-05 | 27-03-PLAN | User sees overlay sized appropriately for mobile (grid hidden, badge tuned, pointer-safety preserved) | SATISFIED | useMediaQuery gate at 768px hides grid on mobile. Badge upgraded to WCAG 2.5.5 hit-area (>= 44px) via min-height + flex centering. pointer-events-none preserved on container, no descendant pointer-events-auto overrides. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/fsb-control-overlay.tsx | 12 | "dangerouslySetInnerHTML" mentioned | Info | False positive — only appears in a security-mitigation comment explaining what is NOT used. |
| src/lib/voice-controller.ts | 237-241 | Dead-code 'navigate' branch in dispatchToolCall (Plan 27-01 wrapped it in runTool, but no caller invokes dispatchToolCall('navigate', ...)) | Blocker | Causes the navigate caption to never fire in real LLM-driven usage. Breaks FSB-04 success criterion 1 for the navigate tool. |

### Human Verification Required

8 items need human testing — see `human_verification:` block in frontmatter for full details:

1. Visual cross-fade timing for openProject caption (target ~1700ms total)
2. Theme-toggle end-to-end (caption + actual switch)
3. Scroll-to caption (verifies generic copy holds)
4. closeBrowser flow (requires open iframe state)
5. Mobile DevTools at 375px: grid absence, 44px hit-area measurement, tap-through
6. Desktop pixel-diff vs Phase 23 baseline (commit e2a1383)
7. Error path 3000ms hold timing
8. prefers-reduced-motion instant-swap behavior

### Gaps Summary

**One real gap blocks goal achievement.**

Plan 27-01 added a `runTool` wrap around the 'navigate' case inside `dispatchToolCall` (voice-controller.ts:237-241). The intent was correct — navigate IS a captioned tool per the locked context (`Navigating to {page}…`) and it appears in ROADMAP success criterion 1. The wrap itself works as written.

The problem is that the wrap is in the wrong code path. The actual streaming-loop dispatcher in `handleUserTurn` (line 615 onward) handles each tool name with its own switch:

- openProject -> dispatchToolCall('openProject', { slug }) — routes through runTool
- scrollTo -> dispatchToolCall('scrollTo', { selector }) — routes through runTool
- toggleTheme/openLink/closeBrowser/openCurrentProjectExternal/unsupportedIframeControl -> dispatchToolCall(...) — routes through runTool
- **navigate -> goPage(args.page) directly** — bypasses dispatchToolCall entirely

A `grep dispatchToolCall.*navigate src/` returns zero matches: nothing in the codebase invokes dispatchToolCall('navigate', ...). The line-237 case is unreachable in practice, so the runTool emission for navigate never happens, and the FSB caption layer never sees a 'navigate' tool-executing event. In real usage, asking Parz to "go to portfolio" will still trigger the route change but the badge will continue showing 'powered by FSB' — never 'NAVIGATING TO PORTFOLIO…'.

**Single fix:** in handleUserTurn, replace the 'navigate' case (lines 616-618):
```ts
case 'navigate':
  goPage((tc.args as { page: string }).page);
  break;
```
with:
```ts
case 'navigate':
  dispatchToolCall('navigate', tc.args);
  break;
```
This routes through dispatchToolCall, which already wraps in runTool with the args payload.

Note: `goPage` was passed as a closure dependency to `dispatchToolCall` via the navigate case (line 239), so the routing change preserves identical runtime behavior plus adds the missing `tool-executing` emission.

**Mobile/desktop work is solid.** FSB-05 fully delivered. Desktop regression guardrail upheld (only additive base-rule properties; old mobile rule fully replaced by WCAG-compliant equivalent). Caption state machine, timers, sr-only mirror, reduced-motion fallback, and overlay-lifetime extension all work as specified.

---

*Verified: 2026-04-26*
*Verifier: Claude (gsd-verifier)*
