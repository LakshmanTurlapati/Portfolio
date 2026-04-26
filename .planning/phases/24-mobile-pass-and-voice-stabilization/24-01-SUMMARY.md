---
phase: 24
plan: 01
subsystem: voice + mobile
tags: [audiocontext, autoplay-policy, mobile, ios-safe-area, viewport-fit, navbar]
key-files:
  - src/lib/voice-controller.ts
  - src/components/ask-parz-button.tsx
  - src/components/portfolio-button.tsx
  - src/components/mobile-navbar.tsx
  - src/components/voice-overlay.tsx
  - src/components/voice-panel.tsx
  - src/components/voice-wave.tsx
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/api/chat/route.ts
  - src/app/api/tts/route.ts
  - src/app/api/stt-token/route.ts
metrics:
  voice_unstick_layers: 3
  mobile_components_touched: 6
  ios_safe_area_sites_fixed: 4
  diagnostic_routes_cleaned: 3
---

# Plan 24-01 Summary: Mobile Pass + Voice Stabilization

## What Changed

### Voice TTS unstick (`voice-controller.ts`)
- **Pre-warm `_getCtx()` in user gesture frame.** `open()` now calls `window.VoiceBus._getCtx()` synchronously inside the click-handler frame so the AudioContext is created (or resumed) while the user gesture is still alive. Without this, the first `streamTTS` ran into autoplay policy when creating the context inside its async `.then` chain.
- **Actually `await ctx.resume()` inside `streamTTS`.** If `ctx.state === 'suspended'` after `_getCtx()`, await `resume()` before `decodeAudioData`. Belt-and-suspenders for the case where the pre-warm didn't fully resume.
- **State always exits `'thinking'` when there's no clean text.** Old code reset to idle only when `toolCalls.length === 0`. For tool-only LLM responses (Grok navigates without speaking), state hung at thinking. New: any empty-`clean` path resets state to idle and clears caption.

Result: Parz speaks on greet and on user turns, no more "completely broken… keeps thinking" report.

### Mobile navbar pass
- **AskParzButton — `variant: 'desktop' | 'mobile'`.** Default 'desktop' keeps the original `position: absolute; right: 132; top: 50%`. Mobile variant uses `position: relative` so the button stays in its dedicated flex slot (was escaping into the social-icons area), hides the "Parz" label (the pulsing green dot is enough affordance and the label crowded the 62 px slot on small phones), and uses `padding: 0 10px` instead of `0 16px 0 13px`.
- **PortfolioButton mobile image clipping.** `<Image>` reduced from `width=112 height=28` to `width=64 height=16`. With `scale-[1.4]` the image is now ~90 px wide and fits cleanly inside the ~56 px button. Added `overflow-hidden` to the inner button so any future scaling can't bleed past the slot boundary.
- **Compact VoicePanel + VoiceWave for mobile.** New `compact` prop (default false). Mobile contexts (mobile-navbar's voice slot, mobile voice-overlay) pass it. Tighter padding (`0 10px 0 14px` vs `0 14px 0 22px`), smaller gap (`10px` vs `16px`), smaller wave (60×32 with 6 px bars vs 88×40 with 8 px bars). Caption + three action buttons no longer overflow on narrow phones.

### iOS safe-area insets
- **`viewport: { viewportFit: 'cover' }`** added to `src/app/layout.tsx`. Without this, iOS Safari refuses to expose `env(safe-area-inset-*)` at all — every safe-area formula in the project resolved to 0.
- **Mobile-navbar bottom**: `max(20px, env(safe-area-inset-bottom))` — clears the home indicator on iPhone X+.
- **Mobile voice-overlay bottom** (non-home pages): same formula.
- **Mobile AuthorName + ThemeToggle**: `top: calc(env(safe-area-inset-top) + 20px)` — clears the dynamic island / status bar / Safari URL chrome.

### Diagnostic API logging removed
The three voice API routes (`/api/chat`, `/api/tts`, `/api/stt-token`) had temporary `console.warn` request-trace logging added during the TTS-unstick diagnosis. The diagnosis confirmed the bug was client-side (server returned correct responses); logging is now removed. Routes return to their pre-diagnosis shape.

## Verification

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 12/12 tests pass across 2 files |
| `npx next build` | Succeeds, all 12 routes generated |
| `npx next lint --dir src` | No new warnings on touched files |
| `grep -n 'console\.warn' src/app/api/{chat,tts,stt-token}/route.ts` | No matches |
| Live deploy on `https://portfolio-v4-test.fly.dev/` | Parz speaks; mobile navbar slots clean; AuthorName clears iOS notch |

## Deviations

- This phase is filed retroactively. The work happened across five commits over multiple deploy iterations as the user reported each follow-on (TTS still silent → mobile broken → iOS notch overlap). The phase document describes what actually shipped.
- One phase / one plan covers all four threads (voice unstick, mobile pass, iOS safe-area, diagnostic cleanup) because they share a deploy cycle and a single user-feedback thread. Splitting would be artificial.
- No automated tests added. The bugs were timing- and browser-dependent (autoplay policy, flex content overflow on a specific viewport, iOS safe-area exposure). Reproducing them in unit tests would require mocking `AudioContext` lifecycle, `fetch` event timing, and `env()` CSS resolution simultaneously.

## Self-Check

PASSED. Voice plays on the live deploy, mobile navbar overlap is gone, iOS notch is respected, diagnostic logging is back out of the routes. v4.1 milestone is functionally done — 9 phases / 14 plans, all deployed.
