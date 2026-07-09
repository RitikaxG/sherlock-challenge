import type { ScenarioFile } from "@sherlock/shared";
import {
  calculateEvaluationMetrics,
  evaluateScenarioResult
} from "./metrics.ts";
import type {
  EvaluationMetrics,
  ScenarioEvaluationResult
} from "./metrics.ts";
import { runScenario } from "./scenario-runner.ts";
import type { ScenarioReplayResult } from "./scenario-runner.ts";

export type EvaluationSummary = {
  readonly results: readonly ScenarioEvaluationResult[];
  readonly aggregate: EvaluationMetrics;
  readonly replays: readonly ScenarioReplayResult[];
};

export function evaluateScenarios(
  scenarios: readonly ScenarioFile[]
): EvaluationSummary {
  const replays = scenarios.map(runScenario);
  const results = replays.map(evaluateScenarioResult);

  return {
    results,
    aggregate: calculateEvaluationMetrics(results),
    replays
  };
}
