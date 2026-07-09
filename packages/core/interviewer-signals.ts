import type { Meeting, Participant } from "@sherlock/shared";

import { createSignal } from "./evidence.ts";
import {
  getEmailDomain,
  includesNameToken,
  normalizeEmail,
  normalizeName
} from "./helpers.ts";
import { getParticipantDisplayName, type CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

export function isKnownInterviewer(meeting: Meeting, participant: Participant) {
  const participantEmail = normalizeEmail(participant.email);
  const participantName = normalizeName(participant.currentName ?? participant.displayName);
  const interviewerEmails = meeting.interviewerEmails.map(normalizeEmail);
  const interviewerNames = meeting.interviewerNames.map(normalizeName);

  return (
    participant.isKnownInterviewerHint ||
    (!!participantEmail && interviewerEmails.includes(participantEmail)) ||
    (!!participantName &&
      interviewerNames.some((name) => name && name === participantName))
  );
}

export function extractInterviewerExclusionSignals(
  state: CandidateSessionState
): ExtractedSignal[] {
  return state.participants.flatMap((participant) => {
    const displayName = getParticipantDisplayName(state, participant);
    const participantEmail = normalizeEmail(participant.email);
    const candidateEmail = normalizeEmail(state.meeting.candidateEmail);
    const participantDomain = getEmailDomain(participantEmail);
    const candidateDomain = getEmailDomain(candidateEmail);
    const signals: ExtractedSignal[] = [];

    if (
      participantEmail &&
      state.meeting.interviewerEmails.map(normalizeEmail).includes(participantEmail)
    ) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "interviewer_email_match",
          direction: "negative",
          strength: 0.95,
          reason: "Participant email matches a known interviewer email.",
          source: "interviewer_exclusion"
        })
      );
    }

    if (
      state.meeting.interviewerNames.some((name) =>
        includesNameToken(displayName, name)
      )
    ) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "interviewer_name_match",
          direction: "negative",
          strength: 0.85,
          reason: "Participant name matches a known interviewer name.",
          source: "interviewer_exclusion"
        })
      );
    }

    if (
      participantDomain &&
      state.meeting.companyDomains.includes(participantDomain) &&
      (!candidateDomain || candidateDomain !== participantDomain)
    ) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "company_domain_email",
          direction: "negative",
          strength: 0.65,
          reason:
            "Participant email uses a company domain while the candidate email appears external or different.",
          source: "interviewer_exclusion"
        })
      );
    }

    return signals;
  });
}
