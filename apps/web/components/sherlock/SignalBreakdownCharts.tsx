import {
  getCriteria,
  getParticipantImpactBreakdown,
  getSignalChartData,
  signalFamilyColors
} from "../../lib/criteria";
import type { CandidateStateSnapshot } from "../../lib/types";

function barWidth(value: number, max: number) {
  if (max <= 0 || value <= 0) {
    return "0%";
  }

  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function donutGradient(
  items: Array<{ name: string; totalImpact: number }>
) {
  const total = items.reduce((sum, item) => sum + item.totalImpact, 0);

  if (total <= 0) {
    return "#1f2b3d";
  }

  let cursor = 0;
  return items.map((item) => {
    const start = cursor;
    const end = cursor + (item.totalImpact / total) * 100;
    cursor = end;
    return `${signalFamilyColors[item.name] ?? "#94a3b8"} ${start}% ${end}%`;
  }).join(", ");
}

function formatImpact(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function familyLabel(name: string) {
  if (name.startsWith("Metadata")) {
    return "Metadata";
  }

  if (name.startsWith("Transcript")) {
    return "Transcript / LLM";
  }

  if (name.startsWith("Behavior")) {
    return "Behavior";
  }

  if (name.startsWith("Meeting")) {
    return "Meeting Events";
  }

  if (name.startsWith("Audio")) {
    return "Audio/Video Future";
  }

  if (name.startsWith("Safety")) {
    return "Safety Overrides";
  }

  return name;
}

export function SignalBreakdownCharts({
  snapshot
}: {
  snapshot: CandidateStateSnapshot | null;
}) {
  const criteria = getCriteria(snapshot);
  const chartData = getSignalChartData(snapshot);
  const participantBreakdown = getParticipantImpactBreakdown(snapshot).slice(0, 4);
  const evidence = snapshot?.evidence ?? [];
  const gates = snapshot?.decisionTrace?.safetyGates ?? [];
  const donutItems = chartData.map((item) => ({
    name: familyLabel(item.name),
    totalImpact: item.positiveImpact + item.negativeImpact,
    evaluatedCount: item.evaluatedCount
  }));
  const maxParticipantImpact = Math.max(
    0.1,
    ...participantBreakdown.map((item) => item.positiveImpact + item.negativeImpact)
  );

  return (
    <section className="panel criteria-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Signal breakdown</p>
          <h2>What was evaluated before scoring</h2>
        </div>
      </div>

      <div className="chart-layout">
        <div className="chart-block signal-family-card">
          <div className="chart-title-row">
            <strong>Signal-family contribution</strong>
            <span>absolute weighted impact</span>
          </div>
          <div className="donut-row">
            <div
              aria-label="Signal family contribution donut"
              className="donut"
              style={{ background: `conic-gradient(${donutGradient(donutItems)})` }}
            >
              <span />
            </div>
            <div className="donut-legend">
              {donutItems.map((item) => (
                <p key={item.name}>
                  <i style={{ background: signalFamilyColors[item.name] ?? "#94a3b8" }} />
                  <strong>{item.name}</strong>
                  <span>
                    {item.totalImpact.toFixed(2)} · {item.evaluatedCount} signals
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-block">
          <div className="chart-title-row">
            <strong>Positive vs negative impact</strong>
            <span>per participant stream</span>
          </div>
          <div className="participant-chart">
            {participantBreakdown.length === 0 ? (
              <p className="empty-text">No participant scores yet.</p>
            ) : (
              participantBreakdown.map((participant) => (
                <div className="participant-stack-row" key={participant.participantId}>
                  <div>
                    <strong>{participant.displayName}</strong>
                    <span>{Math.round(participant.confidence * 100)}%</span>
                  </div>
                  <div className="stacked-impact-bar">
                    <span
                      className="positive-segment"
                      style={{
                        width: barWidth(participant.positiveImpact, maxParticipantImpact)
                      }}
                    />
                    <span
                      className="negative-segment"
                      style={{
                        width: barWidth(participant.negativeImpact, maxParticipantImpact)
                      }}
                    />
                  </div>
                  <small>
                    +{participant.positiveImpact.toFixed(2)} · -
                    {participant.negativeImpact.toFixed(2)} · raw{" "}
                    {participant.rawScore.toFixed(2)}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chart-block full-width-chart">
          <div className="chart-title-row">
            <strong>Safety gates</strong>
            <span>selection and confirmation guardrails</span>
          </div>
          <div className="safety-gate-grid">
            {gates.length === 0 ? (
              <p className="empty-text">Safety gate statuses will appear after ranking.</p>
            ) : (
              gates.map((gate) => (
                <article className={`safety-gate ${gate.status}`} key={gate.gate}>
                  <strong>{gate.gate.replaceAll("_", " ")}</strong>
                  <span>{gate.status.replaceAll("_", " ")}</span>
                  <p>{gate.summary}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="chart-block full-width-chart">
          <div className="chart-title-row">
            <strong>Evidence impact plot</strong>
            <span>negative left · positive right</span>
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
                  <span title={item.signal}>{item.signal.replaceAll("_", " ")}</span>
                  <div className="impact-axis">
                    <i />
                    <b
                      className={item.impact >= 0 ? "positive-dot" : "negative-dot"}
                      style={{
                        left: `${Math.min(96, Math.max(4, 50 + item.impact * 48))}%`
                      }}
                    />
                  </div>
                  <strong>{formatImpact(item.impact)}</strong>
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
