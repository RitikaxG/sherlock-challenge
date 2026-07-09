import { describe, expect, test } from "vitest";
import { MeetingEventSchema } from "@sherlock/shared";

import {
  LlmTranscriptClassificationSchema,
  TranscriptClassificationInputSchema
} from "./schemas.ts";
import { buildTranscriptClassificationPrompt } from "./transcript-classifier.ts";
import { createMockTranscriptClassifierProvider } from "./mock-provider.ts";
import { createLlmTranscriptEvidenceEvent } from "./event-factory.ts";
import { createGeminiTranscriptClassifierProvider } from "./gemini-provider.ts";
import {
  LlmConfigurationError,
  LlmOutputValidationError
} from "./provider.ts";

const input = TranscriptClassificationInputSchema.parse({
  meetingId: "meeting_1",
  participantId: "p_candidate",
  candidateName: "Ritika Gupta",
  candidateEmail: "ritika@example.com",
  interviewerNames: ["Priya Sharma"],
  interviewerEmails: ["priya@sherlock.ai"],
  companyDomains: ["sherlock.ai"],
  transcriptText: "My name is Ritika Gupta, I am here for the interview.",
  timestampSec: 42,
  sourceEventId: "transcript_1",
  speakerConfidence: 0.9
});

describe("@sherlock/llm schemas", () => {
  test("valid candidate-like classification parses", () => {
    expect(
      LlmTranscriptClassificationSchema.parse({
        role: "candidate_like",
        confidence: 0.9,
        selfIdentifiedName: "Ritika Gupta",
        mentionedCandidateName: true,
        evidence: [
          {
            kind: "candidate_self_identification",
            role: "candidate_like",
            confidence: 0.9,
            strength: "strong",
            reason: "Speaker self-identified."
          }
        ],
        uncertainty: [],
        shouldAffectCandidateIdentity: true
      }).role
    ).toBe("candidate_like");
  });

  test("invalid confidence and evidence kind fail", () => {
    expect(() =>
      LlmTranscriptClassificationSchema.parse({
        role: "candidate_like",
        confidence: 2,
        selfIdentifiedName: null,
        mentionedCandidateName: false,
        evidence: [],
        uncertainty: [],
        shouldAffectCandidateIdentity: true
      })
    ).toThrow();

    expect(() =>
      LlmTranscriptClassificationSchema.parse({
        role: "candidate_like",
        confidence: 0.5,
        selfIdentifiedName: null,
        mentionedCandidateName: false,
        evidence: [
          {
            kind: "candidate_selected",
            role: "candidate_like",
            confidence: 0.5,
            strength: "medium",
            reason: "Invalid."
          }
        ],
        uncertainty: [],
        shouldAffectCandidateIdentity: true
      })
    ).toThrow();
  });
});

describe("@sherlock/llm prompt builder", () => {
  test("includes context and guardrails", () => {
    const prompt = buildTranscriptClassificationPrompt(input);

    expect(prompt).toContain("Ritika Gupta");
    expect(prompt).toContain("Priya Sharma");
    expect(prompt).toContain(input.transcriptText);
    expect(prompt).toContain("NOT to decide who the candidate is");
    expect(prompt).toContain("Do not select final candidate participant");
  });
});

describe("@sherlock/llm mock provider", () => {
  test("classifies candidate-like transcript", async () => {
    const result = await createMockTranscriptClassifierProvider().classifyTranscript(input);

    expect(result.role).toBe("candidate_like");
    expect(result.evidence.map((item) => item.kind)).toContain(
      "candidate_self_identification"
    );
  });

  test("classifies interviewer prompt", async () => {
    const result = await createMockTranscriptClassifierProvider().classifyTranscript({
      ...input,
      transcriptText: "Tell me about yourself and walk me through your project."
    });

    expect(result.role).toBe("interviewer_like");
    expect(result.evidence[0]?.kind).toBe("interviewer_question_prompt");
  });

  test("keeps generic project phrase weak or medium", async () => {
    const result = await createMockTranscriptClassifierProvider().classifyTranscript({
      ...input,
      transcriptText: "My project used TypeScript."
    });

    expect(result.role).toBe("candidate_like");
    expect(result.evidence[0]?.strength).not.toBe("strong");
  });

  test("returns uncertain for unclear transcript", async () => {
    const result = await createMockTranscriptClassifierProvider().classifyTranscript({
      ...input,
      transcriptText: "Okay, sounds good."
    });

    expect(result.role).toBe("uncertain");
    expect(result.shouldAffectCandidateIdentity).toBe(false);
  });
});

describe("@sherlock/llm event factory", () => {
  test("creates valid llm_transcript_evidence events", async () => {
    const classification =
      await createMockTranscriptClassifierProvider().classifyTranscript(input);
    const event = createLlmTranscriptEvidenceEvent({
      meetingId: input.meetingId,
      participantId: input.participantId,
      timestampSec: input.timestampSec,
      transcriptSourceEventId: input.sourceEventId,
      sourceEventId: "llm_1",
      classification
    });

    expect(MeetingEventSchema.parse(event)).toEqual(
      expect.objectContaining({
        type: "llm_transcript_evidence",
        participantId: "p_candidate",
        transcriptSourceEventId: "transcript_1"
      })
    );
  });
});

describe("@sherlock/llm Gemini provider", () => {
  test("throws clear configuration error without key or injected client", () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      expect(() => createGeminiTranscriptClassifierProvider()).toThrow(
        LlmConfigurationError
      );
    } finally {
      if (previous !== undefined) {
        process.env.GEMINI_API_KEY = previous;
      }
    }
  });

  test("validates injected Gemini JSON output", async () => {
    const provider = createGeminiTranscriptClassifierProvider({
      client: {
        models: {
          async generateContent() {
            return {
              text: JSON.stringify(
                await createMockTranscriptClassifierProvider().classifyTranscript(input)
              )
            };
          }
        }
      }
    });

    await expect(provider.classifyTranscript(input)).resolves.toEqual(
      expect.objectContaining({ role: "candidate_like" })
    );
  });

  test("throws output validation error for malformed JSON", async () => {
    const provider = createGeminiTranscriptClassifierProvider({
      client: {
        models: {
          async generateContent() {
            return { text: "not-json" };
          }
        }
      }
    });

    await expect(provider.classifyTranscript(input)).rejects.toThrow(
      LlmOutputValidationError
    );
  });
});
