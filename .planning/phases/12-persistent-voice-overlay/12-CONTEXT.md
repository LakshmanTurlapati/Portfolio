# Phase 12: Persistent Voice Overlay - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Lift voice session from page-level (home only) to layout-level so it persists across all page navigation. Voice overlay stays visible and active when navigating between pages. Ask Parz activation remains home-page only. ChatPopup remains home-page only.

</domain>

<decisions>
## Implementation Decisions

### Voice Overlay Persistence
- **D-01:** Voice overlay is a separate fixed-position element rendered at the layout level, NOT inside the navbar. When voice is active, it persists across all page navigations without resetting.
- **D-02:** Ask Parz button stays ONLY on the home page navbar. Voice mode can only be activated from the home page. Once activated, the overlay persists everywhere.
- **D-03:** OVLY-02 requirement adjusted: Ask Parz button is home-page only, but voice overlay once active is visible on all pages.

### Voice Panel Animation
- **D-04:** On the home page, keep the existing GSAP Flip morph animation (navbar transforms into voice panel). On non-home pages, the voice panel renders as a fixed position bar (no navbar to morph from, so it just appears).
- **D-05:** The voice panel needs two rendering modes: (1) inside navbar for GSAP Flip on home, (2) fixed overlay for non-home pages. The VoiceBus state drives which mode to use based on current route.

### Text Mode Fallback
- **D-06:** When user says "text mode" or "switch to text" while on a non-home page, navigate to the home page and open ChatPopup there. ChatPopup stays home-page only — no layout-level ChatPopup needed.

### VoiceBus State Persistence
- **D-07:** VoiceBusProvider is already in layout.tsx (layout-level). VoiceBus state machine (idle, listening, thinking, speaking) already survives navigation because it's in global scope. The hook (useVoiceController) is what needs to be lifted — its state (active, voiceProps, etc.) must be shared via React context.
- **D-08:** Create a VoiceSessionProvider client component at the layout level. It owns useVoiceController and exposes voice state + controls via context. Pages consume context instead of calling useVoiceController directly.

### Claude's Discretion
- Architecture of VoiceSessionProvider context shape (which values to expose, ref vs state for callbacks)
- How to handle GSAP Flip morph when voice was activated on home but user navigated away and came back (should it re-morph or just render as active?)
- Whether to use usePathname() or a simpler mechanism for detecting which page voice is on

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Voice Architecture
- `src/lib/voice-controller.ts` — useVoiceController hook (currently page-level, needs layout lift)
- `src/lib/voice-bus-init.ts` — VoiceBus state machine initialization
- `src/lib/voice-commands.ts` — Voice command definitions and TOUR_STEPS
- `src/providers/voice-bus-provider.tsx` — VoiceBusProvider (already layout-level)
- `src/types/voice-bus.d.ts` — VoiceBus type declarations (declare global)

### Voice UI Components
- `src/components/voice-panel.tsx` — VoicePanel component (currently inside navbar)
- `src/components/voice-wave.tsx` — VoiceWave amplitude visualization
- `src/components/ask-parz-button.tsx` — Ask Parz button with ambient orbs
- `src/components/desktop-navbar.tsx` — Desktop navbar with GSAP Flip morph
- `src/components/mobile-navbar.tsx` — Mobile navbar with CSS morph

### Layout & Pages
- `src/app/layout.tsx` — Root layout (providers wrapped here)
- `src/app/page.tsx` — Home page (currently owns voice controller + navbars)
- `src/app/portfolio/page.tsx` — Portfolio page (no navbar, back button only)
- `src/app/about/page.tsx` — About page (no navbar, back button only)
- `src/app/chat/page.tsx` — Chat page (no navbar, back button only)

### Chat
- `src/components/chat-popup.tsx` — ChatPopup component (home-page only, stays there)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VoiceBusProvider` — Already at layout level in layout.tsx. Provides window.VoiceBus initialization.
- `useVoiceController` — Complete voice hook with STT, TTS, AI loop, commands, tour. Needs lifting from page to layout via new provider.
- `VoicePanel` / `VoiceWave` — Ready-made UI components for the voice overlay.
- `TransitionProvider` / `useTransition` — Already layout-level, provides navigateWithReveal for voice commands.

### Established Patterns
- Provider nesting in layout.tsx: ThemeProvider → TransitionProvider → VoiceBusProvider → {children}
- VoiceNavProps pattern: Omit<VoicePanelProps, 'isDark' | 'micDenied'> — navbars inject their own theme/mic
- GSAP Flip morph: navbar element transforms into VoicePanel on activation (desktop only)
- CSS morph for mobile navbar voice transition

### Integration Points
- `layout.tsx` — New VoiceSessionProvider wraps inside existing VoiceBusProvider
- `page.tsx` (home) — Strips out useVoiceController call, consumes from context instead
- `desktop-navbar.tsx` / `mobile-navbar.tsx` — Props source changes from page to context
- Non-home pages — No changes needed (voice overlay renders independently at layout level)

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants voice overlay to persist "as long as it's open... unless closed"
- On home page, the GSAP Flip morph from navbar→voice panel should continue working as-is
- On non-home pages, voice panel just renders as a fixed position bar (simpler)
- "Switch to text" on non-home pages navigates back to home and opens ChatPopup

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-persistent-voice-overlay*
*Context gathered: 2026-04-24*
