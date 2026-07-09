import type { CandidateStateSnapshot } from "../../lib/types";

export function EvidencePanel({ snapshot }: { snapshot: CandidateStateSnapshot | null }) {
  const evidence = [...(snapshot?.evidence ?? [])].sort(
    (left, right) => Math.abs(right.impact) - Math.abs(left.impact)
  );

  return (
    <section className="panel evidence-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Explanation</p>
          <h2>Evidence and uncertainty</h2>
        </div>
      </div>
      <div className="evidence-table">
        <div className="table-head">
          <span>Signal</span>
          <span>Participant</span>
          <span>Impact</span>
          <span>Reason</span>
        </div>
        {evidence.length === 0 ? (
          <p className="empty-text">No evidence yet. Start or step through a scenario.</p>
        ) : evidence.map((item) => (
          <div className="table-row" key={`${item.signal}_${item.participantId}_${item.reason}`}>
            <span>{item.signal}</span>
            <span>{item.participantId}</span>
            <span className={item.impact > 0 ? "impact-positive" : item.impact < 0 ? "impact-negative" : ""}>
              {item.impact > 0 ? "+" : ""}{item.impact.toFixed(2)}
            </span>
            <span>{item.reason}</span>
          </div>
        ))}
      </div>
      <div className="uncertainty-list">
        <h3>Uncertainty and limits</h3>
        {(snapshot?.uncertainty.length ?? 0) === 0 ? (
          <p className="empty-text">No uncertainty messages yet.</p>
        ) : snapshot?.uncertainty.map((item) => (
          <p
            className={item.toLowerCase().includes("identity verification") || item.toLowerCase().includes("fraud") ? "limit-message" : ""}
            key={item}
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
