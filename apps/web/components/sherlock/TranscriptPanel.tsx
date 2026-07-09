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
          <article className="transcript-item" key={item.id}>
            <div>
              <strong>{item.displayName}</strong>
              <span>{formatTimestamp(item.timestampSec)} · {item.source}</span>
            </div>
            <p>{item.text}</p>
            {item.llmEvidence ? (
              <small>LLM: {item.llmEvidence}{item.strength ? ` · ${item.strength}` : ""}</small>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
