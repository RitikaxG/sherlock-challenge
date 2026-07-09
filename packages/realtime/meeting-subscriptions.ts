import type { ConnectionId } from "./connection-registry.js";

export type MeetingId = string;

export type MeetingSubscriptions = {
  readonly subscribe: (meetingId: MeetingId, connectionId: ConnectionId) => void;
  readonly unsubscribe: (meetingId: MeetingId, connectionId: ConnectionId) => void;
  readonly listConnectionIds: (meetingId: MeetingId) => readonly ConnectionId[];
};
