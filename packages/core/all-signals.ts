import { extractBehaviorSignals } from "./behavior-signals.ts";
import { extractContradictionSignals } from "./contradiction-signals.ts";
import { extractEventSignals } from "./event-signals.ts";
import { extractInterviewerExclusionSignals } from "./interviewer-signals.ts";
import { extractMetadataSignals } from "./metadata-signals.ts";
import type { CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";
import { extractTranscriptSignals } from "./transcript-signals.ts";

export function extractAllSignals(state: CandidateSessionState): ExtractedSignal[] {
  const baseSignals = [
    ...extractMetadataSignals(state),
    ...extractInterviewerExclusionSignals(state),
    ...extractEventSignals(state),
    ...extractBehaviorSignals(state),
    ...extractTranscriptSignals(state)
  ];

  return [
    ...baseSignals,
    ...extractContradictionSignals(baseSignals)
  ];
}
