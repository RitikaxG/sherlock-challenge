import { describe, expect, test } from "vitest";

import {
  collectSpeechMetadata,
  createHttpMeetingEventSink,
  createManualFixtureSpeechSource,
  createSpeakingActivityEvent,
  createTranscriptChunkEvent,
  resolveParticipantId,
  type ParticipantAudioMapping
} from "./index.ts";

const mappings: ParticipantAudioMapping[] = [
  {
    meetingId: "meeting_1",
    participantId: "p_candidate",
    streamId: "stream_1",
    speakerLabel: "speaker_a",
    externalUserId: "external_1"
  }
];

describe("@sherlock/speech metadata collector", () => {
  test("resolves participant ids by stream, speaker label, or external user id", () => {
    expect(
      resolveParticipantId(mappings, {
        meetingId: "meeting_1",
        streamId: "stream_1"
      })
    ).toEqual(expect.objectContaining({ resolved: true, participantId: "p_candidate" }));

    expect(
      resolveParticipantId(mappings, {
        meetingId: "meeting_1",
        speakerLabel: "speaker_a"
      })
    ).toEqual(expect.objectContaining({ resolved: true, participantId: "p_candidate" }));

    expect(
      resolveParticipantId(mappings, {
        meetingId: "meeting_1",
        externalUserId: "external_1"
      })
    ).toEqual(expect.objectContaining({ resolved: true, participantId: "p_candidate" }));
  });

  test("creates speaking activity and transcript shared events", () => {
    const speech = createSpeakingActivityEvent(
      {
        meetingId: "meeting_1",
        streamId: "stream_1",
        startedAtSec: 10,
        endedAtSec: 25,
        speakerConfidence: 0.93,
        source: "manual_fixture",
        sourceEventId: "speech_1"
      },
      mappings
    );
    const transcript = createTranscriptChunkEvent(
      {
        meetingId: "meeting_1",
        speakerLabel: "speaker_a",
        timestampSec: 26,
        startSec: 25,
        endSec: 26,
        text: "My name is Ritika Gupta.",
        isFinal: true,
        source: "manual_fixture",
        sourceEventId: "transcript_1"
      },
      mappings
    );

    expect(speech).toEqual(
      expect.objectContaining({
        resolved: true,
        event: expect.objectContaining({
          type: "speaking_activity",
          participantId: "p_candidate",
          durationSec: 15,
          sourceEventId: "speech_1"
        })
      })
    );
    expect(transcript).toEqual(
      expect.objectContaining({
        resolved: true,
        event: expect.objectContaining({
          type: "transcript_chunk",
          participantId: "p_candidate",
          text: "My name is Ritika Gupta.",
          isFinal: true
        })
      })
    );
  });

  test("unresolved speaker mapping does not emit misleading events", () => {
    const result = createTranscriptChunkEvent(
      {
        meetingId: "meeting_1",
        streamId: "missing",
        timestampSec: 1,
        text: "Hello",
        source: "manual_fixture"
      },
      mappings
    );

    expect(result).toEqual(
      expect.objectContaining({
        resolved: false
      })
    );
  });

  test("collector emits mapped events and sends them to a sink", async () => {
    const sent: unknown[] = [];
    const sink = {
      async sendEvent(_meetingId: string, event: unknown) {
        sent.push(event);
      }
    };
    const result = await collectSpeechMetadata({
      mappings,
      sink,
      source: createManualFixtureSpeechSource([
        {
          kind: "speech_activity",
          observation: {
            meetingId: "meeting_1",
            streamId: "stream_1",
            startedAtSec: 2,
            endedAtSec: 7,
            source: "manual_fixture"
          }
        },
        {
          kind: "transcript",
          observation: {
            meetingId: "meeting_1",
            streamId: "missing",
            timestampSec: 8,
            text: "Unmapped",
            source: "manual_fixture"
          }
        }
      ])
    });

    expect(result.emittedEvents).toHaveLength(1);
    expect(result.unresolvedObservations).toHaveLength(1);
    expect(sent).toHaveLength(1);
  });

  test("http sink posts to the future ingestion endpoint using injected fetch", async () => {
    const calls: unknown[] = [];
    const sink = createHttpMeetingEventSink({
      endpointBaseUrl: "https://example.test/",
      fetch: async (input, init) => {
        calls.push({ input, init });
        return { ok: true, status: 202, text: async () => "" };
      }
    });

    await sink.sendEvent("meeting_1", {
      type: "participant_joined",
      participantId: "p_candidate",
      timestampSec: 0
    });

    expect(calls).toEqual([
      expect.objectContaining({
        input: "https://example.test/meetings/meeting_1/events"
      })
    ]);
  });
});
