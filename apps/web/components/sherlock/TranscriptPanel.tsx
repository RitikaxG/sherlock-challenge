import { formatTimestamp } from "../../lib/event-formatters";
import type { TranscriptItem } from "../../lib/types";

type CollapsedTranscriptItem = TranscriptItem & {
  count: number;
};

function collapseTranscriptItems(items: readonly TranscriptItem[]) {
  const grouped = new Map<string, CollapsedTranscriptItem>();

  for (const item of items) {
    const key = item.llmEvidence
      ? [
          item.timestampSec,
          item.participantId,
          item.source,
          item.role ?? "",
          item.llmEvidence,
          (item.evidenceKinds ?? []).join(",")
        ].join("|")
      : [
          item.timestampSec,
          item.participantId,
          item.text,
          item.source
        ].join("|");
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, { ...item, count: 1 });
    }
  }

  return [...grouped.values()];
}

export function TranscriptPanel({ items }: { items: TranscriptItem[] }) {
  const visibleItems = collapseTranscriptItems(items).slice(-10);

  return (
    <section className="panel transcript-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Speaker transcript</p>
          <h2>Transcript and LLM evidence</h2>
        </div>
      </div>
      <div className="transcript-list">
        {visibleItems.length === 0 ? (
          <p className="empty-text">Transcript chunks and structured LLM evidence will appear here.</p>
        ) : visibleItems.map((item, index) => (
          <article
            className={`transcript-item ${item.llmEvidence ? "llm-evidence-item" : "raw-transcript-item"}`}
            key={`${item.id}_${index}`}
          >
            <div>
              <strong>
                {item.llmEvidence ? "Structured LLM evidence" : "Raw transcript chunk"}
                {item.count > 1 ? <em className="count-badge">x{item.count}</em> : null}
              </strong>
              <span>{formatTimestamp(item.timestampSec)} · {item.displayName}</span>
            </div>
            <small>
              {item.llmEvidence
                ? "Gemini extracted transcript role evidence"
                : `Source: ${item.source}`}
            </small>
            <p>{item.text}</p>
            {item.llmEvidence ? (
              <div className="llm-evidence-meta">
                <span>Role: {item.role ?? "unknown"}</span>
                <span>
                  Confidence:{" "}
                  {item.confidence === undefined
                    ? "n/a"
                    : `${Math.round(item.confidence * 100)}%`}
                </span>
                <span>Strength: {item.strength ?? "n/a"}</span>
                <span>Kinds: {(item.evidenceKinds ?? [item.llmEvidence]).join(", ")}</span>
                <em>LLM extracted role evidence. Core fusion made the final candidate decision.</em>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
