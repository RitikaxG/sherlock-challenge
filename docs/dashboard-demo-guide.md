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

## What Each Scenario Proves

- Generic device insufficient: Sherlock does not trust "MacBook Pro" or other weak display names.
- Strong self-identification: transcript evidence can identify a generic stream once the speaker self-identifies.
- Multiple interviewers: company-domain and interviewer metadata prevent interviewer streams from being selected.
- Ambiguous top two: the engine intentionally refuses to choose when candidates are too close.
- LLM evidence: Gemini extracts structured transcript role evidence only; core still makes the final decision.
- Stable confirmation: confirmation requires repeated evidence across time and sources.

## Framing

Sherlock identifies the candidate participant stream inside a live meeting. It does not perform human identity verification such as face match, liveness, ID checks, or voice biometrics. It also does not make a cheating or fraud verdict. The dashboard is meant to show the identity routing layer that must exist before any downstream fraud detection can be trusted.
