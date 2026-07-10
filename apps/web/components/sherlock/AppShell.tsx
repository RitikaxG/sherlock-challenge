"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useMeetingReplay } from "../../hooks/useMeetingReplay";
import { useMeetingWebSocket } from "../../hooks/useMeetingWebSocket";
import { demoScenarios } from "../../lib/demo-scenarios";
import type { ConnectionStatus, DemoScenario } from "../../lib/types";
import { CandidateDecisionPanel } from "./CandidateDecisionPanel";
import { ConnectionStatusBadge } from "./ConnectionStatus";
import { DecisionSummaryHero } from "./DecisionSummaryHero";
import { DemoNarrationPanel } from "./DemoNarrationPanel";
import { EvidencePanel } from "./EvidencePanel";
import { EventImpactPanel } from "./EventImpactPanel";
import { EventTimeline } from "./EventTimeline";
import { InterviewRoom } from "./InterviewRoom";
import { PipelineStepper } from "./PipelineStepper";
import { ReplayControls } from "./ReplayControls";
import { ScenarioSelector } from "./ScenarioSelector";
import { SignalBreakdownCharts } from "./SignalBreakdownCharts";
import { TranscriptPanel } from "./TranscriptPanel";
import { WhyCandidateCard } from "./WhyCandidateCard";

export function AppShell() {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(
    demoScenarios[0]!
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const runner = useMeetingReplay(selectedScenario);

  const handleScenarioSelect = useCallback((scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setConnectionStatus("idle");
  }, []);

  const handleWsMessage = useCallback(
    (message: { snapshot: NonNullable<typeof runner.snapshot> }) => {
      runner.receiveSnapshot(message.snapshot);
    },
    [runner]
  );

  const handleWsStatus = useCallback(
    (status: "open" | "closed" | "error") => {
      if (status === "open") {
        setConnectionStatus("websocket_connected");
      } else if (status === "error") {
        setConnectionStatus("polling");
      } else if (runner.meetingId && connectionStatus !== "polling") {
        setConnectionStatus("websocket_disconnected");
      } else if (connectionStatus !== "polling") {
        setConnectionStatus("idle");
      }
    },
    [connectionStatus, runner.meetingId]
  );

  useMeetingWebSocket(
    runner.meetingId,
    Boolean(runner.meetingId && !runner.useLocalFallback),
    handleWsMessage,
    handleWsStatus
  );

  useEffect(() => {
    if (runner.meetingId && !runner.useLocalFallback && connectionStatus === "idle") {
      setConnectionStatus("backend_connected");
    }
  }, [connectionStatus, runner.meetingId, runner.useLocalFallback]);

  useEffect(() => {
    if (connectionStatus !== "polling") {
      return;
    }

    const interval = window.setInterval(() => {
      void runner.pollSnapshot();
    }, 7500);

    return () => window.clearInterval(interval);
  }, [connectionStatus, runner]);

  const currentScenarioLabel = useMemo(
    () => `${selectedScenario.id.slice(0, 2)} · ${selectedScenario.edgeCase}`,
    [selectedScenario]
  );

  return (
    <main className="sherlock-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sherlock Candidate Identity Fusion Engine</p>
          <h1>Sherlock Live Candidate Identity Demo</h1>
        </div>
        <div className="topbar-meta">
          <span>{runner.status}</span>
          <span>{currentScenarioLabel}</span>
          <ConnectionStatusBadge
            status={runner.useLocalFallback ? "local_fallback" : connectionStatus}
            warning={runner.backendWarning}
          />
        </div>
      </header>

      {runner.backendWarning ? (
        <div className="warning-banner">{runner.backendWarning}</div>
      ) : null}

      <DecisionSummaryHero
        snapshot={runner.snapshot}
        participants={runner.participants}
      />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="left-stack">
            <ScenarioSelector
              scenarios={demoScenarios}
              selectedId={selectedScenario.id}
              onSelect={handleScenarioSelect}
            />
            <InterviewRoom
              key={selectedScenario.id}
              participants={runner.participants}
              snapshot={runner.snapshot}
            />
            <WhyCandidateCard
              snapshot={runner.snapshot}
              participants={runner.participants}
            />
            <PipelineStepper snapshot={runner.snapshot} />
            <div className="feed-grid">
              <TranscriptPanel items={runner.transcript} />
              <EventTimeline items={runner.timeline} />
            </div>
            <DemoNarrationPanel
              scenario={selectedScenario}
              snapshot={runner.snapshot}
              status={runner.status}
            />
          </div>

          <div className="right-stack">
            <CandidateDecisionPanel
              snapshot={runner.snapshot}
              participants={runner.participants}
            />
            <EventImpactPanel
              impact={runner.eventImpact}
              selectedCandidateId={runner.snapshot?.selectedCandidateId}
            />
            <ReplayControls
              status={runner.status}
              speed={runner.replaySpeed}
              currentEventIndex={runner.currentEventIndex}
              totalEvents={selectedScenario.events.length}
              onSpeedChange={runner.setReplaySpeed}
              onStart={() => void runner.start()}
              onPause={runner.pause}
              onResume={runner.resume}
              onStep={() => void runner.stepNext()}
              onReset={runner.reset}
            />
          </div>
        </div>

        <EvidencePanel snapshot={runner.snapshot} />
        <SignalBreakdownCharts snapshot={runner.snapshot} />
      </div>
    </main>
  );
}
