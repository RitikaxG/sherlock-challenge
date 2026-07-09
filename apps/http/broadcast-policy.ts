import type { CandidateStateSnapshot } from "@sherlock/shared";

export function shouldBroadcastSnapshot(
  previous: CandidateStateSnapshot | undefined,
  next: CandidateStateSnapshot
) {
  if (!previous) {
    return true;
  }

  return (
    previous.state !== next.state ||
    previous.selectedCandidateId !== next.selectedCandidateId ||
    Math.abs(previous.confidence - next.confidence) >= 0.03 ||
    previous.evidence.length !== next.evidence.length ||
    previous.uncertainty.length !== next.uncertainty.length
  );
}
