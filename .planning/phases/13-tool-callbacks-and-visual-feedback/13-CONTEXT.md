# Phase 13: Tool Callbacks and Visual Feedback - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire all voice tool callbacks (openProject, navigate, scrollTo, openLink, toggleTheme) to real on-screen actions and fix the tour to work end-to-end across pages. Add FSB-inspired viewport border glow that communicates voice state through color-coded animations.

</domain>

<decisions>
## Implementation Decisions

### Tool Callback Wiring
- **D-01:** Pages register their tool callbacks with VoiceSessionProvider. The existing `ToolCallbacks` interface in `voice-controller.ts` already defines the shape (openProject, scrollTo, openLink, toggleTheme). VoiceSessionProvider exposes a registration method via context.
- **D-02:** `openProject` navigates to the portfolio page and opens the project's detail card there. When voice says "open Parz-AI" from a non-portfolio page, navigate to `/portfolio` first, then open the project detail.
- **D-03:** `scrollTo` on the about page delegates to the existing `scrollToSection()` method that scrolls the custom scrollable div (not window.scrollIntoView).
- **D-04:** `openLink` opens the referenced URL in a new tab via `window.open(url, '_blank')`.
- **D-05:** `toggleTheme` uses the existing `useTheme().setTheme()` from next-themes.
- **D-06:** `navigate` (TOOL-02) is already handled by `matchNavIntent` in voice-commands.ts and `goPage` in VoiceSessionProvider. No additional wiring needed.

### Tour Fix
- **D-07:** Tour auto-plays continuously -- each step plays automatically after the previous TTS finishes speaking. No pauses between steps, no user confirmation needed. Smooth demo flow.
- **D-08:** Replace the hardcoded 500ms delay with a page-ready signal pattern. When navigating during tour, wait for the destination page's tool callbacks to register before executing tool calls. Use a CustomEvent `voice:page-ready` or poll for DOM element presence.
- **D-09:** Fix the slug/name mismatch in TOUR_STEPS[3] -- `openProject({ slug: 'Parz-AI' })` must match the `name` field in projects.ts. Normalize the lookup.

### Viewport Glow (FSB-inspired)
- **D-10:** Subtle CSS box-shadow glow on the viewport/body -- NOT a thick border. Style: `0 0 30px 10px rgba(color, 0.3)` or similar soft outer glow.
- **D-11:** Glow is MONOCHROME and background-aware -- uses the opposite color of the current background for visibility. Dark mode (black bg) → white glow `rgba(255,255,255,0.3)`. Light mode (white bg) → black glow `rgba(0,0,0,0.3)`.
- **D-12:** NO colored glows. States differentiated by animation pattern: listening → breathing pulse, tool executing → solid/steady, success → brief flash then fade, error → rapid flicker or persistent.
- **D-13:** Glow is driven by VoiceBus state events. A new `VoiceGlow` component in layout subscribes to VoiceBus state and applies the appropriate CSS box-shadow with theme-aware color.
- **D-14:** Success glow flashes briefly (0.5-1s) then fades out. Error glow persists until voice state changes.

### Claude's Discretion
- Implementation of page-ready signal (CustomEvent vs DOM polling vs callback registration detection)
- Whether VoiceGlow is a separate component or integrated into VoiceOverlay
- openProject URL query param vs context-based approach for cross-page navigation
- How to detect "tool executing" state (a new VoiceBus state or a wrapper around dispatchToolCall)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Voice Architecture
- `src/lib/voice-controller.ts` — useVoiceController hook with ToolCallbacks interface and dispatchToolCall
- `src/lib/voice-commands.ts` — TOUR_STEPS array, matchNavIntent, isTourIntent
- `src/providers/voice-session-provider.tsx` — Layout-level provider (created in Phase 12)
- `src/components/voice-overlay.tsx` — Fixed-position voice panel for non-home pages (Phase 12)
- `src/lib/voice-bus-init.ts` — VoiceBus state machine and event system

### Pages (tool callback targets)
- `src/app/portfolio/page.tsx` — openProject target (project detail state, IframeViewer)
- `src/app/about/page.tsx` — scrollTo target (section refs, scrollToSection method)
- `src/app/page.tsx` — Home page (VoiceSession consumer, ChatPopup listener)

### Data
- `src/data/projects.ts` — Project data with `name` field (TOUR_STEPS uses `slug` -- mismatch to fix)

### Design Reference
- `.planning/research/SUMMARY.md` — Milestone research findings
- `.planning/research/PITFALLS.md` — Tour race condition, slug mismatch documented

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ToolCallbacks` interface in voice-controller.ts — already defines openProject, scrollTo, openLink, toggleTheme
- `dispatchToolCall` in voice-controller.ts — single dispatch point, console.warns on missing callback
- `matchNavIntent` in voice-commands.ts — already handles page navigation intents
- `VoiceBus.on('state', ...)` — event subscription for state changes (drives glow)
- `useTheme()` from next-themes — toggleTheme implementation
- `useVoiceSession()` context — established pattern for voice state access

### Established Patterns
- CustomEvent pattern for cross-tree communication (parz:open-text-chat from Phase 12)
- VoiceBus state machine: idle → listening → thinking → speaking
- Fixed-position layout-level overlay pattern (VoiceOverlay from Phase 12)

### Integration Points
- VoiceSessionProvider.toolCallbacks — where pages register their callback implementations
- VoiceBus state events — where VoiceGlow subscribes for state-driven glow changes
- portfolio/page.tsx project state — where openProject sets the selected project
- about/page.tsx sectionRefs — where scrollTo triggers section scrolling

</code_context>

<specifics>
## Specific Ideas

- FSB-inspired viewport glow: subtle box-shadow, not thick border. Blue breathing pulse for listening.
- Tour is a smooth auto-play demo -- no pauses, no confirmations, each step flows after TTS ends.
- openProject from any page navigates to portfolio first, then opens the detail card.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 13-tool-callbacks-and-visual-feedback*
*Context gathered: 2026-04-25*
