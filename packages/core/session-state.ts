import type { Meeting, MeetingEvent, Participant } from "@sherlock/shared";

export type CandidateSessionState = {
  readonly meeting: Meeting;
  readonly participants: readonly Participant[];
  readonly events: readonly MeetingEvent[];
  readonly currentDisplayNames: Readonly<Record<string, string>>;
  readonly participantSpeakingDurationSec: Readonly<Record<string, number>>;
  readonly webcamOnByParticipant: Readonly<Record<string, boolean>>;
  readonly screenShareByParticipant: Readonly<Record<string, boolean>>;
  readonly transcriptSnippetsByParticipant: Readonly<Record<string, readonly string[]>>;
  readonly joinedAtSecByParticipant: Readonly<Record<string, number>>;
  readonly leftAtSecByParticipant: Readonly<Record<string, number>>;
  readonly originalDisplayNames: Readonly<Record<string, string>>;
};

function participantsById(participants: readonly Participant[]) {
  return Object.fromEntries(
    participants.map((participant) => [participant.id, participant])
  );
}

export function createInitialSessionState(
  meeting: Meeting,
  participants: readonly Participant[] = []
): CandidateSessionState {
  return {
    meeting,
    participants,
    events: [],
    currentDisplayNames: Object.fromEntries(
      participants.map((participant) => [
        participant.id,
        participant.currentName ?? participant.displayName
      ])
    ),
    participantSpeakingDurationSec: {},
    webcamOnByParticipant: {},
    screenShareByParticipant: {},
    transcriptSnippetsByParticipant: {},
    joinedAtSecByParticipant: Object.fromEntries(
      participants
        .filter((participant) => participant.joinedAtSec !== undefined)
        .map((participant) => [participant.id, participant.joinedAtSec as number])
    ),
    leftAtSecByParticipant: Object.fromEntries(
      participants
        .filter((participant) => participant.leftAtSec !== undefined)
        .map((participant) => [participant.id, participant.leftAtSec as number])
    ),
    originalDisplayNames: Object.fromEntries(
      participants.map((participant) => [participant.id, participant.displayName])
    )
  };
}

export function applyMeetingEvent(
  state: CandidateSessionState,
  event: MeetingEvent
): CandidateSessionState {
  const participants = participantsById(state.participants);
  const participant = participants[event.participantId];
  const currentDisplayNames = { ...state.currentDisplayNames };
  const participantSpeakingDurationSec = {
    ...state.participantSpeakingDurationSec
  };
  const webcamOnByParticipant = { ...state.webcamOnByParticipant };
  const screenShareByParticipant = { ...state.screenShareByParticipant };
  const transcriptSnippetsByParticipant = {
    ...state.transcriptSnippetsByParticipant
  };
  const joinedAtSecByParticipant = { ...state.joinedAtSecByParticipant };
  const leftAtSecByParticipant = { ...state.leftAtSecByParticipant };

  if (participant && !currentDisplayNames[event.participantId]) {
    currentDisplayNames[event.participantId] =
      participant.currentName ?? participant.displayName;
  }

  switch (event.type) {
    case "participant_joined":
      joinedAtSecByParticipant[event.participantId] = event.timestampSec;
      break;
    case "participant_left":
      leftAtSecByParticipant[event.participantId] = event.timestampSec;
      break;
    case "display_name_changed":
      currentDisplayNames[event.participantId] = event.newDisplayName;
      break;
    case "webcam_changed":
      webcamOnByParticipant[event.participantId] = event.webcamOn;
      break;
    case "screen_share_changed":
      screenShareByParticipant[event.participantId] = event.sharing;
      break;
    case "speaking_activity":
      participantSpeakingDurationSec[event.participantId] =
        (participantSpeakingDurationSec[event.participantId] ?? 0) +
        event.durationSec;
      break;
    case "transcript_chunk":
      transcriptSnippetsByParticipant[event.participantId] = [
        ...(transcriptSnippetsByParticipant[event.participantId] ?? []),
        event.text
      ];
      break;
  }

  return {
    ...state,
    events: [...state.events, event],
    currentDisplayNames,
    participantSpeakingDurationSec,
    webcamOnByParticipant,
    screenShareByParticipant,
    transcriptSnippetsByParticipant,
    joinedAtSecByParticipant,
    leftAtSecByParticipant
  };
}

export function getParticipantDisplayName(
  state: CandidateSessionState,
  participant: Participant
) {
  return (
    state.currentDisplayNames[participant.id] ??
    participant.currentName ??
    participant.displayName
  );
}
