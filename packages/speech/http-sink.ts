import type { MeetingEvent } from "@sherlock/shared";

export type MeetingEventSink = {
  sendEvent(meetingId: string, event: MeetingEvent): Promise<void>;
};

export type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export function createHttpMeetingEventSink(options: {
  endpointBaseUrl: string;
  fetch: FetchLike;
}): MeetingEventSink {
  const baseUrl = options.endpointBaseUrl.replace(/\/$/, "");

  return {
    async sendEvent(meetingId, event) {
      const response = await options.fetch(
        `${baseUrl}/meetings/${encodeURIComponent(meetingId)}/events`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to send meeting event: ${response.status} ${await response.text()}`
        );
      }
    }
  };
}
