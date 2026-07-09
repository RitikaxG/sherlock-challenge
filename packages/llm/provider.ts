import type {
  LlmTranscriptClassification,
  TranscriptClassificationInput
} from "./schemas.ts";

export type TranscriptClassifierProvider = {
  classifyTranscript(
    input: TranscriptClassificationInput
  ): Promise<LlmTranscriptClassification>;
};

export type TranscriptClassifierProviderConfig = {
  model?: string;
};

export class LlmConfigurationError extends Error {}
export class LlmProviderError extends Error {}
export class LlmOutputValidationError extends Error {}
