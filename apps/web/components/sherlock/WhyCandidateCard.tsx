import {
  formatSignalName,
  whyCandidateSummary
} from "../../lib/decision-explainability";
import type {
  CandidateStateSnapshot,
  ParticipantRuntimeState
} from "../../lib/types";

function impactLabel(value: number) {
  if (value === 0) {
    return "";
  }

  return ` ${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function WhyCandidateCard({
  snapshot,
  participants
}: {
  snapshot: CandidateStateSnapshot | null;
  participants: ParticipantRuntimeState[];
}) {
  const summary = whyCandidateSummary(snapshot, participants);

  return (
    <section className="panel why-candidate-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Why this candidate?</p>
          <h2>Why Sherlock selected {summary.selectedLabel}</h2>
        </div>
      </div>
      <div className="why-candidate-grid">
        <article>
          <strong>Selected because</strong>
          {summary.selectedReasons.map((reason) => (
            <p key={`${reason.label}_${reason.impact}`}>
              {formatSignalName(reason.label)}
              <span>{impactLabel(reason.impact)}</span>
            </p>
          ))}
        </article>
        <article>
          <strong>Rejected nearest alternative</strong>
          <small>{summary.rejectedLabel}</small>
          {summary.rejectedReasons.map((reason) => (
            <p key={`${reason.label}_${reason.impact}`}>
              {formatSignalName(reason.label)}
              <span>{impactLabel(reason.impact)}</span>
            </p>
          ))}
        </article>
        <article>
          <strong>Still not verified</strong>
          {summary.limitations.map((limitation) => (
            <p key={limitation}>{limitation}</p>
          ))}
        </article>
      </div>
    </section>
  );
}
