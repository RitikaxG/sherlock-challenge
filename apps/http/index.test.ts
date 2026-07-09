import { afterEach, describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { createMeetingConnectionRegistry } from "@sherlock/realtime";
import { createMockTranscriptClassifierProvider } from "@sherlock/llm";

import { createHttpApp, createNoopPersistence } from "./index.ts";
import type { CreateMeetingRequest } from "./types.ts";

const openApps: FastifyInstance[] = [];

async function testApp() {
  const app = await createHttpApp({
    persistence: createNoopPersistence()
  });
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map((app) => app.close()));
});

const meetingRequest: CreateMeetingRequest = {
  meeting: {
    id: "meeting_1",
    candidateName: "Ritika Gupta",
    candidateEmail: "ritika@example.com",
    interviewerNames: ["Priya Sharma"],
    interviewerEmails: ["priya@sherlock.ai"],
    companyDomains: ["sherlock.ai"]
  },
  participants: [
    {
      id: "p_candidate",
      meetingId: "meeting_1",
      displayName: "MacBook Pro",
      isKnownInterviewerHint: false
    },
    {
      id: "p_interviewer",
      meetingId: "meeting_1",
      displayName: "Priya Sharma",
      email: "priya@sherlock.ai",
      isKnownInterviewerHint: true
    }
  ]
};

async function createMeeting(app: FastifyInstance) {
  return app.inject({
    method: "POST",
    url: "/meetings",
    payload: meetingRequest
  });
}

describe("apps/http", () => {
  test("GET /health returns liveness", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "sherlock-http"
    });
  });

  test("GET /ready returns session-store readiness with no-op persistence", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/ready" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "sherlock-http",
      checks: {
        sessionStore: "ok",
        db: "not_configured"
      }
    });
  });

  test("POST /meetings creates an in-memory meeting session", async () => {
    const app = await testApp();
    const response = await createMeeting(app);
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.meetingId).toBe("meeting_1");
    expect(body.snapshot).toEqual(
      expect.objectContaining({
        meetingId: "meeting_1",
        selectedCandidateId: null
      })
    );
  });

  test("POST /meetings/:meetingId/events accepts speaking metadata fields", async () => {
    const app = await testApp();
    await createMeeting(app);

    const response = await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 80,
        durationSec: 8,
        source: "meeting_bot",
        sourceEventId: "speech_123",
        speakerConfidence: 0.91,
        startSec: 72,
        endSec: 80
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        meetingId: "meeting_1",
        eventAccepted: true,
        snapshot: expect.objectContaining({ meetingId: "meeting_1" })
      })
    );
  });

  test("POST /meetings/:meetingId/events accepts transcript metadata and calls core indirectly", async () => {
    const app = await testApp();
    await createMeeting(app);
    await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 80,
        durationSec: 300,
        source: "meeting_bot",
        sourceEventId: "speech_456"
      }
    });

    const response = await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 90,
        text: "My name is Ritika Gupta, I am here for the interview.",
        source: "asr_transcription",
        sourceEventId: "asr_456",
        speakerConfidence: 0.88,
        isFinal: true,
        startSec: 84,
        endSec: 90
      }
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.snapshot.selectedCandidateId).toBe("p_candidate");
    expect(body.snapshot.state).toBe("LIKELY_CANDIDATE");
  });

  test("GET /meetings/:meetingId/snapshot returns latest snapshot", async () => {
    const app = await testApp();
    await createMeeting(app);

    const response = await app.inject({
      method: "GET",
      url: "/meetings/meeting_1/snapshot"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().snapshot.meetingId).toBe("meeting_1");
  });

  test("invalid event returns 400", async () => {
    const app = await testApp();
    await createMeeting(app);

    const response = await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 90,
        text: ""
      }
    });

    expect(response.statusCode).toBe(400);
  });

  test("unknown meeting returns 404", async () => {
    const app = await testApp();
    const response = await app.inject({
      method: "POST",
      url: "/meetings/missing/events",
      payload: {
        type: "participant_joined",
        participantId: "p_candidate",
        timestampSec: 0
      }
    });

    expect(response.statusCode).toBe(404);
  });

  test("unknown participant returns 400", async () => {
    const app = await testApp();
    await createMeeting(app);
    const response = await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "participant_joined",
        participantId: "missing",
        timestampSec: 0
      }
    });

    expect(response.statusCode).toBe(400);
  });

  test("registers the meeting WebSocket endpoint", async () => {
    const app = await testApp();

    expect(
      app.hasRoute({
        method: "GET",
        url: "/meetings/:meetingId/ws"
      })
    ).toBe(true);
  });

  test("event ingestion broadcasts candidate_state_updated to meeting subscribers", async () => {
    const registry = createMeetingConnectionRegistry();
    const sent: string[] = [];
    const app = await createHttpApp({
      persistence: createNoopPersistence(),
      realtimeRegistry: registry
    });
    openApps.push(app);
    await createMeeting(app);
    registry.subscribe("meeting_1", {
      send(data) {
        sent.push(data);
      }
    });

    await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 80,
        durationSec: 300
      }
    });

    expect(JSON.parse(sent[0] ?? "{}")).toEqual(
      expect.objectContaining({
        type: "candidate_state_updated",
        snapshot: expect.objectContaining({ meetingId: "meeting_1" })
      })
    );
  });

  test("with transcript classifier configured, transcript ingestion applies LLM evidence", async () => {
    const app = await createHttpApp({
      persistence: createNoopPersistence(),
      transcriptClassifier: createMockTranscriptClassifierProvider()
    });
    openApps.push(app);
    await createMeeting(app);

    const response = await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 90,
        text: "My name is Ritika Gupta, I am here for the interview.",
        sourceEventId: "transcript_1"
      }
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.llmEvidenceApplied).toBe(true);
    expect(body.snapshot.evidence.map((item: { signal: string }) => item.signal)).toEqual(
      expect.arrayContaining(["candidate_self_identification"])
    );
  });

  test("classifier failure does not reject the original transcript event", async () => {
    const app = await createHttpApp({
      persistence: createNoopPersistence(),
      transcriptClassifier: {
        async classifyTranscript() {
          throw new Error("mock classifier failed");
        }
      }
    });
    openApps.push(app);
    await createMeeting(app);

    const response = await app.inject({
      method: "POST",
      url: "/meetings/meeting_1/events",
      payload: {
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 90,
        text: "My name is Ritika Gupta, I am here for the interview.",
        sourceEventId: "transcript_1"
      }
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.eventAccepted).toBe(true);
    expect(body.llmEvidenceApplied).toBe(false);
    expect(body.llmWarning).toContain("mock classifier failed");
  });
});
