import type {
  MeetingEvent,
  ParticipantRuntimeState,
  TimelineItem,
  TranscriptItem
} from "./types";

export function formatTimestamp(timestampSec?: number) {
  if (timestampSec === undefined) {
    return "--:--";
  }

  const minutes = Math.floor(timestampSec / 60).toString().padStart(2, "0");
  const seconds = Math.floor(timestampSec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function describeEvent(
  event: MeetingEvent,
  participants: readonly ParticipantRuntimeState[] = []
) {
  const participant =
    participants.find((item) => item.id === event.participantId)?.currentDisplayName ??
    event.participantId;

  switch (event.type) {
    case "participant_joined":
      return `${participant} joined`;
    case "participant_left":
      return `${participant} left`;
    case "display_name_changed":
      return `${participant} changed display name to ${event.newDisplayName}`;
    case "webcam_changed":
      return `${participant} turned webcam ${event.webcamOn ? "on" : "off"}`;
    case "screen_share_changed":
      return `${participant} ${event.sharing ? "started" : "stopped"} screen sharing`;
    case "speaking_activity":
      return `${participant} spoke for ${event.durationSec}s`;
    case "transcript_chunk":
      return `${participant}: "${event.text}"`;
    case "llm_transcript_evidence":
      return `${participant} received LLM role evidence: ${event.role}`;
  }
}

export function timelineItemForEvent(
  event: MeetingEvent,
  index: number,
  participants: readonly ParticipantRuntimeState[] = []
): TimelineItem {
  return {
    id: `event_${index}_${event.type}_${event.timestampSec}`,
    timestampSec: event.timestampSec,
    kind: "event",
    label: event.type,
    detail: describeEvent(event, participants),
    participantId: event.participantId
  };
}

export function transcriptItemForEvent(
  event: MeetingEvent,
  participants: readonly ParticipantRuntimeState[]
): TranscriptItem | null {
  const participant =
    participants.find((item) => item.id === event.participantId)?.currentDisplayName ??
    event.participantId;

  if (event.type === "transcript_chunk") {
    return {
      id: event.sourceEventId ?? `transcript_${event.participantId}_${event.timestampSec}`,
      participantId: event.participantId,
      displayName: participant,
      timestampSec: event.timestampSec,
      text: event.text,
      source: event.source ?? "manual_fixture"
    };
  }

  if (event.type === "llm_transcript_evidence") {
    const evidence = event.evidence[0];
    return {
      id: event.sourceEventId ?? `llm_${event.participantId}_${event.timestampSec}`,
      participantId: event.participantId,
      displayName: participant,
      timestampSec: event.timestampSec,
      text: event.evidence.map((item) => item.reason).join(" "),
      source: "gemini_transcript_classifier",
      llmEvidence: evidence?.kind ?? event.role,
      strength: evidence?.strength
    };
  }

  return null;
}
