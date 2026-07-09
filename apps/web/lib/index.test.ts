import { describe, expect, test } from "vitest";

import { buildApiUrl } from "./sherlock-api";
import { buildWebSocketUrl } from "./sherlock-ws";
import { decisionSummary, inferMargin } from "./decision-copy";
import { describeEvent, formatTimestamp } from "./event-formatters";
import { getCriteria } from "./criteria";
import {
  demoScenarios,
  recommendedDemoScenarioIds
} from "./demo-scenarios";
import { snapshotKey } from "./replay-helpers";
import { getScenarioResult } from "./scenario-results";
import type { CandidateStateSnapshot } from "./types";

const baseSnapshot: CandidateStateSnapshot = {
  meetingId: "m1",
  selectedCandidateId: "p1",
  confidence: 0.8,
  state: "LIKELY_CANDIDATE",
  participants: [
    { participantId: "p1", displayName: "A", confidence: 0.8, rawScore: 0.8 },
    { participantId: "p2", displayName: "B", confidence: 0.5, rawScore: 0.5 }
  ],
  evidence: [],
  uncertainty: []
};

describe("Sherlock web utilities", () => {
  test("builds API and WebSocket URLs from a configurable base", () => {
    expect(buildApiUrl("/meetings", "http://localhost:3001/")).toBe(
      "http://localhost:3001/meetings"
    );
    expect(buildWebSocketUrl("meeting 1", "https://api.example.com")).toBe(
      "wss://api.example.com/meetings/meeting%201/ws"
    );
  });

  test("formats timeline timestamps and event descriptions", () => {
    expect(formatTimestamp(75)).toBe("01:15");
    expect(
      describeEvent({
        type: "display_name_changed",
        participantId: "p1",
        timestampSec: 5,
        newDisplayName: "Ritika Gupta"
      })
    ).toContain("Ritika Gupta");
  });

  test("summarizes decision state and margin", () => {
    expect(decisionSummary(null)).toContain("Start a scenario");
    expect(
      inferMargin({
        ...baseSnapshot
      })
    ).toBeCloseTo(0.3);
  });

  test("maps criteria and scenario metadata", () => {
    expect(getCriteria(null).map((item) => item.name)).toContain(
      "Transcript / LLM evidence"
    );
    expect(demoScenarios).toHaveLength(20);
    expect(demoScenarios.find((scenario) => scenario.id === "08_two_unknown_ambiguous")?.expectedState).toBe(
      "AMBIGUOUS"
    );
  });

  test("maps real core signal names into criteria groups", () => {
    const criteria = getCriteria({
      ...baseSnapshot,
      evidence: [
        {
          signal: "candidate_email_exact",
          participantId: "p1",
          impact: 0.3,
          reason: "Candidate email matched."
        },
        {
          signal: "speaking_activity",
          participantId: "p1",
          impact: 0.12,
          reason: "Participant spoke."
        },
        {
          signal: "candidate_transcript_interviewer_metadata_conflict",
          participantId: "p2",
          impact: -0.5,
          reason: "Transcript and metadata conflict."
        },
        {
          signal: "display_name_change",
          participantId: "p1",
          impact: 0.1,
          reason: "Display name changed."
        }
      ]
    });

    expect(
      criteria.find((item) => item.name === "Metadata signals")?.currentSignals
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ signal: "candidate_email_exact" })
      ])
    );
    expect(
      criteria.find((item) => item.name === "Behavior signals")?.currentSignals
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ signal: "speaking_activity" })
      ])
    );
    expect(
      criteria.find((item) => item.name === "Safety overrides")?.currentSignals
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signal: "candidate_transcript_interviewer_metadata_conflict"
        })
      ])
    );
    expect(
      criteria.find((item) => item.name === "Meeting event signals")?.currentSignals
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ signal: "display_name_change" })
      ])
    );
  });

  test("recommended demo path points at existing scenarios", () => {
    expect(recommendedDemoScenarioIds).toHaveLength(6);
    for (const id of recommendedDemoScenarioIds) {
      expect(demoScenarios.some((scenario) => scenario.id === id)).toBe(true);
    }
  });

  test("computes expected-vs-actual scenario result", () => {
    const scenario = demoScenarios.find(
      (item) => item.id === "12_strong_self_identification"
    )!;

    expect(getScenarioResult(scenario, null, "running").status).toBe("pending");
    expect(
      getScenarioResult(
        scenario,
        {
          ...baseSnapshot,
          selectedCandidateId: scenario.expectedSelectedCandidateId,
          state: scenario.expectedState
        },
        "completed"
      ).status
    ).toBe("pass");
    expect(
      getScenarioResult(
        scenario,
        {
          ...baseSnapshot,
          selectedCandidateId: null,
          state: "INSUFFICIENT_DATA"
        },
        "completed"
      ).status
    ).toBe("fail");
  });

  test("snapshot key dedupes equal snapshots and changes on state or confidence", () => {
    expect(snapshotKey(baseSnapshot)).toBe(snapshotKey({ ...baseSnapshot }));
    expect(snapshotKey(baseSnapshot)).not.toBe(
      snapshotKey({ ...baseSnapshot, state: "CONFIRMED_CANDIDATE" })
    );
    expect(snapshotKey(baseSnapshot)).not.toBe(
      snapshotKey({ ...baseSnapshot, confidence: 0.9 })
    );
  });
});
