import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  createMeetingConnectionRegistry,
  type MeetingConnectionRegistry
} from "@sherlock/realtime";
import type { TranscriptClassifierProvider } from "@sherlock/llm";

import { createOptionalPersistence } from "./persistence.ts";
import { registerRoutes } from "./routes.ts";
import {
  createMeetingSessionStore,
  type MeetingSessionStore
} from "./session-store.ts";
import { registerWebsocket } from "./websocket.ts";
import type { PersistenceAdapter } from "./types.ts";

export type CreateHttpAppOptions = {
  readonly sessionStore?: MeetingSessionStore;
  readonly persistence?: PersistenceAdapter;
  readonly realtimeRegistry?: MeetingConnectionRegistry;
  readonly transcriptClassifier?: TranscriptClassifierProvider;
  readonly logger?: boolean;
};

export async function createHttpApp(options: CreateHttpAppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  const webOrigin = process.env.SHERLOCK_WEB_ORIGIN ?? "http://localhost:3000";
  const sessionStore = options.sessionStore ?? createMeetingSessionStore();
  const persistence = options.persistence ?? createOptionalPersistence();
  const realtimeRegistry =
    options.realtimeRegistry ?? createMeetingConnectionRegistry();

  await app.register(cors, {
    origin: webOrigin
  });
  await registerWebsocket(app, { sessionStore, realtimeRegistry });
  await registerRoutes(app, {
    sessionStore,
    persistence,
    realtimeRegistry,
    transcriptClassifier: options.transcriptClassifier
  });

  return app;
}
