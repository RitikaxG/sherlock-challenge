import type { EvidenceItem } from "@sherlock/shared";

import { defaultFusionConfig, type FusionConfig } from "./fusion-config.ts";
import type { CandidateFusionResult, WeightedSignal } from "./fusion-types.ts";

function signalImpact(signal: WeightedSignal) {
  return Math.abs(signal.weightedImpact);
}

export function buildEvidenceItems(
  signals: readonly WeightedSignal[],
  config: FusionConfig = defaultFusionConfig
): EvidenceItem[] {
  return [...signals]
    .filter((signal) => signal.direction !== "neutral")
    .sort((left, right) => signalImpact(right) - signalImpact(left))
    .slice(0, config.maxEvidenceItems)
    .map((signal) => ({
      signal: signal.kind,
      participantId: signal.participantId,
      impact: signal.weightedImpact,
      reason: signal.reason
    }));
}

export function buildCandidateExplanation(
  result: Omit<CandidateFusionResult, "evidence" | "uncertainty">,
  config: FusionConfig = defaultFusionConfig
) {
  const uncertainty: string[] = [];
  const topParticipant = result.topParticipant;
  const secondParticipant = result.secondParticipant;

  for (const signal of result.signals) {
    if (signal.direction === "neutral") {
      uncertainty.push(signal.reason);
    }
  }

  if (!topParticipant) {
    uncertainty.push("No participants are available to rank.");
  } else if (topParticipant.positiveWeight < config.thresholds.minimumPositiveEvidence) {
    uncertainty.push("No participant has enough positive evidence to choose safely.");
  }

  if (result.decisionState === "AMBIGUOUS" && secondParticipant) {
    uncertainty.push("Top two participants are too close to choose safely.");
  }

  if (topParticipant?.hasStrongInterviewerExclusion) {
    uncertainty.push(
      "Top participant also has strong interviewer evidence, so confirmation is blocked."
    );
  }

  if (result.decisionState === "INSUFFICIENT_DATA") {
    uncertainty.push("Candidate identity remains insufficiently supported by evidence.");
  }

  if (result.decisionState !== "AMBIGUOUS" && secondParticipant) {
    const rejectedReason =
      secondParticipant.negativeWeight > 0
        ? "Nearest alternative has negative or exclusionary evidence."
        : "Nearest alternative has weaker positive evidence.";
    uncertainty.push(rejectedReason);
  }

  return {
    evidence: buildEvidenceItems(result.signals, config),
    uncertainty: [...new Set(uncertainty)]
  };
}
