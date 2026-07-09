import type { ConnectionStatus } from "../../lib/types";

export function ConnectionStatusBadge({
  status,
  warning
}: {
  status: ConnectionStatus;
  warning?: string | null;
}) {
  const label = warning ? "fallback demo" : status;

  return (
    <div className={`status-pill status-${warning ? "offline" : status}`}>
      <span className="live-dot" />
      {label}
    </div>
  );
}
