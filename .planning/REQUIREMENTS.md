# Requirements: Portfolio V2 -- v4.3 Legacy V2 Chat-Only Boundary

**Defined:** 2026-04-29
**Core Value:** A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona.

## v4.3 Requirements

Requirements for the Legacy V2 text-chat boundary. Each maps to roadmap phases.

### Text Chat Boundary

- [x] **CHAT-01**: User can ask normal persona, portfolio, project, and broad-topic questions in Legacy V2 text chat and receive conversational answers without triggering site navigation or site-control side effects.
- [x] **CHAT-02**: User who asks Legacy V2 text chat to navigate, open a project viewer, scroll the site, toggle theme, run a tour, control the browser shell, or use other advanced controls receives a concise response that says text chat cannot do that and points them to voice mode for advanced features.
- [x] **CHAT-03**: Legacy V2 chat popup and the full `/chat` page send text-chat requests without enabling site-control tools.
- [x] **CHAT-04**: Legacy V2 chat popup and the full `/chat` page do not execute accidental tool-call parts from assistant messages.

### Voice Control Preservation

- [x] **VOICE-01**: Voice mode still supports the existing advanced site-control tools, including navigation, project opening, about-section scrolling, project-preview scrolling, browser close/external open, theme toggling, switch-to-text, and end-call behavior.

### Regression Coverage

- [x] **TEST-01**: Automated tests prove the server prompt/tool routing, text-chat transport bodies, client-side no-tool execution path, and voice tool access boundary.

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Chat Motion Polish

- **CHAT-ANIM-01**: User experiences a more refined DART chat popup transition and send/message animation polish without changing the final visual design baseline.

### Production API Verification

- **API-03**: Owner can run the existing live Amplify/custom-domain API smoke script against a reachable `audienclature.com` or Amplify production URL.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Removing voice-mode site control | The user explicitly wants advanced navigation/tool behavior preserved in voice mode. |
| Redesigning Legacy V2 chat visuals | v4.2 established the DART-refined popup as the final visual baseline; this milestone is behavior-only. |
| Removing ordinary URL links from chat answers | Text chat can still answer and linkify normal URLs; only tool-driven site control is disallowed. |
| Implementing CHAT-ANIM-01 | Transition polish remains future work unless explicitly pulled into scope later. |
| Amplify/custom-domain API verification | API-03 is infra-gated and unrelated to the chat boundary. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAT-01 | Phase 29 | Complete |
| CHAT-02 | Phase 29 | Complete |
| CHAT-03 | Phase 29 | Complete |
| CHAT-04 | Phase 29 | Complete |
| VOICE-01 | Phase 29 | Complete |
| TEST-01 | Phase 29 | Complete |

**Coverage:**
- v4.3 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 after roadmap creation*
