import { formatPercent } from "./decision-copy";
import type { EventImpact } from "./types";

export function stateImpactCopy(impact: EventImpact) {
  if (!impact.previousState) {
    return `State is ${impact.nextState}`;
  }

  if (impact.previousState === impact.nextState) {
    return `State remained ${impact.nextState}`;
  }

  return `State changed from ${impact.previousState} to ${impact.nextState}`;
}

export function confidenceImpactCopy(impact: EventImpact) {
  if (impact.previousConfidence === undefined) {
    return `Confidence is ${formatPercent(impact.nextConfidence)}`;
  }

  if (impact.previousConfidence === impact.nextConfidence) {
    return `Confidence remained ${formatPercent(impact.nextConfidence)}`;
  }

  const direction =
    impact.nextConfidence > impact.previousConfidence ? "increased" : "decreased";

  return `Confidence ${direction} from ${formatPercent(impact.previousConfidence)} to ${formatPercent(impact.nextConfidence)}`;
}

export function selectedStreamImpactCopy(
  impact: EventImpact,
  selectedCandidateId: string | null | undefined
) {
  if (impact.selectedCandidateChanged) {
    return `Selected stream changed to ${selectedCandidateId ?? "none"}`;
  }

  return `Selected stream stayed ${selectedCandidateId ?? "none"}`;
}

export function decisiveEventCopy(impact: EventImpact) {
  const becameLikely =
    impact.previousState !== "LIKELY_CANDIDATE" &&
    impact.nextState === "LIKELY_CANDIDATE";
  const becameConfirmed =
    impact.previousState !== "CONFIRMED_CANDIDATE" &&
    impact.nextState === "CONFIRMED_CANDIDATE";

  if (becameLikely) {
    return "This event made the candidate likely.";
  }

  if (becameConfirmed) {
    return "This event confirmed the candidate stream.";
  }

  return null;
}
