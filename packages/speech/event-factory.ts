import { MeetingEventSchema, type MeetingEvent } from "@sherlock/shared";

import type { ParticipantAudioMapping, SpeechSourceKind } from "./mapper.ts";
import { resolveParticipantId } from "./mapper.ts";

export type SpeechActivityObservation = {
  meetingId: string;
  streamId?: string;
  speakerLabel?: string;
  externalUserId?: string;
  startedAtSec: number;
  endedAtSec: number;
  speakerConfidence?: number;
  source: SpeechSourceKind;
  sourceEventId?: string;
};

export type TranscriptObservation = {
  meetingId: string;
  streamId?: string;
  speakerLabel?: string;
  externalUserId?: string;
  startSec?: number;
  endSec?: number;
  timestampSec: number;
  text: string;
  isFinal?: boolean;
  speakerConfidence?: number;
  source: SpeechSourceKind;
  sourceEventId?: string;
};

export type ObservationEventResult =
  | {
      readonly resolved: true;
      readonly event: MeetingEvent;
    }
  | {
      readonly resolved: false;
      readonly reason: string;
    };

export function createSpeakingActivityEvent(
  observation: SpeechActivityObservation,
  mappings: readonly ParticipantAudioMapping[]
): ObservationEventResult {
  const durationSec = observation.endedAtSec - observation.startedAtSec;
  if (durationSec < 0) {
    return {
      resolved: false,
      reason: "Speech activity observation ended before it started."
    };
  }

  const resolution = resolveParticipantId(mappings, observation);
  if (!resolution.resolved) {
    return resolution;
  }

  return {
    resolved: true,
    event: MeetingEventSchema.parse({
      type: "speaking_activity",
      participantId: resolution.participantId,
      timestampSec: observation.endedAtSec,
      durationSec,
      source: observation.source,
      sourceEventId: observation.sourceEventId,
      speakerConfidence: observation.speakerConfidence,
      startSec: observation.startedAtSec,
      endSec: observation.endedAtSec
    })
  };
}

export function createTranscriptChunkEvent(
  observation: TranscriptObservation,
  mappings: readonly ParticipantAudioMapping[]
): ObservationEventResult {
  const resolution = resolveParticipantId(mappings, observation);
  if (!resolution.resolved) {
    return resolution;
  }

  return {
    resolved: true,
    event: MeetingEventSchema.parse({
      type: "transcript_chunk",
      participantId: resolution.participantId,
      timestampSec: observation.timestampSec,
      text: observation.text,
      source: observation.source,
      sourceEventId: observation.sourceEventId,
      speakerConfidence: observation.speakerConfidence,
      startSec: observation.startSec,
      endSec: observation.endSec,
      isFinal: observation.isFinal
    })
  };
}
