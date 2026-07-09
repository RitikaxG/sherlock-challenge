import { createSignal } from "./evidence.ts";
import { isGenericDeviceName, safeNumber } from "./helpers.ts";
import { getParticipantDisplayName, type CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

function scheduledStartSec(state: CandidateSessionState) {
  if (!state.meeting.scheduledStart) {
    return undefined;
  }

  return Date.parse(state.meeting.scheduledStart) / 1000;
}

export function extractEventSignals(state: CandidateSessionState): ExtractedSignal[] {
  const startSec = scheduledStartSec(state);
  const joinedEvents = state.events.filter(
    (event) => event.type === "participant_joined"
  );
  const interviewerJoinCountByParticipant = new Map<string, number>();

  for (const event of joinedEvents) {
    const participant = state.participants.find(
      (item) => item.id === event.participantId
    );
    const isInterviewer = participant?.isKnownInterviewerHint ?? false;

    if (isInterviewer) {
      for (const laterEvent of joinedEvents) {
        if (laterEvent.timestampSec > event.timestampSec) {
          interviewerJoinCountByParticipant.set(
            laterEvent.participantId,
            (interviewerJoinCountByParticipant.get(laterEvent.participantId) ?? 0) +
              1
          );
        }
      }
    }
  }

  return state.participants.flatMap((participant) => {
    const signals: ExtractedSignal[] = [];
    const joinedAtSec =
      state.joinedAtSecByParticipant[participant.id] ?? participant.joinedAtSec;
    const displayName = getParticipantDisplayName(state, participant);
    const originalName =
      state.originalDisplayNames[participant.id] ?? participant.displayName;

    if (joinedAtSec !== undefined && startSec !== undefined) {
      const secondsFromStart = Math.abs(joinedAtSec - startSec);

      if (secondsFromStart <= 300) {
        signals.push(
          createSignal({
            participantId: participant.id,
            kind: "join_timing",
            direction: "positive",
            strength: 0.25,
            reason: "Participant joined close to the scheduled start time.",
            source: "event"
          })
        );
      } else if (joinedAtSec < startSec - 900) {
        signals.push(
          createSignal({
            participantId: participant.id,
            kind: "join_timing",
            direction: "neutral",
            strength: 0.1,
            reason: "Participant joined much earlier than the scheduled start.",
            source: "event"
          })
        );
      }
    }

    if (safeNumber(interviewerJoinCountByParticipant.get(participant.id)) >= 2) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "join_order",
          direction: "positive",
          strength: 0.2,
          reason: "Participant joined after multiple known interviewers.",
          source: "event"
        })
      );
    }

    if (
      originalName !== displayName &&
      isGenericDeviceName(originalName) &&
      !isGenericDeviceName(displayName)
    ) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "display_name_change",
          direction: "positive",
          strength: 0.45,
          reason:
            "Participant changed from a generic device name to a more identifying display name.",
          source: "event"
        })
      );
    }

    return signals;
  });
}
