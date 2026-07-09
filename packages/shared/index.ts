import { z } from "zod";

export const CandidateDecisionStateSchema = z.enum([
  "INSUFFICIENT_DATA",
  "POSSIBLE_CANDIDATE",
  "LIKELY_CANDIDATE",
  "CONFIRMED_CANDIDATE",
  "AMBIGUOUS"
]);

export const CandidateStateSchema = CandidateDecisionStateSchema;

export const TranscriptRoleSchema = z.enum([
  "candidate_like",
  "interviewer_like",
  "observer_like",
  "uncertain"
]);

export const TranscriptRoleEvidenceKindSchema = z.enum([
  "candidate_self_identification",
  "candidate_name_spoken",
  "candidate_experience_statement",
  "candidate_project_statement",
  "interviewer_question_prompt",
  "interviewer_role_description",
  "interviewer_control_language",
  "observer_or_admin_language",
  "no_clear_role_evidence"
]);

export const TranscriptRoleEvidenceItemSchema = z.object({
  kind: TranscriptRoleEvidenceKindSchema,
  role: TranscriptRoleSchema,
  confidence: z.number().min(0).max(1),
  strength: z.enum(["weak", "medium", "strong"]),
  matchedText: z.string().min(1).optional(),
  reason: z.string().min(1)
});

export const TranscriptRoleEvidencePayloadSchema = z.object({
  transcriptSourceEventId: z.string().min(1).optional(),
  role: TranscriptRoleSchema,
  confidence: z.number().min(0).max(1),
  selfIdentifiedName: z.string().min(1).nullable(),
  mentionedCandidateName: z.boolean(),
  evidence: z.array(TranscriptRoleEvidenceItemSchema),
  uncertainty: z.array(z.string()),
  shouldAffectCandidateIdentity: z.boolean()
});

export const MeetingSchema = z.object({
  id: z.string().min(1),
  candidateName: z.string().min(1),
  candidateEmail: z.string().email().optional(),
  scheduledStart: z.string().datetime().optional(),
  interviewerNames: z.array(z.string()).default([]),
  interviewerEmails: z.array(z.string().email()).default([]),
  companyDomains: z.array(z.string()).default([])
});



export const ParticipantSchema = z.object({
  id: z.string().min(1),
  meetingId: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  currentName: z.string().optional(),
  joinedAtSec: z.number().nonnegative().optional(),
  leftAtSec: z.number().nonnegative().optional(),
  isKnownInterviewerHint: z.boolean().default(false)
});

const BaseMeetingEventSchema = z.object({
  participantId: z.string().min(1),
  timestampSec: z.number().nonnegative(),
  source: z.string().min(1).optional(),
  sourceEventId: z.string().min(1).optional()
});

const SpeechEventMetadataSchema = z.object({
  speakerConfidence: z.number().min(0).max(1).optional(),
  startSec: z.number().nonnegative().optional(),
  endSec: z.number().nonnegative().optional()
});

export const MeetingEventSchema = z.discriminatedUnion("type", [
  BaseMeetingEventSchema.extend({
    type: z.literal("participant_joined")
  }),
  BaseMeetingEventSchema.extend({
    type: z.literal("participant_left")
  }),
  BaseMeetingEventSchema.extend({
    type: z.literal("display_name_changed"),
    newDisplayName: z.string().min(1)
  }),
  BaseMeetingEventSchema.extend({
    type: z.literal("webcam_changed"),
    webcamOn: z.boolean()
  }),
  BaseMeetingEventSchema.extend({
    type: z.literal("screen_share_changed"),
    sharing: z.boolean()
  }),
  BaseMeetingEventSchema.extend({
    type: z.literal("speaking_activity"),
    durationSec: z.number().nonnegative()
  }).merge(SpeechEventMetadataSchema),
  BaseMeetingEventSchema.extend({
    type: z.literal("transcript_chunk"),
    text: z.string().min(1),
    isFinal: z.boolean().optional()
  }).merge(SpeechEventMetadataSchema),
  BaseMeetingEventSchema.extend({
    type: z.literal("llm_transcript_evidence")
  }).merge(TranscriptRoleEvidencePayloadSchema)
]).superRefine((event, context) => {
  if (
    "startSec" in event &&
    "endSec" in event &&
    event.startSec !== undefined &&
    event.endSec !== undefined &&
    event.endSec < event.startSec
  ) {
    context.addIssue({
      code: "custom",
      message: "endSec must be greater than or equal to startSec",
      path: ["endSec"]
    });
  }
});

export const EvidenceItemSchema = z.object({
  signal: z.string().min(1),
  participantId: z.string().min(1),
  impact: z.number(),
  reason: z.string().min(1)
});

export const ParticipantScoreSchema = z.object({
  participantId: z.string().min(1),
  displayName: z.string().min(1),
  confidence: z.number().min(0).max(1),
  rawScore: z.number()
});

export const CandidateStateSnapshotSchema = z.object({
  meetingId: z.string().min(1),
  selectedCandidateId: z.string().min(1).nullable(),
  confidence: z.number().min(0).max(1),
  state: CandidateDecisionStateSchema,
  participants: z.array(ParticipantScoreSchema),
  evidence: z.array(EvidenceItemSchema),
  uncertainty: z.array(z.string()),
  timestampSec: z.number().nonnegative().optional()
});

export const CandidateStateUpdatedMessageSchema = z.object({
  type: z.literal("candidate_state_updated"),
  snapshot: CandidateStateSnapshotSchema
});

export const ScenarioExpectedOutcomeSchema = z.object({
  candidateParticipantId: z.string().min(1).nullable(),
  finalState: CandidateDecisionStateSchema.optional(),
  allowAmbiguous: z.boolean().default(false)
});

export const ScenarioFileSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  meeting: MeetingSchema,
  participants: z.array(ParticipantSchema),
  events: z.array(MeetingEventSchema),
  expected: ScenarioExpectedOutcomeSchema
});

export type CandidateDecisionState = z.infer<
  typeof CandidateDecisionStateSchema
>;
export type CandidateState = z.infer<typeof CandidateStateSchema>;
export type TranscriptRole = z.infer<typeof TranscriptRoleSchema>;
export type TranscriptRoleEvidenceKind = z.infer<
  typeof TranscriptRoleEvidenceKindSchema
>;
export type TranscriptRoleEvidenceItem = z.infer<
  typeof TranscriptRoleEvidenceItemSchema
>;
export type TranscriptRoleEvidencePayload = z.infer<
  typeof TranscriptRoleEvidencePayloadSchema
>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type MeetingEvent = z.infer<typeof MeetingEventSchema>;
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type ParticipantScore = z.infer<typeof ParticipantScoreSchema>;
export type CandidateStateSnapshot = z.infer<
  typeof CandidateStateSnapshotSchema
>;
export type CandidateStateUpdatedMessage = z.infer<
  typeof CandidateStateUpdatedMessageSchema
>;
export type ScenarioExpectedOutcome = z.infer<
  typeof ScenarioExpectedOutcomeSchema
>;
export type ScenarioFile = z.infer<typeof ScenarioFileSchema>;
