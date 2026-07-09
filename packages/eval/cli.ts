#!/usr/bin/env bun

import { evaluateScenarios } from "./evaluator.ts";
import { formatEvaluationReport } from "./reporter.ts";
import { defaultScenarioDirectory, loadScenarios } from "./scenario-loader.ts";

export async function runEvaluationCli(argv = process.argv): Promise<number> {
  const scenarioPath = argv[2] ?? defaultScenarioDirectory;
  const scenarios = await loadScenarios(scenarioPath);
  const summary = evaluateScenarios(scenarios);

  console.log(formatEvaluationReport(summary));

  return summary.aggregate.failedScenarios === 0 ? 0 : 1;
}

if (import.meta.main) {
  runEvaluationCli()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
