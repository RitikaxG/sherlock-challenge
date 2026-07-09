import type { MeetingEvent } from "@sherlock/shared";

import { createSignal } from "./evidence.ts";
import { includesNameToken, nameTokenOverlap, textIncludesAny } from "./helpers.ts";
import { defaultFusionConfig } from "./fusion-config.ts";
import type { CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

const interviewerQuestionPrompts = [
  "tell me about yourself",
  "can you explain",
  "can you walk me through",
  "what was your role",
  "why should we hire"
];

const interviewerRoleDescriptions = [
  "the role is",
  "we are hiring",
  "this position",
  "our team is looking"
];

const interviewerControlLanguage = [
  "i will ask",
  "let's start the interview",
  "lets start the interview",
  "next question",
  "we will move on"
];

function transcriptEventsForParticipant(
  state: CandidateSessionState,
  participantId: string
) {
  return state.events.filter(
    (event): event is Extract<MeetingEvent, { type: "transcript_chunk" }> =>
      event.type === "transcript_chunk" && event.participantId === participantId
  );
}

function expiresAt(timestampSec: number) {
  return timestampSec + defaultFusionConfig.transcriptSignalTtlSec;
}

export function extractTranscriptSignals(
  state: CandidateSessionState
): ExtractedSignal[] {
  return state.participants.flatMap((participant) => {
    const signals: ExtractedSignal[] = [];

    for (const event of transcriptEventsForParticipant(state, participant.id)) {
      const text = event.text;
      const common = {
        participantId: participant.id,
        timestampSec: event.timestampSec,
        sourceEventIds: event.sourceEventId ? [event.sourceEventId] : undefined,
        expiresAtSec: expiresAt(event.timestampSec),
        isPersistent: false
      };

      if (textIncludesAny(text, ["i am the candidate", "i am here for the interview", "i'm here for the interview", "im here for the interview"])) {
        signals.push(
          createSignal({
            ...common,
            kind: "candidate_self_identification",
            direction: "positive",
            strength: 0.7,
            reason:
              "Transcript contains explicit candidate self-identification language.",
            source: "transcript",
            specificity: "strong"
          })
        );
      }

      if (textIncludesAny(text, ["my name is", "i am "]) && includesNameToken(text, state.meeting.candidateName)) {
        signals.push(
          createSignal({
            ...common,
            kind: "candidate_name_spoken",
            direction: "positive",
            strength: 0.65 + nameTokenOverlap(text, state.meeting.candidateName) * 0.25,
            reason: "Transcript includes a spoken candidate-name match.",
            source: "transcript",
            specificity: "strong"
          })
        );
      }

      if (textIncludesAny(text, ["my experience", "experience includes", "i have experience"])) {
        signals.push(
          createSignal({
            ...common,
            kind: "candidate_experience_statement",
            direction: "positive",
            strength: 0.38,
            reason:
              "Transcript contains candidate-like experience language, which is useful but not decisive by itself.",
            source: "transcript",
            specificity: "medium"
          })
        );
      }

      if (textIncludesAny(text, ["my project", "i worked on", "project used", "project involved"])) {
        signals.push(
          createSignal({
            ...common,
            kind: "candidate_project_statement",
            direction: "positive",
            strength: 0.25,
            reason:
              "Transcript contains generic project language, which is weak candidate evidence by itself.",
            source: "transcript",
            specificity: "weak"
          })
        );
      }

      if (textIncludesAny(text, interviewerQuestionPrompts)) {
        signals.push(
          createSignal({
            ...common,
            kind: "interviewer_question_prompt",
            direction: "negative",
            strength: 0.65,
            reason: "Transcript contains interviewer-style question prompting.",
            source: "transcript",
            specificity: "strong"
          })
        );
      }

      if (textIncludesAny(text, interviewerRoleDescriptions)) {
        signals.push(
          createSignal({
            ...common,
            kind: "interviewer_role_description",
            direction: "negative",
            strength: 0.5,
            reason: "Transcript contains interviewer-style role description language.",
            source: "transcript",
            specificity: "medium"
          })
        );
      }

      if (textIncludesAny(text, interviewerControlLanguage)) {
        signals.push(
          createSignal({
            ...common,
            kind: "interviewer_control_language",
            direction: "negative",
            strength: 0.55,
            reason: "Transcript contains interviewer-style control language.",
            source: "transcript",
            specificity: "medium"
          })
        );
      }

      if (
        signals.every(
          (signal) =>
            signal.participantId !== participant.id ||
            signal.timestampSec !== event.timestampSec
        )
      ) {
        signals.push(
          createSignal({
            ...common,
            kind: "transcript_role_uncertain",
            direction: "neutral",
            strength: 0.1,
            reason:
              "Transcript was observed but did not contain clear candidate or interviewer role evidence.",
            source: "transcript",
            specificity: "weak"
          })
        );
      }
    }

    return signals;
  });
}
