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
- `packages/speech` converts upstream speech activity and transcript observations into shared `MeetingEvent` objects. It must not record raw audio or compute candidate identity.
- `packages/llm` owns transcript evidence extraction only. It must not directly select the candidate.
- `packages/db` owns Prisma schema, migrations, typed DB client, and repositories.
- `packages/db` stores events, evidence, score snapshots, and scenario results, but it must not compute candidate identity.
- `packages/shared` owns shared Zod schemas and TypeScript contracts.
- `apps/web` owns the dashboard UI.
- LLMs may contribute structured transcript evidence, but the deterministic fusion engine remains the final decision-maker.

## Current Phase Guardrail

Phase 10 is final verification, documentation cleanup, and packaging.

Do not implement new features in Phase 10.
Only fix reproducibility, stale docs, command failures, packaging, or final verification issues.

Do not implement yet:

- production Zoom/Meet/Teams integration
- raw audio recording
- CV/person detection
- face recognition
- voice biometrics
- legal identity verification
- cheating/fraud verdicts
- autonomous multi-agent framework

For `apps/web`:

- It owns dashboard UI and demo experience only.
- It may call `apps/http` routes and WebSocket endpoint.
- It must not compute candidate identity.
- It must display backend/core decisions only.
- It may show local fallback demo mode, but must clearly label it as fallback.

For `packages/llm`:

- It owns transcript role evidence extraction only.
- It may call Gemini from `gemini-provider.ts`.
- It must read secrets from environment variables such as `GEMINI_API_KEY`; never commit API keys.
- It must validate model JSON output with Zod before producing shared events.
- It must not select the final candidate or compute candidate identity.
- It must not import apps, DB, React, Fastify, WebSocket, realtime, or core unless a shared type compatibility issue absolutely requires it.

For `apps/http`:

- It may orchestrate route validation, in-memory session state, optional DB persistence, and realtime broadcast.
- It may receive `MeetingEvent` objects from meeting bots, speech collectors, fixtures, or future integrations.
- It must call `packages/core` for identity decisions through the session store; it must not implement scoring, transcript interpretation, contradiction detection, confidence, or explanation logic.
- It may broadcast `candidate_state_updated` through `packages/realtime`.
- It should keep DB persistence optional so local tests do not require Postgres.
- It may optionally invoke `packages/llm`, but prompt/provider logic must stay in `packages/llm`.

For `packages/eval`:

- Replay scenarios by calling `packages/core`; do not reimplement candidate selection, scoring, ambiguity, or confidence rules.
- Evaluation code may load local JSON fixtures and compute expected-vs-actual metrics.
- Scenario fixtures should stay synthetic and must not contain real candidate data.
- The eval package may depend on `@sherlock/shared`, `@sherlock/core`, and Node/Bun filesystem APIs only.
- It must not import DB, Fastify/API, realtime/WebSocket, React/UI, or LLM packages.

For `packages/speech`:

- Convert structured upstream speech/transcript observations into shared `MeetingEvent` objects.
- Resolve participants through stream IDs, speaker labels, or external user IDs.
- Use dependency-injected sinks/fetches for testability.
- Do not import `@sherlock/core`, `@sherlock/db`, React, Fastify, WebSocket libraries, audio/CV libraries, or LLM providers.
- Do not record raw audio or decide who the candidate is.
- `apps/http` will later receive generated events and call `packages/core`.

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
bun --filter '@sherlock/llm' test
bun --filter '@sherlock/eval' test
bun --filter '@sherlock/eval' eval
bun --filter '@sherlock/speech' test
bun --filter http test
```

## Testing Expectations

- Keep domain logic covered with fast unit tests.
- Add scenario/evaluation tests before tuning scoring thresholds.
- Any later integration with DB, API, WebSocket, or UI should prove that `packages/core` remains independently testable.
