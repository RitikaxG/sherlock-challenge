import type { CandidateStateUpdatedMessage } from "./types";
import { getSherlockApiUrl } from "./sherlock-api";

export function buildWebSocketUrl(meetingId: string, baseUrl = getSherlockApiUrl()) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/meetings/${encodeURIComponent(meetingId)}/ws`;
  url.search = "";
  return url.toString();
}

export function connectMeetingWebSocket(
  meetingId: string,
  onMessage: (message: CandidateStateUpdatedMessage) => void,
  onStatus?: (status: "open" | "closed" | "error") => void
) {
  const socket = new WebSocket(buildWebSocketUrl(meetingId));

  socket.addEventListener("open", () => onStatus?.("open"));
  socket.addEventListener("close", () => onStatus?.("closed"));
  socket.addEventListener("error", () => onStatus?.("error"));
  socket.addEventListener("message", (event) => {
    const parsed = JSON.parse(event.data) as CandidateStateUpdatedMessage;
    if (parsed.type === "candidate_state_updated") {
      onMessage(parsed);
    }
  });

  return () => socket.close();
}
