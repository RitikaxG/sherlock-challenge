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

const signalGroups: Record<string, string[]> = {
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

function signalsFor(group: string, evidence: readonly EvidenceItem[]) {
  const names = signalGroups[group] ?? [];
  return evidence.filter((item) =>
    names.some((name) => item.signal.includes(name))
  );
}

export function getCriteria(snapshot: CandidateStateSnapshot | null): CriteriaItem[] {
  const evidence = snapshot?.evidence ?? [];

  return [
    {
      name: "Metadata signals",
      importance: "30%",
      description: "Checks candidate name/email match, generic device names, and interviewer/company-domain exclusion.",
      examples: ["candidate_name_exact", "candidate_email_exact", "interviewer_email_match"],
      currentSignals: signalsFor("Metadata", evidence),
      tone: "positive"
    },
    {
      name: "Transcript / LLM evidence",
      importance: "30%",
      description: "Uses deterministic transcript patterns and Gemini structured role evidence. Generic project phrases stay weak; self-identification is stronger.",
      examples: ["candidate_self_identification", "candidate_name_spoken", "interviewer_question_prompt"],
      currentSignals: signalsFor("Transcript / LLM", evidence),
      tone: "positive"
    },
    {
      name: "Behavior signals",
      importance: "18%",
      description: "Uses speaking duration and meeting behavior as supporting evidence, never as the only proof.",
      examples: ["speaking_activity", "webcam_on", "screen_share"],
      currentSignals: signalsFor("Behavior", evidence),
      tone: "neutral"
    },
    {
      name: "Meeting event signals",
      importance: "12%",
      description: "Tracks joins, leaves, display-name changes, and continuity across rejoin events.",
      examples: ["join_timing", "join_order", "display_name_change"],
      currentSignals: signalsFor("Meeting Events", evidence),
      tone: "neutral"
    },
    {
      name: "Audio/video future signals",
      importance: "10% future-ready",
      description: "Speech metadata and webcam/screen-share status are scaffolded, without voice biometrics or face matching.",
      examples: ["active_speaker_confidence", "face_visible"],
      currentSignals: signalsFor("Audio/Video Future", evidence),
      tone: "neutral"
    },
    {
      name: "Safety overrides",
      importance: "override",
      description: "Interviewer exclusion, contradictions, temporal stability, and evidence decay can block or reduce confidence.",
      examples: ["candidate_transcript_interviewer_metadata_conflict", "mixed_transcript_role_conflict", "company_domain_email"],
      currentSignals: signalsFor("Safety Overrides", evidence),
      tone: "warning"
    }
  ];
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
