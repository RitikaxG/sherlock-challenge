import type { MeetingEvent, TranscriptRoleEvidenceItem } from "@sherlock/shared";

import { createSignal } from "./evidence.ts";
import { defaultFusionConfig } from "./fusion-config.ts";
import type { CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal, SignalDirection, SignalKind } from "./signal-types.ts";

type LlmTranscriptEvidenceEvent = Extract<
  MeetingEvent,
  { type: "llm_transcript_evidence" }
>;

const candidateKinds = new Set([
  "candidate_self_identification",
  "candidate_name_spoken",
  "candidate_experience_statement",
  "candidate_project_statement"
]);

const interviewerKinds = new Set([
  "interviewer_question_prompt",
  "interviewer_role_description",
  "interviewer_control_language"
]);

function llmEventsForParticipant(
  state: CandidateSessionState,
  participantId: string
): LlmTranscriptEvidenceEvent[] {
  return state.events.filter(
    (event): event is LlmTranscriptEvidenceEvent =>
      event.type === "llm_transcript_evidence" &&
      event.participantId === participantId
  );
}

function strengthMultiplier(strength: TranscriptRoleEvidenceItem["strength"]) {
  switch (strength) {
    case "strong":
      return 0.7;
    case "medium":
      return 0.48;
    case "weak":
      return 0.28;
  }
}

function directionForEvidence(
  item: TranscriptRoleEvidenceItem
): SignalDirection {
  if (candidateKinds.has(item.kind)) {
    return "positive";
  }

  if (interviewerKinds.has(item.kind)) {
    return "negative";
  }

  return "neutral";
}

function signalKindForEvidence(item: TranscriptRoleEvidenceItem): SignalKind {
  if (item.kind === "no_clear_role_evidence") {
    return "transcript_role_uncertain";
  }

  return item.kind;
}

export function extractLlmTranscriptEvidenceSignals(
  state: CandidateSessionState
): ExtractedSignal[] {
  return state.participants.flatMap((participant) => {
    const signals: ExtractedSignal[] = [];

    for (const event of llmEventsForParticipant(state, participant.id)) {
      const expiresAtSec =
        event.timestampSec + defaultFusionConfig.transcriptSignalTtlSec;
      const sourceEventIds = [
        event.sourceEventId,
        event.transcriptSourceEventId
      ].filter((value): value is string => value !== undefined);

      if (!event.shouldAffectCandidateIdentity) {
        signals.push(
          createSignal({
            participantId: participant.id,
            kind: "transcript_role_uncertain",
            direction: "neutral",
            strength: 0.1,
            reason:
              event.uncertainty[0] ??
              "LLM transcript evidence should not affect candidate identity.",
            source: "transcript",
            specificity: "weak",
            timestampSec: event.timestampSec,
            sourceEventIds,
            expiresAtSec,
            isPersistent: false
          })
        );
        continue;
      }

      for (const item of event.evidence) {
        const direction = directionForEvidence(item);
        signals.push(
          createSignal({
            participantId: participant.id,
            kind: signalKindForEvidence(item),
            direction,
            strength: item.confidence * strengthMultiplier(item.strength),
            reason: `LLM transcript evidence: ${item.reason}`,
            source: "transcript",
            specificity: item.strength,
            timestampSec: event.timestampSec,
            sourceEventIds,
            expiresAtSec,
            isPersistent: false
          })
        );
      }

      for (const uncertainty of event.uncertainty) {
        signals.push(
          createSignal({
            participantId: participant.id,
            kind: "transcript_role_uncertain",
            direction: "neutral",
            strength: 0.1,
            reason: `LLM transcript uncertainty: ${uncertainty}`,
            source: "transcript",
            specificity: "weak",
            timestampSec: event.timestampSec,
            sourceEventIds,
            expiresAtSec,
            isPersistent: false
          })
        );
      }
    }

    return signals;
  });
}
