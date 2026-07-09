import type { TranscriptClassificationInput } from "./schemas.ts";

function list(values: readonly string[]) {
  return values.length === 0 ? "none" : values.join(", ");
}

export function buildTranscriptClassificationPrompt(
  input: TranscriptClassificationInput
) {
  return `You are assisting a candidate identity fusion engine for live interview monitoring.

Your task is NOT to decide who the candidate is.
Your task is only to classify this transcript chunk into structured role evidence.

The deterministic fusion engine will make the final candidate decision later.

Meeting context:
Candidate name: ${input.candidateName}
Candidate email: ${input.candidateEmail ?? "unknown"}
Known interviewer names: ${list(input.interviewerNames)}
Known interviewer emails: ${list(input.interviewerEmails)}
Company domains: ${list(input.companyDomains)}

Participant:
participantId: ${input.participantId}
timestampSec: ${input.timestampSec}
speakerConfidence: ${input.speakerConfidence ?? "unknown"}

Transcript:
${input.transcriptText}

Classify whether this transcript sounds candidate-like, interviewer-like, observer/admin-like, or uncertain.

Rules:
- Strong candidate evidence includes explicit self-identification, e.g. "My name is X", "I am here for the interview", or direct candidate-name mention by the speaker.
- Generic phrases like "my project", "my experience", or "I worked on" are only weak/medium evidence.
- Interviewer evidence includes asking questions, describing the role, controlling the interview flow, or evaluating the candidate.
- If the transcript is short, unclear, generic, or could be either candidate/interviewer, choose uncertain.
- Do not claim identity verification.
- Do not select final candidate participant.
- Return JSON only matching the configured schema.`;
}
