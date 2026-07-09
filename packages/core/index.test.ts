import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  applyMeetingEvent,
  createInitialSessionState,
  extractBehaviorSignals,
  extractInterviewerExclusionSignals,
  extractMetadataSignals,
  extractTranscriptSignals,
  rankParticipants
} from "./index.ts";
import {
  MeetingEventSchema,
  MeetingSchema,
  ParticipantSchema
} from "@sherlock/shared";

const meeting = MeetingSchema.parse({
  id: "meeting_1",
  candidateName: "Ritika Gupta",
  candidateEmail: "ritika@gmail.com",
  interviewerNames: ["Priya Sharma"],
  interviewerEmails: ["priya@sherlock.ai"],
  companyDomains: ["sherlock.ai"]
});

function participant(input: {
  id: string;
  displayName: string;
  email?: string;
  isKnownInterviewerHint?: boolean;
}) {
  return ParticipantSchema.parse({
    meetingId: meeting.id,
    isKnownInterviewerHint: false,
    ...input
  });
}

describe("@sherlock/core Phase 3 signal extraction", () => {
  test("valid MeetingEventSchema parses correctly", () => {
    expect(
      MeetingEventSchema.parse({
        type: "participant_joined",
        participantId: "participant_1",
        timestampSec: 0
      }).type
    ).toBe("participant_joined");
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

  test("metadata signals detect exact candidate name matches", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" })
    ]);

    expect(extractMetadataSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "p_candidate",
          kind: "candidate_name_exact",
          direction: "positive"
        })
      ])
    );
  });

  test("metadata signals keep generic device names weak and neutral", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_device", displayName: "MacBook Pro" })
    ]);

    expect(extractMetadataSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "p_device",
          kind: "generic_device_name",
          direction: "neutral"
        })
      ])
    );
  });

  test("interviewer name, email, and company domain produce negative signals", () => {
    const state = createInitialSessionState(meeting, [
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);

    const signals = [
      ...extractMetadataSignals(state),
      ...extractInterviewerExclusionSignals(state)
    ];

    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "interviewer_name_match" }),
        expect.objectContaining({ kind: "interviewer_email_match" }),
        expect.objectContaining({ kind: "company_domain_email" })
      ])
    );
    expect(signals.every((signal) => signal.direction !== "positive")).toBe(true);
  });

  test("session state applies event updates deterministically", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" })
    ]);

    const state = [
      MeetingEventSchema.parse({
        type: "display_name_changed",
        participantId: "p_candidate",
        timestampSec: 10,
        newDisplayName: "Ritika Gupta"
      }),
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 20,
        durationSec: 45
      }),
      MeetingEventSchema.parse({
        type: "webcam_changed",
        participantId: "p_candidate",
        timestampSec: 25,
        webcamOn: true
      }),
      MeetingEventSchema.parse({
        type: "screen_share_changed",
        participantId: "p_candidate",
        timestampSec: 30,
        sharing: true
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 40,
        text: "My name is Ritika and I worked on a project."
      })
    ].reduce(applyMeetingEvent, baseState);

    expect(state.currentDisplayNames.p_candidate).toBe("Ritika Gupta");
    expect(state.participantSpeakingDurationSec.p_candidate).toBe(45);
    expect(state.webcamOnByParticipant.p_candidate).toBe(true);
    expect(state.screenShareByParticipant.p_candidate).toBe(true);
    expect(state.transcriptSnippetsByParticipant.p_candidate).toEqual([
      "My name is Ritika and I worked on a project."
    ]);
  });

  test("behavior signals reflect speaking activity, webcam, and screen share", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 20,
        durationSec: 90
      }),
      MeetingEventSchema.parse({
        type: "webcam_changed",
        participantId: "p_candidate",
        timestampSec: 25,
        webcamOn: true
      }),
      MeetingEventSchema.parse({
        type: "screen_share_changed",
        participantId: "p_candidate",
        timestampSec: 30,
        sharing: true
      })
    ].reduce(applyMeetingEvent, baseState);

    expect(extractBehaviorSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "speaking_activity" }),
        expect.objectContaining({ kind: "webcam_on" }),
        expect.objectContaining({ kind: "screen_share" })
      ])
    );
  });

  test("transcript signals detect candidate-like and interviewer-like phrases", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" }),
      participant({ id: "p_interviewer", displayName: "Priya Sharma" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 40,
        text: "My name is Ritika and I worked on my project."
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_interviewer",
        timestampSec: 50,
        text: "Tell me about yourself and then can you explain the role."
      })
    ].reduce(applyMeetingEvent, baseState);

    expect(extractTranscriptSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "p_candidate",
          kind: "candidate_transcript_phrase",
          direction: "positive"
        }),
        expect.objectContaining({
          participantId: "p_interviewer",
          kind: "interviewer_transcript_phrase",
          direction: "negative"
        })
      ])
    );
  });

  test("rankParticipants aggregates signals but keeps placeholder state", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" }),
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);

    const snapshot = rankParticipants(state);

    expect(snapshot.state).toBe("INSUFFICIENT_DATA");
    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.evidence.length).toBeGreaterThan(0);
    expect(snapshot.participants[0]?.participantId).toBe("p_candidate");
  });

  test("core imports stay pure", () => {
    const forbiddenImports = [
      "@sherlock/db",
      "@sherlock/realtime",
      "@sherlock/llm",
      "fastify",
      "prisma",
      "react",
      "websocket"
    ];
    const files = readdirSync(new URL(".", import.meta.url))
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .map((file) => join(new URL(".", import.meta.url).pathname, file));

    for (const file of files) {
      const source = readFileSync(file, "utf8").toLowerCase();

      for (const forbiddenImport of forbiddenImports) {
        expect(source).not.toContain(forbiddenImport);
      }
    }
  });
});
