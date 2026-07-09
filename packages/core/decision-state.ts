import type { CandidateDecisionState } from "@sherlock/shared";

import { defaultFusionConfig, type FusionConfig } from "./fusion-config.ts";
import type { DecisionStateInput } from "./fusion-types.ts";

export function decideCandidateState(
  input: DecisionStateInput,
  config: FusionConfig = defaultFusionConfig
): CandidateDecisionState {
  const topParticipant = input.topParticipant;

  if (!topParticipant) {
    return "INSUFFICIENT_DATA";
  }

  if (
    topParticipant.positiveWeight <
    config.thresholds.minimumPositiveEvidence
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (topParticipant.confidence < config.thresholds.insufficient) {
    return "INSUFFICIENT_DATA";
  }

  if (
    input.secondParticipant &&
    input.secondParticipant.positiveWeight >=
      config.thresholds.minimumPositiveEvidence &&
    input.margin < config.thresholds.ambiguousMargin
  ) {
    return "AMBIGUOUS";
  }

  if (topParticipant.confidence < config.thresholds.likely) {
    return "POSSIBLE_CANDIDATE";
  }

  if (
    topParticipant.confidence >= config.thresholds.confirmed &&
    input.margin >= config.thresholds.ambiguousMargin &&
    !topParticipant.hasStrongInterviewerExclusion
  ) {
    return "CONFIRMED_CANDIDATE";
  }

  return "LIKELY_CANDIDATE";
}

export function selectedCandidateIdForState(
  state: CandidateDecisionState,
  topParticipantId: string | undefined
) {
  if (state === "AMBIGUOUS" || state === "INSUFFICIENT_DATA") {
    return null;
  }

  return topParticipantId ?? null;
}
