import type {
  CandidateStateSnapshot,
  EvidenceItem,
  ParticipantScore
} from "@sherlock/shared";

import { extractBehaviorSignals } from "./behavior-signals.ts";
import { summarizeSignals } from "./evidence.ts";
import { extractEventSignals } from "./event-signals.ts";
import { extractInterviewerExclusionSignals } from "./interviewer-signals.ts";
import { extractMetadataSignals } from "./metadata-signals.ts";
import { getParticipantDisplayName, type CandidateSessionState } from "./session-state.ts";
import { extractTranscriptSignals } from "./transcript-signals.ts";
import type { ExtractedSignal } from "./signal-types.ts";

export function extractAllSignals(state: CandidateSessionState): ExtractedSignal[] {
  return [
    ...extractMetadataSignals(state),
    ...extractInterviewerExclusionSignals(state),
    ...extractEventSignals(state),
    ...extractBehaviorSignals(state),
    ...extractTranscriptSignals(state)
  ];
}

function signalToImpact(signal: ExtractedSignal) {
  if (signal.direction === "positive") {
    return signal.strength;
  }

  if (signal.direction === "negative") {
    return -signal.strength;
  }

  return 0;
}

export function rankParticipants(
  state: CandidateSessionState
): CandidateStateSnapshot {
  const signals = extractAllSignals(state);
  const rawScoresByParticipant = new Map<string, number>();

  for (const participant of state.participants) {
    const summary = summarizeSignals(participant.id, signals);
    rawScoresByParticipant.set(
      participant.id,
      summary.positiveStrength - summary.negativeStrength
    );
  }

  const maxAbsScore = Math.max(
    1,
    ...Array.from(rawScoresByParticipant.values()).map((score) => Math.abs(score))
  );

  const participants = state.participants.map<ParticipantScore>((participant) => {
    const rawScore = rawScoresByParticipant.get(participant.id) ?? 0;

    return {
      participantId: participant.id,
      displayName: getParticipantDisplayName(state, participant),
      confidence: Math.max(0, Math.min(0.65, (rawScore / maxAbsScore + 1) / 3)),
      rawScore
    };
  });

  participants.sort((left, right) => right.rawScore - left.rawScore);

  const evidence = signals.map<EvidenceItem>((signal) => ({
    signal: signal.kind,
    participantId: signal.participantId,
    impact: signalToImpact(signal),
    reason: signal.reason
  }));

  // TODO Phase 4: replace this conservative placeholder with weighted fusion,
  // confidence normalization, margin rules, and state transitions.
  return {
    meetingId: state.meeting.id,
    selectedCandidateId: null,
    confidence: participants[0]?.confidence ?? 0,
    state: "INSUFFICIENT_DATA",
    participants,
    evidence,
    uncertainty: [
      "Final weighted fusion and confidence state transitions are not implemented until Phase 4."
    ]
  };
}
