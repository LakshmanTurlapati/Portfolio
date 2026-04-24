---
phase: 08-voice-mode
verified: 2026-04-23T00:00:00Z
status: passed
score: 15/15 must-haves verified
overrides_applied: 0
---

# Phase 8: Voice Mode Verification Report

**Phase Goal:** Users can speak to Parz -- voice mode activates from the navbar, the navbar morphs into a voice panel, and the full speech-to-text/text-to-speech pipeline runs with visual feedback
**Verified:** 2026-04-23
**Status:** PASSED
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Clicking Ask Parz activates voice mode and the navbar visually morphs into a voice control panel showing current state (idle, listening, thinking, speaking) | VERIFIED | `handleAskParz` in page.tsx calls `openVoice()`/`closeVoice()`. Desktop navbar conditionally applies `w-[760px] h-[72px]` vs `w-[630px] h-[60px]` + GSAP Flip.from(). VoicePanel renders state chip with 4 distinct colors. Human checkpoint A confirmed visually. |
| SC-2 | In listening state, the mic captures speech via Web Speech API and displays a live amplitude waveform visualization; the recognized transcript is visible before submission | VERIFIED | voice-controller.ts uses `(window as any).SpeechRecognition \|\| webkitSpeechRecognition`. `attachMic()` in voice-bus-init.ts creates AnalyserNode + `_startLoop()` for RMS. `r.onresult` sets `setTranscript()` for interim display. VoiceWave subscribes to `VoiceBus.on('level')`. Human checkpoint B confirmed. |
| SC-3 | After a voice query, Parz responds with synthesized speech (ElevenLabs eleven_turbo_v2_5 via /api/tts proxy) with a real amplitude envelope animation; the particles mesh breathes in sync with VoiceBus state | VERIFIED | `/api/tts/route.ts` calls `ElevenLabsClient.textToSpeech.stream(voiceId, { modelId: 'eleven_turbo_v2_5' })`. `streamTTS()` in voice-controller.ts fetches `/api/tts`, decodes via `AudioBufferSourceNode`, calls `_startLoop(analyser, 1.4)` for live RMS. particle-background.tsx `tick()` reads `window.VoiceBus.level` synchronously in rAF. Human checkpoints C + D confirmed. |
| SC-4 | User can say a page name to navigate, say "text" or click to switch to the chat text interface, or say "stop" / click to exit voice mode | VERIFIED | `handleUserTurn()` checks `isStopIntent`, `isTextModeIntent`, `isTourIntent`, `matchNavIntent` in order. `voiceProps.onFallbackChat` calls `openTextChat()`. Stop button calls `voiceProps.onStop` = `stopAll()`. Close button calls `voiceProps.onClose` = `close()`. Human checkpoint E confirmed. |

### Plan-Specific Must-Have Truths

#### Plan 01 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | window.VoiceBus exists after page load with state='idle' and level=0 | VERIFIED | `initVoiceBus()` sets `state: 'idle', level: 0` on `window.VoiceBus`. Called at module scope in voice-bus-provider.tsx before any useEffect. Idempotency guard: `if (typeof window === 'undefined' \|\| window.VoiceBus) return`. |
| 2 | window.VoiceBus.setState() transitions state and emits 'state' events | VERIFIED | `setState(s)` early-returns if same state, sets `window.VoiceBus.state = s`, calls `emit('state', s)`, then applies fallback levels when `!_liveAudio`. |
| 3 | window.VoiceBus.setLevel() clamps to [0,1] and emits 'level' events | VERIFIED | `setLevel(n)`: `Math.max(0, Math.min(1, n))`, early-returns on delta < 0.001, then `emit('level', v)`. |
| 4 | VoiceBusProvider context exposes current VoiceState string via useVoiceBus() | VERIFIED | VoiceBusProvider has `useEffect(() => window.VoiceBus.on('state', setState), [])`. useVoiceBus() returns `useContext(VoiceBusContext)`. use-voice-bus.ts re-exports from provider. |
| 5 | POST /api/tts with {text, voiceId} streams audio/mpeg bytes from ElevenLabs eleven_turbo_v2_5 | VERIFIED | Route uses `ElevenLabsClient.textToSpeech.stream(voiceId, { modelId: 'eleven_turbo_v2_5' })`, returns `Response(audioStream, { headers: { 'Content-Type': 'audio/mpeg' } })`. |
| 6 | ELEVENLABS_API_KEY never appears in client bundle; /api/tts returns 503 when env var absent | VERIFIED | Key only appears in `src/app/api/tts/route.ts` (3 occurrences, all server-side). No `NEXT_PUBLIC_` prefix. `hasEnvVar('ELEVENLABS_API_KEY')` guard returns 503 when absent. |

#### Plan 02 Must-Haves

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | useVoiceController hook returns { active, open, close, voiceProps } for controlling the full voice session | VERIFIED | Return at line 552: `{ active, open, close, micDenied, prefersReduced, voiceProps: { state, caption, transcript, onMic, onStop, onClose, onFallbackChat } }`. |
| 8 | Clicking the mic button starts SpeechRecognition (webkitSpeechRecognition fallback) and calls VoiceBus.attachMic() | VERIFIED | `startListening()` uses `(window as any).SpeechRecognition \|\| (window as any).webkitSpeechRecognition`. `r.onstart` calls `window.VoiceBus.attachMic()`. |
| 9 | When a final transcript arrives, matchNavIntent checks for page navigation; AI intent routes to /api/chat then /api/tts | VERIFIED | `handleUserTurn()` calls `matchNavIntent(u)` (line ~289). AI path: `fetch('/api/chat', ...)` then `streamTTS()` which calls `fetch('/api/tts', ...)`. |
| 10 | Voice history (last 20 messages) persists to localStorage under 'pf-voice-history' | VERIFIED | Load: `localStorage.getItem('pf-voice-history')` (line 103). Save: `localStorage.setItem('pf-voice-history', JSON.stringify(historyRef.current.slice(-20)))` (line 516). |
| 11 | Energy-threshold barge-in: mic energy above 0.15 while state === 'speaking' cancels TTS and switches to listening | VERIFIED | `window.VoiceBus.on('level', ...)` checks `window.VoiceBus.state === 'speaking' && effectiveLevel > 0.15` then calls `bargeIn()`. |
| 12 | Keyboard: Space held = push-to-talk while held; Esc = close voice mode | VERIFIED | `keydown Space` → `startListening()`. `keyup Space` → `recogRef.current?.stop()`. `keydown Escape` → `close()`. Registered when `active`, cleaned up on deactivation. |
| 13 | prefers-reduced-motion: morph animation is skipped, particle amplitude capped at 0.2 | VERIFIED | desktop-navbar.tsx `useGSAP`: checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, skips Flip.from() on match. voice-controller.ts caps `effectiveLevel = Math.min(level, 0.2)` in barge-in subscription when `prefersReduced`. |
| 14 | Mic-permission-denied state sets micDenied=true for recovery CTA display | VERIFIED | `r.onerror` handler: `if (e.error === 'not-allowed') setMicDenied(true)`. VoicePanel renders "Mic denied — click to retry" CTA when `micDenied` prop is true. |
| 15 | Tour step 4 openProject tool call dispatched via toolCallbacks.openProject -- not silently no-opped | VERIFIED | `dispatchToolCall` (line 112) invokes `toolCallbacks.openProject(args)` when provided; emits `console.warn('[VoiceController] openProject tool called but no toolCallbacks.openProject provided')` when absent. Called in `startTour()` at line 392. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/voice-bus.d.ts` | TypeScript Window augmentation for VoiceBusInstance | VERIFIED | Contains `declare global { type VoiceState; interface VoiceBusInstance; interface Window { VoiceBus } }` |
| `src/lib/voice-bus-init.ts` | initVoiceBus() singleton initializer | VERIFIED | Exports `initVoiceBus`, all prototype methods present: on/off/emit/setState/setLevel/_getCtx/_startLoop/_stopLoop/attachMic/attachTTSFake |
| `src/providers/voice-bus-provider.tsx` | React context mirror of window.VoiceBus.state | VERIFIED | Exports VoiceBusProvider + useVoiceBus. `initVoiceBus()` called at module scope. useEffect subscribes to `VoiceBus.on('state', ...)`. |
| `src/hooks/use-voice-bus.ts` | Convenience re-export of useVoiceBus | VERIFIED | `export { useVoiceBus } from '@/providers/voice-bus-provider'` |
| `src/app/api/tts/route.ts` | ElevenLabs streaming TTS proxy | VERIFIED | Exports POST. Uses ElevenLabsClient. eleven_turbo_v2_5. Voice ID allowlisted. Text sliced to 500 chars. 503 on missing key. |
| `src/lib/voice-controller.ts` | useVoiceController hook — full voice session state machine | VERIFIED | Exports useVoiceController. All session behaviors implemented and wired. |
| `src/lib/voice-commands.ts` | matchNavIntent regex router and TOUR_STEPS array | VERIFIED | Exports matchNavIntent, TOUR_STEPS (5 steps), isTourIntent, isStopIntent, isTextModeIntent. |
| `src/components/voice-wave.tsx` | 5-bar waveform driven by VoiceBus.level | VERIFIED | Exports VoiceWave. baseHeights [0.32, 0.62, 1.0, 0.62, 0.32]. Wobble formula with `phase * 1.7`. VoiceBus.on('level') subscription. rAF time loop. |
| `src/components/voice-panel.tsx` | NavbarVoicePanel content -- waveform, state chip, caption, action buttons | VERIFIED | Exports VoicePanel. State dot colors #8fbcff/#ff8f8f/#ffd58f/#8fffb6. vmDotBlink keyframes. FaMicrophone/FaStop/FaComment/FaXmark. micDenied CTA. |
| `src/components/desktop-navbar.tsx` | Desktop navbar with GSAP Flip voice-active morph | VERIFIED | Contains `voice-active`, `Flip.from`, `Flip.getState`, `gsap.registerPlugin(Flip)`. w-[760px] h-[72px] when voiceActive. VoicePanel rendered inside. prefers-reduced-motion jump-cut path. |
| `src/components/mobile-navbar.tsx` | Mobile navbar with CSS height transition voice-active morph | VERIFIED | Contains h-[140px] (voice-active), h-[70px] (default). CSS transition on height. VoicePanel rendered in expanded area. |
| `src/components/particle-background.tsx` | ParticleBackground with VoiceBus breathing rAF loop | VERIFIED | Contains `waitForInst`. Three `__vmTick` references (cancel-before-destroy, assign in waitForInst, cleanup). Breathing formulas: 1.6 Hz / 4.2 Hz, 65/35, i*0.18 phase offset. Thinking branch: 3.2 Hz pulse + 11 Hz spark. Baseline restore. |
| `src/app/layout.tsx` | VoiceBusProvider in provider stack | VERIFIED | Import and JSX usage both present (2 matches for VoiceBusProvider). |
| `src/app/page.tsx` | useVoiceController wired to navbars | VERIFIED | Imports useVoiceController, destructures active/open/close/micDenied/voiceProps, passes all to DesktopNavbar + MobileNavbar. handleAskParz toggles voice. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/lib/voice-bus-init.ts | window.VoiceBus | initVoiceBus() called at module scope in voice-bus-provider.tsx | WIRED | `initVoiceBus()` at module scope (line 10 of provider), before component definition |
| src/providers/voice-bus-provider.tsx | window.VoiceBus.on('state',...) | useEffect subscription | WIRED | `return window.VoiceBus.on('state', setState ...)` inside useEffect |
| src/app/api/tts/route.ts | ElevenLabsClient.textToSpeech.stream | POST handler with server-side ELEVENLABS_API_KEY | WIRED | `client.textToSpeech.stream(voiceId, { modelId: 'eleven_turbo_v2_5' })` |
| src/lib/voice-controller.ts | window.VoiceBus.setState | setState('listening')/setState('thinking')/setState('speaking')/setState('idle') | WIRED | All 4 state transitions confirmed in voice-controller.ts |
| src/lib/voice-controller.ts | /api/chat + /api/tts | handleUserTurn() calls fetch('/api/chat') then streamTTS() calls fetch('/api/tts') | WIRED | Both fetch calls present with correct endpoints |
| src/lib/voice-commands.ts | matchNavIntent | Called in handleUserTurn with lowercased utterance | WIRED | `matchNavIntent(u)` called at line ~289 |
| src/lib/voice-controller.ts | toolCallbacks.openProject | dispatchToolCall called in startTour for step.call entries | WIRED | `dispatchToolCall(step.call[0], step.call[1])` at line 392; openProject wired in dispatchToolCall body |
| src/app/page.tsx | src/components/desktop-navbar.tsx | voiceActive + voiceProps props | WIRED | Props passed: `voiceActive={voiceActive}`, `voiceProps={voiceProps}`, `micDenied={micDenied}` |
| src/components/desktop-navbar.tsx | GSAP Flip | useGSAP captures Flip.getState before adding voice-active class | WIRED | `Flip.getState(navRef.current)` then toggle class then `Flip.from(state, ...)` |
| src/components/voice-panel.tsx | src/components/voice-wave.tsx | VoiceWave rendered inside VoicePanel | WIRED | `import { VoiceWave }` and `<VoiceWave isDark={isDark} />` inside VoicePanel body |
| src/components/particle-background.tsx | window.VoiceBus.level | rAF tick reads window.VoiceBus.level synchronously | WIRED | `bus?.level ?? 0` in tick() function, called from requestAnimationFrame |
| containerRef.__vmTick | breathing rAF cancel | cleanup in useEffect calls containerRef.current.__vmTick?.() | WIRED | Three occurrences of `__vmTick` at correct positions (cancel-before-destroy, assign, unmount cleanup) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| VoiceWave | `level` (number 0-1) | `window.VoiceBus.on('level', ...)` → from RMS analysis in `_startLoop()` or `attachTTSFake()` | Yes — driven by real mic/audio amplitude at 60fps | FLOWING |
| VoiceWave | `t` (time) | `performance.now() / 1000` via rAF | Yes — real monotonic clock | FLOWING |
| VoicePanel | `state`, `caption`, `transcript` | Props from useVoiceController via page.tsx | Yes — live voice session state | FLOWING |
| particle-background | particle opacity/line_linked | `window.VoiceBus.level` + `window.VoiceBus.state` in rAF tick | Yes — synchronous window global read in rAF; no React re-renders | FLOWING |

### Behavioral Spot-Checks

Step 7b SKIPPED — voice mode requires browser APIs (SpeechRecognition, AudioContext, getUserMedia) that cannot be invoked from CLI. Human checkpoint was conducted and approved instead.

**Human checkpoint record (from 08-05-SUMMARY.md):**

| Checkpoint | Covers | Result |
|------------|--------|--------|
| A: Navbar morph (pill-to-capsule open + revert close) | VOIC-01 | PASS |
| B: Red dot + live transcript + active waveform bars during listening | VOIC-02 | PASS |
| C: Yellow thinking state, green speaking state, audio + animated waveform | VOIC-03 | PASS |
| D: Particle mesh breathes during voice activity, settles on close | VOIC-04 | PASS |
| E: Voice commands navigate pages, chat fallback opens ChatPopup, stop exits | VOIC-05 | PASS |
| F: Mobile bottom bar grows in height at <600px breakpoint | Mobile | PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VOIC-01 | 08-01, 08-02, 08-03, 08-05 | Clicking Ask Parz opens voice mode where the navbar morphs into a voice control panel | SATISFIED | handleAskParz opens voice mode; GSAP Flip morphs desktop navbar; CSS height transition morphs mobile navbar; VoicePanel shows state chip |
| VOIC-02 | 08-02, 08-03, 08-05 | Voice mode uses Web Speech API (SpeechRecognition) for STT with live mic amplitude visualization | SATISFIED | SpeechRecognition with webkitSpeechRecognition fallback in startListening(); attachMic() with AnalyserNode + _startLoop() for live RMS; VoiceWave renders 5 bars driven by level |
| VOIC-03 | 08-01, 08-02, 08-05 | Voice mode uses TTS with amplitude envelope animation | SATISFIED | Note: REQUIREMENTS.md says "Web Speech Synthesis" but ROADMAP SC (authoritative) specifies "ElevenLabs eleven_turbo_v2_5 via /api/tts proxy". Implementation uses ElevenLabs with AudioBufferSourceNode + real RMS amplitude. attachTTSFake() is the SpeechSynthesis fallback path when ElevenLabs fails. Both paths implemented. Human checkpoint C confirmed TTS + waveform sync. |
| VOIC-04 | 08-01, 08-04, 08-05 | VoiceBus manages state (idle, listening, thinking, speaking) and drives particle mesh breathing animation | SATISFIED | window.VoiceBus singleton with 4 states + pub/sub. particle-background.tsx waitForInst + tick loop reads VoiceBus.level and .state synchronously in rAF. All three breathing modes (thinking, level>0, baseline) implemented verbatim from prototype. |
| VOIC-05 | 08-02, 08-03, 08-05 | User can navigate pages, switch to text chat, or stop via voice commands | SATISFIED | matchNavIntent routes to portfolio/about/home. isTextModeIntent + onFallbackChat opens ChatPopup. isStopIntent + onStop/onClose exits. Human checkpoint E confirmed all 3 paths. |

Note on VOIC-03 discrepancy: REQUIREMENTS.md contains "Web Speech Synthesis for TTS" — this wording predates the v3 redesign decision to use ElevenLabs. The ROADMAP.md success criteria (the authoritative contract for Phase 8) explicitly specifies "ElevenLabs eleven_turbo_v2_5 via /api/tts proxy." The implementation satisfies the ROADMAP contract. WebSpeechSynthesis (`attachTTSFake`) is retained as a fallback when ElevenLabs fails, covering the original REQUIREMENTS.md intent as a degraded-mode path.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/voice-wave.tsx | 36 | `if (!mounted) return null` | INFO | SSR hydration guard — standard pattern for browser API components. Not a stub. The full waveform renders when mounted is true. |

No blockers, no stubs, no TODO/FIXME/PLACEHOLDER found in any of the 9 voice files.

### Human Verification Required

None — human verification was completed during plan 08-05. All 6 checkpoints (A through F) were approved by the developer. The approval covers all 5 VOIC requirements including complex visual behaviors that cannot be verified programmatically:
- GSAP Flip animation timing and smoothness
- VoiceWave bar naturalness
- Particle breathing visual sync
- Audio + waveform synchronization during TTS
- Mobile breakpoint height growth

### Gaps Summary

No gaps. All 15 must-haves verified. All 5 VOIC requirements satisfied. All key links wired. All required artifacts exist and contain substantive implementations. Data flows from real sources (audio analysis, AI API, SpeechRecognition) to UI components. Human visual verification completed with all checkpoints passing.

---

_Verified: 2026-04-23_
_Verifier: Claude (gsd-verifier)_
