import { getCriteria, getSignalChartData } from "../../lib/criteria";
import type { CandidateStateSnapshot } from "../../lib/types";

function barWidth(value: number, max: number) {
  if (max <= 0) {
    return "0%";
  }

  return `${Math.max(3, Math.round((value / max) * 100))}%`;
}

export function EvaluationCriteriaPanel({
  snapshot
}: {
  snapshot: CandidateStateSnapshot | null;
}) {
  const criteria = getCriteria(snapshot);
  const chartData = getSignalChartData(snapshot);
  const evidence = snapshot?.evidence ?? [];
  const maxImpact = Math.max(
    0.1,
    ...chartData.map((item) => item.positiveImpact + item.negativeImpact)
  );
  const maxParticipantConfidence = Math.max(
    0.1,
    ...(snapshot?.participants.map((participant) => participant.confidence) ?? [0])
  );

  return (
    <section className="panel criteria-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Signal evaluation charts</p>
          <h2>What was evaluated before scoring</h2>
        </div>
      </div>

      <div className="chart-layout">
        <div className="chart-block">
          <div className="chart-title-row">
            <strong>Signal families evaluated</strong>
            <span>positive vs exclusionary impact</span>
          </div>
          <div className="signal-bars">
            {chartData.map((item) => (
              <div className="signal-bar-row" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.importance} · {item.evaluatedCount} signals evaluated
                  </small>
                </div>
                <div className="dual-bar" aria-label={`${item.name} signal impact`}>
                  <span
                    className="positive-segment"
                    style={{ width: barWidth(item.positiveImpact, maxImpact) }}
                  />
                  <span
                    className="negative-segment"
                    style={{ width: barWidth(item.negativeImpact, maxImpact) }}
                  />
                </div>
                <em>
                  {item.netImpact >= 0 ? "+" : ""}
                  {item.netImpact.toFixed(2)}
                </em>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-block">
          <div className="chart-title-row">
            <strong>Participant candidate ranking</strong>
            <span>backend confidence scores</span>
          </div>
          <div className="participant-chart">
            {(snapshot?.participants ?? []).length === 0 ? (
              <p className="empty-text">No participant scores yet.</p>
            ) : (
              snapshot?.participants.map((participant) => (
                <div className="participant-score-bar" key={participant.participantId}>
                  <span>{participant.displayName}</span>
                  <div className="single-bar">
                    <span
                      style={{
                        width: barWidth(
                          participant.confidence,
                          maxParticipantConfidence
                        )
                      }}
                    />
                  </div>
                  <strong>{Math.round(participant.confidence * 100)}%</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chart-block full-width-chart">
          <div className="chart-title-row">
            <strong>Evidence impact plot</strong>
            <span>sorted by weighted impact</span>
          </div>
          <div className="impact-plot">
            {evidence.length === 0 ? (
              <p className="empty-text">Evidence points will appear after replay events.</p>
            ) : (
              evidence.slice(0, 12).map((item) => (
                <div
                  className="impact-point-row"
                  key={`${item.signal}_${item.participantId}_${item.reason}`}
                >
                  <span>{item.signal}</span>
                  <div className="impact-axis">
                    <i />
                    <b
                      className={item.impact >= 0 ? "positive-dot" : "negative-dot"}
                      style={{
                        left: `${Math.min(96, Math.max(4, 50 + item.impact * 48))}%`
                      }}
                    />
                  </div>
                  <strong>
                    {item.impact > 0 ? "+" : ""}
                    {item.impact.toFixed(2)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <details className="criteria-details">
        <summary>Show criteria definitions</summary>
        <div className="criteria-definition-list">
          {criteria.map((item) => (
            <article key={item.name}>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
              <small>Examples: {item.examples.join(", ")}</small>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
