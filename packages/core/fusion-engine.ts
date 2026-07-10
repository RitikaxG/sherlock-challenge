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

function currentTimestampSec(state: CandidateSessionState) {
  return Math.max(0, ...state.events.map((event) => event.timestampSec));
}

function activeSignal(signal: ExtractedSignal, timestampSec: number) {
  return (
    signal.isPersistent ||
    signal.expiresAtSec === undefined ||
    signal.expiresAtSec >= timestampSec
  );
}

function weightSignal(signal: ExtractedSignal, config: FusionConfig): WeightedSignal {
  const sourceWeight = config.sourceWeights[signal.source];

  if (signal.direction === "positive") {
    return {
      ...signal,
      sourceWeight,
      weightedImpact: signal.strength * sourceWeight
    };
  }

  if (signal.direction === "negative") {
    return {
      ...signal,
      sourceWeight,
      weightedImpact:
        -signal.strength * sourceWeight * config.negativeSignalMultiplier
    };
  }

  return {
    ...signal,
    sourceWeight,
    weightedImpact: 0
  };
}

function confirmationStatus(
  signals: readonly WeightedSignal[],
  config: FusionConfig
) {
  const positiveSignals = signals.filter((signal) => signal.weightedImpact > 0);
  const timestampedPositiveSignals = positiveSignals.filter(
    (signal) => signal.timestampSec !== undefined
  );
  const firstTimestamp = timestampedPositiveSignals
    .map((signal) => signal.timestampSec as number)
    .sort((left, right) => left - right)[0];
  const lastTimestamp = timestampedPositiveSignals
    .map((signal) => signal.timestampSec as number)
    .sort((left, right) => right - left)[0];
  const stableSec =
    firstTimestamp !== undefined && lastTimestamp !== undefined
      ? lastTimestamp - firstTimestamp
      : 0;
  const evidenceEvents = new Set(
    positiveSignals.flatMap((signal) => signal.sourceEventIds ?? [])
  );
  const timestampedEventCount = timestampedPositiveSignals.length;
  const evidenceEventCount = Math.max(evidenceEvents.size, timestampedEventCount);
  const distinctSources = new Set(
    positiveSignals
      .filter((signal) => signal.source !== "contradiction")
      .map((signal) => signal.source)
  ).size;

  if (stableSec < config.thresholds.confirmationMinStableSec) {
    return {
      eligible: false,
      reason:
        "Candidate evidence is strong but not stable long enough for confirmation."
    };
  }

  if (evidenceEventCount < config.thresholds.confirmationMinEvidenceEvents) {
    return {
      eligible: false,
      reason:
        "Candidate evidence is strong but does not span enough evidence events for confirmation."
    };
  }

  if (
    distinctSources < config.thresholds.confirmationMinDistinctSignalSources
  ) {
    return {
      eligible: false,
      reason:
        "Candidate evidence is strong but does not span enough distinct signal sources for confirmation."
    };
  }

  return {
    eligible: true,
    reason: null
  };
}

export function fuseCandidateSignals(
  state: CandidateSessionState,
  config: FusionConfig = defaultFusionConfig
): CandidateFusionResult {
  const nowSec = currentTimestampSec(state);
  const extractedSignals = extractAllSignals(state);
  const expiredSignalCount = extractedSignals.filter(
    (signal) => !activeSignal(signal, nowSec)
  ).length;
  const signals = extractedSignals.filter((signal) =>
    activeSignal(signal, nowSec)
  ).map((signal) =>
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
      const hasStrongContradiction = participantSignals.some(
        (signal) =>
          signal.source === "contradiction" &&
          signal.direction === "negative" &&
          signal.strength >= config.thresholds.strongContradiction
      );
      const confirmation = confirmationStatus(participantSignals, config);

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
        hasStrongInterviewerExclusion,
        hasStrongContradiction,
        confirmationEligible: confirmation.eligible,
        confirmationBlockReason: confirmation.reason
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
    confidence: topParticipant?.confidence ?? 0,
    expiredSignalCount
  };
  const explanation = buildCandidateExplanation(partialResult, config);

  return {
    ...partialResult,
    evidence: explanation.evidence,
    uncertainty: explanation.uncertainty
  };
}
