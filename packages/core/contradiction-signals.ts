import { createSignal } from "./evidence.ts";
import type { ExtractedSignal } from "./signal-types.ts";

const candidateMetadataKinds = new Set([
  "candidate_name_exact",
  "candidate_name_partial",
  "candidate_email_exact"
]);

const interviewerMetadataKinds = new Set([
  "interviewer_name_match",
  "interviewer_email_match",
  "company_domain_email"
]);

const candidateTranscriptKinds = new Set([
  "candidate_self_identification",
  "candidate_name_spoken",
  "candidate_experience_statement",
  "candidate_project_statement",
  "candidate_transcript_phrase"
]);

const interviewerTranscriptKinds = new Set([
  "interviewer_question_prompt",
  "interviewer_role_description",
  "interviewer_control_language",
  "interviewer_transcript_phrase"
]);

function hasKind(
  signals: readonly ExtractedSignal[],
  kinds: ReadonlySet<string>
) {
  return signals.some((signal) => kinds.has(signal.kind));
}

function strongestTimestamp(signals: readonly ExtractedSignal[]) {
  return signals
    .map((signal) => signal.timestampSec)
    .filter((timestamp): timestamp is number => timestamp !== undefined)
    .sort((left, right) => right - left)[0];
}

export function extractContradictionSignals(
  signals: readonly ExtractedSignal[]
): ExtractedSignal[] {
  const participantIds = new Set(signals.map((signal) => signal.participantId));
  const contradictionSignals: ExtractedSignal[] = [];

  for (const participantId of participantIds) {
    const participantSignals = signals.filter(
      (signal) => signal.participantId === participantId
    );
    const hasCandidateMetadata = hasKind(participantSignals, candidateMetadataKinds);
    const hasInterviewerMetadata = hasKind(
      participantSignals,
      interviewerMetadataKinds
    );
    const hasCandidateTranscript = hasKind(
      participantSignals,
      candidateTranscriptKinds
    );
    const hasInterviewerTranscript = hasKind(
      participantSignals,
      interviewerTranscriptKinds
    );
    const sourceEventIds = participantSignals.flatMap(
      (signal) => signal.sourceEventIds ?? []
    );

    if (hasCandidateMetadata && hasInterviewerMetadata) {
      contradictionSignals.push(
        createSignal({
          participantId,
          kind: "candidate_interviewer_metadata_conflict",
          direction: "negative",
          strength: 0.85,
          reason:
            "Participant has both candidate-matching metadata and interviewer/company metadata, so candidate identity is contradictory.",
          source: "contradiction",
          specificity: "strong",
          isPersistent: true,
          timestampSec: strongestTimestamp(participantSignals),
          sourceEventIds
        })
      );
    }

    if (hasCandidateTranscript && hasInterviewerMetadata) {
      contradictionSignals.push(
        createSignal({
          participantId,
          kind: "candidate_transcript_interviewer_metadata_conflict",
          direction: "negative",
          strength: 0.8,
          reason:
            "Participant has candidate-like transcript evidence but also strong interviewer metadata.",
          source: "contradiction",
          specificity: "strong",
          isPersistent: false,
          timestampSec: strongestTimestamp(participantSignals),
          sourceEventIds
        })
      );
    }

    if (hasCandidateTranscript && hasInterviewerTranscript) {
      contradictionSignals.push(
        createSignal({
          participantId,
          kind: "mixed_transcript_role_conflict",
          direction: "negative",
          strength: 0.65,
          reason:
            "Participant transcript contains both candidate-like and interviewer-like role language.",
          source: "contradiction",
          specificity: "medium",
          isPersistent: false,
          timestampSec: strongestTimestamp(participantSignals),
          sourceEventIds
        })
      );
    }
  }

  return contradictionSignals;
}
