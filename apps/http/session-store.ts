import {
  applyMeetingEvent,
  createInitialSessionState,
  rankParticipants,
  type CandidateSessionState
} from "@sherlock/core";
import {
  CandidateStateSnapshotSchema,
  MeetingEventSchema,
  MeetingSchema,
  ParticipantSchema,
  type CandidateStateSnapshot,
  type Meeting,
  type MeetingEvent,
  type Participant
} from "@sherlock/shared";

export type MeetingSession = {
  readonly meeting: Meeting;
  readonly participants: readonly Participant[];
  readonly state: CandidateSessionState;
  readonly snapshot: CandidateStateSnapshot;
};

export type MeetingSessionStore = {
  createMeetingSession(
    meeting: Meeting,
    participants: readonly Participant[]
  ): MeetingSession;
  getMeetingSession(meetingId: string): MeetingSession | undefined;
  requireMeetingSession(meetingId: string): MeetingSession;
  appendMeetingEvent(meetingId: string, event: MeetingEvent): CandidateStateSnapshot;
  getSnapshot(meetingId: string): CandidateStateSnapshot | undefined;
};

export class MeetingSessionNotFoundError extends Error {}
export class UnknownParticipantError extends Error {}

function validateParticipants(meeting: Meeting, participants: readonly Participant[]) {
  for (const participant of participants) {
    if (participant.meetingId !== meeting.id) {
      throw new Error(
        `Participant ${participant.id} belongs to ${participant.meetingId}, not ${meeting.id}.`
      );
    }
  }
}

export function createMeetingSessionStore(): MeetingSessionStore {
  const sessions = new Map<string, MeetingSession>();

  function setSession(
    meeting: Meeting,
    participants: readonly Participant[],
    state: CandidateSessionState
  ) {
    const snapshot = CandidateStateSnapshotSchema.parse(rankParticipants(state));
    const session = {
      meeting,
      participants,
      state,
      snapshot
    };
    sessions.set(meeting.id, session);
    return session;
  }

  return {
    createMeetingSession(meetingInput, participantInputs) {
      const meeting = MeetingSchema.parse(meetingInput);
      const participants = participantInputs.map((participant) =>
        ParticipantSchema.parse(participant)
      );
      validateParticipants(meeting, participants);

      return setSession(
        meeting,
        participants,
        createInitialSessionState(meeting, participants)
      );
    },
    getMeetingSession(meetingId) {
      return sessions.get(meetingId);
    },
    requireMeetingSession(meetingId) {
      const session = sessions.get(meetingId);
      if (!session) {
        throw new MeetingSessionNotFoundError(`Meeting ${meetingId} was not found.`);
      }

      return session;
    },
    appendMeetingEvent(meetingId, eventInput) {
      const session = this.requireMeetingSession(meetingId);
      const event = MeetingEventSchema.parse(eventInput);
      if (!session.participants.some((participant) => participant.id === event.participantId)) {
        throw new UnknownParticipantError(
          `Participant ${event.participantId} is not part of meeting ${meetingId}.`
        );
      }

      const nextState = applyMeetingEvent(session.state, event);
      return setSession(session.meeting, session.participants, nextState).snapshot;
    },
    getSnapshot(meetingId) {
      return sessions.get(meetingId)?.snapshot;
    }
  };
}
