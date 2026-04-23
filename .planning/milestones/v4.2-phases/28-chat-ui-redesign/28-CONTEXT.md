# Phase 28: Chat UI Redesign - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** Autonomous redesign — Claude's discretion within portfolio aesthetic

**Post-v4.2 correction (2026-04-28):** The user selected the DART-refined chat popup as the final visual baseline after this context was gathered. This document is historical planning context where it conflicts with the newer source of truth: centered desktop shell maxing at 400px, mobile 8px shell, DART voice-to-chat morph, and future-only transition / animation polish tracked as CHAT-ANIM-01.

<domain>
## Phase Boundary

Visual / UX polish redesign of `src/components/chat-popup.tsx`. Behavior is preserved verbatim from v4.1 (send, receive, suggestion chips, loading states, error states, mobile keyboard handling from Phase 26). Phase 25's voice integration (page-ready event for openTextChat) and Phase 26's iOS keyboard fixes (inputMode, scrollIntoView, safe-area) remain intact.

In scope: visual treatment of the popup (header, message bubbles, suggestion chips, input bar), motion (entry/exit, message appear, loading indicator), spacing/typography refresh, accessibility focus management.

Out of scope: any change to chat API behavior; voice integration changes; new features beyond visual/UX polish; messaging back-end.

</domain>

<decisions>
## Implementation Decisions

### Visual Language
- Aesthetic: clean monochrome consistent with FSB overlay + portfolio. No new brand colors introduced.
- Surface: DART-refined popup shell with compact rounded corners (aligned with the current ChatPopup / IframeViewer visual language; the removed ProjectDetail panel is not a reference surface)
- Background: theme-aware — `#fafaf7` (light) / `#1a1a1c` (dark), matching iframe-viewer
- Borders: 1px subtle border using `rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.08)` dark
- Shadow: `0 24px 64px rgba(0,0,0,0.3)` (matches iframe-viewer for visual coherence)

### Layout
- Header: 56px tall, contains persona name ("Parz" or persona label) on left, close button (X) on right
- Message area: scrollable, flex-1, padding `px-5 py-4`, gap-3 between message bubbles
- Suggestion chips: shown above input when message thread is empty or after error; horizontal scrollable strip on mobile, wrapped on desktop
- Input bar: fixed at bottom, 56-72px tall, padding `px-4 py-3`, send button right-aligned
- Mobile (<768px): DART shell with 8px viewport margins; desktop: centered shell with 24px viewport breathing room and max 400px width. The earlier 420px bottom-right anchor is superseded.

### Typography
- Header persona name: Instrument Serif italic, 20px (matches portfolio's serif accent)
- Message text (assistant): Lato 15px, regular weight, line-height 1.5
- Message text (user): Lato 15px, slightly bolder (medium weight)
- Suggestion chips: Lato 13px, medium weight
- Input placeholder: Lato 14px, regular weight
- Timestamps: JetBrains Mono 11px, opacity 0.5 (existing portfolio pattern)

### Motion
- Popup entry: fade-in + scale from 0.96 → 1.0, 200ms ease-out
- Popup exit: fade-out, 150ms ease-in
- Message appear: fade-in + slide-up 4px, 180ms ease-out, staggered for assistant streaming
- Loading dots: existing 3-dot pulse animation preserved
- Send button: scale to 0.94 on tap (haptic-feel)
- Honor `prefers-reduced-motion`: instant swaps, no scale/slide

### Color & Accent
- Accent for active states (focus ring, send button enabled): existing `--color-accent` token (already in design system)
- Send button: filled when input has text, outline when empty; same accent color
- Error state: existing `--color-error` token; subtle red border on input wrapper
- Success ack: subtle green pulse on send (250ms)

### Accessibility
- Open popup → auto-focus input within 100ms (existing Phase 25 mount-focus pattern preserved)
- Tab cycles: input → send button → close button → back to input (focus trap optional, deferred)
- Escape closes the popup (preserve existing behavior)
- ARIA: dialog role, aria-labelledby on persona name, aria-live polite on assistant message stream
- Color contrast: all text meets WCAG AA against the surface background

### Behavior Preservation (no change)
- Send: unchanged
- Receive (streaming response): unchanged
- Suggestion chips: same trigger conditions (empty thread, after error)
- Loading state: same 3-dot pulse
- Error state: same error message format
- iOS keyboard handling: Phase 26's `inputMode="text"`, `enterKeyHint="send"`, `onFocus` scrollIntoView with 300ms setTimeout, `paddingBottom: max(16px, env(safe-area-inset-bottom))` all preserved
- Voice integration: page-ready listener from Phase 25 preserved

### Claude's Discretion
- Exact CSS values for spacing (lean toward 4/8/12/16/24 ladder)
- Specific border-radius for inner elements (chips, send button, input)
- Whether to add subtle background pattern or texture (recommendation: no, keep minimal)
- Loading dot exact size and rhythm

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/chat-popup.tsx` — current implementation (Phase 25 voice-integration + Phase 26 mobile fixes)
- `src/app/globals.css` — design tokens (--color-*, --font-lato, --font-instrument-serif)
- `src/hooks/use-media-query.ts` — established Phase 26 mobile breakpoint helper
- `src/components/iframe-viewer.tsx` — reference for popup card aesthetic (rounded-2xl, theme-aware bg, shadow)

### Established Patterns
- Theme-aware styling via `isDark` prop from theme provider
- Tailwind v4 utility classes
- React Icons (`react-icons/fa6`) for iconography
- Refs for input focus and scroll-to-bottom
- VoiceBus events (preserved as-is for Phase 25 integration)

### Integration Points
- Chat popup is rendered conditionally by parent provider (likely chat-popup-provider or similar)
- Voice → text handoff via `parz:open-text-chat` custom event (Phase 25)
- API calls to chat backend (preserved verbatim)

</code_context>

<specifics>
## Specific Ideas

- Match the popup-card aesthetic of `iframe-viewer.tsx` for visual coherence (same rounded-2xl, same theme-aware bg, same shadow signature)
- Use Instrument Serif for the persona name header — this italic serif already appears throughout portfolio for "personality" moments
- The existing send button can stay as a simple icon button; redesign focuses on surface, type, and motion polish, not new components

</specifics>

<deferred>
## Deferred Ideas

- Persona avatar in header (current popup uses text-only label)
- Multi-thread support / message history pane
- File / image attachment
- Markdown rendering in messages (might already exist; redesign should not touch it)
- Voice toggle inside popup (currently triggered from elsewhere)
- Settings menu inside popup

</deferred>
