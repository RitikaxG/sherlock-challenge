import { formatTimestamp } from "../../lib/event-formatters";
import {
  confidenceImpactCopy,
  decisiveEventCopy,
  selectedStreamImpactCopy,
  stateImpactCopy
} from "../../lib/ui-copy";
import type { EventImpact } from "../../lib/types";

export function EventImpactPanel({
  impact,
  selectedCandidateId
}: {
  impact: EventImpact | null;
  selectedCandidateId?: string | null;
}) {
  const decisiveCopy = impact ? decisiveEventCopy(impact) : null;

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
            {decisiveCopy ? <li className="decisive-event">{decisiveCopy}</li> : null}
            <li>{stateImpactCopy(impact)}</li>
            <li>{confidenceImpactCopy(impact)}</li>
            <li>{selectedStreamImpactCopy(impact, selectedCandidateId)}</li>
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
