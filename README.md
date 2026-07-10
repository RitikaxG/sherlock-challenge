# Sherlock Candidate Identity Fusion Engine

Sherlock needs an identity routing layer that identifies the actual interview candidate in real time by fusing metadata, participant events, transcript evidence, behavior signals, confidence scoring, explanations, and edge-case evaluation.

## Problem Statement

Interview fraud detectors are only useful when Sherlock knows which meeting participant is the candidate. In real calls, the candidate may join as "MacBook Pro", use the wrong display name, arrive late, change names, rejoin, or share the room with interviewers and observers. This project will resolve participant identity continuously, rank candidates with confidence, explain why a participant was selected, and gracefully return insufficient or ambiguous states when evidence is weak.

## Non-Goals

- No full Zoom, Google Meet, or calendar production integration in the sprint prototype.
- No deepfake detection, face recognition, voice biometrics, or complete anti-fraud suite.
- No heavy autonomous multi-agent framework.
- No committed secrets, API keys, or real candidate data.
- No black-box LLM final decision. LLM output can add transcript evidence only.
- No real speech/audio recording, CV, human identity verification, or fraud verdicts in the dashboard phase.

## Architecture Overview

The target architecture is a Bun/Turborepo monorepo with pure identity logic at the center:

- `packages/shared`: Zod schemas and TypeScript contracts for meetings, participants, events, evidence, WebSocket messages, and scenarios.
- `packages/core`: pure session state, deterministic signal extraction, fusion scoring, confidence/state decisions, ambiguity handling, and explanations.
- `packages/db`: Prisma/Postgres persistence for meetings, participants, events, score snapshots, and scenario results.
- `packages/llm`: structured transcript role evidence adapters with deterministic fallback rules.
- `packages/realtime`: WebSocket subscription registry and typed broadcast helpers.
- `packages/eval`: scenario replay, metrics, expected-vs-actual checks, and CLI reporting.
- `packages/speech`: speech metadata collector scaffolding that maps upstream speech/transcript observations into shared meeting events.
- `apps/http`: deployable backend server that composes Fastify HTTP routes and a WebSocket endpoint, calls packages, optionally persists snapshots, and broadcasts live candidate state.
- `apps/web`: real-time dashboard for scenario replay, participant leaderboard, evidence, uncertainty, confidence timeline, and evaluation summaries.
- `scenarios`: replayable JSON edge cases with expected outcomes.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for package responsibilities, event flow, and the Mermaid diagram.

## Project Docs

- [Architecture](./ARCHITECTURE.md)
- [Evaluation Report](./docs/evaluation-report.md)
- [Reproducibility Guide](./docs/reproducibility.md)

## Phase Plan Summary

| Phase | Goal | Status |
| --- | --- | --- |
| 0 | Product scope, thesis, acceptance criteria, architecture docs | Done |
| 1 | Bun/Turborepo workspace contracts and package boundary alignment | Done |
| 2 | Prisma/Postgres persistence package | Done |
| 3 | Pure core domain model and deterministic signal extractors | Done |
| 4 | Fusion engine, confidence, ambiguity, and explanations | Done |
| 5 | Scenario simulator and evaluation harness | Done |
| 5.5 | Core hardening, transcript specificity, temporal stability, evidence decay, and speech metadata scaffolding | Done |
| 6 | Fastify ingestion and WebSocket broadcast | Done |
| 7 | Optional LLM transcript classifier evidence package | Done |
| 8 | React real-time dashboard and demo experience | Done |
| 9 | Final evaluation report, reproducibility pass, and docs polish | Done |
| 10 | Final verification and documentation cleanup | Done |

## Current Repository Shape

This repository currently starts from a Turborepo Tailwind template and contains:

- `apps/web`: Next.js real-time interview dashboard for scenario replay, candidate decision display, evidence, and uncertainty.
- `apps/http`: Fastify ingestion and WebSocket composition app.
- `packages/ui`: shared React/Tailwind component package.
- `packages/shared`: Zod schemas and TypeScript contracts.
- `packages/core`: pure identity engine with deterministic signal extraction and fusion decision snapshots.
- `packages/db`: Prisma/Postgres schema, client helper, and repository plumbing.
- `packages/realtime`: reusable realtime registry and broadcaster helpers.
- `packages/eval`: scenario replay, metrics, expected-vs-actual checks, and CLI reporting.
- `packages/speech`: speech metadata mapping, event factory, collector, and optional injected HTTP sink.
- `packages/llm`: Gemini-backed structured transcript role evidence extraction with mock-provider tests.
- `packages/eslint-config`: shared ESLint configuration.
- `packages/typescript-config`: shared TypeScript configuration.
- `packages/tailwind-config`: shared Tailwind styles.
- `docs/implementation-blueprint.pdf` and `docs/implementation-blueprint.docx`: implementation blueprint.

## Commands

Use Bun from the repository root:

```sh
bun install
bun run check-types
bun run build
bun run lint
```

Useful package-level commands currently available:

```sh
bun --filter web dev
bun --filter web check-types
bun --filter web build
bun --filter web test
bun --filter http check-types
bun --filter http test
bun --filter http dev
bun --filter '@sherlock/shared' check-types
bun --filter '@sherlock/core' check-types
bun --filter '@sherlock/core' test
bun --filter '@sherlock/llm' check-types
bun --filter '@sherlock/llm' test
bun --filter '@sherlock/realtime' check-types
bun --filter '@sherlock/eval' check-types
bun --filter '@sherlock/eval' test
bun --filter '@sherlock/eval' eval
bun --filter '@sherlock/speech' check-types
bun --filter '@sherlock/speech' test
bun --filter '@sherlock/db' db:generate
bun --filter '@sherlock/db' db:migrate
bun --filter '@sherlock/db' check-types
bun --filter '@sherlock/db' test
bun --filter @repo/ui run check-types
```

Optional real Gemini smoke test:

```sh
GEMINI_API_KEY=... bun --filter '@sherlock/llm' test:integration
```

Gemini is used only to extract structured transcript role evidence. The LLM does not select the candidate; `packages/core` remains the deterministic final decision-maker.

### Enabling real Gemini transcript classification in the backend

By default, the backend accepts transcript and LLM-evidence events but does not call Gemini automatically.

To enable real Gemini classification when `transcript_chunk` events arrive:

```sh
ENABLE_LLM_TRANSCRIPT_CLASSIFIER=true
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
bun --filter http dev
```

With Docker:

```sh
ENABLE_LLM_TRANSCRIPT_CLASSIFIER=true GEMINI_API_KEY=your_key_here docker compose up
```

The LLM extracts structured transcript role evidence only. It does not select the candidate. `packages/core` remains the deterministic final decision-maker.

Dashboard env vars:

```env
NEXT_PUBLIC_SHERLOCK_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
SHERLOCK_WEB_ORIGIN=http://localhost:3000
```

Run the full local application stack with Docker:

```sh
docker compose up
```

This starts:

- Postgres on `localhost:5432`
- Prisma migrations, applied before the backend starts
- Fastify backend on `http://localhost:3001`
- Next.js dashboard on `http://localhost:3000`

Open `http://localhost:3000`, choose a scenario, and start replay. The web app creates a meeting through `apps/http`, posts fixture events, listens for `candidate_state_updated` over WebSocket, and falls back to snapshot polling if the socket is unavailable. If the backend is unavailable and demo mode is enabled, the UI shows a clear local visual fallback warning instead of pretending it is connected.

### Dashboard explanation model

The dashboard explains four layers:

1. Raw events: what happened in the meeting.
2. Signals: what evidence was extracted.
3. Fusion: how weighted evidence affected each participant.
4. Safety gates: why the engine selected, refused, or delayed confirmation.

Manual Bun fallback:

```sh
# terminal 1
HOST=127.0.0.1 PORT=3001 bun --filter http dev

# terminal 2
bun --filter web dev
```

Postgres only:

```sh
docker compose up postgres
```

## Project Status

The repository is ready after running the verification commands.

Primary implementation docs:

- Architecture doc
- Evaluation report
- Reproducibility guide

The engine identifies the candidate participant stream; it does not verify legal human identity or make cheating/fraud verdicts.
