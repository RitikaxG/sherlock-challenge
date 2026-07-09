import type { CandidateStateSnapshot, EvidenceItem } from "./types";

export type CriteriaItem = {
  name: string;
  importance: string;
  description: string;
  examples: string[];
  currentSignals: EvidenceItem[];
  tone: "positive" | "neutral" | "warning";
};

const signalGroups: Record<string, string[]> = {
  Metadata: [
    "candidate_name_exact",
    "candidate_name_partial",
    "candidate_email_match",
    "interviewer_email_match",
    "company_domain_email"
  ],
  "Transcript / LLM": [
    "candidate_self_identification",
    "candidate_name_spoken",
    "candidate_experience_statement",
    "candidate_project_statement",
    "llm_transcript_evidence",
    "interviewer_question_prompt"
  ],
  Behavior: ["speaking_duration", "long_candidate_speech", "screen_share_activity"],
  "Meeting Events": ["participant_joined", "display_name_changed", "candidate_rejoined"],
  "Audio/Video Future": ["webcam_changed", "speaker_confidence"],
  "Safety Overrides": [
    "interviewer_exclusion",
    "contradiction",
    "interviewer_role_description",
    "observer_or_admin_language"
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
      description: "Checks candidate name/email match and interviewer/company-domain exclusion.",
      examples: ["candidate_name_exact", "candidate_email_match", "interviewer_email_match"],
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
      examples: ["speaking_duration", "screen_share_activity"],
      currentSignals: signalsFor("Behavior", evidence),
      tone: "neutral"
    },
    {
      name: "Meeting event signals",
      importance: "12%",
      description: "Tracks joins, leaves, display-name changes, and continuity across rejoin events.",
      examples: ["participant_joined", "display_name_changed", "candidate_rejoined"],
      currentSignals: signalsFor("Meeting Events", evidence),
      tone: "neutral"
    },
    {
      name: "Audio/video future signals",
      importance: "10% future-ready",
      description: "Speech metadata and webcam/screen-share status are scaffolded, without voice biometrics or face matching.",
      examples: ["speaker_confidence", "webcam_changed"],
      currentSignals: signalsFor("Audio/Video Future", evidence),
      tone: "neutral"
    },
    {
      name: "Safety overrides",
      importance: "override",
      description: "Interviewer exclusion, contradictions, temporal stability, and evidence decay can block or reduce confidence.",
      examples: ["interviewer_exclusion", "contradiction", "temporal stability", "evidence decay"],
      currentSignals: signalsFor("Safety Overrides", evidence),
      tone: "warning"
    }
  ];
}
