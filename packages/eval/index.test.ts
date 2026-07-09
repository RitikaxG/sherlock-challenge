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

    expect(scenarios).toHaveLength(20);
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

  it("surfaces hardening uncertainty messages in scenario results", async () => {
    const summary = evaluateScenarios(await loadScenarios());
    const contradiction = summary.replays.find(
      (replay) =>
        replay.scenarioId === "13_interviewer_candidate_transcript_conflict"
    );
    const unstable = summary.replays.find(
      (replay) => replay.scenarioId === "15_no_instant_confirmation"
    );
    const confirmed = summary.replays.find(
      (replay) => replay.scenarioId === "16_stable_candidate_confirmation"
    );

    expect(contradiction?.finalSnapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("contradictory candidate and interviewer evidence")
      ])
    );
    expect(unstable?.finalSnapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("not stable long enough")
      ])
    );
    expect(confirmed?.finalSnapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("human identity verification")
      ])
    );
  });

  it("reports aggregate metrics for all scenarios", async () => {
    const summary = evaluateScenarios(await loadScenarios());
    const report = formatEvaluationReport(summary);

    expect(summary.aggregate.totalScenarios).toBe(20);
    expect(summary.aggregate.passedScenarios).toBe(20);
    expect(summary.aggregate.averageFinalConfidence).toBeGreaterThan(0);
    expect(summary.aggregate.averageEvidenceCount).toBeGreaterThan(0);
    expect(summary.results[0]?.evidenceCount).toBeGreaterThan(0);
    expect(summary.results[0]?.uncertaintyCount).toBeGreaterThanOrEqual(0);
    expect(report).toContain("Sherlock Scenario Evaluation");
    expect(report).toContain("20/20 passed");
    expect(report).toContain("Avg final confidence");
    expect(report).toContain("evidence");
  });
});
