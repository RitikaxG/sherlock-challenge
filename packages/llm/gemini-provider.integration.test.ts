import { describe, expect, test } from "vitest";

import { createGeminiTranscriptClassifierProvider } from "./gemini-provider.ts";

const maybeTest = process.env.GEMINI_API_KEY ? test : test.skip;

describe("@sherlock/llm Gemini integration", () => {
  maybeTest("classifies candidate self-identification with real Gemini", async () => {
    const provider = createGeminiTranscriptClassifierProvider();
    const result = await provider.classifyTranscript({
      meetingId: "meeting_1",
      participantId: "p_candidate",
      candidateName: "Ritika Gupta",
      candidateEmail: "ritika@example.com",
      interviewerNames: ["Priya Sharma"],
      interviewerEmails: ["priya@sherlock.ai"],
      companyDomains: ["sherlock.ai"],
      transcriptText:
        "My name is Ritika Gupta, I am here for the interview and I worked on a backend system.",
      timestampSec: 10
    });

    expect(result.role).toBe("candidate_like");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.evidence.map((item) => item.kind)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/candidate_self_identification|candidate_name_spoken/)
      ])
    );
    expect(result.shouldAffectCandidateIdentity).toBe(true);
  });
});
