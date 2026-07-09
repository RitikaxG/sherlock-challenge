import type { SignalSource } from "./signal-types.ts";

export type FusionDecisionThresholds = {
  readonly insufficient: number;
  readonly likely: number;
  readonly confirmed: number;
  readonly ambiguousMargin: number;
  readonly minimumPositiveEvidence: number;
  readonly strongInterviewerExclusion: number;
  readonly strongContradiction: number;
  readonly confirmationMinStableSec: number;
  readonly confirmationMinEvidenceEvents: number;
  readonly confirmationMinDistinctSignalSources: number;
};

export type FusionConfig = {
  readonly sourceWeights: Readonly<Record<SignalSource, number>>;
  readonly negativeSignalMultiplier: number;
  readonly transcriptSignalTtlSec: number;
  readonly behaviorSignalTtlSec: number;
  readonly thresholds: FusionDecisionThresholds;
  readonly maxEvidenceItems: number;
};

export const defaultFusionConfig: FusionConfig = {
  sourceWeights: {
    metadata: 0.3,
    transcript: 0.3,
    behavior: 0.18,
    event: 0.12,
    interviewer_exclusion: 0.35,
    contradiction: 0.4,
    audio_video: 0.2
  },
  negativeSignalMultiplier: 1.15,
  transcriptSignalTtlSec: 300,
  behaviorSignalTtlSec: 120,
  thresholds: {
    insufficient: 0.55,
    likely: 0.75,
    confirmed: 0.9,
    ambiguousMargin: 0.15,
    minimumPositiveEvidence: 0.15,
    strongInterviewerExclusion: 0.8,
    strongContradiction: 0.7,
    confirmationMinStableSec: 60,
    confirmationMinEvidenceEvents: 2,
    confirmationMinDistinctSignalSources: 2
  },
  maxEvidenceItems: 8
};
