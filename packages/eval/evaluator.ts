import type { EvaluationMetrics } from "./metrics.js";

export type EvaluationSummary = {
  readonly totalScenarios: number;
  readonly passedScenarios: number;
  readonly metrics: EvaluationMetrics;
};

export type Evaluator<TScenario = unknown> = {
  readonly evaluate: (scenarios: readonly TScenario[]) => EvaluationSummary;
};
