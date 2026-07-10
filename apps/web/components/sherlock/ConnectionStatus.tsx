import type { ConnectionStatus } from "../../lib/types";
import { connectionStatusLabel } from "../../lib/replay-helpers";

export function ConnectionStatusBadge({
  status,
  warning
}: {
  status: ConnectionStatus;
  warning?: string | null;
}) {
  const label = connectionStatusLabel(status, warning);
  const tone =
    warning || status === "local_fallback"
      ? "local_fallback"
      : status === "websocket_disconnected" || status === "backend_connected"
        ? "backend_connected"
        : status;

  return (
    <div className={`status-pill status-${tone}`}>
      <span className="live-dot" />
      {label}
    </div>
  );
}
