# Sherlock Final Demo Script

## Opening: 30 seconds

Say:

"This project solves the identity routing problem before interview fraud detection. Sherlock first needs to know which participant stream belongs to the candidate."

Then add:

"Sherlock identifies the candidate participant stream, not legal identity. Fraud detection should only run after this routing layer is confident."

## Architecture Overview: 60 seconds

Explain the packages:

- `packages/shared`: Zod schemas and TypeScript contracts.
- `packages/core`: pure deterministic identity engine.
- `apps/http`: Fastify ingestion, session composition, optional persistence, and WebSocket broadcast.
- `packages/realtime`: reusable broadcast and subscription helpers.
- `packages/llm`: Gemini transcript role evidence extraction only.
- `packages/eval`: scenario replay and metrics.
- `apps/web`: dashboard for replay, evidence, uncertainty, and explanation.

Key line:

"Apps compose packages. The core engine does not import Fastify, Prisma, React, WebSocket, or an LLM SDK."

## Demo Flow

Use the scenario dropdown and run these in order.

### 1. Generic device insufficient

- Click: `02 - Generic device remains insufficient`.
- Point at: selected stream, participant tile, evidence table, expected-vs-actual.
- Proves: display name alone is not trusted.
- Say: "The system does not trust display name alone."

### 2. Strong self-identification

- Click: `12 - Strong self-identification`.
- Point at: transcript evidence, decision summary, participant confidence.
- Proves: explicit self-identification can resolve a generic device stream.
- Say: "A generic device becomes useful only after stronger transcript evidence arrives."

### 3. Multiple interviewers

- Click: `04 - Multiple interviewers`.
- Point at: interviewer metadata, negative evidence, safety gates.
- Proves: known interviewers are excluded from candidate selection.
- Say: "Interviewer exclusion is a safety guard, not a cosmetic label."

### 4. Ambiguous top two

- Click: `08 - Two unknown participants ambiguous`.
- Point at: final state, top streams, safety gates, expected-vs-actual.
- Proves: ambiguity is handled safely.
- Say: "Ambiguous is a safe valid outcome."

### 5. LLM candidate evidence

- Click: `18 - LLM candidate evidence`.
- Point at: transcript/LLM evidence panel and evidence table.
- Proves: Gemini extracts role evidence, but does not decide.
- Say: "LLM extracts role evidence; core makes the final decision."

### 6. Stable confirmation

- Click: `16 - Stable confirmation`.
- Point at: state change, confidence, pipeline, safety gates.
- Proves: confirmation requires stability over time.
- Say: "Likely candidate and confirmed candidate are intentionally different states."

## How To Explain The Dashboard

- Top decision summary: current selected stream, confidence, and state.
- Participant tiles: visible meeting streams and metadata hints.
- Pipeline trace: event received, signals extracted, weighted, ranked, gated, and emitted.
- Signal breakdown: what evidence families contributed before scoring.
- Safety gates: ambiguity, interviewer exclusion, contradiction, stability, and verification limits.
- Evidence table: positive/negative signals and uncertainty.
- Transcript/LLM evidence: raw transcript chunks and structured role evidence.
- Expected-vs-actual result: scenario pass/fail for the selected fixture.

## Key Lines To Say

- "The system does not trust display name alone."
- "Ambiguous is a safe valid outcome."
- "LLM extracts role evidence; core makes the final decision."
- "This identifies the candidate participant stream, not legal identity."
- "Fraud detection should only run after this routing layer is confident."

## Recording Note

Use a production build or disable local dev overlays/extensions before recording. If a red issue badge appears and the repo search does not find app code producing it, treat it as browser/dev tooling and record from a clean browser profile or production build.

## Closing: 30 seconds

Say:

"The next production steps would be meeting bot integration, a real ASR feed, privacy and security hardening, optional face/liveness/voice modules as separate evidence sources, and evaluation on larger real-world labeled datasets."
