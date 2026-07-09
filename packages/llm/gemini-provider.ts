import { GoogleGenAI } from "@google/genai";
import { ZodError } from "zod";

import {
  LlmOutputValidationError,
  LlmProviderError,
  LlmConfigurationError,
  type TranscriptClassifierProvider,
  type TranscriptClassifierProviderConfig
} from "./provider.ts";
import {
  LlmTranscriptClassificationSchema,
  llmTranscriptClassificationJsonSchema,
  type TranscriptClassificationInput
} from "./schemas.ts";
import { buildTranscriptClassificationPrompt } from "./transcript-classifier.ts";

type GeminiInteractionClient = {
  interactions?: {
    create(input: unknown): Promise<{ output_text?: string }>;
  };
  models?: {
    generateContent(input: unknown): Promise<{ text?: string; response?: { text?: () => string } }>;
  };
};

export type GeminiTranscriptClassifierProviderOptions =
  TranscriptClassifierProviderConfig & {
    apiKey?: string;
    client?: GeminiInteractionClient;
  };

function parseGeminiJson(outputText: string | undefined) {
  if (!outputText?.trim()) {
    throw new LlmProviderError("Gemini returned empty transcript classification output.");
  }

  try {
    return JSON.parse(outputText);
  } catch (error) {
    throw new LlmOutputValidationError(
      `Gemini transcript classification output was not valid JSON: ${
        error instanceof Error ? error.message : "unknown parse error"
      }`
    );
  }
}

async function callGemini(
  client: GeminiInteractionClient,
  model: string,
  prompt: string
) {
  if (client.interactions?.create) {
    const interaction = await client.interactions.create({
      model,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: llmTranscriptClassificationJsonSchema
      }
    });
    return interaction.output_text;
  }

  if (client.models?.generateContent) {
    const result = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: llmTranscriptClassificationJsonSchema
      }
    });

    return result.text ?? result.response?.text?.();
  }

  throw new LlmProviderError("Gemini client does not expose a supported generation method.");
}

export function createGeminiTranscriptClassifierProvider(
  options: GeminiTranscriptClassifierProviderOptions = {}
): TranscriptClassifierProvider {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model =
    options.model ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const client =
    options.client ??
    (() => {
      if (!apiKey) {
        throw new LlmConfigurationError(
          "GEMINI_API_KEY is required for Gemini transcript classification."
        );
      }

      return new GoogleGenAI({ apiKey }) as GeminiInteractionClient;
    })();

  return {
    async classifyTranscript(input: TranscriptClassificationInput) {
      const prompt = buildTranscriptClassificationPrompt(input);

      try {
        const outputText = await callGemini(client, model, prompt);
        return LlmTranscriptClassificationSchema.parse(
          parseGeminiJson(outputText)
        );
      } catch (error) {
        if (
          error instanceof LlmConfigurationError ||
          error instanceof LlmProviderError ||
          error instanceof LlmOutputValidationError
        ) {
          throw error;
        }

        if (error instanceof ZodError) {
          throw new LlmOutputValidationError(
            `Gemini transcript classification failed schema validation: ${error.message}`
          );
        }

        throw new LlmProviderError(
          `Gemini transcript classification request failed: ${
            error instanceof Error ? error.message : "unknown provider error"
          }`
        );
      }
    }
  };
}
