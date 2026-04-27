# Phase 27: FSB Overlay Polish - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Mode:** Smart discuss (3 areas, all recommendations accepted)

<domain>
## Phase Boundary

Dynamic action captions in the FSB overlay during Parz tool runs (FSB-04), plus a mobile-tuned overlay treatment that scales for small screens (FSB-05). Desktop must remain pixel-identical to end of Phase 19/23.

In scope: FSB overlay component (`src/components/fsb-overlay.tsx` or wherever the Phase 19/23 implementation lives), VoiceBus subscription for `tool-executing`/`tool-success`/`tool-error` events, mobile media query gate.

Out of scope: any change to voice-controller's emission semantics (Phase 25 already cleaned that up); copy changes outside the per-tool caption strings; non-overlay UI.

</domain>

<decisions>
## Implementation Decisions

### Caption Copy per Tool (FSB-04)
- `openProject` → `Opening {projectName}…` (use the project's display name, e.g., "Opening FSB / Full Self Browsing…")
- `scrollTo` → `Scrolling…` (no anchor name in caption — keep generic)
- `closeBrowser` → `Closing browser…`
- `toggleTheme` → `Switching theme…` (no dark/light specifier — keep generic)
- `openLink` → `Opening link…` (no hostname in caption — keep generic)
- `openCurrentProjectExternal` → `Opening externally…`
- `navigate` → `Navigating to {page}…` (use the route name like "portfolio" or "about")

### Caption Behavior
- Trigger: render caption on `tool-executing` event (Phase 25's runTool helper emits this consistently for all 7 tools; missing-handler path emits only `tool-error`)
- Auto-hide on success: 1500 ms after `tool-success` event
- Error duration: caption stays for 3000 ms after `tool-error` event, paired with the existing tool-error glow on the overlay
- Position: caption rendered inside the overlay badge area (not floating below)

### Mobile Overlay Treatment (FSB-05)
- Mobile breakpoint: `max-width: 768px` via `useMediaQuery` (matches Phase 26 convention)
- Desktop grid: hidden on mobile; only the FSB badge is visible
- Badge size on mobile: slightly larger than desktop for touch comfort (target ~44px hit area)
- Caption on mobile: same caption text, smaller font size for the narrower badge

### Claude's Discretion
- Exact font sizes for caption (mobile vs desktop) — pick reasonable values matching the existing FSB overlay typography
- Caption fade-in/fade-out animation curve and duration — pick something natural (~150-250ms ease-in-out)
- Internal state-machine details for caption display (timer refs, cleanup on unmount)
- Whether to colocate the caption helper inside the overlay component or extract a separate hook

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- VoiceBus event emission stable since Phase 19 (`tool-executing`, `tool-success`, `tool-error`) — Phase 25's runTool helper unified all 7 tool callbacks through this pipeline
- `useMediaQuery('(max-width: 768px)')` hook now established (Phase 26)
- FSB overlay component exists from Phase 19; Phase 23 already added monochrome polish and `powered by FSB` badge

### Established Patterns
- VoiceBus subscribe pattern (Phase 19+) — overlay component already subscribes to relevant voice events
- Tailwind responsive classes for breakpoints

### Integration Points
- Subscribe to `tool-executing` / `tool-success` / `tool-error` in the FSB overlay component
- Add internal state for "current caption text" + "show caption" boolean
- Wrap the desktop grid in a `hidden md:block` (or matchMedia) to hide on mobile
- Tweak badge dimensions with mobile media query

</code_context>

<specifics>
## Specific Ideas

- The caption template `Opening {projectName}…` requires the tool-executing event payload to include the project name. Phase 19's emission semantics include the tool's input args; the overlay can read `args.projectName` (or `args.name` depending on the tool's contract — RESEARCH should confirm during planning).
- The trailing `…` is the unicode ellipsis (U+2026) — match the typography convention already in `voice-controller.ts` (`Listening…`, `Thinking…`).
- "Pointer-safety preserved" (FSB-05 success criterion) means the overlay must not block clicks/taps on underlying content; existing CSS already handles this via `pointer-events: none` on the overlay container with selective `pointer-events: auto` on interactive elements. New mobile-scaled badge must keep this.

</specifics>

<deferred>
## Deferred Ideas

- Per-tool color hints in the badge (different glow tints per tool) — out of scope; monochrome remains
- Caption history / log of recent actions
- Caption-only mobile mode (badge hidden, caption floats)
- Tablet-specific overlay treatment (tablet inherits desktop)
- Animated caption transitions between rapid-fire tool calls (current pattern: latest event wins)

</deferred>
