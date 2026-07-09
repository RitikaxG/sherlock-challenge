import {
  CandidateStateUpdatedMessageSchema,
  type CandidateStateSnapshot,
  type CandidateStateUpdatedMessage
} from "@sherlock/shared";

import type {
  MeetingConnectionRegistry,
  RealtimeClient
} from "./connection-registry.ts";

export type BroadcastResult = {
  readonly attempted: number;
  readonly delivered: number;
  readonly removed: number;
};

export function broadcastJsonToMeeting(
  registry: MeetingConnectionRegistry,
  meetingId: string,
  message: unknown
): BroadcastResult {
  const payload = JSON.stringify(message);
  const clients = registry.getClients(meetingId);
  let delivered = 0;
  let removed = 0;

  for (const client of clients) {
    try {
      client.send(payload);
      delivered += 1;
    } catch {
      registry.unsubscribe(meetingId, client);
      client.close?.();
      removed += 1;
    }
  }

  return {
    attempted: clients.length,
    delivered,
    removed
  };
}

export function createCandidateStateUpdatedMessage(
  snapshot: CandidateStateSnapshot
): CandidateStateUpdatedMessage {
  return CandidateStateUpdatedMessageSchema.parse({
    type: "candidate_state_updated",
    snapshot
  });
}

export function broadcastCandidateStateUpdated(
  registry: MeetingConnectionRegistry,
  snapshot: CandidateStateSnapshot
): BroadcastResult {
  return broadcastJsonToMeeting(
    registry,
    snapshot.meetingId,
    createCandidateStateUpdatedMessage(snapshot)
  );
}

export type { RealtimeClient };
