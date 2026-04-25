# Phase 12: Persistent Voice Overlay - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 12-persistent-voice-overlay
**Areas discussed:** Voice overlay placement, Activation scope, Text mode fallback, Animation approach

---

## Voice Overlay Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Navbar on all pages | Full navbar on all pages for Ask Parz access | |
| Voice panel location | Fixed overlay independent of navbar | |
| ChatPopup scope | Move ChatPopup to layout level | |

**User's choice:** "Voice overlay only on all pages.. only when it is active and continuous." — User wants the overlay as a separate fixed element, not tied to the navbar, only visible when active.

---

## Activation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Floating Ask Parz button | Small FAB on all pages | |
| Add to back button bar | Ask Parz next to back arrow | |
| Full navbar everywhere | Replace back buttons with full nav | |

**User's choice:** "cannot access other than in home" — Ask Parz activation is home-page only. Voice overlay persists once activated.

---

## Text Mode Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate home + open chat | Go to home and open ChatPopup | ✓ |
| ChatPopup anywhere | Layout-level ChatPopup overlay | |
| Navigate to /chat | Route to full chat page | |

**User's choice:** Navigate home + open chat — simplest approach, ChatPopup stays home-only.

---

## Animation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Keep GSAP morph | Navbar morphs on home, fixed panel on other pages | ✓ |
| Fixed panel always | Drop GSAP morph everywhere | |
| You decide | Claude picks | |

**User's choice:** Keep GSAP morph — on home page, navbar morphs into voice panel. On other pages, voice panel renders as fixed position (no navbar to morph from).

---

## Claude's Discretion

- VoiceSessionProvider context shape
- GSAP Flip re-morph behavior on return to home
- Page detection mechanism (usePathname vs other)

## Deferred Ideas

None
