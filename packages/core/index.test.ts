import { describe, expect, test } from "vitest";

import {
  applyMeetingEvent,
  createInitialSessionState,
  rankParticipants
} from "./index.ts";
import {
  MeetingEventSchema,
  MeetingSchema,
  ParticipantSchema
} from "@sherlock/shared";

describe("@sherlock/core Phase 1B placeholders", () => {
  test("valid MeetingEventSchema parses correctly", () => {
    const event = MeetingEventSchema.parse({
      type: "participant_joined",
      participantId: "participant_1",
      timestampSec: 0
    });

    expect(event.type).toBe("participant_joined");
  });

  test("malformed meeting events are rejected", () => {
    expect(() =>
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "participant_1",
        timestampSec: 10,
        text: ""
      })
    ).toThrow();
  });

  test("createInitialSessionState creates an empty event list", () => {
    const meeting = MeetingSchema.parse({
      id: "meeting_1",
      candidateName: "Ritika Gupta"
    });

    const state = createInitialSessionState(meeting);

    expect(state.events).toEqual([]);
  });

  test("applyMeetingEvent appends one event", () => {
    const meeting = MeetingSchema.parse({
      id: "meeting_1",
      candidateName: "Ritika Gupta"
    });
    const event = MeetingEventSchema.parse({
      type: "participant_joined",
      participantId: "participant_1",
      timestampSec: 0
    });

    const initialState = createInitialSessionState(meeting);
    const nextState = applyMeetingEvent(initialState, event);

    expect(nextState.events).toHaveLength(1);
    expect(nextState.events[0]).toEqual(event);
  });

  test("rankParticipants returns INSUFFICIENT_DATA placeholder state", () => {
    const meeting = MeetingSchema.parse({
      id: "meeting_1",
      candidateName: "Ritika Gupta"
    });
    const participant = ParticipantSchema.parse({
      id: "participant_1",
      meetingId: meeting.id,
      displayName: "MacBook Pro"
    });
    const state = createInitialSessionState(meeting, [participant]);

    const snapshot = rankParticipants(state);

    expect(snapshot.state).toBe("INSUFFICIENT_DATA");
    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.participants).toHaveLength(1);
  });
});
