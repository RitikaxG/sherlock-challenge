import { describe, expect, test } from "bun:test";

import {
  applyMeetingEvent,
  createInitialSessionState,
  rankParticipants
} from "./index.ts";
import corePackage from "./package.json";
import {
  MeetingEventSchema,
  MeetingSchema,
  ParticipantSchema
} from "@sherlock/shared";

describe("@sherlock/core Phase 1 smoke coverage", () => {
  test("valid shared schemas parse correctly", () => {
    const meeting = MeetingSchema.parse({
      id: "meeting_1",
      candidateName: "Ritika Gupta"
    });
    const participant = ParticipantSchema.parse({
      id: "participant_1",
      meetingId: meeting.id,
      displayName: "Ritika"
    });

    expect(meeting.id).toBe("meeting_1");
    expect(participant.isKnownInterviewerHint).toBe(false);
  });

  test("malformed events are rejected", () => {
    expect(() =>
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "participant_1",
        timestampSec: 12,
        text: ""
      })
    ).toThrow();
  });

  test("@sherlock/core can import and use shared contracts", () => {
    const meeting = MeetingSchema.parse({
      id: "meeting_1",
      candidateName: "Ritika Gupta"
    });
    const participant = ParticipantSchema.parse({
      id: "participant_1",
      meetingId: meeting.id,
      displayName: "MacBook Pro"
    });
    const event = MeetingEventSchema.parse({
      type: "participant_joined",
      participantId: participant.id,
      timestampSec: 0
    });

    const initialState = createInitialSessionState(meeting, [participant]);
    const nextState = applyMeetingEvent(initialState, event);
    const snapshot = rankParticipants(nextState);

    expect(snapshot.state).toBe("INSUFFICIENT_DATA");
    expect(snapshot.participants).toHaveLength(1);
  });

  test("@sherlock/core package dependencies stay pure", () => {
    expect(corePackage.dependencies).toEqual({
      "@sherlock/shared": "*"
    });
  });
});
