import type {
  CandidateDecisionState,
  EvidenceItem,
  ParticipantScore
} from "@sherlock/shared";

import type { ExtractedSignal } from "./signal-types.ts";

export type WeightedSignal = ExtractedSignal & {
  readonly weightedImpact: number;
};

export type FusedParticipantScore = ParticipantScore & {
  readonly positiveWeight: number;
  readonly negativeWeight: number;
  readonly neutralSignals: readonly WeightedSignal[];
  readonly signals: readonly WeightedSignal[];
  readonly hasStrongInterviewerExclusion: boolean;
};

export type CandidateFusionResult = {
  readonly participantScores: readonly FusedParticipantScore[];
  readonly signals: readonly WeightedSignal[];
  readonly topParticipant: FusedParticipantScore | null;
  readonly secondParticipant: FusedParticipantScore | null;
  readonly margin: number;
  readonly decisionState: CandidateDecisionState;
  readonly selectedCandidateId: string | null;
  readonly confidence: number;
  readonly evidence: readonly EvidenceItem[];
  readonly uncertainty: readonly string[];
};

export type DecisionStateInput = {
  readonly topParticipant: FusedParticipantScore | null;
  readonly secondParticipant: FusedParticipantScore | null;
  readonly margin: number;
};
