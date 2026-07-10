import { formatPercent } from "../../lib/decision-copy";
import {
  participantLabel,
  primaryDecisionCriteria
} from "../../lib/decision-explainability";
import type {
  CandidateStateSnapshot,
  ParticipantRuntimeState
} from "../../lib/types";

export function DecisionSummaryHero({
  snapshot,
  participants
}: {
  snapshot: CandidateStateSnapshot | null;
  participants: ParticipantRuntimeState[];
}) {
  const selectedLabel = participantLabel(
    snapshot?.selectedCandidateId ?? null,
    participants
  );
  const confidence = snapshot?.confidence ?? 0;
  const criteria = primaryDecisionCriteria(snapshot, participants);

  return (
    <section className={`decision-summary-hero state-${snapshot?.state ?? "INSUFFICIENT_DATA"}`}>
      <div className="hero-copy">
        <p className="eyebrow">Live decision summary</p>
        <span>Selected candidate stream</span>
        <h2>{selectedLabel}</h2>
        <div className="decision-criteria-list" aria-label="Decision criteria">
          {criteria.map((item, index) => (
            <p key={`${item}_${index}`}>{item}</p>
          ))}
        </div>
        <div className="hero-limitations">
          <span>Face/liveness/ID not verified</span>
          <span>No fraud verdict</span>
        </div>
      </div>
      <div className="hero-metrics">
        <div
          aria-label={`Candidate confidence ${formatPercent(confidence)}`}
          className="confidence-ring"
          style={{
            background: `conic-gradient(var(--green) ${Math.round(confidence * 100)}%, #1f2b3d 0)`
          }}
        >
          <span>{formatPercent(confidence)}</span>
        </div>
        <div>
          <span>State</span>
          <strong>{snapshot?.state ?? "WAITING"}</strong>
        </div>
      </div>
    </section>
  );
}
