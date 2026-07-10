import { formatTimestamp } from "../../lib/event-formatters";
import type { TimelineItem } from "../../lib/types";

type CollapsedTimelineItem = TimelineItem & {
  count: number;
};

function collapseTimelineItems(items: readonly TimelineItem[]) {
  const grouped = new Map<string, CollapsedTimelineItem>();

  for (const item of items) {
    const key = [
      item.timestampSec ?? "",
      item.kind,
      item.label,
      item.detail,
      item.participantId ?? ""
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

export function EventTimeline({ items }: { items: TimelineItem[] }) {
  const visibleItems = collapseTimelineItems(items).slice(-18);

  return (
    <section className="panel timeline-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Live feed</p>
          <h2>Event timeline</h2>
        </div>
      </div>
      <div className="timeline-list">
        {visibleItems.length === 0 ? (
          <p className="empty-text">Replay events will appear here.</p>
        ) : visibleItems.map((item, index) => (
          <article className={`timeline-item ${item.kind}`} key={`${item.id}_${index}`}>
            <time>{formatTimestamp(item.timestampSec)}</time>
            <div>
              <strong>
                {item.label}
                {item.count > 1 ? <em className="count-badge">x{item.count}</em> : null}
              </strong>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
