import { ZodError } from "zod";
import type { FastifyInstance } from "fastify";
import {
  MeetingEventSchema,
  MeetingSchema,
  ParticipantSchema
} from "@sherlock/shared";
import {
  broadcastCandidateStateUpdated,
  type MeetingConnectionRegistry
} from "@sherlock/realtime";

import { shouldBroadcastSnapshot } from "./broadcast-policy.ts";
import {
  MeetingSessionNotFoundError,
  UnknownParticipantError,
  type MeetingSessionStore
} from "./session-store.ts";
import type {
  CreateMeetingRequest,
  PersistenceAdapter,
  ReadinessResponse
} from "./types.ts";

function badRequest(reply: { code(statusCode: number): { send(payload: unknown): void } }, error: unknown) {
  const message =
    error instanceof ZodError
      ? error.issues.map((issue) => issue.message).join("; ")
      : error instanceof Error
        ? error.message
        : "Invalid request.";
  reply.code(400).send({ error: message });
}

export async function registerRoutes(
  app: FastifyInstance,
  options: {
    sessionStore: MeetingSessionStore;
    persistence: PersistenceAdapter;
    realtimeRegistry: MeetingConnectionRegistry;
  }
) {
  app.get("/health", async () => ({
    ok: true,
    service: "sherlock-http"
  }));

  app.get("/ready", async (): Promise<ReadinessResponse> => {
    const db = await options.persistence.ready();
    return {
      ok: true,
      service: "sherlock-http",
      checks: {
        sessionStore: "ok",
        db: db.db
      },
      ...(db.warning ? { warning: db.warning } : {})
    };
  });

  app.post("/meetings", async (request, reply) => {
    try {
      const body = request.body as CreateMeetingRequest;
      const meeting = MeetingSchema.parse(body.meeting);
      const participants = body.participants.map((participant) =>
        ParticipantSchema.parse(participant)
      );
      const session = options.sessionStore.createMeetingSession(
        meeting,
        participants
      );

      try {
        await options.persistence.persistMeeting(meeting, participants);
      } catch (error) {
        request.log.warn({ error }, "Optional meeting persistence failed.");
      }

      return {
        meetingId: meeting.id,
        snapshot: session.snapshot
      };
    } catch (error) {
      return badRequest(reply, error);
    }
  });

  app.get("/meetings/:meetingId/snapshot", async (request, reply) => {
    const { meetingId } = request.params as { meetingId: string };
    const snapshot = options.sessionStore.getSnapshot(meetingId);

    if (!snapshot) {
      return reply.code(404).send({ error: "Meeting not found." });
    }

    return { snapshot };
  });

  app.post("/meetings/:meetingId/events", async (request, reply) => {
    const { meetingId } = request.params as { meetingId: string };

    try {
      const event = MeetingEventSchema.parse(request.body);
      const previous = options.sessionStore.getSnapshot(meetingId);
      const snapshot = options.sessionStore.appendMeetingEvent(meetingId, event);

      try {
        await options.persistence.persistEvent(meetingId, event, snapshot);
      } catch (error) {
        request.log.warn({ error }, "Optional event persistence failed.");
      }

      if (shouldBroadcastSnapshot(previous, snapshot)) {
        broadcastCandidateStateUpdated(options.realtimeRegistry, snapshot);
      }

      return {
        meetingId,
        eventAccepted: true,
        snapshot
      };
    } catch (error) {
      if (error instanceof MeetingSessionNotFoundError) {
        return reply.code(404).send({ error: "Meeting not found." });
      }

      if (error instanceof UnknownParticipantError || error instanceof ZodError) {
        return badRequest(reply, error);
      }

      request.log.error({ error }, "Failed to ingest meeting event.");
      return reply.code(500).send({ error: "Internal server error." });
    }
  });
}
