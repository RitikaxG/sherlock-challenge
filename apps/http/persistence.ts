import {
  appendMeetingEvent,
  createMeeting,
  createScoreSnapshot,
  upsertParticipant
} from "@sherlock/db";
import type {
  CandidateStateSnapshot,
  Meeting,
  MeetingEvent,
  Participant
} from "@sherlock/shared";

import type { PersistenceAdapter } from "./types.ts";

export function createNoopPersistence(): PersistenceAdapter {
  return {
    mode: "disabled",
    async persistMeeting() {},
    async persistEvent() {},
    async ready() {
      return { db: "not_configured" };
    }
  };
}

export function createDbPersistence(): PersistenceAdapter {
  return {
    mode: "enabled",
    async persistMeeting(meeting: Meeting, participants: readonly Participant[]) {
      await createMeeting(meeting);
      await Promise.all(participants.map((participant) => upsertParticipant(participant)));
    },
    async persistEvent(
      meetingId: string,
      event: MeetingEvent,
      snapshot: CandidateStateSnapshot
    ) {
      await appendMeetingEvent({ ...event, meetingId });
      await createScoreSnapshot({
        ...snapshot,
        participantId: snapshot.selectedCandidateId
      });
    },
    async ready() {
      return { db: "configured" };
    }
  };
}

export function createOptionalPersistence(
  databaseUrl = process.env.DATABASE_URL
): PersistenceAdapter {
  return databaseUrl ? createDbPersistence() : createNoopPersistence();
}
