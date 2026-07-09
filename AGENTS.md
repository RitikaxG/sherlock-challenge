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
- Preserve the existing `src/` folder structure inside packages and apps when adding code.
- The core identity engine belongs in `packages/core` and must stay pure and testable.
- `packages/core` must not import or depend on Fastify, React, Prisma, WebSocket, an LLM provider, filesystem state, network calls, or environment variables.
- Delivery layers should be thin:
  - API/WebSocket orchestration belongs in `apps/api`.
  - Dashboard UI belongs in `apps/web`.
  - Prisma persistence belongs in `packages/db`.
  - Shared Zod schemas and TypeScript contracts belong in `packages/shared`.
  - LLM transcript evidence adapters belong in `packages/llm`.
- LLMs may contribute structured transcript evidence, but the deterministic fusion engine remains the final decision-maker.

## Current Phase Guardrail

This first pass is documentation and repository orientation only.

Do not implement yet:

- scoring engine
- signal extractors
- WebSocket layer
- Fastify API
- dashboard
- scenario evaluator
- LLM package/provider

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
bun --filter @sherlock/core run test
```

## Testing Expectations

- Keep domain logic covered with fast unit tests.
- Add scenario/evaluation tests before tuning scoring thresholds.
- Any later integration with DB, API, WebSocket, or UI should prove that `packages/core` remains independently testable.
