# Phase 16: Public-Safe Persona and Content Refresh - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the auto-selected alternatives considered.

**Date:** 2026-04-26
**Phase:** 16-public-safe-persona-and-content-refresh
**Mode:** auto
**Areas discussed:** Public source of truth, Current public facts, Persona voice, Safety/refusals, Visible content parity

---

## Public Source of Truth

| Option | Description | Selected |
|--------|-------------|----------|
| Typed first-party public data contract | Create/refactor shared TypeScript data used by prompt and visible content. | yes |
| Direct edits in each existing file | Manually edit `system-prompt.ts`, `bio.ts`, `experience.ts`, and `projects.ts` independently. | |
| External CMS/database/vector store | Move portfolio facts outside the codebase. | |

**Auto choice:** Typed first-party public data contract.
**Notes:** Recommended by `.planning/research/SUMMARY.md` and consistent with existing `src/data/*` patterns. Avoids source-of-truth drift without adding unnecessary infrastructure.

---

## Current Public Facts

| Option | Description | Selected |
|--------|-------------|----------|
| High-level public-safe facts only | Use approved InfiniteChoice/Voyza wording, FSB/GitFly flagship positioning, and GitFly public link only. | yes |
| Rich employer/product detail | Include deeper employer/product implementation or metrics. | |
| Keep current stale facts | Preserve Rocket Mortgage/current old project framing. | |

**Auto choice:** High-level public-safe facts only.
**Notes:** Matches PROJECT/REQUIREMENTS safety constraints. Current files contain stale Rocket Mortgage and old FSB/GitFly framing that planning should update.

---

## Persona Voice

| Option | Description | Selected |
|--------|-------------|----------|
| Direct-first warm builder voice | Concise answer first, personality through wording, no corporate/recruiter tone. | yes |
| Highly casual/chattery voice | More banter, longer friend-texting responses. | |
| Formal portfolio assistant | Professional recruiter-style voice. | |

**Auto choice:** Direct-first warm builder voice.
**Notes:** Carries forward current project guidance: direct, warm, practical, playful when appropriate, not robotic or corporate.

---

## Safety and Refusals

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit refusal categories | Define internal prompt/data, secrets/config, private GitFly source, non-public employer details, and voice internals as protected. | yes |
| Generic safety note | Add a broad instruction to avoid private details. | |
| Rely on model discretion | Do not encode specific refusal boundaries. | |

**Auto choice:** Explicit refusal categories.
**Notes:** Required by SAFE-01 through SAFE-05 and reduces ambiguity for prompt planning.

---

## Visible Content Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt and UI share same facts | About, Experience, projects, and prompt data are derived from or checked against the same approved facts. | yes |
| Update only prompt first | Improve Parz while leaving visible site content stale. | |
| Update visible site only | Improve pages while leaving Parz stale. | |

**Auto choice:** Prompt and UI share same facts.
**Notes:** Required by CONT-05 and aligns with later Phase 20 parity tests.

---

## Claude's Discretion

- Exact module names and copy wording may be chosen during planning/implementation if they satisfy the locked facts and guardrails.
- The planner may decide whether Phase 16 includes lightweight static checks or leaves the full test suite to Phase 20.

## Deferred Ideas

- Direct inbuilt-browser project opening is Phase 17.
- Global Parz site control is Phase 18.
- FSB-inspired overlay is Phase 19.
- Full eval/E2E coverage is Phase 20.
