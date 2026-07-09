export type EvaluationMetrics = {
  readonly topOneAccuracy: number;
  readonly topTwoAccuracy: number;
  readonly falseInterviewerSelections: number;
  readonly ambiguityPrecision: number;
  readonly averageTimeToLikelyCandidateSec: number | null;
};
