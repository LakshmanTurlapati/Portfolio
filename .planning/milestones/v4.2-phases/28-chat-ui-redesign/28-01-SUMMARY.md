---
phase: 28
plan: 01
subsystem: chat-popup-layout
tags: [chat, layout, geometry, behavior-preservation]
requires:
  - src/hooks/use-media-query.ts
  - src/components/chat-popup.tsx (v4.1 baseline incl. Phase 25 + Phase 26)
provides:
  - "Historical desktop bottom-right anchored popup card (420px wide, 24px from edges); superseded post-v4.2 by the DART-refined centered max-400px shell"
  - "Mobile full-bleed popup (8px inset, 100dvh-aware with safe-area)"
  - "56px header with <h2 id=\"chat-popup-heading\">Parz</h2> + 32x32 close button"
  - "Independently scrollable messages area (16px padding, scrollbarWidth none)"
  - "Layout shell ready for Plan 02 (typography + color) and Plan 03 (motion + a11y)"
affects:
  - src/components/chat-popup.tsx
tech-stack:
  added: []
  patterns:
    - "useMediaQuery('(min-width: 768px)') geometry gate (matches Phase 26 / Phase 27 pattern)"
    - "Inline style spread of layout-only objects keyed by isDesktop"
key-files:
  created: []
  modified:
    - src/components/chat-popup.tsx
decisions:
  - "Removed popupIn animation entry: existing keyframe used translate(-50%) which fights new geometry. Plan 03 will reintroduce a new keyframe matching the new geometry; the temporary loss of an entry animation between this plan and Plan 03 is acceptable."
  - "Added role=\"dialog\" but NOT aria-modal/aria-labelledby: full ARIA semantics land in Plan 03. role alone is harmless and gives Plan 03 a stable selector."
  - "Header h2 left intentionally unstyled: typography (Instrument Serif italic 22px) lands in Plan 02. h2 carries the id and stable DOM hook for Plan 03 aria-labelledby."
  - "Persona span replaced with a wrapper <div> + h2 (rather than just h2 directly) so Plan 02 can drop the optional Lato 12 / opacity 0.55 subtitle next to the heading without re-wrapping."
metrics:
  duration: ~10 minutes
  completed: 2026-04-26
---

# Phase 28 Plan 01: Layout Geometry Re-scaffold Summary

**Post-v4.2 correction (2026-04-28):** The layout described below is historical. The user selected the DART-refined chat popup as the final visual baseline after this plan, replacing the 420px bottom-right desktop target with the current centered DART shell. Preserve the behavior evidence below; do not use this summary to undo the DART baseline.

Replaced the chat popup's centered v4.1 geometry with a responsive layout shell — desktop 420px bottom-right anchor, mobile full-bleed minus 8px — gated by `useMediaQuery('(min-width: 768px)')`. Header restructured to a fixed 56px row containing an `<h2 id="chat-popup-heading">Parz</h2>` and a 32x32 close button (44x44 hit area). Messages region now scrolls independently inside the card with 16px padding. All Phase 25 voice handoff and Phase 26 iOS keyboard inheritance preserved verbatim.

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Replace popup card geometry — desktop bottom-right anchor + mobile full-bleed inset | `e22538f` |
| 2 | Restructure header (56px) and messages area (16px padding, scrollbarWidth none) | `5ee8645` |

## Behavior Preservation — Grep Verification

The following identifiers were greped on the post-execution file and ALL pass:

### Phase 26 / MOB-02 iOS keyboard
- `inputMode="text"` — line 530 PRESENT
- `enterKeyHint="send"` — line 531 PRESENT
- `autoComplete="off"` — line 532 PRESENT
- `paddingBottom: 'max(16px, env(safe-area-inset-bottom))'` — line 522 PRESENT
- `inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })` — line 538 PRESENT (300ms setTimeout intact)

### Phase 25 / VOICE-05 voice handoff
- `inputRef.current?.focus()` mount-focus useEffect — line 187 PRESENT
- Component still mounts and auto-focuses input, so the parent provider's `parz:open-text-chat` listener continues to operate as a no-op handoff

### useChat hook + transport
- `const { messages, sendMessage, status, error } = useChat({` — line 124 PRESENT
- `siteControlChatTransport` — defined and consumed PRESENT
- `enableSiteControl: true` body — PRESENT in `DefaultChatTransport({ body: ... })`

### Tool-call dispatch (six branches preserved verbatim)
- `navigate` (line 147) PRESENT
- `openProject` (line 151) PRESENT
- `scrollTo` (line 154) PRESENT
- `closeBrowser` (line 157) PRESENT
- `openCurrentProjectExternal` (line 158) PRESENT
- `unsupportedIframeControl` (line 159) PRESENT

### Behavior tokens (handlers + state)
- `handleSend` PRESENT
- `handleSuggestionClick` PRESENT
- `handleKeyDown` PRESENT
- `loadingMsgIndex` PRESENT
- `currentError` PRESENT
- `handledToolCallsRef` PRESENT
- `showSuggestions = !suggestionClicked && userMessageCount < 2` PRESENT
- `sanitizeText`, `linkifyText`, `RenderLinkedText` imports + usage PRESENT

## New Geometry — Grep Verification

- `useMediaQuery('(min-width: 768px)')` — line 108 PRESENT
- `right: '24px'` (desktop) — line 280 PRESENT
- `bottom: '24px'` (desktop) — line 281 PRESENT
- `width: '420px'` (desktop) — line 282 PRESENT
- `inset: '8px'` (mobile) — line 288 PRESENT
- `calc(100dvh - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom))` (mobile) — line 292 PRESENT
- Legacy `left: '50%'` — ABSENT (verified by `! grep -q`)
- Legacy `translateX(-50%)` — ABSENT (verified by `! grep -q`)

## New Header — Grep Verification

- `height: '56px'` — line 304 PRESENT
- `padding: '12px 16px'` — line 305 PRESENT
- `<h2 id="chat-popup-heading">` — lines 311-312 PRESENT
- Close button `width: '32px'` / `height: '32px'` / `padding: '6px'` (44x44 hit area) — line 325 PRESENT
- Legacy `<span>Chat with Parz</span>` — REPLACED with h2

## New Messages Area — Grep Verification

- `padding: '16px'` (flat 16 on all sides per UI-SPEC §5.3) PRESENT
- `scrollbarWidth: 'none'` PRESENT (Firefox; WebKit suppression deferred to Plan 03 scoped style)
- `flex: 1; overflowY: 'auto'; minHeight: 0` PRESENT
- All children (empty state, message map, loading bubble, error bubble, messagesEndRef sentinel) untouched

## TypeScript Check

`npx tsc --noEmit -p tsconfig.json` — exits cleanly (no output, no errors).

## Deviations from Plan

None. UI-SPEC §5.1, §5.2, §5.3 and the inline plan actions implemented exactly as written. Both task verification grep chains returned `PASS`.

The plan explicitly directed removing the `animation: 'popupIn ...'` line (correction note in Task 1, step 3) — applied as instructed.

## Hand-off Notes for Plan 02 (Typography + Color)

The layout shell is correct and behavior-preserving, but the visual treatment is still mid-transition:

- **Header h2** is unstyled (no font-family / font-size / color). Plan 02 must apply Instrument Serif italic 22px on `#chat-popup-heading` and decide on the optional Lato 12 / opacity 0.55 subtitle inside the existing wrapper `<div>`.
- **Message bubbles** are still v4.1-shaped: 80% max-width, fontSize 14, lineHeight 1.6, no Lato weight differentiation between user (500) vs assistant (400). Plan 02 raises max-width to 85% and applies the typography contract from UI-SPEC §3.
- **Suggestion chips** are still v4.1-shaped: padding 8 16, borderRadius 20, fontSize 13. Plan 02 changes to borderRadius 999, applies letter-spacing 0.005em, replaces inline mouseEnter/mouseLeave transform handler with a CSS hover (and tames scale to 1.04).
- **Send button** is still 36x36; UI-SPEC §5.9 requires 44x44 for WCAG 2.5.5. Plan 02 (or Plan 03 for the success pulse) takes this.
- **Input field** padding is still `12px 52px 12px 20px`; UI-SPEC §5.9 calls for `12px 56px 12px 20px` to host the larger send button.
- **Backdrop** background changed from rgba(20,20,20,0.92)/(255,255,255,0.92) to flat #1a1a1c/#fafaf7 in this plan to match iframe-viewer aesthetic. Backdrop element itself untouched.

## Hand-off Notes for Plan 03 (Motion + A11y)

- **Entry animation** is currently absent — `popupIn` keyframe still defined in the scoped `<style>` block but no longer wired to the popup card style. Plan 03 introduces a new `popupIn` keyframe matching the new geometry (no translateX(-50%)) and re-applies it.
- **role="dialog"** is on the popup card; `aria-modal="true"` and `aria-labelledby="chat-popup-heading"` still need to be added by Plan 03.
- **Escape-to-close**, `role="log"` / `aria-live="polite"` on messages area, `role="alert"` on error bubble, `role="status"` on loading bubble — all deferred to Plan 03 per UI-SPEC §8.
- **scrollbarWidth: 'none'** is set inline (Firefox), but WebKit `::-webkit-scrollbar { width: 0 }` suppression must be added by Plan 03 in the scoped `<style>` block.
- **prefers-reduced-motion** fallback block is not yet present; Plan 03 owns the full motion spec (UI-SPEC §7).

## Self-Check: PASSED

- File exists: src/components/chat-popup.tsx — FOUND
- Commit e22538f exists in `git log` — FOUND
- Commit 5ee8645 exists in `git log` — FOUND
- All 8 success criteria from PLAN frontmatter `must_haves.truths` validated by grep
- TypeScript compile passes cleanly
