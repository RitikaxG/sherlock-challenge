import type { CandidateDecisionTrace } from "@sherlock/shared";

import { defaultFusionConfig, type FusionConfig } from "./fusion-config.ts";
import type { CandidateFusionResult } from "./fusion-types.ts";
import type { CandidateSessionState } from "./session-state.ts";

function pipelineStatus(
  blocked: boolean,
  warning: boolean
): "complete" | "warning" | "blocked" {
  if (blocked) {
    return "blocked";
  }

  if (warning) {
    return "warning";
  }

  return "complete";
}

export function buildDecisionTrace(
  state: CandidateSessionState,
  result: CandidateFusionResult,
  config: FusionConfig = defaultFusionConfig
): CandidateDecisionTrace {
  const topParticipant = result.topParticipant;
  const signalCount = result.signals.length;
  const blockedByAmbiguity = result.decisionState === "AMBIGUOUS";
  const blockedByInterviewer = Boolean(
    topParticipant?.hasStrongInterviewerExclusion
  );
  const warningByContradiction = Boolean(topParticipant?.hasStrongContradiction);
  const confirmationWarning =
    result.decisionState === "LIKELY_CANDIDATE" &&
    Boolean(topParticipant?.confirmationBlockReason);

  const safetyGates: CandidateDecisionTrace["safetyGates"] = [
    {
      gate: "interviewer_exclusion",
      status: blockedByInterviewer ? "blocked" : "passed",
      summary: blockedByInterviewer
        ? "Top participant has strong interviewer metadata or role evidence."
        : "Top ranked participant is not blocked by strong interviewer evidence."
    },
    {
      gate: "contradiction",
      status: warningByContradiction ? "warning" : "passed",
      summary: warningByContradiction
        ? "Candidate-like and interviewer-like evidence conflict for the top participant."
        : "No strong contradiction is attached to the top ranked participant."
    },
    {
      gate: "ambiguity_margin",
      status: blockedByAmbiguity ? "blocked" : "passed",
      summary: blockedByAmbiguity
        ? `Top two participants are within the ${Math.round(config.thresholds.ambiguousMargin * 100)}% ambiguity margin.`
        : "Ranking margin is wide enough for the current decision state."
    },
    {
      gate: "confirmation_stability",
      status:
        result.decisionState === "CONFIRMED_CANDIDATE"
          ? "passed"
          : confirmationWarning
            ? "warning"
            : "not_applicable",
      summary:
        result.decisionState === "CONFIRMED_CANDIDATE"
          ? "Evidence is strong and stable enough for confirmation."
          : topParticipant?.confirmationBlockReason ??
            "Confirmation stability is not required for the current state."
    },
    {
      gate: "evidence_decay",
      status: "passed",
      summary:
        result.expiredSignalCount > 0
          ? `${result.expiredSignalCount} stale evidence signal(s) were filtered before scoring.`
          : "No expired evidence is affecting the current score."
    },
    {
      gate: "identity_verification_limit",
      status:
        result.decisionState === "LIKELY_CANDIDATE" ||
        result.decisionState === "CONFIRMED_CANDIDATE"
          ? "warning"
          : "not_applicable",
      summary:
        result.decisionState === "LIKELY_CANDIDATE" ||
        result.decisionState === "CONFIRMED_CANDIDATE"
          ? "Sherlock identifies the candidate stream only; face, liveness, and ID checks are not performed."
          : "Human identity verification is outside this candidate-stream ranking step."
    }
  ];

  const decisionBlocked =
    blockedByAmbiguity ||
    blockedByInterviewer ||
    result.decisionState === "INSUFFICIENT_DATA";

  return {
    pipeline: [
      {
        step: "Meeting event applied",
        status: state.events.length > 0 ? "complete" : "pending",
        summary:
          state.events.length > 0
            ? `${state.events.length} meeting event(s) are in session state.`
            : "Waiting for meeting events."
      },
      {
        step: "Signals extracted",
        status: signalCount > 0 ? "complete" : "warning",
        summary:
          signalCount > 0
            ? `${signalCount} active signal(s) are available for scoring.`
            : "No active scoring signals have been extracted yet."
      },
      {
        step: "Expired evidence filtered",
        status: "complete",
        summary:
          result.expiredSignalCount > 0
            ? `${result.expiredSignalCount} stale signal(s) removed.`
            : "No stale evidence needed filtering."
      },
      {
        step: "Signal weights applied",
        status: signalCount > 0 ? "complete" : "pending",
        summary:
          signalCount > 0
            ? "Source weights and negative multipliers were applied to active signals."
            : "Weights will apply after signals exist."
      },
      {
        step: "Participants ranked",
        status: result.participantScores.length > 0 ? "complete" : "pending",
        summary:
          result.participantScores.length > 0
            ? `${result.participantScores.length} participant stream(s) ranked.`
            : "No participants are available to rank."
      },
      {
        step: "Safety gates checked",
        status: pipelineStatus(
          blockedByAmbiguity || blockedByInterviewer,
          warningByContradiction || confirmationWarning
        ),
        summary:
          blockedByAmbiguity || blockedByInterviewer
            ? "At least one safety gate blocked selection or confirmation."
            : warningByContradiction || confirmationWarning
              ? "Safety gates passed with a warning that limits confirmation."
              : "Safety gates passed for the current decision."
      },
      {
        step: "Decision emitted",
        status: pipelineStatus(decisionBlocked, warningByContradiction),
        summary: `${result.decisionState} with ${Math.round(result.confidence * 100)}% confidence.`
      }
    ],
    scoreBreakdown: result.participantScores.map((participant) => ({
      participantId: participant.participantId,
      displayName: participant.displayName,
      positiveWeight: participant.positiveWeight,
      negativeWeight: participant.negativeWeight,
      rawScore: participant.rawScore,
      confidence: participant.confidence
    })),
    safetyGates
  };
}
