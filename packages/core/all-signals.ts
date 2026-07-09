import { extractBehaviorSignals } from "./behavior-signals.ts";
import { extractEventSignals } from "./event-signals.ts";
import { extractInterviewerExclusionSignals } from "./interviewer-signals.ts";
import { extractMetadataSignals } from "./metadata-signals.ts";
import type { CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";
import { extractTranscriptSignals } from "./transcript-signals.ts";

export function extractAllSignals(state: CandidateSessionState): ExtractedSignal[] {
  return [
    ...extractMetadataSignals(state),
    ...extractInterviewerExclusionSignals(state),
    ...extractEventSignals(state),
    ...extractBehaviorSignals(state),
    ...extractTranscriptSignals(state)
  ];
}
