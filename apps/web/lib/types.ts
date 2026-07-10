import type {
  CandidateDecisionState,
  CandidateStateSnapshot,
  CandidateStateUpdatedMessage,
  EvidenceItem,
  Meeting,
  MeetingEvent,
  Participant,
  ParticipantScore,
  ScenarioExpectedOutcome
} from "@sherlock/shared";

export type {
  CandidateDecisionState,
  CandidateStateSnapshot,
  CandidateStateUpdatedMessage,
  EvidenceItem,
  Meeting,
  MeetingEvent,
  Participant,
  ParticipantScore,
  ScenarioExpectedOutcome
};

export type DemoScenario = {
  id: string;
  title: string;
  edgeCase: string;
  demoExplanation: string;
  whatToSay: string[];
  expectedState: CandidateDecisionState;
  expectedSelectedCandidateId: string | null;
  meeting: Meeting;
  participants: Participant[];
  events: MeetingEvent[];
  expected: ScenarioExpectedOutcome;
};

export type ReplayStatus = "idle" | "running" | "paused" | "completed";
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "backend_connected"
  | "websocket_connected"
  | "websocket_disconnected"
  | "polling"
  | "local_fallback"
  | "offline";
export type ReplaySpeed = "0.5x" | "1x" | "2x" | "instant";

export type TimelineItem = {
  id: string;
  timestampSec?: number;
  kind: "event" | "snapshot" | "system";
  label: string;
  detail: string;
  participantId?: string;
  changedSnapshot?: boolean;
};

export type TranscriptItem = {
  id: string;
  participantId: string;
  displayName: string;
  timestampSec: number;
  text: string;
  source: string;
  llmEvidence?: string;
  strength?: string;
  role?: string;
  confidence?: number;
  evidenceKinds?: string[];
};

export type EventImpact = {
  eventLabel: string;
  participantId?: string;
  timestampSec?: number;
  previousState?: CandidateDecisionState;
  nextState: CandidateDecisionState;
  previousConfidence?: number;
  nextConfidence: number;
  selectedCandidateChanged: boolean;
  newEvidence: EvidenceItem[];
};

export type ParticipantRuntimeState = Participant & {
  currentDisplayName: string;
  joined: boolean;
  webcamOn: boolean;
  sharingScreen: boolean;
  speaking: boolean;
  lastSpokeAtSec?: number;
};

export type CreateMeetingRequest = {
  meeting: Meeting;
  participants: Participant[];
};

export type CreateMeetingResponse = {
  meetingId: string;
  snapshot: CandidateStateSnapshot;
};

export type SnapshotResponse = {
  snapshot: CandidateStateSnapshot;
};

export type PostEventResponse = {
  meetingId: string;
  eventAccepted: boolean;
  snapshot: CandidateStateSnapshot;
  llmEvidenceApplied?: boolean;
  llmEvent?: MeetingEvent;
  llmWarning?: string;
};
