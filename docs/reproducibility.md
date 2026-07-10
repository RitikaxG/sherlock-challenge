# Reproducibility Guide

## Prerequisites

- Bun
- Docker
- Optional Gemini API key

## Local Commands

Install dependencies:

```sh
bun install
```

Typecheck, test, build, and evaluate:

```sh
bun run check-types
bun run build
bun --filter web test
bun --filter http test
bun --filter '@sherlock/core' test
bun --filter '@sherlock/llm' test
bun --filter '@sherlock/eval' test
bun --filter '@sherlock/eval' eval
```

Run the local dashboard without Docker:

```sh
HOST=127.0.0.1 PORT=3001 bun --filter http dev
```

In another terminal:

```sh
bun --filter web dev
```

Open `http://localhost:3000`.

## Docker Demo

```sh
docker compose up
```

Open:

```text
http://localhost:3000
```

Docker starts Postgres, applies committed Prisma migrations from `packages/db/prisma/migrations`, starts the Fastify backend on `http://localhost:3001`, and starts the Next.js dashboard on `http://localhost:3000`.

Recommended replay scenarios:

1. Generic device insufficient
2. Strong self-identification
3. Multiple interviewers
4. Ambiguous top two
5. LLM candidate evidence
6. Stable confirmation

## Optional Gemini

`.env.example` uses placeholders only. Do not commit real keys.

Required variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
ENABLE_LLM_TRANSCRIPT_CLASSIFIER=false
```

Optional integration test:

```sh
GEMINI_API_KEY=your_key_here bun --filter '@sherlock/llm' test:integration
```

Enable Gemini-backed backend transcript classification:

```sh
ENABLE_LLM_TRANSCRIPT_CLASSIFIER=true GEMINI_API_KEY=your_key_here bun --filter http dev
```

With Docker:

```sh
ENABLE_LLM_TRANSCRIPT_CLASSIFIER=true GEMINI_API_KEY=your_key_here docker compose up
```

Gemini extracts structured transcript role evidence only. It does not select the candidate.

## Troubleshooting

- Backend unavailable fallback: if `NEXT_PUBLIC_ENABLE_DEMO_MODE=true`, the web app can show a local visual fallback warning instead of pretending the backend is connected.
- WebSocket closed but HTTP active: the dashboard can continue with snapshot polling; verify `http://localhost:3001/ready`.
- Red issue/dev overlay: repo search did not find an app-generated `Issues` badge. For recording, use a production build, a clean browser profile, or disabled local extensions/overlays.
- Prisma migration/db setup: Docker uses `bun --filter '@sherlock/db' db:deploy` against committed migrations. For manual local setup, use `DATABASE_URL="postgresql://sherlock:sherlock@localhost:5432/sherlock_dev" bun --filter '@sherlock/db' db:migrate`.
- Prisma OpenSSL warning in Docker: the `oven/bun` image may warn that Prisma could not detect libssl and is defaulting to `openssl-1.1.x`. In the local demo check, migrations and client generation still completed successfully. A production Dockerfile should install OpenSSL explicitly or use an image that includes it.
- Docker dependencies: the `deps` service caches `node_modules` against `bun.lock`, so repeated `docker compose up` runs skip `bun install` when the lockfile is unchanged.

## Limitations

The demo does not include production meeting integrations, raw audio recording, face recognition, voice biometrics, legal identity verification, or fraud verdicts.
