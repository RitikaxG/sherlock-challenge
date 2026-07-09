import { MeetingEventSchema, type MeetingEvent } from "@sherlock/shared";

import {
  LlmTranscriptClassificationSchema,
  type LlmTranscriptClassification
} from "./schemas.ts";

export function createLlmTranscriptEvidenceEvent(input: {
  meetingId: string;
  participantId: string;
  timestampSec: number;
  transcriptSourceEventId?: string;
  classification: LlmTranscriptClassification;
  sourceEventId?: string;
}): MeetingEvent {
  const classification = LlmTranscriptClassificationSchema.parse(
    input.classification
  );

  return MeetingEventSchema.parse({
    type: "llm_transcript_evidence",
    participantId: input.participantId,
    timestampSec: input.timestampSec,
    source: "gemini_transcript_classifier",
    sourceEventId: input.sourceEventId,
    transcriptSourceEventId: input.transcriptSourceEventId,
    ...classification
  });
}
