# Sherlock Dashboard Demo Guide

## Start Locally

```sh
docker compose up
```

Open `http://localhost:3000`.

This starts Postgres, applies Prisma migrations before the backend boots, runs the Fastify backend on `http://localhost:3001`, and runs the Next.js dashboard on `http://localhost:3000`.

Manual Bun fallback:

```sh
# terminal 1
HOST=127.0.0.1 PORT=3001 bun --filter http dev

# terminal 2
bun --filter web dev
```

Useful env vars:

```env
NEXT_PUBLIC_SHERLOCK_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
SHERLOCK_WEB_ORIGIN=http://localhost:3000
```

## Suggested 5-10 Minute Demo Order

1. Generic device insufficient
2. Strong self-identification
3. Multiple interviewers
4. Ambiguous top two
5. LLM candidate self-identification
6. Stable candidate confirmation

## Explaining The Dashboard

- Pipeline Trace: narrate the path from event ingestion to signal extraction, weighting, ranking, safety gates, and emitted decision.
- Signal Breakdown: use the donut to show which signal families contributed, then use the stacked bars to explain positive vs negative impact per stream.
- Safety Gates: call out interviewer exclusion, contradictions, ambiguity margin, confirmation stability, evidence decay, and the identity verification limitation.
- Event Impact: after stepping a scenario, show what changed in state, confidence, selected stream, and evidence after the latest event.
- Transcript / LLM Evidence: separate transcript chunks from Gemini structured role evidence. Gemini contributes evidence only; core still makes the candidate decision.

## Final Recording Note

Use a production build or disable local dev overlays/extensions before recording. A visible development issue badge should not appear in the final demo unless it is clearly browser/dev tooling outside the app.

## What Each Scenario Proves

- Generic device insufficient: Sherlock does not trust "MacBook Pro" or other weak display names.
- Strong self-identification: transcript evidence can identify a generic stream once the speaker self-identifies.
- Multiple interviewers: company-domain and interviewer metadata prevent interviewer streams from being selected.
- Ambiguous top two: the engine intentionally refuses to choose when candidates are too close.
- LLM evidence: Gemini extracts structured transcript role evidence only; core still makes the final decision.
- Stable confirmation: confirmation requires repeated evidence across time and sources.

## Framing

Sherlock identifies the candidate participant stream inside a live meeting. It does not perform human identity verification such as face match, liveness, ID checks, or voice biometrics. It also does not make a cheating or fraud verdict. The dashboard is meant to show the identity routing layer that must exist before any downstream fraud detection can be trusted.
