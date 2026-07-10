import { formatPercent } from "../../lib/decision-copy";
import { formatTimestamp } from "../../lib/event-formatters";
import type { EventImpact } from "../../lib/types";

function confidenceChange(impact: EventImpact) {
  if (impact.previousConfidence === undefined) {
    return `Confidence is ${formatPercent(impact.nextConfidence)}`;
  }

  const delta = impact.nextConfidence - impact.previousConfidence;
  const direction = delta > 0 ? "increased" : delta < 0 ? "decreased" : "stayed";

  if (direction === "stayed") {
    return `Confidence stayed ${formatPercent(impact.nextConfidence)}`;
  }

  return `Confidence ${direction} from ${formatPercent(impact.previousConfidence)} to ${formatPercent(impact.nextConfidence)}`;
}

export function EventImpactPanel({ impact }: { impact: EventImpact | null }) {
  return (
    <section className="panel event-impact-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Event impact</p>
          <h2>What changed after this event?</h2>
        </div>
      </div>
      {impact === null ? (
        <p className="empty-text">Step or start a scenario to compare snapshots.</p>
      ) : (
        <div className="event-impact-body">
          <div className="event-impact-head">
            <strong>{impact.eventLabel}</strong>
            <span>{formatTimestamp(impact.timestampSec)}</span>
          </div>
          <ul>
            <li>
              State {impact.previousState === impact.nextState ? "stayed" : "changed"}{" "}
              <strong>{impact.previousState ?? "none"}</strong> to{" "}
              <strong>{impact.nextState}</strong>
            </li>
            <li>{confidenceChange(impact)}</li>
            <li>
              Selected stream{" "}
              {impact.selectedCandidateChanged ? "changed after this event" : "did not change"}
            </li>
          </ul>
          <div className="new-evidence-list">
            <strong>New evidence</strong>
            {impact.newEvidence.length === 0 ? (
              <p>No new evidence rows were added by this snapshot.</p>
            ) : (
              impact.newEvidence.slice(0, 4).map((item) => (
                <p key={`${item.signal}_${item.participantId}_${item.reason}`}>
                  <span className={item.impact >= 0 ? "impact-positive" : "impact-negative"}>
                    {item.impact >= 0 ? "+" : ""}
                    {item.impact.toFixed(2)}
                  </span>{" "}
                  {item.signal} · {item.participantId}
                </p>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
