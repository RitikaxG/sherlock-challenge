import { createGeminiTranscriptClassifierProvider } from "@sherlock/llm";
import { createHttpApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

function createOptionalTranscriptClassifier() {
  if (process.env.ENABLE_LLM_TRANSCRIPT_CLASSIFIER !== "true") {
    return undefined;
  }

  return createGeminiTranscriptClassifierProvider({
    model: process.env.GEMINI_MODEL
  });
}

const app = await createHttpApp({
  logger: true,
  transcriptClassifier: createOptionalTranscriptClassifier()
});

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
