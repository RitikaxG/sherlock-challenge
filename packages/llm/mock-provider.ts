import {
  LlmTranscriptClassificationSchema,
  type LlmTranscriptClassification
} from "./schemas.ts";
import type { TranscriptClassifierProvider } from "./provider.ts";

function candidateNameResult(): LlmTranscriptClassification {
  return LlmTranscriptClassificationSchema.parse({
    role: "candidate_like",
    confidence: 0.88,
    selfIdentifiedName: "Ritika Gupta",
    mentionedCandidateName: true,
    evidence: [
      {
        kind: "candidate_self_identification",
        role: "candidate_like",
        confidence: 0.88,
        strength: "strong",
        matchedText: "My name is Ritika Gupta",
        reason: "Speaker explicitly self-identified with the candidate name."
      },
      {
        kind: "candidate_name_spoken",
        role: "candidate_like",
        confidence: 0.84,
        strength: "strong",
        matchedText: "Ritika Gupta",
        reason: "Transcript includes the candidate name spoken by the speaker."
      }
    ],
    uncertainty: [],
    shouldAffectCandidateIdentity: true
  });
}

function interviewerPromptResult(): LlmTranscriptClassification {
  return LlmTranscriptClassificationSchema.parse({
    role: "interviewer_like",
    confidence: 0.86,
    selfIdentifiedName: null,
    mentionedCandidateName: false,
    evidence: [
      {
        kind: "interviewer_question_prompt",
        role: "interviewer_like",
        confidence: 0.86,
        strength: "strong",
        matchedText: "Tell me about yourself",
        reason: "Speaker is prompting another participant like an interviewer."
      }
    ],
    uncertainty: [],
    shouldAffectCandidateIdentity: true
  });
}

function genericProjectResult(): LlmTranscriptClassification {
  return LlmTranscriptClassificationSchema.parse({
    role: "candidate_like",
    confidence: 0.48,
    selfIdentifiedName: null,
    mentionedCandidateName: false,
    evidence: [
      {
        kind: "candidate_project_statement",
        role: "candidate_like",
        confidence: 0.48,
        strength: "weak",
        matchedText: "my project",
        reason: "Project discussion can be candidate-like but is not specific."
      }
    ],
    uncertainty: ["Generic project language is weak role evidence."],
    shouldAffectCandidateIdentity: true
  });
}

function uncertainResult(): LlmTranscriptClassification {
  return LlmTranscriptClassificationSchema.parse({
    role: "uncertain",
    confidence: 0.25,
    selfIdentifiedName: null,
    mentionedCandidateName: false,
    evidence: [
      {
        kind: "no_clear_role_evidence",
        role: "uncertain",
        confidence: 0.25,
        strength: "weak",
        reason: "Transcript does not provide clear role evidence."
      }
    ],
    uncertainty: ["No clear transcript role evidence."],
    shouldAffectCandidateIdentity: false
  });
}

export function createMockTranscriptClassifierProvider(
  responses: Partial<Record<string, LlmTranscriptClassification>> = {}
): TranscriptClassifierProvider {
  return {
    async classifyTranscript(input) {
      const configured = responses[input.transcriptText];
      if (configured) {
        return LlmTranscriptClassificationSchema.parse(configured);
      }

      const text = input.transcriptText.toLowerCase();
      if (text.includes("my name is ritika gupta")) {
        return candidateNameResult();
      }
      if (text.includes("tell me about yourself")) {
        return interviewerPromptResult();
      }
      if (
        text.includes("my project") ||
        text.includes("project used") ||
        text.includes("i worked on")
      ) {
        return genericProjectResult();
      }

      return uncertainResult();
    }
  };
}
