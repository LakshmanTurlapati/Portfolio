---
phase: 28
plan: 02
subsystem: chat-popup-typography-color
tags: [chat, typography, color, ui-spec, behavior-preservation]
requires:
  - 28-01 (geometry shell)
  - src/app/layout.tsx (--font-instrument-serif + --font-lato registration)
  - src/app/globals.css (--color-text + --color-bg theme tokens)
provides:
  - "Instrument Serif italic 22px persona name with Lato 12 / 0.55 opacity subtitle"
  - "Lato-only body typography (400 regular + 500 medium for user bubbles / chip labels)"
  - "Assistant bubble: secondary tint (0.04/0.06 alpha) + 0.08 alpha subtle border"
  - "User bubble: var(--color-text) fill + var(--color-bg) text + Lato 500"
  - "Bubble max-width raised from 80% to 85% per UI-SPEC §5.4"
  - "Loading + error bubbles use the same secondary tint surface as assistant bubbles"
  - "Pill-shape (border-radius 999px) suggestion chips with mobile horizontal scroll vs desktop wrap"
  - "44x44 send button with filled/outlined dual state and 1.04/0.94 hover/active scale"
  - "Input wrapper conditional red error border (rgba(239,68,68,0.45)) clears on first keystroke"
  - "Visual contract complete; layout shell ready for Plan 03 (motion + ARIA + a11y)"
affects:
  - src/components/chat-popup.tsx
tech-stack:
  added: []
  patterns:
    - "Inline conditional border-color on wrapper element keyed by currentError"
    - "Local sendHover useState driving the send button's CSS scale transform"
    - "Spread `...(isDesktop ? wrap : scroll)` style block for mobile vs desktop chip strip"
key-files:
  created: []
  modified:
    - src/components/chat-popup.tsx
decisions:
  - "Suggestion chips use inline onMouseEnter / onMouseLeave / onMouseDown / onMouseUp to drive hover (1.04) and active (0.98) scale rather than CSS class. Matches the in-place pattern from Plan 01 / v4.1 and avoids touching the scoped <style> block (which Plan 03 owns)."
  - "Send button hover uses a local sendHover useState rather than inline event mutation so onMouseUp can correctly restore the hover transform without manual bookkeeping."
  - "Input row padding shorthand changed from '8px 16px 16px' to '8px 16px' so the paddingBottom: max(16px, env(safe-area-inset-bottom)) override (Phase 26 / MOB-02) actually wins."
  - "currentError clear logic placed inline in onChange (`if (e.target.value.length > 0 && currentError) setCurrentError(null)`) per UI-SPEC §5.10 forgiving-UX decision."
metrics:
  duration: ~12 minutes
  completed: 2026-04-26
---

# Phase 28 Plan 02: Typography + Color + Visual Treatment Summary

Applied UI-SPEC §3 (Typography), §4 (Color), §5.4-§5.7 (Bubble dimensions), §5.8 (Suggestion chips), §5.9 (Input row), and §5.10 (Error border) to `src/components/chat-popup.tsx`. The popup now matches the monochrome + accent contract pixel-for-pixel: Instrument Serif italic persona name, Lato-only body type with two weights (400/500), secondary-tint assistant bubbles with 0.08 alpha subtle borders, full-pill suggestion chips, 44x44 dual-state send button, and conditional red error border on the input wrapper. All Phase 25 voice handoff and Phase 26 iOS keyboard inheritance survives byte-identical.

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Apply typography + color to header, empty-state, message bubbles, loading bubble, and error bubble | `3d71ddc` |
| 2 | Apply suggestion chip pill treatment + input row + 44x44 send button + error border on input wrapper | `3c70077` |

## Visual Treatment -- Grep Evidence

### Header / Persona name (UI-SPEC §3, §5.2)
- `var(--font-instrument-serif)` -- line 316 PRESENT
- `fontStyle: 'italic'` -- line 317 PRESENT
- `fontSize: '22px'` -- line 318 PRESENT
- `fontWeight: 400` (header h2) PRESENT
- `lineHeight: 1.2` (header h2) PRESENT
- Subtitle span with `Lakshman&apos;s digital twin`, Lato 12 / 0.55 opacity PRESENT

### Empty-state (UI-SPEC §5.5)
- `padding: '32px 16px 16px'` (s-7 / s-4 / s-4) PRESENT
- `fontFamily: 'var(--font-lato)`, `fontSize: '14px'`, `fontWeight: 400`, `lineHeight: 1.6`, `opacity: 0.7` PRESENT
- Em-dash glyph `—` (U+2014) preserved verbatim from v4.1 (matches UI-SPEC §6)

### Message bubbles (UI-SPEC §5.4)
- `maxWidth: '85%'` PRESENT (v4.1 80% replaced)
- `fontFamily: 'var(--font-lato), sans-serif'` PRESENT
- `fontSize: '15px'` PRESENT
- `fontWeight: isUser ? 500 : 400` PRESENT
- `lineHeight: 1.5` PRESENT
- Assistant `backgroundColor` keys to `rgba(0,0,0,0.04)` light / `rgba(255,255,255,0.06)` dark PRESENT
- Assistant `border: 1px solid` keys to `rgba(0,0,0,0.08)` / `rgba(255,255,255,0.08)` PRESENT
- User bubble fill `var(--color-text)`, color `var(--color-bg)`, no border PRESENT
- Tail radius 16/16/16/4 (assistant) and 16/16/4/16 (user) via `borderBottomRightRadius` / `borderBottomLeftRadius` PRESENT

### Loading bubble (UI-SPEC §5.6)
- `padding: '10px 14px'` PRESENT
- `border: 1px solid` keys to 0.08 alpha PRESENT
- `backgroundColor` keys to secondary tint PRESENT
- `dot-wave-popup 1.4s ease-in-out ${i * 0.2}s infinite` UNCHANGED PRESENT
- `popup-shimmer-text` className UNCHANGED PRESENT

### Error bubble (UI-SPEC §5.7)
- `maxWidth: '85%'` PRESENT
- `backgroundColor: 'rgba(239, 68, 68, 0.10)'` PRESENT
- `border: '1px solid rgba(239, 68, 68, 0.30)'` PRESENT
- `fontFamily: 'var(--font-lato), sans-serif'`, `fontSize: '14px'`, `fontWeight: 400`, `lineHeight: 1.5` PRESENT
- `borderBottomLeftRadius: '4px'` (assistant tail) PRESENT

### Suggestion chips (UI-SPEC §5.8)
- Strip container conditional: `flexWrap: 'wrap'; justifyContent: 'center'` (desktop) vs `flexWrap: 'nowrap'; overflowX: 'auto'; WebkitOverflowScrolling: 'touch'; scrollbarWidth: 'none'` (mobile) PRESENT
- Chip `borderRadius: '999px'` PRESENT (3 occurrences -- both chips + send button)
- Chip `fontFamily: 'var(--font-lato), sans-serif'` PRESENT
- Chip `fontSize: '13px'`, `fontWeight: 500`, `letterSpacing: '0.005em'`, `lineHeight: 1.3` PRESENT
- Chip border `rgba(0,0,0,0.15)` light / `rgba(255,255,255,0.20)` dark PRESENT
- Chip background secondary tint PRESENT
- Hover `scale(1.04)` (was 1.05) PRESENT
- Active `scale(0.98)` PRESENT (onMouseDown)
- `transition: 'transform 200ms ease, border-color 200ms ease'` PRESENT
- `whiteSpace: 'nowrap'` and `flexShrink: 0` (so mobile strip never wraps) PRESENT

### Input row (UI-SPEC §5.9)
- Outer row padding `8px 16px` + `paddingBottom: 'max(16px, env(safe-area-inset-bottom))'` (Phase 26) PRESENT
- Wrapper conditional border `rgba(239, 68, 68, 0.45)` when `currentError` else `transparent` PRESENT
- Wrapper `borderRadius: '24px'` and `transition: 'border-color 200ms ease-in-out'` PRESENT
- Input field `padding: '12px 56px 12px 20px'` PRESENT (raised from 12/52/12/20 to host 44x44 send)
- Input `fontFamily: 'var(--font-lato)', fontSize 14, fontWeight 400, lineHeight 1.5` PRESENT
- Input background secondary tint, border 0.10 alpha (light) / 0.12 alpha (dark) PRESENT
- Input disabled state `opacity: 0.6, cursor: 'not-allowed'` PRESENT
- onChange augmented with `if (e.target.value.length > 0 && currentError) setCurrentError(null)` PRESENT (line 604)

### Send button (UI-SPEC §5.9)
- `width: '44px'`, `height: '44px'` PRESENT (raised from 36)
- `borderRadius: '999px'`, `right: '6px'`, `top: '50%'`, `transform: translateY(-50%)` PRESENT
- Enabled state: `backgroundColor: var(--color-text)`, `color: var(--color-bg)`, opacity 1, no border PRESENT
- Disabled state: `backgroundColor: 'transparent'`, `color: var(--color-text)`, opacity 0.30, border 1px solid 0.08 alpha PRESENT
- `sendHover` useState drives hover `scale(1.04)` PRESENT
- `onMouseDown` adds active `scale(0.94)` PRESENT
- `transition: 'transform 150ms ease, background-color 200ms ease, opacity 200ms ease, color 200ms ease'` PRESENT
- `<FaArrowUp size={16} />` PRESENT (raised from 14)

## Forbidden Patterns -- ABSENT (negative grep)

- `JetBrains` -- ABSENT (mono not registered, drop confirmed)
- `maxWidth: '80%'` -- ABSENT (all bubbles raised to 85%)
- `width: '36px'` -- ABSENT (send raised to 44)
- `scale(1.05)` -- ABSENT (chips tamed to 1.04)
- `FaArrowUp size={14}` -- ABSENT (raised to 16)
- `padding: '12px 52px 12px 20px'` -- ABSENT (raised to 56px right)

## Behavior Preservation -- Grep Evidence

### Phase 26 / MOB-02 iOS keyboard (lines verified)
- `inputMode="text"` -- line 598 PRESENT
- `enterKeyHint="send"` -- line 599 PRESENT
- `autoComplete="off"` -- line 600 PRESENT
- `paddingBottom: 'max(16px, env(safe-area-inset-bottom))'` -- line 583 PRESENT
- `onFocus` setTimeout 300ms scrollIntoView -- line 609 PRESENT (block: 'center', behavior: 'smooth')

### Phase 25 / VOICE-05 voice handoff
- mount-focus useEffect `inputRef.current?.focus()` PRESENT (line 187)
- Component still auto-focuses on mount, so parent provider's `parz:open-text-chat` listener continues to operate as no-op handoff

### useChat hook + transport
- `useChat({ transport: siteControlChatTransport, onError: ... })` PRESENT (line 125)
- `siteControlChatTransport = new DefaultChatTransport({ body: { enableSiteControl: true } })` PRESENT (line 41-43)

### Tool-call dispatch (six branches preserved verbatim, lines 148-160)
- `navigate` PRESENT
- `openProject` PRESENT
- `scrollTo` PRESENT
- `closeBrowser` PRESENT
- `openCurrentProjectExternal` PRESENT
- `unsupportedIframeControl` PRESENT

### Handlers + state
- `handleSend` PRESENT (line 191) -- body unchanged
- `handleSuggestionClick` PRESENT (line 199) -- body unchanged
- `handleKeyDown` PRESENT (line 208) -- body unchanged
- `loadingMsgIndex` cycle PRESENT
- `currentError` random pick on `error` change PRESENT (line 178-183)
- `handledToolCallsRef` PRESENT (line 111)
- `showSuggestions = !suggestionClicked && userMessageCount < 2` PRESENT (line 132)
- `sanitizeText`, `linkifyText`, `RenderLinkedText` imports + usage PRESENT

### scrolling sentinel
- `<div ref={messagesEndRef} />` PRESENT (line 505)

## TypeScript Check

`npx tsc --noEmit -p tsconfig.json` -- exits cleanly (no output, no errors).

## ESLint Check

`npx eslint src/components/chat-popup.tsx` -- exits cleanly (no output, no errors).

## Deviations from Plan

None. UI-SPEC §3, §4, §5.4-§5.10 and the inline plan actions implemented exactly as written. Both task verification grep chains returned `PASS`.

The plan's Task 2 verify chain referenced the substring `currentError && setCurrentError(null)`. The action body specified the precise statement `if (e.target.value.length > 0 && currentError) setCurrentError(null);` and that is what was implemented (verbatim, line 604). The verification semantically passes -- `currentError` and `setCurrentError(null)` both occur on the same line as required.

## Threat Model Cross-Check (UI-SPEC + plan §threat_model)

- T-28-04 (Tampering -- RenderLinkedText): no change. `RenderLinkedText` and `linkifyText` body unchanged. Disposition `accept` -- preserved.
- T-28-05 (Information disclosure -- error bubble): `currentError = getRandomItem(PARZ_ERRORS)` still set from the curated list, never from `error.message`. Disposition `mitigate` -- preserved.
- T-28-06 (Repudiation -- chip click parity): `handleSuggestionClick` body unchanged; `sendMessage({ text })` path identical to typed-input path. Disposition `accept` -- preserved.

## Hand-off Notes for Plan 03 (Motion + Accessibility)

The visual contract is complete. Outstanding items strictly belong to Plan 03 per the original phase decomposition:

- **Entry animation**: still absent. The `popupIn` keyframe in the scoped `<style>` block uses the legacy `translateX(-50%)` which fights the new geometry. Plan 03 must replace it with a geometry-correct entry (e.g., `opacity 0 -> 1`, `scale 0.96 -> 1.0`) and re-wire it to the popup card style.
- **Message-appear animation**: not yet implemented. Plan 03 owns the `messageAppear` keyframe (180ms ease-out, 4px translateY).
- **Send-success pulse**: optional per UI-SPEC §7. Plan 03 may borrow the existing `askParzPulse` keyframe from `globals.css` if implemented.
- **`prefers-reduced-motion` block**: not yet present in the scoped `<style>`. Plan 03 owns the full reduced-motion fallback.
- **WebKit scrollbar suppression**: `scrollbarWidth: 'none'` is set inline (Firefox). Plan 03 must add the `::-webkit-scrollbar { width: 0 }` rule in the scoped style.
- **ARIA semantics**: only `role="dialog"` is on the popup card. Plan 03 must add `aria-modal="true"`, `aria-labelledby="chat-popup-heading"`, plus `role="log"` / `aria-live="polite"` on messages, `role="alert"` on error bubble, `role="status"` on loading bubble.
- **Escape-to-close** keyboard handler: not yet wired. Plan 03 owns this.
- **Focus restoration on close**: not yet wired (capture `document.activeElement` on mount, restore on unmount). Plan 03 owns this.
- **Focus-visible outline rings**: rely on browser defaults right now. Plan 03 may want to apply explicit 2px outline + 2px offset per UI-SPEC §4 if defaults are insufficient.

The chip strip and send button are now structured to receive Plan 03's CSS-class-based motion treatment with minimal refactor (e.g., extracting the chip hover transform into a CSS class would let Plan 03 add the reduced-motion fallback in one place).

## Self-Check: PASSED

- File exists: `src/components/chat-popup.tsx` -- FOUND
- Commit `3d71ddc` exists in `git log` -- FOUND
- Commit `3c70077` exists in `git log` -- FOUND
- All 11 success criteria from PLAN frontmatter `must_haves.truths` validated by grep
- All 4 `must_haves.artifacts` `contains` substrings present in chat-popup.tsx
- Both `must_haves.key_links` patterns matched
- TypeScript compile passes cleanly
- ESLint passes cleanly
