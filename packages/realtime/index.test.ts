import { describe, expect, test } from "vitest";

import {
  broadcastCandidateStateUpdated,
  broadcastJsonToMeeting,
  createMeetingConnectionRegistry,
  type RealtimeClient
} from "./index.ts";
import type { CandidateStateSnapshot } from "@sherlock/shared";

function client(onSend: (data: string) => void): RealtimeClient {
  return {
    send: onSend
  };
}

const snapshot: CandidateStateSnapshot = {
  meetingId: "meeting_1",
  selectedCandidateId: "p_candidate",
  confidence: 0.8,
  state: "LIKELY_CANDIDATE",
  participants: [],
  evidence: [],
  uncertainty: []
};

describe("@sherlock/realtime", () => {
  test("subscribes and unsubscribes meeting clients", () => {
    const registry = createMeetingConnectionRegistry();
    const unsubscribe = registry.subscribe("meeting_1", client(() => {}));

    expect(registry.clientCount("meeting_1")).toBe(1);
    unsubscribe();
    expect(registry.clientCount("meeting_1")).toBe(0);
  });

  test("broadcasts JSON messages to meeting subscribers", () => {
    const registry = createMeetingConnectionRegistry();
    const sent: string[] = [];
    registry.subscribe("meeting_1", client((data) => sent.push(data)));

    const result = broadcastJsonToMeeting(registry, "meeting_1", {
      type: "hello"
    });

    expect(result).toEqual({ attempted: 1, delivered: 1, removed: 0 });
    expect(JSON.parse(sent[0] ?? "{}")).toEqual({ type: "hello" });
  });

  test("removes failed clients during broadcast", () => {
    const registry = createMeetingConnectionRegistry();
    let closed = false;
    registry.subscribe("meeting_1", {
      send() {
        throw new Error("socket closed");
      },
      close() {
        closed = true;
      }
    });

    const result = broadcastJsonToMeeting(registry, "meeting_1", {
      type: "hello"
    });

    expect(result).toEqual({ attempted: 1, delivered: 0, removed: 1 });
    expect(closed).toBe(true);
    expect(registry.clientCount("meeting_1")).toBe(0);
  });

  test("broadcasts candidate_state_updated messages", () => {
    const registry = createMeetingConnectionRegistry();
    const sent: string[] = [];
    registry.subscribe("meeting_1", client((data) => sent.push(data)));

    broadcastCandidateStateUpdated(registry, snapshot);

    expect(JSON.parse(sent[0] ?? "{}")).toEqual({
      type: "candidate_state_updated",
      snapshot
    });
  });
});
