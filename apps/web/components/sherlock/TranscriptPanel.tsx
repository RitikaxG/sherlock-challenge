import { formatTimestamp } from "../../lib/event-formatters";
import type { TranscriptItem } from "../../lib/types";

export function TranscriptPanel({ items }: { items: TranscriptItem[] }) {
  return (
    <section className="panel transcript-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Speaker transcript</p>
          <h2>Transcript and LLM evidence</h2>
        </div>
      </div>
      <div className="transcript-list">
        {items.length === 0 ? (
          <p className="empty-text">Transcript chunks and structured LLM evidence will appear here.</p>
        ) : items.slice(-10).map((item) => (
          <article
            className={`transcript-item ${item.llmEvidence ? "llm-evidence-item" : "raw-transcript-item"}`}
            key={item.id}
          >
            <div>
              <strong>
                {item.llmEvidence ? "Structured LLM evidence" : "Raw transcript chunk"}
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
