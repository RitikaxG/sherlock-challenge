import { calculateMargin, normalizeConfidence, rankByScore } from "./confidence.ts";
import { decideCandidateState, selectedCandidateIdForState } from "./decision-state.ts";
import { buildCandidateExplanation } from "./explanation.ts";
import { defaultFusionConfig, type FusionConfig } from "./fusion-config.ts";
import type {
  CandidateFusionResult,
  FusedParticipantScore,
  WeightedSignal
} from "./fusion-types.ts";
import { extractAllSignals } from "./all-signals.ts";
import { getParticipantDisplayName, type CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

function weightSignal(signal: ExtractedSignal, config: FusionConfig): WeightedSignal {
  const sourceWeight = config.sourceWeights[signal.source];

  if (signal.direction === "positive") {
    return {
      ...signal,
      weightedImpact: signal.strength * sourceWeight
    };
  }

  if (signal.direction === "negative") {
    return {
      ...signal,
      weightedImpact:
        -signal.strength * sourceWeight * config.negativeSignalMultiplier
    };
  }

  return {
    ...signal,
    weightedImpact: 0
  };
}

export function fuseCandidateSignals(
  state: CandidateSessionState,
  config: FusionConfig = defaultFusionConfig
): CandidateFusionResult {
  const signals = extractAllSignals(state).map((signal) =>
    weightSignal(signal, config)
  );

  const participantScores = state.participants.map<FusedParticipantScore>(
    (participant) => {
      const participantSignals = signals.filter(
        (signal) => signal.participantId === participant.id
      );
      const positiveWeight = participantSignals
        .filter((signal) => signal.weightedImpact > 0)
        .reduce((total, signal) => total + signal.weightedImpact, 0);
      const negativeWeight = Math.abs(
        participantSignals
          .filter((signal) => signal.weightedImpact < 0)
          .reduce((total, signal) => total + signal.weightedImpact, 0)
      );
      const rawScore = positiveWeight - negativeWeight;
      const hasStrongInterviewerExclusion = participantSignals.some(
        (signal) =>
          signal.source === "interviewer_exclusion" &&
          signal.direction === "negative" &&
          signal.strength >= config.thresholds.strongInterviewerExclusion
      );

      return {
        participantId: participant.id,
        displayName: getParticipantDisplayName(state, participant),
        rawScore,
        confidence: normalizeConfidence({
          rawScore,
          positiveWeight,
          negativeWeight
        }),
        positiveWeight,
        negativeWeight,
        neutralSignals: participantSignals.filter(
          (signal) => signal.direction === "neutral"
        ),
        signals: participantSignals,
        hasStrongInterviewerExclusion
      };
    }
  );

  const rankedParticipants = rankByScore(participantScores);
  const topParticipant = rankedParticipants[0] ?? null;
  const secondParticipant = rankedParticipants[1] ?? null;
  const margin = calculateMargin(topParticipant, secondParticipant);
  const decisionState = decideCandidateState(
    { topParticipant, secondParticipant, margin },
    config
  );
  const selectedCandidateId = selectedCandidateIdForState(
    decisionState,
    topParticipant?.participantId
  );
  const partialResult = {
    participantScores: rankedParticipants,
    signals,
    topParticipant,
    secondParticipant,
    margin,
    decisionState,
    selectedCandidateId,
    confidence: topParticipant?.confidence ?? 0
  };
  const explanation = buildCandidateExplanation(partialResult, config);

  return {
    ...partialResult,
    evidence: explanation.evidence,
    uncertainty: explanation.uncertainty
  };
}
