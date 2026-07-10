import type {
  CandidateStateSnapshot,
  EventImpact,
  MeetingEvent
} from "./types";

export function snapshotKey(snapshot: CandidateStateSnapshot) {
  return [
    snapshot.meetingId,
    snapshot.state,
    snapshot.selectedCandidateId ?? "none",
    Math.round(snapshot.confidence * 1000),
    snapshot.timestampSec ?? "none",
    snapshot.evidence.length,
    snapshot.uncertainty.length
  ].join("|");
}

export function decisionTracePipeline(snapshot: CandidateStateSnapshot | null) {
  return snapshot?.decisionTrace?.pipeline ?? [
    {
      step: "Event received",
      status: "pending" as const,
      summary: "Waiting for the first scenario event."
    },
    {
      step: "Signals extracted",
      status: "pending" as const,
      summary: "Core will extract metadata, transcript, behavior, and safety signals."
    },
    {
      step: "Scores updated",
      status: "pending" as const,
      summary: "Participant scores update after signals are weighted."
    },
    {
      step: "Decision emitted",
      status: "pending" as const,
      summary: "A candidate state snapshot will appear after ranking."
    }
  ];
}

export function buildEventImpact(
  event: MeetingEvent,
  previousSnapshot: CandidateStateSnapshot | null,
  nextSnapshot: CandidateStateSnapshot
): EventImpact {
  const previousEvidenceKeys = new Set(
    (previousSnapshot?.evidence ?? []).map(
      (item) => `${item.signal}|${item.participantId}|${item.reason}`
    )
  );
  const newEvidence = nextSnapshot.evidence.filter(
    (item) =>
      !previousEvidenceKeys.has(`${item.signal}|${item.participantId}|${item.reason}`)
  );

  return {
    eventLabel: event.type,
    participantId: event.participantId,
    timestampSec: event.timestampSec,
    nextState: nextSnapshot.state,
    nextConfidence: nextSnapshot.confidence,
    selectedCandidateChanged:
      (previousSnapshot?.selectedCandidateId ?? null) !==
      nextSnapshot.selectedCandidateId,
    newEvidence,
    ...(previousSnapshot === null ? {} : { previousState: previousSnapshot.state }),
    ...(previousSnapshot === null
      ? {}
      : { previousConfidence: previousSnapshot.confidence })
  };
}

export function connectionStatusLabel(status: string, warning?: string | null) {
  if (warning) {
    return "local visual fallback";
  }

  switch (status) {
    case "idle":
      return "not started";
    case "connecting":
      return "connecting";
    case "backend_connected":
      return "backend connected";
    case "websocket_connected":
      return "WebSocket connected";
    case "websocket_disconnected":
      return "HTTP active · WS closed";
    case "polling":
      return "polling backend";
    case "local_fallback":
      return "local visual fallback";
    case "offline":
      return "backend unavailable";
    default:
      return status;
  }
}
