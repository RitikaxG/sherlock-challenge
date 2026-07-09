import type { EvaluationSummary } from "./evaluator.ts";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatSeconds(value: number | null): string {
  return value === null ? "n/a" : `${Math.round(value * 10) / 10}s`;
}

function formatNumber(value: number | null): string {
  return value === null ? "n/a" : `${Math.round(value * 1000) / 1000}`;
}

export function formatEvaluationReport(summary: EvaluationSummary): string {
  const lines = [
    "Sherlock Scenario Evaluation",
    "",
    `Scenarios: ${summary.aggregate.passedScenarios}/${summary.aggregate.totalScenarios} passed`,
    `Top-1 accuracy: ${formatPercent(summary.aggregate.topOneAccuracy)}`,
    `State accuracy: ${formatPercent(summary.aggregate.stateAccuracy)}`,
    `False interviewer selections: ${summary.aggregate.falseInterviewerSelections}`,
    `Avg final confidence: ${formatNumber(summary.aggregate.averageFinalConfidence)}`,
    `Avg evidence count: ${formatNumber(summary.aggregate.averageEvidenceCount)}`,
    `Ambiguous handled: ${summary.aggregate.ambiguousScenariosPassed}/${summary.aggregate.ambiguousScenarios}`,
    `Insufficient-data handled: ${summary.aggregate.insufficientDataScenariosPassed}/${summary.aggregate.insufficientDataScenarios}`,
    `Avg time to likely: ${formatSeconds(summary.aggregate.averageTimeToLikelyCandidateSec)}`,
    `Avg time to confirmed: ${formatSeconds(summary.aggregate.averageTimeToConfirmedCandidateSec)}`,
    "",
    "Results:"
  ];

  for (const result of summary.results) {
    const marker = result.passed ? "PASS" : "FAIL";
    const expected = `${result.expectedCandidateId ?? "none"} / ${
      result.expectedState ?? "any"
    }`;
    const actual = `${result.actualCandidateId ?? "none"} / ${
      result.actualState
    }`;
    lines.push(
      `- ${marker} ${result.scenarioId}: ${result.title} (expected ${expected}, got ${actual}, confidence ${result.confidence.toFixed(3)}, evidence ${result.evidenceCount}, uncertainty ${result.uncertaintyCount})`
    );

    if (!result.passed) {
      lines.push(`  Reasons: ${result.failureReasons.join("; ")}`);
    }
  }

  return lines.join("\n");
}
