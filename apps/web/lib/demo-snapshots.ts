import type {
  CandidateStateSnapshot,
  DemoScenario,
  MeetingEvent,
  ParticipantScore
} from "./types";

function scoreForParticipant(scenario: DemoScenario, event: MeetingEvent, index: number): ParticipantScore[] {
  const progress = Math.min(1, (index + 1) / Math.max(1, scenario.events.length));
  const selectedId = scenario.expectedSelectedCandidateId;

  return scenario.participants
    .map((participant) => {
      const isExpected = participant.id === selectedId;
      const eventBelongsToParticipant = participant.id === event.participantId;
      const confidence = isExpected
        ? Math.min(0.92, 0.2 + progress * 0.7)
        : eventBelongsToParticipant
          ? Math.min(0.62, 0.12 + progress * 0.45)
          : Math.min(0.35, 0.08 + progress * 0.2);

      return {
        participantId: participant.id,
        displayName: participant.currentName ?? participant.displayName,
        confidence,
        rawScore: confidence
      };
    })
    .sort((left, right) => right.confidence - left.confidence);
}

export function createFallbackSnapshot(
  scenario: DemoScenario,
  event: MeetingEvent | null,
  index: number
): CandidateStateSnapshot {
  const finalish = index >= scenario.events.length - 1;
  const state = finalish ? scenario.expectedState : "INSUFFICIENT_DATA";
  const selectedCandidateId = finalish ? scenario.expectedSelectedCandidateId : null;

  return {
    meetingId: scenario.meeting.id,
    selectedCandidateId,
    confidence: selectedCandidateId && state !== "AMBIGUOUS" ? 0.72 : 0,
    state,
    participants: event
      ? scoreForParticipant(scenario, event, index)
      : scenario.participants.map((participant) => ({
          participantId: participant.id,
          displayName: participant.displayName,
          confidence: 0,
          rawScore: 0
        })),
    evidence: finalish && selectedCandidateId
      ? [
          {
            signal: "local_demo_expected_outcome",
            participantId: selectedCandidateId,
            impact: 0.5,
            reason: "Backend unavailable; this visual fallback uses scenario expected outcome only."
          }
        ]
      : [],
    uncertainty: [
      "Backend unavailable - showing local visual demo only.",
      "Human identity verification has not been performed.",
      "Fraud or cheating detection has not been performed."
    ],
    timestampSec: event?.timestampSec
  };
}
