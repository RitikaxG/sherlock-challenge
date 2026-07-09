import { describe, expect, it } from "vitest";

import { evaluateScenarios } from "./evaluator.ts";
import { formatEvaluationReport } from "./reporter.ts";
import {
  defaultScenarioDirectory,
  loadScenarioFile,
  loadScenarios
} from "./scenario-loader.ts";
import { runScenario } from "./scenario-runner.ts";

describe("@sherlock/eval scenario harness", () => {
  it("loads and validates the root scenario fixtures", async () => {
    const scenarios = await loadScenarios();

    expect(scenarios).toHaveLength(10);
    expect(scenarios.map((scenario) => scenario.id)).toContain(
      "08_two_unknown_ambiguous"
    );
  });

  it("replays a scenario through the core engine", () => {
    const scenario = loadScenarioFile(
      `${defaultScenarioDirectory}/01_exact_name_match.json`
    );
    const replay = runScenario(scenario);

    expect(replay.finalSnapshot.selectedCandidateId).toBe("p_candidate");
    expect(replay.finalSnapshot.state).toBe("LIKELY_CANDIDATE");
    expect(replay.timeline).toHaveLength(scenario.events.length);
  });

  it("handles ambiguous and insufficient-data outcomes", async () => {
    const scenarios = await loadScenarios();
    const summary = evaluateScenarios(scenarios);

    const ambiguous = summary.results.find(
      (result) => result.scenarioId === "08_two_unknown_ambiguous"
    );
    const insufficient = summary.results.find(
      (result) => result.scenarioId === "10_no_transcript_yet"
    );

    expect(ambiguous?.passed).toBe(true);
    expect(ambiguous?.actualState).toBe("AMBIGUOUS");
    expect(insufficient?.passed).toBe(true);
    expect(insufficient?.actualState).toBe("INSUFFICIENT_DATA");
  });

  it("reports aggregate metrics for all scenarios", async () => {
    const summary = evaluateScenarios(await loadScenarios());
    const report = formatEvaluationReport(summary);

    expect(summary.aggregate.totalScenarios).toBe(10);
    expect(summary.aggregate.passedScenarios).toBe(10);
    expect(report).toContain("Sherlock Scenario Evaluation");
    expect(report).toContain("10/10 passed");
  });
});
