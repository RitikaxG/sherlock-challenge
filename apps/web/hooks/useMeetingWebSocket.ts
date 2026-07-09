"use client";

import { useEffect } from "react";

import { connectMeetingWebSocket } from "../lib/sherlock-ws";
import type { CandidateStateUpdatedMessage } from "../lib/types";

export function useMeetingWebSocket(
  meetingId: string | null,
  enabled: boolean,
  onMessage: (message: CandidateStateUpdatedMessage) => void,
  onStatus: (status: "open" | "closed" | "error") => void
) {
  useEffect(() => {
    if (!meetingId || !enabled) {
      return;
    }

    return connectMeetingWebSocket(meetingId, onMessage, onStatus);
  }, [enabled, meetingId, onMessage, onStatus]);
}
