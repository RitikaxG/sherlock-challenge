import type { CandidateStateSnapshot, EvidenceItem } from "./types";

export type CriteriaItem = {
  name: string;
  importance: string;
  description: string;
  examples: string[];
  currentSignals: EvidenceItem[];
  tone: "positive" | "neutral" | "warning";
};

export type SignalChartDatum = {
  name: string;
  importance: string;
  evaluatedCount: number;
  positiveImpact: number;
  negativeImpact: number;
  netImpact: number;
  examples: string[];
};

export type ParticipantImpactBreakdown = {
  participantId: string;
  displayName: string;
  positiveImpact: number;
  negativeImpact: number;
  rawScore: number;
  confidence: number;
};

export const signalGroups: Record<string, string[]> = {
  Metadata: [
    "candidate_name_exact",
    "candidate_name_partial",
    "candidate_email_exact",
    "generic_device_name",
    "interviewer_name_match",
    "interviewer_email_match",
    "company_domain_email"
  ],
  "Transcript / LLM": [
    "candidate_transcript_phrase",
    "interviewer_transcript_phrase",
    "candidate_self_identification",
    "candidate_name_spoken",
    "candidate_experience_statement",
    "candidate_project_statement",
    "interviewer_question_prompt",
    "interviewer_role_description",
    "interviewer_control_language",
    "observer_or_admin_language",
    "no_clear_role_evidence",
    "transcript_role_uncertain"
  ],
  Behavior: [
    "speaking_activity",
    "long_silence",
    "webcam_on",
    "screen_share"
  ],
  "Meeting Events": [
    "join_timing",
    "join_order",
    "display_name_change"
  ],
  "Audio/Video Future": [
    "face_visible",
    "multiple_faces_detected",
    "face_match_score",
    "voice_consistency_score",
    "active_speaker_confidence",
    "speaker_overlap_detected",
    "background_voice_detected",
    "audio_quality_low"
  ],
  "Safety Overrides": [
    "candidate_interviewer_metadata_conflict",
    "candidate_transcript_interviewer_metadata_conflict",
    "mixed_transcript_role_conflict",
    "interviewer_name_match",
    "interviewer_email_match",
    "company_domain_email"
  ]
};

export const signalFamilyColors: Record<string, string> = {
  "Metadata": "#60a5fa",
  "Transcript / LLM": "#34d399",
  "Behavior": "#f59e0b",
  "Meeting Events": "#a78bfa",
  "Audio/Video Future": "#22d3ee",
  "Safety Overrides": "#fb7185"
};

function signalsFor(group: string, evidence: readonly EvidenceItem[]) {
  const names = signalGroups[group] ?? [];
  return evidence.filter((item) => names.includes(item.signal));
}

export function getCriteria(snapshot: CandidateStateSnapshot | null): CriteriaItem[] {
  const evidence = snapshot?.evidence ?? [];

  return [
    {
      name: "Metadata signals",
      importance: "30%",
      description: "Metadata helps orient the engine with names, emails, device labels, and known interviewer/company clues, but it is never blindly trusted as proof.",
      examples: ["candidate_name_exact", "candidate_email_exact", "interviewer_email_match"],
      currentSignals: signalsFor("Metadata", evidence),
      tone: "positive"
    },
    {
      name: "Transcript / LLM evidence",
      importance: "30%",
      description: "Transcript and Gemini evidence describe speaker role signals. They can strengthen or weaken a stream, but the LLM never makes the final candidate decision.",
      examples: ["candidate_self_identification", "candidate_name_spoken", "interviewer_question_prompt"],
      currentSignals: signalsFor("Transcript / LLM", evidence),
      tone: "positive"
    },
    {
      name: "Behavior signals",
      importance: "18%",
      description: "Behavior such as speech, webcam, and screen share is weak supporting context. It helps compare streams but should not identify the candidate alone.",
      examples: ["speaking_activity", "webcam_on", "screen_share"],
      currentSignals: signalsFor("Behavior", evidence),
      tone: "neutral"
    },
    {
      name: "Meeting event signals",
      importance: "12%",
      description: "Meeting events track timing, join order, display-name changes, and stream continuity as contextual evidence.",
      examples: ["join_timing", "join_order", "display_name_change"],
      currentSignals: signalsFor("Meeting Events", evidence),
      tone: "neutral"
    },
    {
      name: "Audio/video future signals",
      importance: "10% future-ready",
      description: "Audio/video signal names are reserved for future evidence. This prototype does not perform face recognition, voice biometrics, liveness, or identity verification.",
      examples: ["active_speaker_confidence", "face_visible"],
      currentSignals: signalsFor("Audio/Video Future", evidence),
      tone: "neutral"
    },
    {
      name: "Safety overrides",
      importance: "override",
      description: "Safety overrides reduce, warn, or block confidence when interviewer evidence, contradictions, ambiguity, stale evidence, or verification limits matter.",
      examples: ["candidate_transcript_interviewer_metadata_conflict", "mixed_transcript_role_conflict", "company_domain_email"],
      currentSignals: signalsFor("Safety Overrides", evidence),
      tone: "warning"
    }
  ];
}

export function getParticipantImpactBreakdown(
  snapshot: CandidateStateSnapshot | null
): ParticipantImpactBreakdown[] {
  if (snapshot?.decisionTrace?.scoreBreakdown) {
    return snapshot.decisionTrace.scoreBreakdown.map((participant) => ({
      participantId: participant.participantId,
      displayName: participant.displayName,
      positiveImpact: participant.positiveWeight,
      negativeImpact: participant.negativeWeight,
      rawScore: participant.rawScore,
      confidence: participant.confidence
    }));
  }

  return (snapshot?.participants ?? []).map((participant) => ({
    participantId: participant.participantId,
    displayName: participant.displayName,
    positiveImpact: Math.max(0, participant.rawScore),
    negativeImpact: Math.abs(Math.min(0, participant.rawScore)),
    rawScore: participant.rawScore,
    confidence: participant.confidence
  }));
}

export function getSignalChartData(
  snapshot: CandidateStateSnapshot | null
): SignalChartDatum[] {
  return getCriteria(snapshot).map((item) => {
    const positiveImpact = item.currentSignals
      .filter((signal) => signal.impact > 0)
      .reduce((total, signal) => total + signal.impact, 0);
    const negativeImpact = item.currentSignals
      .filter((signal) => signal.impact < 0)
      .reduce((total, signal) => total + Math.abs(signal.impact), 0);

    return {
      name: item.name,
      importance: item.importance,
      evaluatedCount: item.currentSignals.length,
      positiveImpact,
      negativeImpact,
      netImpact: positiveImpact - negativeImpact,
      examples: item.examples
    };
  });
}
