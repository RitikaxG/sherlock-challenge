import websocketPlugin from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import {
  CandidateStateUpdatedMessageSchema,
  type CandidateStateSnapshot
} from "@sherlock/shared";
import type {
  MeetingConnectionRegistry,
  RealtimeClient
} from "@sherlock/realtime";

import type { MeetingSessionStore } from "./session-store.ts";

function sendSnapshot(client: RealtimeClient, snapshot: CandidateStateSnapshot) {
  client.send(
    JSON.stringify(
      CandidateStateUpdatedMessageSchema.parse({
        type: "candidate_state_updated",
        snapshot
      })
    )
  );
}

export async function registerWebsocket(
  app: FastifyInstance,
  options: {
    sessionStore: MeetingSessionStore;
    realtimeRegistry: MeetingConnectionRegistry;
  }
) {
  await app.register(websocketPlugin);

  app.get("/meetings/:meetingId/ws", { websocket: true }, (socket, request) => {
    const { meetingId } = request.params as { meetingId: string };
    const snapshot = options.sessionStore.getSnapshot(meetingId);
    const client = socket as RealtimeClient;

    if (!snapshot) {
      client.send(JSON.stringify({ type: "error", error: "Meeting not found." }));
      client.close?.();
      return;
    }

    const unsubscribe = options.realtimeRegistry.subscribe(meetingId, client);
    sendSnapshot(client, snapshot);
    socket.on("close", unsubscribe);
  });
}
