import { getCriteria } from "../../lib/criteria";
import type { CandidateStateSnapshot } from "../../lib/types";

export function EvaluationCriteriaPanel({
  snapshot
}: {
  snapshot: CandidateStateSnapshot | null;
}) {
  const criteria = getCriteria(snapshot);

  return (
    <section className="panel criteria-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Decision criteria</p>
          <h2>Transparent signal weighting</h2>
        </div>
      </div>
      <div className="criteria-grid">
        {criteria.map((item) => (
          <article className={`criteria-card ${item.tone}`} key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.importance}</span>
            </div>
            <p>{item.description}</p>
            <small>Examples: {item.examples.join(", ")}</small>
            <div className="current-signals">
              {item.currentSignals.length === 0 ? (
                <em>No current signals</em>
              ) : item.currentSignals.map((signal) => (
                <span key={`${item.name}_${signal.signal}_${signal.participantId}`}>
                  {signal.signal} {signal.impact > 0 ? "+" : ""}{signal.impact.toFixed(2)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
