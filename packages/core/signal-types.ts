import type { Meeting, Participant } from "@sherlock/shared";

import type { CandidateSessionState } from "./session-state.ts";

export type SignalKind =
  | "candidate_name_exact"
  | "candidate_name_partial"
  | "candidate_email_exact"
  | "generic_device_name"
  | "interviewer_name_match"
  | "interviewer_email_match"
  | "company_domain_email"
  | "join_timing"
  | "join_order"
  | "display_name_change"
  | "speaking_activity"
  | "long_silence"
  | "webcam_on"
  | "screen_share"
  | "candidate_transcript_phrase"
  | "interviewer_transcript_phrase";

export type SignalDirection = "positive" | "negative" | "neutral";

export type SignalSource =
  | "metadata"
  | "event"
  | "behavior"
  | "transcript"
  | "interviewer_exclusion";

export type ExtractedSignal = {
  readonly participantId: string;
  readonly kind: SignalKind;
  readonly direction: SignalDirection;
  readonly strength: number;
  readonly reason: string;
  readonly source: SignalSource;
};

export type SignalExtractionContext = {
  readonly state: CandidateSessionState;
  readonly meeting: Meeting;
  readonly participants: readonly Participant[];
};

export type ParticipantSignalSummary = {
  readonly participantId: string;
  readonly signals: readonly ExtractedSignal[];
  readonly positiveStrength: number;
  readonly negativeStrength: number;
  readonly neutralCount: number;
};
