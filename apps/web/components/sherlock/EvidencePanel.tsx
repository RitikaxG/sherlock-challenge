import type { CandidateStateSnapshot, EvidenceItem } from "../../lib/types";

type GroupedEvidenceItem = {
  signal: string;
  participantId: string;
  impact: number;
  direction: string;
  sources: string[];
  reasons: string[];
  rawStrength: number | null;
  weightedImpact: number;
  sourceWeights: number[];
  expiresAtSec?: number;
  count: number;
};

function groupEvidenceItems(evidence: readonly EvidenceItem[]): GroupedEvidenceItem[] {
  const groups = new Map<string, GroupedEvidenceItem>();

  for (const item of evidence) {
    const direction =
      item.direction ?? (item.impact > 0 ? "positive" : item.impact < 0 ? "negative" : "neutral");
    const key = `${item.signal}|${item.participantId}|${direction}`;
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        signal: item.signal,
        participantId: item.participantId,
        impact: item.impact,
        direction,
        sources: [item.source ?? "unknown"],
        reasons: [item.reason],
        rawStrength: item.rawStrength ?? null,
        weightedImpact: item.weightedImpact ?? item.impact,
        sourceWeights: item.sourceWeight === undefined ? [] : [item.sourceWeight],
        ...(item.expiresAtSec === undefined ? {} : { expiresAtSec: item.expiresAtSec }),
        count: 1
      });
      continue;
    }

    current.impact += item.impact;
    current.weightedImpact += item.weightedImpact ?? item.impact;
    current.count += 1;
    current.rawStrength = Math.max(current.rawStrength ?? 0, item.rawStrength ?? 0);

    if (!current.sources.includes(item.source ?? "unknown")) {
      current.sources.push(item.source ?? "unknown");
    }

    if (!current.reasons.includes(item.reason)) {
      current.reasons.push(item.reason);
    }

    if (
      item.sourceWeight !== undefined &&
      !current.sourceWeights.includes(item.sourceWeight)
    ) {
      current.sourceWeights.push(item.sourceWeight);
    }

    if (item.expiresAtSec !== undefined) {
      current.expiresAtSec =
        current.expiresAtSec === undefined
          ? item.expiresAtSec
          : Math.max(current.expiresAtSec, item.expiresAtSec);
    }
  }

  return [...groups.values()].sort(
    (left, right) => Math.abs(right.impact) - Math.abs(left.impact)
  );
}

export function EvidencePanel({ snapshot }: { snapshot: CandidateStateSnapshot | null }) {
  const evidence = groupEvidenceItems(snapshot?.evidence ?? []);

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
          <span>Source</span>
          <span>Reason</span>
        </div>
        {evidence.length === 0 ? (
          <p className="empty-text">No evidence yet. Start or step through a scenario.</p>
        ) : evidence.map((item) => (
          <div className="table-row" key={`${item.signal}_${item.participantId}_${item.direction}`}>
            <span>
              {item.signal}
              {item.count > 1 ? <small className="signal-count">x{item.count}</small> : null}
            </span>
            <span>{item.participantId}</span>
            <span className={item.impact > 0 ? "impact-positive" : item.impact < 0 ? "impact-negative" : ""}>
              {item.impact > 0 ? "+" : ""}{item.impact.toFixed(2)}
            </span>
            <span>
              {item.sources.join(" + ")} · {item.direction}
              {item.sourceWeights.length === 0
                ? ""
                : ` · w ${item.sourceWeights.map((weight) => weight.toFixed(2)).join("/")}`}
            </span>
            <span>
              {item.reasons[0]}
              {item.reasons.length > 1 ? ` + ${item.reasons.length - 1} more reason(s)` : ""}
            </span>
            <small className="evidence-meta">
              raw {item.rawStrength?.toFixed(2) ?? "n/a"} · combined weighted{" "}
              {item.weightedImpact.toFixed(2)}
              {item.expiresAtSec === undefined ? " · persistent/unknown ttl" : ` · expires ${item.expiresAtSec}s`}
            </small>
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
