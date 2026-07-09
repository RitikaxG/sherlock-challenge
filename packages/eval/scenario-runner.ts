import {
  applyMeetingEvent,
  createInitialSessionState,
  rankParticipants
} from "@sherlock/core";
import type {
  CandidateStateSnapshot,
  MeetingEvent,
  ScenarioFile
} from "@sherlock/shared";

export type ScenarioTimelineEntry = {
  readonly eventIndex: number;
  readonly event: MeetingEvent;
  readonly timestampSec: number;
  readonly snapshot: CandidateStateSnapshot;
};

export type ScenarioReplayResult = {
  readonly scenario: ScenarioFile;
  readonly scenarioId: string;
  readonly title: string;
  readonly timeline: readonly ScenarioTimelineEntry[];
  readonly finalSnapshot: CandidateStateSnapshot;
};

export function runScenario(scenario: ScenarioFile): ScenarioReplayResult {
  const orderedEvents = [...scenario.events].sort(
    (left, right) => left.timestampSec - right.timestampSec
  );
  let session = createInitialSessionState(
    scenario.meeting,
    scenario.participants
  );

  const timeline = orderedEvents.map<ScenarioTimelineEntry>((event, index) => {
    session = applyMeetingEvent(session, event);
    const snapshot = {
      ...rankParticipants(session),
      timestampSec: event.timestampSec
    };

    return {
      eventIndex: index,
      event,
      timestampSec: event.timestampSec,
      snapshot
    };
  });

  const finalSnapshot =
    timeline.at(-1)?.snapshot ?? {
      ...rankParticipants(session),
      timestampSec: 0
    };

  return {
    scenario,
    scenarioId: scenario.id,
    title: scenario.title,
    timeline,
    finalSnapshot
  };
}
