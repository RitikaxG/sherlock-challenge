import type { CandidateStateSnapshot, ParticipantScore } from "@sherlock/shared";

import { fuseCandidateSignals } from "./fusion-engine.ts";
import type { CandidateSessionState } from "./session-state.ts";

export function rankParticipants(
  state: CandidateSessionState
): CandidateStateSnapshot {
  const result = fuseCandidateSignals(state);
  const participants = result.participantScores.map<ParticipantScore>(
    (participant) => ({
      participantId: participant.participantId,
      displayName: participant.displayName,
      confidence: participant.confidence,
      rawScore: participant.rawScore
    })
  );

  return {
    meetingId: state.meeting.id,
    selectedCandidateId: result.selectedCandidateId,
    confidence: result.confidence,
    state: result.decisionState,
    participants,
    evidence: [...result.evidence],
    uncertainty: [...result.uncertainty]
  };
}
