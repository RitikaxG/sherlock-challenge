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
- No scoring engine, WebSocket behavior, dashboard, evaluator behavior, or LLM logic in this architecture-alignment pass.

## Architecture Overview

The target architecture is a Bun/Turborepo monorepo with pure identity logic at the center:

- `packages/shared`: Zod schemas and TypeScript contracts for meetings, participants, events, evidence, WebSocket messages, and scenarios.
- `packages/core`: pure signal extraction, fusion scoring, confidence state machine, and explanation generation.
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
| 1 | Bun/Turborepo workspace contracts and package boundary alignment | In progress |
| 2 | Prisma/Postgres persistence package | Later |
| 3 | Pure core domain model and deterministic signal extractors | Later |
| 4 | Fusion engine, confidence, ambiguity, and explanations | Later |
| 5 | Scenario simulator and evaluation harness | Later |
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
- `packages/db`: minimal Prisma package with generated client files and a placeholder schema.
- `packages/realtime`: placeholder realtime infrastructure package.
- `packages/eval`: placeholder evaluation package.
- `packages/eslint-config`: shared ESLint configuration.
- `packages/typescript-config`: shared TypeScript configuration.
- `packages/tailwind-config`: shared Tailwind styles.
- `docs/implementation-blueprint.pdf` and `docs/implementation-blueprint.docx`: implementation blueprint.

Expected target packages/apps that are not present yet:

- `packages/core`
- `packages/shared`
- `packages/llm`
- `scenarios`
- `docker-compose.yml`

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
bun --filter web run dev
bun --filter http run check-types
bun --filter @sherlock/realtime run check-types
bun --filter @sherlock/eval run check-types
bun --filter @repo/ui run check-types
```

When the Sherlock packages are added, keep using Bun filters:

```sh
bun --filter @sherlock/core run test
bun --filter @sherlock/db run test
```

## First Implementation Direction

The recommended next phase is to finish Phase 1 contracts before writing scoring logic. Add `packages/shared` with Zod schemas and TypeScript event contracts, add `packages/core` with a minimal pure test harness, and make `bun run check-types` pass across the workspace.
