import type {
  CreateMeetingRequest,
  CreateMeetingResponse,
  MeetingEvent,
  PostEventResponse,
  SnapshotResponse
} from "./types";

export function getSherlockApiUrl() {
  return (
    process.env.NEXT_PUBLIC_SHERLOCK_API_URL ?? "http://localhost:3001"
  ).replace(/\/$/, "");
}

export function buildApiUrl(path: string, baseUrl = getSherlockApiUrl()) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, "")}${cleanPath}`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Sherlock API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function createMeeting(request: CreateMeetingRequest) {
  return requestJson<CreateMeetingResponse>(buildApiUrl("/meetings"), {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function getSnapshot(meetingId: string) {
  return requestJson<SnapshotResponse>(
    buildApiUrl(`/meetings/${encodeURIComponent(meetingId)}/snapshot`)
  );
}

export function postMeetingEvent(meetingId: string, event: MeetingEvent) {
  return requestJson<PostEventResponse>(
    buildApiUrl(`/meetings/${encodeURIComponent(meetingId)}/events`),
    {
      method: "POST",
      body: JSON.stringify(event)
    }
  );
}
