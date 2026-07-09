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
- No WebSocket behavior, dashboard, or LLM logic in the current evaluation-harness phase.

## Architecture Overview

The target architecture is a Bun/Turborepo monorepo with pure identity logic at the center:

- `packages/shared`: Zod schemas and TypeScript contracts for meetings, participants, events, evidence, WebSocket messages, and scenarios.
- `packages/core`: pure session state, deterministic signal extraction, fusion scoring, confidence/state decisions, ambiguity handling, and explanations.
- `packages/db`: Prisma/Postgres persistence for meetings, participants, events, score snapshots, and scenario results.
- `packages/llm`: structured transcript role evidence adapters with deterministic fallback rules.
- `packages/realtime`: reusable WebSocket infrastructure for connection registry, broadcaster, meeting subscriptions, and typed broadcast helpers.
- `packages/eval`: scenario replay, metrics, expected-vs-actual checks, and CLI reporting.
- `apps/http`: deployable backend server that composes HTTP routes and a WebSocket endpoint, calls packages, persists snapshots, and broadcasts live candidate state.
- `apps/web`: real-time dashboard for scenario replay, participant leaderboard, evidence, uncertainty, confidence timeline, and evaluation summaries.
- `scenarios`: replayable JSON edge cases with expected outcomes.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for package responsibilities, event flow, and the Mermaid diagram.

## Phase Plan Summary

| Phase | Goal | Status |
| --- | --- | --- |
| 0 | Product scope, thesis, acceptance criteria, architecture docs | Done |
| 1 | Bun/Turborepo workspace contracts and package boundary alignment | Done |
| 2 | Prisma/Postgres persistence package | Done |
| 3 | Pure core domain model and deterministic signal extractors | Done |
| 4 | Fusion engine, confidence, ambiguity, and explanations | Done |
| 5 | Scenario simulator and evaluation harness | Done |
| 6 | Fastify ingestion and WebSocket broadcast | Later |
| 7 | Optional LLM transcript classifier evidence package | Later |
| 8 | React real-time dashboard | Later |
| 9 | Edge-case hardening and evaluation report | Later |
| 10 | Submission polish, demo script, and reproducibility pass | Later |

## Current Repository Shape

This repository currently starts from a Turborepo Tailwind template and contains:

- `apps/web`: Next.js starter app.
- `apps/http`: placeholder backend composition package.
- `packages/ui`: shared React/Tailwind component package.
- `packages/shared`: Zod schemas and TypeScript contracts.
- `packages/core`: pure identity engine with deterministic signal extraction and fusion decision snapshots.
- `packages/db`: Prisma/Postgres schema, client helper, and repository plumbing.
- `packages/realtime`: placeholder realtime infrastructure package.
- `packages/eval`: scenario replay, metrics, expected-vs-actual checks, and CLI reporting.
- `packages/eslint-config`: shared ESLint configuration.
- `packages/typescript-config`: shared TypeScript configuration.
- `packages/tailwind-config`: shared Tailwind styles.
- `docs/implementation-blueprint.pdf` and `docs/implementation-blueprint.docx`: implementation blueprint.

Expected target packages/apps that are not present yet:

- `packages/llm`

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
bun --filter http check-types
bun --filter '@sherlock/shared' check-types
bun --filter '@sherlock/core' check-types
bun --filter '@sherlock/core' test
bun --filter '@sherlock/realtime' check-types
bun --filter '@sherlock/eval' check-types
bun --filter '@sherlock/eval' test
bun --filter '@sherlock/eval' eval
bun --filter '@sherlock/db' db:generate
bun --filter '@sherlock/db' db:migrate
bun --filter '@sherlock/db' check-types
bun --filter '@sherlock/db' test
bun --filter @repo/ui run check-types
```

Local Postgres:

```sh
docker compose up -d
```

## Next Implementation Direction

The recommended next phase is Phase 6: add Fastify ingestion and WebSocket broadcast in `apps/http`, with realtime helpers from `packages/realtime`, without moving identity decision logic out of `packages/core`.
