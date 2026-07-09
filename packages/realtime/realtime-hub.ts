import type { Broadcaster } from "./broadcaster.js";
import type { ConnectionRegistry } from "./connection-registry.js";
import type { MeetingSubscriptions } from "./meeting-subscriptions.js";

export type RealtimeHub<TConnection = unknown> = {
  readonly broadcaster: Broadcaster;
  readonly connections: ConnectionRegistry<TConnection>;
  readonly meetingSubscriptions: MeetingSubscriptions;
};
