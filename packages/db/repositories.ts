import type {
  CandidateStateSnapshot,
  Meeting,
  MeetingEvent,
  Participant,
  ScenarioFile
} from "@sherlock/shared";

import { Prisma } from "./generated/prisma/client.ts";
import { getPrismaClient, type SherlockDbClient } from "./client.ts";

type JsonObject = Prisma.InputJsonObject;

export type CreateMeetingInput = Meeting;

export type UpsertParticipantInput = Participant;

export type AppendMeetingEventInput = MeetingEvent & {
  readonly meetingId: string;
};

export type CreateScoreSnapshotInput = CandidateStateSnapshot & {
  readonly participantId?: string | null;
};

export type CreateScenarioResultInput = {
  readonly scenarioId: ScenarioFile["id"];
  readonly meetingId?: string | null;
  readonly expectedCandidateId?: string | null;
  readonly predictedCandidateId?: string | null;
  readonly passed: boolean;
  readonly metrics: JsonObject;
  readonly finalSnapshot?: CandidateStateSnapshot | null;
};

function db(client?: SherlockDbClient) {
  return client ?? getPrismaClient();
}

export function createMeeting(
  input: CreateMeetingInput,
  client?: SherlockDbClient
) {
  return db(client).meeting.create({
    data: {
      id: input.id,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
      scheduledStart: input.scheduledStart
        ? new Date(input.scheduledStart)
        : undefined,
      interviewerNames: input.interviewerNames,
      interviewerEmails: input.interviewerEmails,
      companyDomains: input.companyDomains
    }
  });
}

export function upsertParticipant(
  input: UpsertParticipantInput,
  client?: SherlockDbClient
) {
  return db(client).participant.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      meetingId: input.meetingId,
      displayName: input.displayName,
      email: input.email,
      currentName: input.currentName,
      joinedAtSec: input.joinedAtSec,
      leftAtSec: input.leftAtSec,
      isKnownInterviewerHint: input.isKnownInterviewerHint
    },
    update: {
      meetingId: input.meetingId,
      displayName: input.displayName,
      email: input.email,
      currentName: input.currentName,
      joinedAtSec: input.joinedAtSec,
      leftAtSec: input.leftAtSec,
      isKnownInterviewerHint: input.isKnownInterviewerHint
    }
  });
}

export function appendMeetingEvent(
  input: AppendMeetingEventInput,
  client?: SherlockDbClient
) {
  const { meetingId, participantId, timestampSec, type, ...payload } = input;

  return db(client).meetingEvent.create({
    data: {
      meetingId,
      participantId,
      type,
      timestampSec,
      payload
    }
  });
}

export function createScoreSnapshot(
  input: CreateScoreSnapshotInput,
  client?: SherlockDbClient
) {
  return db(client).scoreSnapshot.create({
    data: {
      meetingId: input.meetingId,
      participantId: input.participantId,
      selectedCandidateId: input.selectedCandidateId,
      confidence: input.confidence,
      state: input.state,
      participants: input.participants,
      evidence: input.evidence,
      uncertainty: input.uncertainty,
      rawSnapshot: input
    }
  });
}

export function createScenarioResult(
  input: CreateScenarioResultInput,
  client?: SherlockDbClient
) {
  return db(client).scenarioResult.create({
    data: {
      scenarioId: input.scenarioId,
      meetingId: input.meetingId,
      expectedCandidateId: input.expectedCandidateId,
      predictedCandidateId: input.predictedCandidateId,
      passed: input.passed,
      metrics: input.metrics,
      finalSnapshot:
        input.finalSnapshot === null ? Prisma.JsonNull : input.finalSnapshot
    }
  });
}

export function getMeetingWithEvents(
  meetingId: string,
  client?: SherlockDbClient
) {
  return db(client).meeting.findUnique({
    where: { id: meetingId },
    include: {
      participants: true,
      events: {
        orderBy: { timestampSec: "asc" }
      },
      scoreSnapshots: {
        orderBy: { createdAt: "asc" }
      },
      scenarioResults: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
}
