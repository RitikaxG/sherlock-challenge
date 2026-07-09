import { createSignal } from "./evidence.ts";
import { textIncludesAny } from "./helpers.ts";
import type { CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

const candidateLikePhrases = [
  "i am ",
  "my name is",
  "i am the candidate",
  "i'm here for the interview",
  "im here for the interview",
  "my experience",
  "my project",
  "i worked on"
];

const interviewerLikePhrases = [
  "tell me about yourself",
  "can you explain",
  "we are hiring",
  "the role is",
  "i will ask",
  "let's start the interview",
  "lets start the interview"
];

export function extractTranscriptSignals(
  state: CandidateSessionState
): ExtractedSignal[] {
  return state.participants.flatMap((participant) => {
    const snippets = state.transcriptSnippetsByParticipant[participant.id] ?? [];
    const text = snippets.join(" ");
    const signals: ExtractedSignal[] = [];

    if (textIncludesAny(text, candidateLikePhrases)) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "candidate_transcript_phrase",
          direction: "positive",
          strength: 0.55,
          reason: "Transcript contains candidate-like self-description language.",
          source: "transcript"
        })
      );
    }

    if (textIncludesAny(text, interviewerLikePhrases)) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "interviewer_transcript_phrase",
          direction: "negative",
          strength: 0.5,
          reason: "Transcript contains interviewer-like prompt language.",
          source: "transcript"
        })
      );
    }

    return signals;
  });
}
