"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  createMeeting,
  getSnapshot,
  postMeetingEvent
} from "../lib/sherlock-api";
import { createFallbackSnapshot } from "../lib/demo-snapshots";
import { timelineItemForEvent, transcriptItemForEvent } from "../lib/event-formatters";
import { buildEventImpact, snapshotKey } from "../lib/replay-helpers";
import type {
  CandidateStateSnapshot,
  DemoScenario,
  EventImpact,
  MeetingEvent,
  ParticipantRuntimeState,
  ReplaySpeed,
  ReplayStatus,
  TimelineItem,
  TranscriptItem
} from "../lib/types";

const speedDelayMs: Record<ReplaySpeed, number> = {
  "0.5x": 2400,
  "1x": 1400,
  "2x": 800,
  instant: 160
};

function createRuntimeParticipants(scenario: DemoScenario): ParticipantRuntimeState[] {
  return scenario.participants.map((participant) => ({
    ...participant,
    currentDisplayName: participant.currentName ?? participant.displayName,
    joined: false,
    webcamOn: false,
    sharingScreen: false,
    speaking: false
  }));
}

function applyParticipantEvent(
  participants: readonly ParticipantRuntimeState[],
  event: MeetingEvent
): ParticipantRuntimeState[] {
  return participants.map((participant) => {
    if (participant.id !== event.participantId) {
      return event.type === "speaking_activity"
        ? { ...participant, speaking: false }
        : participant;
    }

    switch (event.type) {
      case "participant_joined":
        return { ...participant, joined: true };
      case "participant_left":
        return { ...participant, joined: false, speaking: false };
      case "display_name_changed":
        return { ...participant, currentDisplayName: event.newDisplayName };
      case "webcam_changed":
        return { ...participant, webcamOn: event.webcamOn };
      case "screen_share_changed":
        return { ...participant, sharingScreen: event.sharing };
      case "speaking_activity":
        return { ...participant, speaking: true, lastSpokeAtSec: event.timestampSec };
      default:
        return participant;
    }
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useScenarioRunner(selectedScenario: DemoScenario) {
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantRuntimeState[]>(() =>
    createRuntimeParticipants(selectedScenario)
  );
  const [snapshot, setSnapshot] = useState<CandidateStateSnapshot | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<ReplayStatus>("idle");
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [backendWarning, setBackendWarning] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>("1x");
  const [eventImpact, setEventImpact] = useState<EventImpact | null>(null);
  const abortRef = useRef(false);
  const statusRef = useRef<ReplayStatus>("idle");
  const indexRef = useRef(0);
  const participantsRef = useRef<ParticipantRuntimeState[]>(participants);
  const meetingIdRef = useRef<string | null>(null);
  const localFallbackRef = useRef(false);
  const lastSnapshotKeyRef = useRef<string | null>(null);
  const snapshotRef = useRef<CandidateStateSnapshot | null>(null);

  const reset = useCallback(() => {
    const nextParticipants = createRuntimeParticipants(selectedScenario);
    abortRef.current = true;
    statusRef.current = "idle";
    indexRef.current = 0;
    setMeetingId(null);
    meetingIdRef.current = null;
    setParticipants(nextParticipants);
    participantsRef.current = nextParticipants;
    setSnapshot(null);
    snapshotRef.current = null;
    setEventImpact(null);
    setTimeline([]);
    setTranscript([]);
    setStatus("idle");
    setCurrentEventIndex(0);
    setBackendWarning(null);
    setUseLocalFallback(false);
    localFallbackRef.current = false;
    lastSnapshotKeyRef.current = null;
  }, [selectedScenario]);

  useLayoutEffect(() => {
    reset();
  }, [reset]);

  const appendSnapshotTimeline = useCallback((nextSnapshot: CandidateStateSnapshot) => {
    setTimeline((items) => [
      ...items,
      {
        id: `snapshot_${items.length}_${nextSnapshot.state}_${nextSnapshot.timestampSec ?? Date.now()}`,
        timestampSec: nextSnapshot.timestampSec,
        kind: "snapshot",
        label: "candidate_state_updated",
        detail: `${nextSnapshot.state} · selected ${nextSnapshot.selectedCandidateId ?? "none"} · ${Math.round(nextSnapshot.confidence * 100)}%`,
        changedSnapshot: true
      }
    ]);
  }, []);

  const receiveSnapshot = useCallback(
    (nextSnapshot: CandidateStateSnapshot) => {
      setSnapshot(nextSnapshot);
      snapshotRef.current = nextSnapshot;
      const nextKey = snapshotKey(nextSnapshot);
      if (lastSnapshotKeyRef.current !== nextKey) {
        appendSnapshotTimeline(nextSnapshot);
        lastSnapshotKeyRef.current = nextKey;
      }
    },
    [appendSnapshotTimeline]
  );

  const startMeeting = useCallback(async () => {
    if (meetingIdRef.current || localFallbackRef.current) {
      return meetingIdRef.current ?? selectedScenario.meeting.id;
    }

    try {
      const response = await createMeeting({
        meeting: selectedScenario.meeting,
        participants: selectedScenario.participants
      });
      setMeetingId(response.meetingId);
      meetingIdRef.current = response.meetingId;
      receiveSnapshot(response.snapshot);
      return response.meetingId;
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true") {
        setBackendWarning("Backend unavailable - showing local visual demo only.");
        setUseLocalFallback(true);
        localFallbackRef.current = true;
        const fallback = createFallbackSnapshot(selectedScenario, null, -1);
        receiveSnapshot(fallback);
        return selectedScenario.meeting.id;
      }

      throw error;
    }
  }, [meetingId, receiveSnapshot, selectedScenario, useLocalFallback]);

  const sendEventAtIndex = useCallback(
    async (eventIndex: number) => {
      const event = selectedScenario.events[eventIndex];
      if (!event) {
        setStatus("completed");
        statusRef.current = "completed";
        return;
      }

      const previousParticipants = participantsRef.current;
      const updatedParticipants = applyParticipantEvent(previousParticipants, event);
      participantsRef.current = updatedParticipants;
      setParticipants(updatedParticipants);
      setTimeline((items) => [
        ...items,
        timelineItemForEvent(event, eventIndex, previousParticipants)
      ]);
      const transcriptItem = transcriptItemForEvent(event, updatedParticipants);
      if (transcriptItem) {
        setTranscript((items) => [...items, transcriptItem]);
      }

      if (localFallbackRef.current) {
        const nextSnapshot = createFallbackSnapshot(selectedScenario, event, eventIndex);
        setEventImpact(buildEventImpact(event, snapshotRef.current, nextSnapshot));
        receiveSnapshot(nextSnapshot);
      } else if (meetingIdRef.current) {
        const response = await postMeetingEvent(meetingIdRef.current, event);
        if (response.llmEvent) {
          setTimeline((items) => [
            ...items,
            timelineItemForEvent(
              response.llmEvent as MeetingEvent,
              eventIndex,
              updatedParticipants
            )
          ]);
          const llmTranscriptItem = transcriptItemForEvent(
            response.llmEvent as MeetingEvent,
            updatedParticipants
          );
          if (llmTranscriptItem) {
            setTranscript((items) => [...items, llmTranscriptItem]);
          }
        }
        setEventImpact(buildEventImpact(event, snapshotRef.current, response.snapshot));
        receiveSnapshot(response.snapshot);
        if (response.llmWarning) {
          setBackendWarning(response.llmWarning);
        }
      }

      const nextIndex = eventIndex + 1;
      indexRef.current = nextIndex;
      setCurrentEventIndex(nextIndex);

      if (nextIndex >= selectedScenario.events.length) {
        setStatus("completed");
        statusRef.current = "completed";
      }
    },
    [meetingId, receiveSnapshot, selectedScenario, useLocalFallback]
  );

  const stepNext = useCallback(async () => {
    await startMeeting();
    await sendEventAtIndex(indexRef.current);
  }, [sendEventAtIndex, startMeeting]);

  const start = useCallback(async () => {
    abortRef.current = false;
    await startMeeting();
    setStatus("running");
    statusRef.current = "running";

    while (
      !abortRef.current &&
      statusRef.current === "running" &&
      indexRef.current < selectedScenario.events.length
    ) {
      await sendEventAtIndex(indexRef.current);
      const delay = speedDelayMs[replaySpeed];
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }, [replaySpeed, selectedScenario.events.length, sendEventAtIndex, startMeeting]);

  const pause = useCallback(() => {
    setStatus("paused");
    statusRef.current = "paused";
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") {
      return;
    }

    void start();
  }, [start]);

  const pollSnapshot = useCallback(async () => {
    if (!meetingId || useLocalFallback) {
      return;
    }

    const response = await getSnapshot(meetingId);
    receiveSnapshot(response.snapshot);
  }, [meetingId, receiveSnapshot, useLocalFallback]);

  return {
    meetingId,
    participants,
    snapshot,
    timeline,
    transcript,
    status,
    currentEventIndex,
    backendWarning,
    useLocalFallback,
    replaySpeed,
    eventImpact,
    setReplaySpeed,
    start,
    pause,
    resume,
    reset,
    stepNext,
    receiveSnapshot,
    pollSnapshot
  };
}
