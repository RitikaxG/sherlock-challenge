import type { MeetingEvent } from "@sherlock/shared";

import {
  createSpeakingActivityEvent,
  createTranscriptChunkEvent,
  type SpeechActivityObservation,
  type TranscriptObservation
} from "./event-factory.ts";
import type { MeetingEventSink } from "./http-sink.ts";
import type { ParticipantAudioMapping } from "./mapper.ts";

export type SpeechObservation =
  | {
      readonly kind: "speech_activity";
      readonly observation: SpeechActivityObservation;
    }
  | {
      readonly kind: "transcript";
      readonly observation: TranscriptObservation;
    };

export type SpeechMetadataSource = AsyncIterable<SpeechObservation>;

export type SpeechCollectorResult = {
  readonly emittedEvents: readonly MeetingEvent[];
  readonly unresolvedObservations: readonly string[];
};

export async function collectSpeechMetadata(options: {
  source: SpeechMetadataSource;
  mappings: readonly ParticipantAudioMapping[];
  sink?: MeetingEventSink;
}): Promise<SpeechCollectorResult> {
  const emittedEvents: MeetingEvent[] = [];
  const unresolvedObservations: string[] = [];

  for await (const item of options.source) {
    const result =
      item.kind === "speech_activity"
        ? createSpeakingActivityEvent(item.observation, options.mappings)
        : createTranscriptChunkEvent(item.observation, options.mappings);

    if (!result.resolved) {
      unresolvedObservations.push(result.reason);
      continue;
    }

    emittedEvents.push(result.event);
    await options.sink?.sendEvent(item.observation.meetingId, result.event);
  }

  return {
    emittedEvents,
    unresolvedObservations
  };
}

export async function* createManualFixtureSpeechSource(
  observations: readonly SpeechObservation[]
): AsyncIterable<SpeechObservation> {
  for (const observation of observations) {
    yield observation;
  }
}
