import type {
  CandidateStateSnapshot,
  EvidenceItem,
  ParticipantRuntimeState
} from "./types";

const guardrailOrder = [
  "interviewer_exclusion",
  "ambiguity_margin",
  "confirmation_stability",
  "identity_verification_limit",
  "contradiction",
  "evidence_decay"
] as const;

export const guardrailWhyItMatters: Record<string, string> = {
  interviewer_exclusion:
    "Prevents interviewers or company-domain participants from being selected as the candidate stream.",
  ambiguity_margin:
    "Ensures Sherlock refuses to choose when top participant streams are too close.",
  confirmation_stability:
    "Allows a stream to be likely before it earns stronger confirmation over time.",
  identity_verification_limit:
    "This engine routes the candidate stream; it does not perform legal identity verification.",
  contradiction:
    "Warns when candidate-like and interviewer-like evidence conflict for the same stream.",
  evidence_decay:
    "Keeps stale transcript or behavior evidence from dominating the current decision."
};

export function formatSignalName(signal: string) {
  return signal.replaceAll("_", " ");
}

function sortedEvidence(
  evidence: readonly EvidenceItem[],
  participantId: string,
  direction: "positive" | "negative"
) {
  return evidence
    .filter((item) =>
      direction === "positive"
        ? item.participantId === participantId && item.impact > 0
        : item.participantId === participantId && item.impact < 0
    )
    .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact));
}

export function topPositiveEvidence(
  snapshot: CandidateStateSnapshot | null,
  participantId: string | null | undefined,
  limit = 3
) {
  if (!snapshot || !participantId) {
    return [];
  }

  return sortedEvidence(snapshot.evidence, participantId, "positive").slice(0, limit);
}

export function topNegativeEvidence(
  snapshot: CandidateStateSnapshot | null,
  participantId: string | null | undefined,
  limit = 3
) {
  if (!snapshot || !participantId) {
    return [];
  }

  return sortedEvidence(snapshot.evidence, participantId, "negative").slice(0, limit);
}

export function nearestAlternative(snapshot: CandidateStateSnapshot | null) {
  if (!snapshot) {
    return null;
  }

  return (
    snapshot.participants.find(
      (participant) => participant.participantId !== snapshot.selectedCandidateId
    ) ?? null
  );
}

export function participantLabel(
  participantId: string | null | undefined,
  participants: readonly ParticipantRuntimeState[]
) {
  if (!participantId) {
    return "No stream selected";
  }

  const participant = participants.find((item) => item.id === participantId);
  return participant
    ? `${participant.currentDisplayName} / ${participant.id}`
    : participantId;
}

export function primaryDecisionReason(
  snapshot: CandidateStateSnapshot | null,
  participants: readonly ParticipantRuntimeState[]
) {
  if (!snapshot || !snapshot.selectedCandidateId) {
    return "Sherlock is waiting for enough evidence before selecting a candidate stream.";
  }

  const selected = topPositiveEvidence(snapshot, snapshot.selectedCandidateId, 2);
  const alternative = nearestAlternative(snapshot);
  const rejected = topNegativeEvidence(snapshot, alternative?.participantId, 1);
  const selectedReason =
    selected.length > 0
      ? selected.map((item) => formatSignalName(item.signal)).join(" and ")
      : "stronger positive candidate evidence";
  const rejectedReason = rejected[0]
    ? `${formatSignalName(rejected[0].signal)} on ${participantLabel(alternative?.participantId, participants)}`
    : "weaker or less specific evidence on the nearest alternative";

  return `Selected because ${selectedReason}; nearest alternative was held back by ${rejectedReason}.`;
}

export function whyCandidateSummary(
  snapshot: CandidateStateSnapshot | null,
  participants: readonly ParticipantRuntimeState[]
) {
  const selectedId = snapshot?.selectedCandidateId ?? null;
  const alternative = nearestAlternative(snapshot);
  const selectedEvidence = topPositiveEvidence(snapshot, selectedId, 3);
  const rejectedEvidence = topNegativeEvidence(
    snapshot,
    alternative?.participantId,
    3
  );
  const limitations = [
    "Face/liveness/ID verification not performed.",
    "Fraud/cheating verdict not performed."
  ];

  return {
    selectedLabel: participantLabel(selectedId, participants),
    rejectedLabel: participantLabel(alternative?.participantId, participants),
    selectedReasons:
      selectedEvidence.length > 0
        ? selectedEvidence.map((item) => ({
            label: formatSignalName(item.signal),
            impact: item.impact
          }))
        : [{ label: "Waiting for positive candidate evidence", impact: 0 }],
    rejectedReasons:
      rejectedEvidence.length > 0
        ? rejectedEvidence.map((item) => ({
            label: formatSignalName(item.signal),
            impact: item.impact
          }))
        : [{ label: "No strong exclusion evidence on nearest alternative yet", impact: 0 }],
    limitations
  };
}

export function participantEvidenceSummary(
  snapshot: CandidateStateSnapshot | null,
  participantId: string
) {
  const positive = topPositiveEvidence(snapshot, participantId, 1)[0] ?? null;
  const negative = topNegativeEvidence(snapshot, participantId, 1)[0] ?? null;

  return {
    positive,
    negative,
    positiveLabel: positive ? formatSignalName(positive.signal) : null,
    negativeLabel: negative ? formatSignalName(negative.signal) : null
  };
}

export function orderedSafetyGates(snapshot: CandidateStateSnapshot | null) {
  const gates = snapshot?.decisionTrace?.safetyGates ?? [];

  return [...gates].sort((left, right) => {
    const leftIndex = guardrailOrder.indexOf(
      left.gate as (typeof guardrailOrder)[number]
    );
    const rightIndex = guardrailOrder.indexOf(
      right.gate as (typeof guardrailOrder)[number]
    );
    return (
      (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    );
  });
}
