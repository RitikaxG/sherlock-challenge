export {
  applyMeetingEvent,
  createInitialSessionState,
  getParticipantDisplayName
} from "./session-state.ts";
export type { CandidateSessionState } from "./session-state.ts";
export {
  getEmailDomain,
  includesNameToken,
  isGenericDeviceName,
  nameTokenOverlap,
  normalizeEmail,
  normalizeName,
  safeNumber
} from "./helpers.ts";
export {
  createSignal,
  summarizeSignals
} from "./evidence.ts";
export {
  extractMetadataSignals,
  extractParticipantMetadataSignals
} from "./metadata-signals.ts";
export {
  extractInterviewerExclusionSignals,
  isKnownInterviewer
} from "./interviewer-signals.ts";
export { extractEventSignals } from "./event-signals.ts";
export { extractBehaviorSignals } from "./behavior-signals.ts";
export { extractTranscriptSignals } from "./transcript-signals.ts";
export { extractLlmTranscriptEvidenceSignals } from "./llm-transcript-signals.ts";
export { extractContradictionSignals } from "./contradiction-signals.ts";
export {
  rankParticipants
} from "./ranking.ts";
export { extractAllSignals } from "./all-signals.ts";
export {
  calculateMargin,
  normalizeConfidence,
  rankByScore
} from "./confidence.ts";
export {
  decideCandidateState,
  selectedCandidateIdForState
} from "./decision-state.ts";
export {
  buildCandidateExplanation,
  buildEvidenceItems
} from "./explanation.ts";
export {
  buildDecisionTrace
} from "./decision-trace.ts";
export {
  defaultFusionConfig
} from "./fusion-config.ts";
export type {
  FusionConfig,
  FusionDecisionThresholds
} from "./fusion-config.ts";
export {
  fuseCandidateSignals
} from "./fusion-engine.ts";
export type {
  CandidateFusionResult,
  DecisionStateInput,
  FusedParticipantScore,
  WeightedSignal
} from "./fusion-types.ts";
export type {
  ExtractedSignal,
  ParticipantSignalSummary,
  SignalDirection,
  SignalExtractionContext,
  SignalKind,
  SignalSource
} from "./signal-types.ts";
