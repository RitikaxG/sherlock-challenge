export {
  collectSpeechMetadata,
  createManualFixtureSpeechSource
} from "./collector.ts";
export type {
  SpeechCollectorResult,
  SpeechMetadataSource,
  SpeechObservation
} from "./collector.ts";
export {
  createSpeakingActivityEvent,
  createTranscriptChunkEvent
} from "./event-factory.ts";
export type {
  ObservationEventResult,
  SpeechActivityObservation,
  TranscriptObservation
} from "./event-factory.ts";
export { createHttpMeetingEventSink } from "./http-sink.ts";
export type { FetchLike, MeetingEventSink } from "./http-sink.ts";
export { resolveParticipantId } from "./mapper.ts";
export type {
  ParticipantAudioMapping,
  ParticipantResolution,
  SpeechIdentity,
  SpeechSourceKind
} from "./mapper.ts";
