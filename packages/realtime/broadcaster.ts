export type BroadcastEnvelope<TPayload = unknown> = {
  readonly type: string;
  readonly meetingId: string;
  readonly payload: TPayload;
};

export type Broadcaster = {
  readonly broadcastToMeeting: <TPayload>(
    envelope: BroadcastEnvelope<TPayload>
  ) => void | Promise<void>;
};
