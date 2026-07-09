# Live Ingestion Flow

Phase 6 wires the live backend transport without moving identity decisions out of `packages/core`.

```text
Meeting Platform / Bot / ASR
        ↓
packages/speech maps speech/transcript observations
        ↓
MeetingEvent
        ↓
POST /meetings/:meetingId/events
        ↓
apps/http in-memory session store
        ↓
packages/core applyMeetingEvent + rankParticipants
        ↓
optional packages/db persistence
        ↓
packages/realtime candidate_state_updated broadcast
```

`packages/speech` handles structured metadata only. It does not record raw audio, run voice biometrics, call meeting-platform APIs, or decide who the candidate is.

`apps/http` validates incoming shared events, updates the live session, optionally persists the event and snapshot, and broadcasts candidate state updates to subscribed WebSocket clients at `GET /meetings/:meetingId/ws`.

`packages/core` remains the only identity engine. It owns signal extraction, contradiction handling, evidence decay, fusion, confidence, state, and explanation output.
