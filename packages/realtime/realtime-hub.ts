import { broadcastCandidateStateUpdated } from "./broadcaster.ts";
import {
  createMeetingConnectionRegistry,
  type MeetingConnectionRegistry,
  type RealtimeClient
} from "./connection-registry.ts";

export type RealtimeHub = {
  readonly registry: MeetingConnectionRegistry;
  subscribe(meetingId: string, client: RealtimeClient): () => void;
  broadcastCandidateStateUpdated: typeof broadcastCandidateStateUpdated;
};

export function createRealtimeHub(): RealtimeHub {
  const registry = createMeetingConnectionRegistry();

  return {
    registry,
    subscribe: registry.subscribe,
    broadcastCandidateStateUpdated: (meetingRegistry, snapshot) =>
      broadcastCandidateStateUpdated(meetingRegistry, snapshot)
  };
}
