import type { Meeting, Participant } from "@sherlock/shared";

import { createSignal } from "./evidence.ts";
import {
  getEmailDomain,
  includesNameToken,
  isGenericDeviceName,
  nameTokenOverlap,
  normalizeEmail,
  normalizeName
} from "./helpers.ts";
import { getParticipantDisplayName, type CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

export function extractParticipantMetadataSignals(
  meeting: Meeting,
  participant: Participant,
  displayName = participant.currentName ?? participant.displayName
): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];
  const normalizedDisplayName = normalizeName(displayName);
  const normalizedCandidateName = normalizeName(meeting.candidateName);
  const participantEmail = normalizeEmail(participant.email);
  const candidateEmail = normalizeEmail(meeting.candidateEmail);
  const participantDomain = getEmailDomain(participantEmail);
  const candidateDomain = getEmailDomain(candidateEmail);

  if (
    normalizedDisplayName &&
    normalizedCandidateName &&
    normalizedDisplayName === normalizedCandidateName
  ) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "candidate_name_exact",
        direction: "positive",
        strength: 0.95,
        reason: "Participant display name exactly matches the candidate name.",
        source: "metadata"
      })
    );
  } else if (includesNameToken(displayName, meeting.candidateName)) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "candidate_name_partial",
        direction: "positive",
        strength: 0.45 + nameTokenOverlap(displayName, meeting.candidateName) * 0.25,
        reason: "Participant display name shares tokens with the candidate name.",
        source: "metadata"
      })
    );
  }

  if (participantEmail && candidateEmail && participantEmail === candidateEmail) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "candidate_email_exact",
        direction: "positive",
        strength: 1,
        reason: "Participant email exactly matches the candidate email.",
        source: "metadata"
      })
    );
  }

  if (isGenericDeviceName(displayName)) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "generic_device_name",
        direction: "neutral",
        strength: 0.2,
        reason: "Participant display name appears to be a generic device name.",
        source: "metadata"
      })
    );
  }

  if (meeting.interviewerNames.some((name) => includesNameToken(displayName, name))) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "interviewer_name_match",
        direction: "negative",
        strength: 0.8,
        reason: "Participant display name resembles a known interviewer name.",
        source: "metadata"
      })
    );
  }

  if (
    participantEmail &&
    meeting.interviewerEmails.map(normalizeEmail).includes(participantEmail)
  ) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "interviewer_email_match",
        direction: "negative",
        strength: 0.9,
        reason: "Participant email matches a known interviewer email.",
        source: "metadata"
      })
    );
  }

  if (
    participantDomain &&
    meeting.companyDomains.includes(participantDomain) &&
    (!candidateDomain || participantDomain !== candidateDomain)
  ) {
    signals.push(
      createSignal({
        participantId: participant.id,
        kind: "company_domain_email",
        direction: "negative",
        strength: 0.55,
        reason:
          "Participant email uses the company domain while the candidate email does not.",
        source: "metadata"
      })
    );
  }

  return signals;
}

export function extractMetadataSignals(state: CandidateSessionState) {
  return state.participants.flatMap((participant) =>
    extractParticipantMetadataSignals(
      state.meeting,
      participant,
      getParticipantDisplayName(state, participant)
    )
  );
}
