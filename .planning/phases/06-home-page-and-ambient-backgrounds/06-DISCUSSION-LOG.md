# Phase 6: Home Page and Ambient Backgrounds - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-23
**Phase:** 06-home-page-and-ambient-backgrounds
**Areas discussed:** Particles config, Stats accuracy, Parz button scope

---

## Particles Config

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is | 90 nodes, speed 1.2, distance 150, grab 200 — matches prototype | ✓ |
| You decide | Claude tunes values during audit | |

**User's choice:** Keep as-is

---

## Stats Accuracy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep hardcoded | Simple, manual updates | |
| Fetch live | GitHub API for real-time stats | ✓ |

**Follow-up:**

| Option | Description | Selected |
|--------|-------------|----------|
| API-available only | Repos, stars, followers from API; hardcode contributions/streak | |
| All live | Everything including scraping contribution graph | ✓ |

**User's choice:** All live including contribution scraping

---

## Parz Button Scope

**User's choice:** Full functional 1:1 voice mode using ElevenLabs TTS + Grok AI

**Clarification:** Full voice mode is Phase 8 scope (VOIC-01-05). For Phase 6, button opens text chat as interim. Tech decisions locked for Phase 8:
- ElevenLabs API key: sk_0652cbb88d5012195f72d932c2609e949ff02c1edcbe7519
- ElevenLabs voice ID: dMWVPH9DSxWOMrrrUso3
- AI backend: Grok (xAI)

## Claude's Discretion

- GitHub API rate limit fallback behavior
- Contribution graph scraping approach
- Chat popup styling

## Deferred Ideas

- Full voice mode → Phase 8 (tech decisions locked)
