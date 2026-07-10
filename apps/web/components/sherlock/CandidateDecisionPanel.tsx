import { findParticipantName, formatPercent, inferMargin } from "../../lib/decision-copy";
import { getParticipantImpactBreakdown } from "../../lib/criteria";
import { formatSignalName, primaryDecisionReason } from "../../lib/decision-explainability";
import type {
  EvidenceItem,
  CandidateStateSnapshot,
  ParticipantRuntimeState
} from "../../lib/types";

function evidenceForParticipant(
  evidence: readonly EvidenceItem[],
  participantId: string,
  direction: "positive" | "negative"
) {
  return evidence
    .filter((item) =>
      direction === "positive"
        ? item.impact > 0 && item.participantId === participantId
        : item.impact < 0 && item.participantId === participantId
    )
    .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact))
    .slice(0, 3);
}

export function CandidateDecisionPanel({
  snapshot,
  participants
}: {
  snapshot: CandidateStateSnapshot | null;
  participants: ParticipantRuntimeState[];
}) {
  const margin = inferMargin(snapshot);
  const selectedName = findParticipantName(
    snapshot?.selectedCandidateId ?? null,
    participants
  );
  const breakdown = getParticipantImpactBreakdown(snapshot);
  const nearestAlternative = snapshot?.participants.find(
    (participant) => participant.participantId !== snapshot.selectedCandidateId
  );
  const selectedEvidence = snapshot?.selectedCandidateId
    ? evidenceForParticipant(snapshot.evidence, snapshot.selectedCandidateId, "positive")
    : [];
  const rejectedEvidence = nearestAlternative
    ? evidenceForParticipant(snapshot?.evidence ?? [], nearestAlternative.participantId, "negative")
    : [];

  return (
    <section className={`panel decision-panel state-${snapshot?.state ?? "INSUFFICIENT_DATA"}`}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Candidate decision</p>
          <h2>Backend ranking and explanation</h2>
        </div>
        <span className="confidence-chip">{formatPercent(snapshot?.confidence ?? 0)}</span>
      </div>
      <div className="decision-state-row">
        <span>State</span>
        <strong>{snapshot?.state ?? "Waiting for meeting"}</strong>
      </div>
      <div className="decision-hero">
        <span>Selected stream</span>
        <strong>{selectedName}</strong>
        <small>{snapshot?.selectedCandidateId ?? "No candidate selected"}</small>
      </div>
      <div className="decision-stats">
        <div>
          <span>Margin</span>
          <strong>{margin === null ? "n/a" : formatPercent(margin)}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{snapshot?.timestampSec ?? 0}s</strong>
        </div>
      </div>
      <div className="leaderboard">
        <div className="leaderboard-heading">
          <strong>Top streams</strong>
          <span>Backend ranking</span>
        </div>
        {(snapshot?.participants ?? []).slice(0, 4).length === 0 ? (
          <p>No participant scores yet.</p>
        ) : (
          snapshot?.participants.slice(0, 4).map((participant, index) => {
            const selected = snapshot.selectedCandidateId === participant.participantId;
            const competing =
              snapshot.state === "AMBIGUOUS" &&
              snapshot.participants
                .slice(0, 2)
                .some((item) => item.participantId === participant.participantId);
            const runtimeName = findParticipantName(
              participant.participantId,
              participants
            );
            const participantBreakdown = breakdown.find(
              (item) => item.participantId === participant.participantId
            );

            return (
              <div
                className={`leaderboard-row ${selected ? "selected" : ""} ${competing ? "competing" : ""}`}
                key={participant.participantId}
              >
                <span>{index + 1}</span>
                <div className="stream-rank-copy">
                  <strong>
                    {runtimeName} / {participant.participantId}
                  </strong>
                  <small>
                    +{(participantBreakdown?.positiveImpact ?? 0).toFixed(2)} positive · -
                    {(participantBreakdown?.negativeImpact ?? 0).toFixed(2)} exclusionary
                  </small>
                </div>
                <div className="rank-score">
                  <em>{formatPercent(participant.confidence)}</em>
                  {selected ? <b>selected</b> : null}
                  {competing ? <b>competing</b> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="why-box">
        <strong>Why selected</strong>
        <p>{primaryDecisionReason(snapshot, participants)}</p>
      </div>
      <div className="selection-reasons">
        <article>
          <strong>Why selected</strong>
          {selectedEvidence.length === 0 ? (
            <p>No selected stream or positive selected-stream evidence yet.</p>
          ) : selectedEvidence.map((item) => (
            <p key={`${item.signal}_${item.reason}`}>
              {formatSignalName(item.signal)} · +{item.impact.toFixed(2)}
            </p>
          ))}
        </article>
        <article>
          <strong>Why nearest alternative lost</strong>
          {rejectedEvidence.length === 0 ? (
            <p>No negative evidence on the nearest alternative yet; it is lower by score or margin.</p>
          ) : rejectedEvidence.map((item) => (
            <p key={`${item.signal}_${item.reason}`}>
              {formatSignalName(item.signal)} · {item.impact.toFixed(2)}
            </p>
          ))}
        </article>
      </div>
      <details className="decision-formula">
        <summary>How this decision is calculated</summary>
        <p>Confidence = normalized positive evidence vs negative/exclusion evidence</p>
        <p>Margin = top participant confidence - second participant confidence</p>
        <p>State = thresholds + ambiguity + safety gates</p>
      </details>
      <div className="boundary-note">
        Candidate participant stream identified only. Human identity verification and fraud detection are not performed here.
      </div>
    </section>
  );
}
