# Phase 8: Voice Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 08-voice-mode
**Areas discussed:** TTS provider, VoiceBus architecture, Navbar morph design, Phase scope boundaries

---

## TTS Provider

| Option | Description | Selected |
|--------|-------------|----------|
| ElevenLabs non-streaming | Fetch full audio, play via AudioContext. Real amplitude data for waveform. | |
| ElevenLabs streaming | Stream audio chunks from /api/tts. Lower latency, MediaSource API. | ✓ |
| Web Speech Synthesis | Browser-native TTS. Robotic, contradicts D-06. | |

**User's choice:** ElevenLabs streaming
**Notes:** D-06 from Phase 6 locked ElevenLabs. User chose streaming over non-streaming for lower perceived latency.

---

## VoiceBus Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid (window + React context) | window.VoiceBus for rAF data, React VoiceBusProvider for UI state | ✓ |
| Window global only | Port prototype as-is. No TypeScript, no React lifecycle. | |
| React context only | All state in context. 60fps level causes re-render storm. | |

**User's choice:** Hybrid (Recommended)
**Notes:** Window is source of truth for level/attachMic/attachTTS. Context mirrors state enum for UI reactivity.

---

## Navbar Morph Design

| Option | Description | Selected |
|--------|-------------|----------|
| GSAP Flip desktop + CSS mobile | Desktop: GSAP Flip morph on same DOM node. Mobile: clip-path expansion. | ✓ |
| CSS transitions everywhere | Animate width/height. Layout thrashing, can't handle asymmetric growth. | |
| Overlay on top | New element above navbar. Z-index complexity. | |

**User's choice:** GSAP Flip desktop + CSS mobile (Recommended)
**Notes:** Same DOM node, two states. Navbar items fade out, capsule content fades in.

---

## Phase Scope Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Core only (VOIC-01 to VOIC-05) | Basic voice mode without extras. | |
| Core + barge-in + accessibility | Add barge-in and keyboard shortcuts. | |
| Everything in VOICE_HANDOFF | Full 1:1 port: tour, tool calls, barge-in, memory, accessibility. | ✓ |

**User's choice:** Everything in VOICE_HANDOFF
**Notes:** User explicitly stated "keep the voice thing identical to claude design prototype 1:1". Full port, not simplified.

---

## Claude's Discretion

- Waveform visualization rendering approach
- Audio chunk buffering strategy
- Tour highlight ring visual style
- VAD library choice

## Deferred Ideas

- Custom voice cloning via ElevenLabs Voice Lab
- Alternative STT providers (Deepgram, OpenAI Realtime)
- Mobile voice controls (MOBV-01, MOBV-02)
