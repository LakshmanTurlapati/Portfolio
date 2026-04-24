# Phase 13: Tool Callbacks and Visual Feedback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 13-tool-callbacks-and-visual-feedback
**Areas discussed:** Viewport glow style, openProject routing, Tour behavior

---

## Viewport Glow Style

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle box-shadow | Soft outer glow via CSS box-shadow, doesn't cover content | ✓ |
| Thick border glow | FSB-style 3-4px solid border with outer glow | |
| Corner accents only | Glow in 4 corners only | |

**User's choice:** Subtle box-shadow

## Glow Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Pulse (breathing) | Glow intensity oscillates slowly | ✓ |
| Solid | Constant glow, no animation | |
| Fade in only | Fades in on state change, stays solid | |

**User's choice:** Pulse (breathing) for listening state

---

## openProject Routing

| Option | Description | Selected |
|--------|-------------|----------|
| URL query param | Navigate to /portfolio?open=slug | |
| Navigate + delay | Navigate first, dispatch after delay | |
| Context-based | Set target in context, portfolio reads on mount | |
| Open IframeViewer here | Open project link directly on current page | |
| Navigate to portfolio | Go to portfolio and open detail card | ✓ |
| IframeViewer first, fallback | Try IframeViewer, fallback to portfolio | |

**User's choice:** Navigate to portfolio and open project detail card there.

---

## Tour Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-play continuous | Each step plays after TTS finishes, no pauses | ✓ |
| Wait for speech end | Wait for TTS + 1s pause between steps | |
| User confirms each | Parz asks "ready?" and waits for "next" | |

**User's choice:** Auto-play continuous — smooth demo flow.

---

## Claude's Discretion

- Page-ready signal implementation
- VoiceGlow component architecture
- openProject cross-page navigation mechanism
- Tool-executing state detection

## Deferred Ideas

None
