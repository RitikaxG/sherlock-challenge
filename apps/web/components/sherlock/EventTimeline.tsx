import { formatTimestamp } from "../../lib/event-formatters";
import type { TimelineItem } from "../../lib/types";

export function EventTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="panel timeline-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live feed</p>
          <h2>Event timeline</h2>
        </div>
      </div>
      <div className="timeline-list">
        {items.length === 0 ? (
          <p className="empty-text">Replay events will appear here.</p>
        ) : items.slice(-18).map((item) => (
          <article className={`timeline-item ${item.kind}`} key={item.id}>
            <time>{formatTimestamp(item.timestampSec)}</time>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
