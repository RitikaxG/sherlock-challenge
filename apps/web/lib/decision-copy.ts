import type { CandidateStateSnapshot, ParticipantRuntimeState } from "./types";

export const stateCopy = {
  INSUFFICIENT_DATA: "The engine does not have enough positive evidence to safely select a candidate.",
  POSSIBLE_CANDIDATE: "One stream is emerging as candidate-like, but the system is still collecting evidence.",
  LIKELY_CANDIDATE: "The selected stream has stronger candidate evidence than alternatives.",
  CONFIRMED_CANDIDATE: "The same participant remained the top candidate across enough time and evidence sources.",
  AMBIGUOUS: "The top two participants are too close. The engine refuses to choose."
} as const;

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function findParticipantName(
  participantId: string | null,
  participants: readonly ParticipantRuntimeState[]
) {
  if (!participantId) {
    return "No stream selected";
  }

  return (
    participants.find((participant) => participant.id === participantId)
      ?.currentDisplayName ?? participantId
  );
}

export function inferMargin(snapshot: CandidateStateSnapshot | null) {
  if (!snapshot || snapshot.participants.length < 2) {
    return null;
  }

  const [first, second] = snapshot.participants;
  if (!first || !second) {
    return null;
  }

  return Math.max(0, first.confidence - second.confidence);
}

export function decisionSummary(snapshot: CandidateStateSnapshot | null) {
  if (!snapshot) {
    return "Start a scenario to create a meeting and stream evidence into the backend.";
  }

  return stateCopy[snapshot.state];
}
