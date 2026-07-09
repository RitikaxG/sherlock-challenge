import type { CandidateStateSnapshot } from "./types";

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
