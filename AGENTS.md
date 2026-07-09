# Sherlock Challenge Agent Rules

These rules apply to future Codex work in this repository.

## Product Scope

- Build a real-time Candidate Identity Fusion Engine for the Sherlock Internship Challenge.
- The product thesis is: identify the actual interview candidate by fusing meeting metadata, participant events, transcript evidence, behavior signals, confidence scoring, explanation, and edge-case evaluation.
- Work phase by phase. Do not implement later phases unless explicitly requested.
- Do not overbuild. Prefer a small, testable system that proves the identity-fusion problem well.
- Do not add secrets, API keys, real candidate data, or committed local credentials.

## Architecture Rules

- Use the existing Turborepo and Bun workspace setup. Do not switch to npm, pnpm, or yarn.
- Use Bun-first package exports. Runtime exports should point directly at TypeScript entrypoints such as `./index.ts` or `./broadcaster.ts`.
- Do not export package runtime entrypoints from `dist/`, and do not make internal workspace imports depend on generated build output.
- Follow the repository's existing package conventions. Do not force a `src/`-based structure where the package already uses root-level modules.
- Apps compose packages. Packages must not depend on apps.
- `apps/http` is the deployable backend transport/composition layer.
- `apps/http` composes HTTP routes and the WebSocket endpoint in one backend server. Do not create a separate deployable WebSocket backend.
- Keep `apps/http` thin: it may validate, orchestrate package calls, persist through `packages/db`, and broadcast through `packages/realtime`, but it must not contain scoring, confidence, or explanation logic.
- The core identity engine belongs in `packages/core` and must stay pure and testable.
- `packages/core` must not import or depend on Fastify, React, Prisma, WebSocket, an LLM provider, filesystem state, network calls, or environment variables.
- `packages/core` owns candidate scoring, signal extraction, confidence, state machine, and explanation logic.
- `packages/realtime` owns reusable WebSocket/realtime infrastructure only: connection registry, broadcaster, meeting subscriptions, and typed broadcast helpers.
- `packages/eval` owns scenario replay, metrics, expected-vs-actual checks, and CLI reporting.
- `packages/llm` owns transcript evidence extraction only. It must not directly select the candidate.
- `packages/db` owns Prisma schema, migrations, typed DB client, and repositories.
- `packages/db` stores events, evidence, score snapshots, and scenario results, but it must not compute candidate identity.
- `packages/shared` owns shared Zod schemas and TypeScript contracts.
- `apps/web` owns the dashboard UI.
- LLMs may contribute structured transcript evidence, but the deterministic fusion engine remains the final decision-maker.

## Current Phase Guardrail

Phase 4 is pure core fusion, confidence, ambiguity, and explanation logic only.

Do not implement yet:

- WebSocket behavior
- Fastify route behavior
- dashboard
- scenario evaluator behavior
- LLM logic/provider

## Commands

Use Bun commands from the repository root:

```sh
bun install
bun run check-types
bun run build
bun run lint
```

When package-specific commands are added, prefer Bun workspace filters, for example:

```sh
bun --filter '@sherlock/core' test
```

## Testing Expectations

- Keep domain logic covered with fast unit tests.
- Add scenario/evaluation tests before tuning scoring thresholds.
- Any later integration with DB, API, WebSocket, or UI should prove that `packages/core` remains independently testable.
