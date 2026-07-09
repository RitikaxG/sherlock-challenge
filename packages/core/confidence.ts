import type { FusedParticipantScore, WeightedSignal } from "./fusion-types.ts";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeConfidence(input: {
  readonly rawScore: number;
  readonly positiveWeight: number;
  readonly negativeWeight: number;
}) {
  if (input.positiveWeight <= 0 || input.rawScore <= 0) {
    return 0;
  }

  const evidenceCoverage = clamp(input.positiveWeight / 0.6);
  const purity =
    input.positiveWeight /
    (input.positiveWeight + input.negativeWeight + 0.15);

  return clamp(0.35 + 0.65 * evidenceCoverage * purity);
}

export function rankByScore(
  scores: readonly FusedParticipantScore[]
): FusedParticipantScore[] {
  return [...scores].sort((left, right) => {
    if (right.confidence !== left.confidence) {
      return right.confidence - left.confidence;
    }

    return right.rawScore - left.rawScore;
  });
}

export function calculateMargin(
  topParticipant: FusedParticipantScore | null,
  secondParticipant: FusedParticipantScore | null
) {
  if (!topParticipant) {
    return 0;
  }

  return topParticipant.confidence - (secondParticipant?.confidence ?? 0);
}

export function calculateWeightedImpact(signal: WeightedSignal) {
  return signal.weightedImpact;
}
