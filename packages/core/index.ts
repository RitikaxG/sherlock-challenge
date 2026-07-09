import type {
  CandidateStateSnapshot,
  Meeting,
  MeetingEvent,
  Participant,
  ParticipantScore
} from "@sherlock/shared";

export type CandidateSessionState = {
  readonly meeting: Meeting;
  readonly participants: readonly Participant[];
  readonly events: readonly MeetingEvent[];
};

export function createInitialSessionState(
  meeting: Meeting,
  participants: readonly Participant[] = []
): CandidateSessionState {
  return {
    meeting,
    participants,
    events: []
  };
}

export function applyMeetingEvent(
  state: CandidateSessionState,
  event: MeetingEvent
): CandidateSessionState {
  return {
    ...state,
    events: [...state.events, event]
  };
}

export function rankParticipants(
  state: CandidateSessionState
): CandidateStateSnapshot {
  const participants = state.participants.map<ParticipantScore>((participant) => ({
    participantId: participant.id,
    displayName: participant.currentName ?? participant.displayName,
    confidence: 0,
    rawScore: 0
  }));

  return {
    meetingId: state.meeting.id,
    selectedCandidateId: null,
    confidence: 0,
    state: "INSUFFICIENT_DATA",
    participants,
    evidence: [],
    uncertainty: ["Scoring has not been implemented yet."]
  };
}
