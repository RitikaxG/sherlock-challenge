import { z } from "zod";
import {
  TranscriptRoleEvidenceItemSchema,
  TranscriptRoleEvidenceKindSchema,
  TranscriptRoleEvidencePayloadSchema,
  TranscriptRoleSchema
} from "@sherlock/shared";

export const LlmTranscriptRoleSchema = TranscriptRoleSchema;
export const LlmTranscriptEvidenceKindSchema = TranscriptRoleEvidenceKindSchema;
export const LlmTranscriptEvidenceItemSchema = TranscriptRoleEvidenceItemSchema;

export const LlmTranscriptClassificationSchema =
  TranscriptRoleEvidencePayloadSchema.omit({
    transcriptSourceEventId: true
  });

export const TranscriptClassificationInputSchema = z.object({
  meetingId: z.string().min(1),
  participantId: z.string().min(1),
  candidateName: z.string().min(1),
  candidateEmail: z.string().email().optional(),
  interviewerNames: z.array(z.string()).default([]),
  interviewerEmails: z.array(z.string().email()).default([]),
  companyDomains: z.array(z.string()).default([]),
  transcriptText: z.string().min(1),
  timestampSec: z.number().nonnegative(),
  sourceEventId: z.string().min(1).optional(),
  speakerConfidence: z.number().min(0).max(1).optional()
});

export const llmTranscriptClassificationJsonSchema = {
  type: "object",
  properties: {
    role: {
      type: "string",
      enum: ["candidate_like", "interviewer_like", "observer_like", "uncertain"]
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1
    },
    selfIdentifiedName: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    mentionedCandidateName: {
      type: "boolean"
    },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "candidate_self_identification",
              "candidate_name_spoken",
              "candidate_experience_statement",
              "candidate_project_statement",
              "interviewer_question_prompt",
              "interviewer_role_description",
              "interviewer_control_language",
              "observer_or_admin_language",
              "no_clear_role_evidence"
            ]
          },
          role: {
            type: "string",
            enum: [
              "candidate_like",
              "interviewer_like",
              "observer_like",
              "uncertain"
            ]
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          strength: {
            type: "string",
            enum: ["weak", "medium", "strong"]
          },
          matchedText: {
            type: "string"
          },
          reason: {
            type: "string"
          }
        },
        required: ["kind", "role", "confidence", "strength", "reason"]
      }
    },
    uncertainty: {
      type: "array",
      items: {
        type: "string"
      }
    },
    shouldAffectCandidateIdentity: {
      type: "boolean"
    }
  },
  required: [
    "role",
    "confidence",
    "selfIdentifiedName",
    "mentionedCandidateName",
    "evidence",
    "uncertainty",
    "shouldAffectCandidateIdentity"
  ]
} as const;

export type LlmTranscriptRole = z.infer<typeof LlmTranscriptRoleSchema>;
export type LlmTranscriptEvidenceKind = z.infer<
  typeof LlmTranscriptEvidenceKindSchema
>;
export type LlmTranscriptEvidenceItem = z.infer<
  typeof LlmTranscriptEvidenceItemSchema
>;
export type LlmTranscriptClassification = z.infer<
  typeof LlmTranscriptClassificationSchema
>;
export type TranscriptClassificationInput = z.infer<
  typeof TranscriptClassificationInputSchema
>;
