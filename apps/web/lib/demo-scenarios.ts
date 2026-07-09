import type { ScenarioFile } from "@sherlock/shared";

import scenario01 from "../../../scenarios/01_exact_name_match.json";
import scenario02 from "../../../scenarios/02_generic_device_name.json";
import scenario03 from "../../../scenarios/03_wrong_candidate_name_entered.json";
import scenario04 from "../../../scenarios/04_multiple_interviewers.json";
import scenario05 from "../../../scenarios/05_silent_observer.json";
import scenario06 from "../../../scenarios/06_display_name_change.json";
import scenario07 from "../../../scenarios/07_late_join_candidate.json";
import scenario08 from "../../../scenarios/08_two_unknown_ambiguous.json";
import scenario09 from "../../../scenarios/09_candidate_rejoins.json";
import scenario10 from "../../../scenarios/10_no_transcript_yet.json";
import scenario11 from "../../../scenarios/11_generic_transcript_not_enough.json";
import scenario12 from "../../../scenarios/12_strong_self_identification.json";
import scenario13 from "../../../scenarios/13_interviewer_candidate_transcript_conflict.json";
import scenario14 from "../../../scenarios/14_candidate_name_interviewer_email_conflict.json";
import scenario15 from "../../../scenarios/15_no_instant_confirmation.json";
import scenario16 from "../../../scenarios/16_stable_candidate_confirmation.json";
import scenario17 from "../../../scenarios/17_old_transcript_decays.json";
import scenario18 from "../../../scenarios/18_llm_candidate_self_identification.json";
import scenario19 from "../../../scenarios/19_llm_interviewer_prompt_negative.json";
import scenario20 from "../../../scenarios/20_llm_generic_project_not_enough.json";

import type { DemoScenario } from "./types";

export const recommendedDemoScenarioIds = [
  "02_generic_device_name",
  "12_strong_self_identification",
  "04_multiple_interviewers",
  "08_two_unknown_ambiguous",
  "18_llm_candidate_self_identification",
  "16_stable_candidate_confirmation"
] as const;

const scenarioFiles = [
  scenario01,
  scenario02,
  scenario03,
  scenario04,
  scenario05,
  scenario06,
  scenario07,
  scenario08,
  scenario09,
  scenario10,
  scenario11,
  scenario12,
  scenario13,
  scenario14,
  scenario15,
  scenario16,
  scenario17,
  scenario18,
  scenario19,
  scenario20
] as ScenarioFile[];

const metadata: Record<
  string,
  Pick<DemoScenario, "edgeCase" | "demoExplanation" | "whatToSay">
> = {
  "01_exact_name_match": {
    edgeCase: "Clean metadata match",
    demoExplanation: "A straightforward name/email match gives the audience a baseline before harder cases.",
    whatToSay: ["Start with the happy path.", "Sherlock still produces evidence and uncertainty instead of a silent magic answer."]
  },
  "02_generic_device_name": {
    edgeCase: "Generic device remains insufficient",
    demoExplanation: "A participant named MacBook Pro joins, but display name alone is not enough to select a candidate.",
    whatToSay: ["This is why the project exists.", "The system refuses to guess from a device name."]
  },
  "03_wrong_candidate_name_entered": {
    edgeCase: "Wrong display name",
    demoExplanation: "The entered name can be misleading, so the engine weighs stronger evidence before choosing.",
    whatToSay: ["Display names are user-controlled.", "Sherlock treats them as weak metadata, not truth."]
  },
  "04_multiple_interviewers": {
    edgeCase: "Multiple interviewers",
    demoExplanation: "Company-domain and known-interviewer signals prevent interviewers from being selected.",
    whatToSay: ["Interviewer exclusion is a safety guard.", "More people in the room should not confuse the candidate stream."]
  },
  "05_silent_observer": {
    edgeCase: "Silent observer",
    demoExplanation: "A participant without meaningful candidate evidence stays below the decision threshold.",
    whatToSay: ["Silence is not candidate evidence.", "Observers should not become accidental candidates."]
  },
  "06_display_name_change": {
    edgeCase: "Display name changes mid-call",
    demoExplanation: "The dashboard shows identity confidence changing as the participant updates their name.",
    whatToSay: ["Sherlock reacts to events over time.", "It can improve confidence without resetting the meeting."]
  },
  "07_late_join_candidate": {
    edgeCase: "Late join",
    demoExplanation: "A candidate who joins late can still become the selected stream after enough evidence arrives.",
    whatToSay: ["Order of arrival is not identity.", "The engine keeps evaluating as new evidence arrives."]
  },
  "08_two_unknown_ambiguous": {
    edgeCase: "Two unknown participants ambiguous",
    demoExplanation: "Two streams look equally candidate-like, so the engine intentionally refuses to choose.",
    whatToSay: ["Ambiguity is a valid safe outcome.", "The product should say I do not know when evidence is too close."]
  },
  "09_candidate_rejoins": {
    edgeCase: "Candidate rejoins",
    demoExplanation: "Continuity remains explainable when a candidate leaves and rejoins.",
    whatToSay: ["Realtime systems see messy call lifecycle events.", "The replay makes continuity visible."]
  },
  "10_no_transcript_yet": {
    edgeCase: "No transcript",
    demoExplanation: "Without transcript or strong metadata, the engine can remain insufficient.",
    whatToSay: ["No transcript means less evidence.", "The system waits instead of over-claiming."]
  },
  "11_generic_transcript_not_enough": {
    edgeCase: "Generic transcript",
    demoExplanation: "Generic project phrases are weak and should not instantly identify the candidate.",
    whatToSay: ["Lots of people can discuss a project.", "Self-identification is stronger than generic content."]
  },
  "12_strong_self_identification": {
    edgeCase: "Strong self-identification",
    demoExplanation: "A generic device becomes likely candidate after the speaker self-identifies in transcript.",
    whatToSay: ["This is the identity routing moment.", "The display name stays generic, but transcript evidence clarifies the stream."]
  },
  "13_interviewer_candidate_transcript_conflict": {
    edgeCase: "Transcript conflict",
    demoExplanation: "Candidate-like speech on an interviewer stream triggers contradiction handling.",
    whatToSay: ["Contradictions reduce confidence.", "The engine does not blindly trust one signal family."]
  },
  "14_candidate_name_interviewer_email_conflict": {
    edgeCase: "Candidate name with interviewer email",
    demoExplanation: "A candidate-looking name can be blocked by interviewer/company-domain metadata.",
    whatToSay: ["Safety overrides matter.", "Interviewer exclusion is stronger than a display-name match."]
  },
  "15_no_instant_confirmation": {
    edgeCase: "No instant confirmation",
    demoExplanation: "The engine can select likely candidate but delay confirmed state until stability gates pass.",
    whatToSay: ["Confirmation is stricter than selection.", "Temporal stability prevents instant overconfidence."]
  },
  "16_stable_candidate_confirmation": {
    edgeCase: "Stable confirmation",
    demoExplanation: "Repeated supporting evidence over time can move the stream to confirmed candidate.",
    whatToSay: ["This shows the confirmation gate.", "Stable evidence across time earns stronger state."]
  },
  "17_old_transcript_decays": {
    edgeCase: "Old evidence decay",
    demoExplanation: "Stale transcript evidence is protected from dominating the current decision forever.",
    whatToSay: ["Evidence has time context.", "Old signals should not overpower current ambiguity."]
  },
  "18_llm_candidate_self_identification": {
    edgeCase: "LLM candidate evidence",
    demoExplanation: "Gemini-style structured evidence is displayed as evidence, not as the final decision-maker.",
    whatToSay: ["The LLM extracts role evidence.", "Core still owns the final candidate decision."]
  },
  "19_llm_interviewer_prompt_negative": {
    edgeCase: "LLM interviewer prompt",
    demoExplanation: "Interviewer-like transcript evidence helps avoid selecting the wrong stream.",
    whatToSay: ["LLM evidence can be negative too.", "It supports interviewer exclusion without making the final call."]
  },
  "20_llm_generic_project_not_enough": {
    edgeCase: "LLM generic project phrase",
    demoExplanation: "Generic project statements from LLM extraction remain weak and may not be enough.",
    whatToSay: ["The system handles weak LLM evidence conservatively.", "This prevents a black-box transcript shortcut."]
  }
};

export const demoScenarios: DemoScenario[] = scenarioFiles.map((scenario) => {
  const extra = metadata[scenario.id] ?? {
    edgeCase: "Candidate identity edge case",
    demoExplanation: scenario.title,
    whatToSay: ["Replay the scenario.", "Point out how evidence and uncertainty change over time."]
  };

  return {
    id: scenario.id,
    title: scenario.title,
    meeting: scenario.meeting,
    participants: scenario.participants,
    events: scenario.events,
    expected: scenario.expected,
    expectedState: scenario.expected.finalState ?? "INSUFFICIENT_DATA",
    expectedSelectedCandidateId: scenario.expected.candidateParticipantId,
    ...extra
  };
});

export function getScenarioById(id: string) {
  return demoScenarios.find((scenario) => scenario.id === id) ?? demoScenarios[0];
}

export function getRecommendedDemoScenarios() {
  return recommendedDemoScenarioIds
    .map((id) => demoScenarios.find((scenario) => scenario.id === id))
    .filter((scenario): scenario is DemoScenario => Boolean(scenario));
}
