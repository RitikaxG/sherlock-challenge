import type {
  CandidateStateSnapshot,
  DemoScenario,
  ReplayStatus
} from "./types";

export type ScenarioResultStatus = "pending" | "pass" | "fail";

export function getScenarioResult(
  scenario: DemoScenario,
  snapshot: CandidateStateSnapshot | null,
  status: ReplayStatus
) {
  const actualState = snapshot?.state ?? null;
  const actualSelectedCandidateId = snapshot?.selectedCandidateId ?? null;

  if (status !== "completed" || !snapshot) {
    return {
      status: "pending" as ScenarioResultStatus,
      expectedState: scenario.expectedState,
      expectedSelectedCandidateId: scenario.expectedSelectedCandidateId,
      actualState,
      actualSelectedCandidateId
    };
  }

  const passed =
    actualState === scenario.expectedState &&
    actualSelectedCandidateId === scenario.expectedSelectedCandidateId;

  return {
    status: passed ? "pass" as const : "fail" as const,
    expectedState: scenario.expectedState,
    expectedSelectedCandidateId: scenario.expectedSelectedCandidateId,
    actualState,
    actualSelectedCandidateId
  };
}
