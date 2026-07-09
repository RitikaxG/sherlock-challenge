import type {
  CandidateDecisionState,
  Participant,
  ScenarioFile
} from "@sherlock/shared";

import type { ScenarioReplayResult } from "./scenario-runner.ts";

export type ScenarioEvaluationResult = {
  readonly scenarioId: string;
  readonly title: string;
  readonly expectedCandidateId: string | null;
  readonly actualCandidateId: string | null;
  readonly expectedState: CandidateDecisionState | null;
  readonly actualState: CandidateDecisionState;
  readonly confidence: number;
  readonly evidenceCount: number;
  readonly uncertaintyCount: number;
  readonly selectedCorrectly: boolean;
  readonly stateMatches: boolean;
  readonly falseInterviewerSelection: boolean;
  readonly timeToFirstLikelyCandidateSec: number | null;
  readonly timeToConfirmedCandidateSec: number | null;
  readonly passed: boolean;
  readonly failureReasons: readonly string[];
};

export type EvaluationMetrics = {
  readonly totalScenarios: number;
  readonly passedScenarios: number;
  readonly failedScenarios: number;
  readonly topOneAccuracy: number;
  readonly stateAccuracy: number;
  readonly falseInterviewerSelections: number;
  readonly averageFinalConfidence: number | null;
  readonly averageEvidenceCount: number | null;
  readonly ambiguousScenarios: number;
  readonly ambiguousScenariosPassed: number;
  readonly insufficientDataScenarios: number;
  readonly insufficientDataScenariosPassed: number;
  readonly averageTimeToLikelyCandidateSec: number | null;
  readonly averageTimeToConfirmedCandidateSec: number | null;
};

function participantById(
  scenario: ScenarioFile,
  participantId: string | null
): Participant | undefined {
  return scenario.participants.find(
    (participant) => participant.id === participantId
  );
}

function isKnownInterviewerSelection(
  scenario: ScenarioFile,
  participantId: string | null
): boolean {
  const participant = participantById(scenario, participantId);
  if (!participant) {
    return false;
  }

  const interviewerEmails = new Set(
    scenario.meeting.interviewerEmails.map((email) => email.toLowerCase())
  );
  const interviewerNames = new Set(
    scenario.meeting.interviewerNames.map((name) => name.toLowerCase())
  );

  return (
    participant.isKnownInterviewerHint ||
    (participant.email !== undefined &&
      interviewerEmails.has(participant.email.toLowerCase())) ||
    interviewerNames.has(participant.displayName.toLowerCase()) ||
    (participant.currentName !== undefined &&
      interviewerNames.has(participant.currentName.toLowerCase()))
  );
}

function firstTimestampForState(
  replay: ScenarioReplayResult,
  participantId: string | null,
  states: readonly CandidateDecisionState[]
): number | null {
  if (!participantId) {
    return null;
  }

  const matchingEntry = replay.timeline.find(
    (entry) =>
      entry.snapshot.selectedCandidateId === participantId &&
      states.includes(entry.snapshot.state)
  );

  return matchingEntry?.timestampSec ?? null;
}

function averageNullable(values: readonly (number | null)[]): number | null {
  const realValues = values.filter((value): value is number => value !== null);
  if (realValues.length === 0) {
    return null;
  }

  const total = realValues.reduce((sum, value) => sum + value, 0);
  return total / realValues.length;
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export function evaluateScenarioResult(
  replay: ScenarioReplayResult
): ScenarioEvaluationResult {
  const expectedCandidateId = replay.scenario.expected.candidateParticipantId;
  const expectedState = replay.scenario.expected.finalState ?? null;
  const actualCandidateId = replay.finalSnapshot.selectedCandidateId;
  const actualState = replay.finalSnapshot.state;
  const selectedCorrectly = expectedCandidateId === actualCandidateId;
  const stateMatches = expectedState === null || expectedState === actualState;
  const falseInterviewerSelection = isKnownInterviewerSelection(
    replay.scenario,
    actualCandidateId
  );
  const failureReasons: string[] = [];

  if (!selectedCorrectly) {
    failureReasons.push(
      `expected candidate ${expectedCandidateId ?? "none"}, got ${
        actualCandidateId ?? "none"
      }`
    );
  }

  if (!stateMatches) {
    failureReasons.push(
      `expected state ${expectedState ?? "any"}, got ${actualState}`
    );
  }

  if (falseInterviewerSelection) {
    failureReasons.push("selected a known interviewer");
  }

  return {
    scenarioId: replay.scenarioId,
    title: replay.title,
    expectedCandidateId,
    actualCandidateId,
    expectedState,
    actualState,
    confidence: replay.finalSnapshot.confidence,
    evidenceCount: replay.finalSnapshot.evidence.length,
    uncertaintyCount: replay.finalSnapshot.uncertainty.length,
    selectedCorrectly,
    stateMatches,
    falseInterviewerSelection,
    timeToFirstLikelyCandidateSec: firstTimestampForState(
      replay,
      expectedCandidateId,
      ["LIKELY_CANDIDATE", "CONFIRMED_CANDIDATE"]
    ),
    timeToConfirmedCandidateSec: firstTimestampForState(
      replay,
      expectedCandidateId,
      ["CONFIRMED_CANDIDATE"]
    ),
    passed: selectedCorrectly && stateMatches && !falseInterviewerSelection,
    failureReasons
  };
}

export function calculateEvaluationMetrics(
  results: readonly ScenarioEvaluationResult[]
): EvaluationMetrics {
  const totalScenarios = results.length;
  const passedScenarios = results.filter((result) => result.passed).length;
  const selectedCorrectly = results.filter(
    (result) => result.selectedCorrectly
  ).length;
  const stateMatches = results.filter((result) => result.stateMatches).length;
  const falseInterviewerSelections = results.filter(
    (result) => result.falseInterviewerSelection
  ).length;
  const ambiguousResults = results.filter(
    (result) => result.expectedState === "AMBIGUOUS"
  );
  const insufficientDataResults = results.filter(
    (result) => result.expectedState === "INSUFFICIENT_DATA"
  );

  return {
    totalScenarios,
    passedScenarios,
    failedScenarios: totalScenarios - passedScenarios,
    topOneAccuracy: totalScenarios === 0 ? 0 : selectedCorrectly / totalScenarios,
    stateAccuracy: totalScenarios === 0 ? 0 : stateMatches / totalScenarios,
    falseInterviewerSelections,
    averageFinalConfidence: average(
      results.map((result) => result.confidence)
    ),
    averageEvidenceCount: average(
      results.map((result) => result.evidenceCount)
    ),
    ambiguousScenarios: ambiguousResults.length,
    ambiguousScenariosPassed: ambiguousResults.filter((result) => result.passed)
      .length,
    insufficientDataScenarios: insufficientDataResults.length,
    insufficientDataScenariosPassed: insufficientDataResults.filter(
      (result) => result.passed
    ).length,
    averageTimeToLikelyCandidateSec: averageNullable(
      results.map((result) => result.timeToFirstLikelyCandidateSec)
    ),
    averageTimeToConfirmedCandidateSec: averageNullable(
      results.map((result) => result.timeToConfirmedCandidateSec)
    )
  };
}
