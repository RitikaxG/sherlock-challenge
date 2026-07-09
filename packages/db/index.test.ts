import { randomUUID } from "node:crypto";

import { describe, expect, test } from "vitest";

import { createPrismaClient } from "./client.ts";
import {
  appendMeetingEvent,
  createMeeting,
  createScoreSnapshot,
  getMeetingWithEvents,
  upsertParticipant
} from "./repositories.ts";

const databaseUrl = process.env.DATABASE_URL;
const maybeTest = databaseUrl ? test : test.skip;

async function canReachDatabase(client: ReturnType<typeof createPrismaClient>) {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe("@sherlock/db repositories", () => {
  maybeTest("persist and load a meeting event flow", async () => {
    const client = createPrismaClient(databaseUrl);
    const suffix = randomUUID();
    const meetingId = `meeting_${suffix}`;
    const participantId = `participant_${suffix}`;

    try {
      if (!(await canReachDatabase(client))) {
        console.warn(
          "Skipping DB integration assertions because Postgres is not reachable."
        );
        return;
      }

      await createMeeting(
        {
          id: meetingId,
          candidateName: "Ritika Gupta",
          candidateEmail: "ritika@example.com",
          interviewerNames: [],
          interviewerEmails: [],
          companyDomains: ["example.com"]
        },
        client
      );

      await upsertParticipant(
        {
          id: participantId,
          meetingId,
          displayName: "MacBook Pro",
          isKnownInterviewerHint: false
        },
        client
      );

      await appendMeetingEvent(
        {
          meetingId,
          participantId,
          type: "participant_joined",
          timestampSec: 0
        },
        client
      );

      await createScoreSnapshot(
        {
          meetingId,
          selectedCandidateId: null,
          confidence: 0,
          state: "INSUFFICIENT_DATA",
          participants: [
            {
              participantId,
              displayName: "MacBook Pro",
              confidence: 0,
              rawScore: 0
            }
          ],
          evidence: [],
          uncertainty: ["Scoring has not been implemented yet."]
        },
        client
      );

      const loaded = await getMeetingWithEvents(meetingId, client);

      expect(loaded?.id).toBe(meetingId);
      expect(loaded?.participants).toHaveLength(1);
      expect(loaded?.events).toHaveLength(1);
      expect(loaded?.scoreSnapshots).toHaveLength(1);
    } finally {
      await client.meeting.delete({ where: { id: meetingId } }).catch(() => {});
      await client.$disconnect();
    }
  });

  test("documents why integration tests may be skipped", () => {
    if (!databaseUrl) {
      expect(databaseUrl).toBeUndefined();
    } else {
      expect(databaseUrl).toContain("postgresql://");
    }
  });
});
