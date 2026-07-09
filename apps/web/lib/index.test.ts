import { describe, expect, test } from "vitest";

import { buildApiUrl } from "./sherlock-api";
import { buildWebSocketUrl } from "./sherlock-ws";
import { decisionSummary, inferMargin } from "./decision-copy";
import { describeEvent, formatTimestamp } from "./event-formatters";
import { getCriteria } from "./criteria";
import { demoScenarios } from "./demo-scenarios";

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
});
