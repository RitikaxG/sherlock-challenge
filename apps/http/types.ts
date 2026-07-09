import type {
  CandidateStateSnapshot,
  Meeting,
  MeetingEvent,
  Participant
} from "@sherlock/shared";

export type CreateMeetingRequest = {
  readonly meeting: Meeting;
  readonly participants: readonly Participant[];
};

export type CreateMeetingResponse = {
  readonly meetingId: string;
  readonly snapshot: CandidateStateSnapshot;
};

export type EventIngestionResponse = {
  readonly meetingId: string;
  readonly eventAccepted: true;
  readonly snapshot: CandidateStateSnapshot;
};

export type ReadinessResponse = {
  readonly ok: boolean;
  readonly service: "sherlock-http";
  readonly checks: {
    readonly sessionStore: "ok";
    readonly db: "not_configured" | "configured" | "warning";
  };
  readonly warning?: string;
};

export type PersistenceMode = "disabled" | "enabled";

export type PersistenceAdapter = {
  readonly mode: PersistenceMode;
  persistMeeting(
    meeting: Meeting,
    participants: readonly Participant[]
  ): Promise<void>;
  persistEvent(
    meetingId: string,
    event: MeetingEvent,
    snapshot: CandidateStateSnapshot
  ): Promise<void>;
  ready(): Promise<{ db: ReadinessResponse["checks"]["db"]; warning?: string }>;
};
