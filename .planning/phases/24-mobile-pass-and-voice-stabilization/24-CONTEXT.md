# Phase 24: Mobile Pass + Voice Stabilization - Context

**Gathered:** 2026-04-26
**Status:** Retroactive — work was performed across five commits between Phase 23's filing and milestone close. This phase captures it so the v4.1 archive reflects the actual landed code.

<domain>
## Phase Boundary

Phase 24 is a stabilization + mobile pass after Phase 23's "no hardcoded speech" deploy revealed two follow-on problems on the live site:

1. **TTS still didn't play.** Phase 23's R-1 fix (barge-in `_liveAudio` guard) closed one regression but the fetch chain hit the AudioContext autoplay policy in a different place — `_getCtx()` was called inside the `streamTTS` `.then` chain, long after the click gesture had expired. The context stayed suspended; `BufferSource.start()` succeeded silently; `onended` never fired; state hung at "speaking" or, for tool-only LLM responses, at "thinking" forever. User report: "completely broken... keeps thinking before even beginning to talk."

2. **Mobile UI overlapped.** With voice working again, the user moved on to mobile and found the navbar/landing visibly broken: AskParz button rendered with desktop coordinates inside the mobile flex layout, the Portfolio mobile image (sized 112 × `scale-[1.4]` ≈ 157 px) overflowed its 56 px button slot into the "About Me" text, and the AuthorName + ThemeToggle at `top: 20px` sat under the iOS notch / dynamic island. The iOS top-bar overlap manifested as "Lakshman Turlapati on the top overlapping with navbar."

Phase 24 closes both bug families and removes the temporary diagnostic API logging that was added during diagnosis.

Phase 24 explicitly does NOT cover:
- Wave-2 P1 audit findings still open in `21-AUDIT.md` (F-05 / F-06 / F-07 / F-08 / F-09).
- Particle-background mobile performance.
- Chat input keyboard handling on iOS.
- Project-detail full-screen mobile UX.

</domain>

<decisions>
## Implementation Decisions

### Voice TTS unstick — three layered fixes, all in `voice-controller.ts`
1. **Pre-warm `VoiceBus._ctx` in user gesture frame.** `open()` now calls `window.VoiceBus._getCtx()` synchronously inside the click-handler frame, so the AudioContext is created (or resumed) while the user gesture is still alive. Browser autoplay policy then permits subsequent operations on the existing context even from async callbacks.
2. **Actually `await ctx.resume()` inside `streamTTS` if state is `'suspended'`.** Belt-and-suspenders for the case where the pre-warm didn't fully resume — e.g., context was created earlier in a non-gesture path. Without this, `source.start()` plays into a suspended context and `onended` never fires.
3. **State always exits `'thinking'` when there's no clean text.** Old code reset state to idle only when `toolCalls.length === 0`. For tool-only responses (Grok navigates without speaking), state hung. New behavior: any path with empty `clean` resets state to idle and clears caption.

### Mobile pass — three commits worth of layout work
1. **AskParzButton — `variant: 'desktop' | 'mobile'`.** Desktop variant keeps the original `absolute right: 132 top-1/2` positioning. Mobile variant uses `position: relative` so the button stays inside its dedicated flex slot. Mobile variant also hides the "Parz" label (the pulsing green dot is enough affordance and the label crowded the 62 px slot) and tightens padding from `0 16px 0 13px` to `0 10px`.
2. **PortfolioButton mobile image clipping.** Reduced `<Image>` from `width=112 height=28` to `width=64 height=16`, plus `overflow-hidden` on the inner button so the scaled-1.4 image can never bleed into adjacent navbar slots even on the narrowest phones.
3. **iOS safe-area insets.** Added `viewport: { viewportFit: 'cover' }` to `app/layout.tsx` (without it iOS Safari refuses to expose `env(safe-area-inset-*)` at all). Mobile navbar bottom uses `max(20px, env(safe-area-inset-bottom))`. Mobile voice-overlay bottom on non-home pages uses the same. Mobile AuthorName and ThemeToggle wrappers on the home page use `top: calc(env(safe-area-inset-top) + 20px)`.
4. **Compact `VoicePanel` + `VoiceWave` for mobile.** New `compact` prop (default false). Mobile contexts pass it: tighter padding, smaller wave (60×32 vs 88×40), so the caption and three action buttons don't overflow the 70 px voice slot.

### Diagnostic logging — added then removed
While diagnosing the TTS hang, three API routes (`/api/chat`, `/api/tts`, `/api/stt-token`) got `console.warn` request-trace logging so `fly logs` could show whether the user's browser was actually hitting endpoints when they tested. The diagnosis confirmed the bug was client-side (server returned correct responses); the AudioContext autoplay fixes resolved it. The diagnostic logging is now removed in this phase.

### Why one phase covers all of this
Three reasons the splits would be artificial:
- All five commits are stabilization / polish work after Phase 23's behavioral changes; no new requirements.
- The voice-unstick and the mobile pass share a deploy cycle (the user reported each only after the previous landed live).
- The diagnostic logging was added solely to support the voice-unstick diagnosis and is removed in the same phase.

### Verification approach
- Reuse Phase 20 contract suite. None of the changes touch persona / safety / project-resolution.
- Manual smoke on the live deploy after each fix. The user is the loop.
- Bundle-string greps to confirm new code actually shipped (Fly auto-stop + cached browser bundle was a recurring confusion).

### Claude's discretion
- Single phase vs. four mini-phases (chose single).
- Phase title (`mobile-pass-and-voice-stabilization`).
- Whether to file the diagnostic-logging removal as a separate plan (folded into the same plan since it was a clean revert of work added in the same window).

</decisions>

<code_context>
## Existing code insights

- `useVoiceController` already had hooks for AudioContext access via `window.VoiceBus._getCtx()`; the fix was to call it earlier in the lifecycle, not introduce new infrastructure.
- The 600 px breakpoint and `useMediaQuery('(max-width: 599px)')` plumbing was already in place. Mobile navbar / desktop navbar swap was correct. The problem was inside the components, not the breakpoint.
- `AskParzButton` was a single component used in both navbars. Adding a `variant` prop instead of forking the component kept the orb animation, hover state, and click handlers shared.
- `VoicePanel` and `VoiceWave` similarly take a single `compact` prop now instead of being forked.
- Next.js 13+ supports `export const viewport: Viewport = { ... }` from `layout.tsx` for setting the viewport meta. Was simply not exported before this phase.
- The diagnostic logging used `console.warn` (not `console.log`) because Fly's log capture surfaces `console.warn` reliably in `fly logs`.

</code_context>
