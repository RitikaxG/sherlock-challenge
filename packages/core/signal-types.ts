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
  | "interviewer_transcript_phrase"
  | "candidate_self_identification"
  | "candidate_name_spoken"
  | "candidate_experience_statement"
  | "candidate_project_statement"
  | "interviewer_question_prompt"
  | "interviewer_role_description"
  | "interviewer_control_language"
  | "observer_or_admin_language"
  | "no_clear_role_evidence"
  | "transcript_role_uncertain"
  | "candidate_interviewer_metadata_conflict"
  | "candidate_transcript_interviewer_metadata_conflict"
  | "mixed_transcript_role_conflict"
  | "face_visible"
  | "multiple_faces_detected"
  | "face_match_score"
  | "voice_consistency_score"
  | "active_speaker_confidence"
  | "speaker_overlap_detected"
  | "background_voice_detected"
  | "audio_quality_low";

export type SignalDirection = "positive" | "negative" | "neutral";
export type SignalSpecificity = "weak" | "medium" | "strong";

export type SignalSource =
  | "metadata"
  | "event"
  | "behavior"
  | "transcript"
  | "interviewer_exclusion"
  | "contradiction"
  | "audio_video";

export type ExtractedSignal = {
  readonly participantId: string;
  readonly kind: SignalKind;
  readonly direction: SignalDirection;
  readonly strength: number;
  readonly reason: string;
  readonly source: SignalSource;
  readonly specificity?: SignalSpecificity;
  readonly timestampSec?: number;
  readonly sourceEventIds?: readonly string[];
  readonly expiresAtSec?: number;
  readonly isPersistent?: boolean;
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
