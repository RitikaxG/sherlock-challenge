"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useMeetingReplay } from "../../hooks/useMeetingReplay";
import { useMeetingWebSocket } from "../../hooks/useMeetingWebSocket";
import {
  demoScenarios,
  getRecommendedDemoScenarios
} from "../../lib/demo-scenarios";
import type { ConnectionStatus, DemoScenario } from "../../lib/types";
import { CandidateDecisionPanel } from "./CandidateDecisionPanel";
import { ConnectionStatusBadge } from "./ConnectionStatus";
import { DemoNarrationPanel } from "./DemoNarrationPanel";
import { EvaluationCriteriaPanel } from "./EvaluationCriteriaPanel";
import { EvidencePanel } from "./EvidencePanel";
import { EventTimeline } from "./EventTimeline";
import { InterviewRoom } from "./InterviewRoom";
import { ReplayControls } from "./ReplayControls";
import { ScenarioSelector } from "./ScenarioSelector";
import { TranscriptPanel } from "./TranscriptPanel";

export function AppShell() {
  const recommendedScenarios = useMemo(() => getRecommendedDemoScenarios(), []);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(
    recommendedScenarios[0] ?? demoScenarios[0]!
  );
  const [scenarioMode, setScenarioMode] =
    useState<"recommended" | "all">("recommended");
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const runner = useMeetingReplay(selectedScenario);

  const handleScenarioSelect = useCallback((scenario: DemoScenario) => {
    runner.reset();
    setSelectedScenario(scenario);
    setConnectionStatus("idle");
  }, [runner]);

  const visibleScenarios = useMemo(
    () => scenarioMode === "recommended" ? recommendedScenarios : demoScenarios,
    [recommendedScenarios, scenarioMode]
  );

  const handleScenarioModeChange = useCallback(
    (mode: "recommended" | "all") => {
      setScenarioMode(mode);
      const nextScenarios = mode === "recommended" ? recommendedScenarios : demoScenarios;
      if (!nextScenarios.some((scenario) => scenario.id === selectedScenario.id)) {
        const next = nextScenarios[0];
        if (next) {
          runner.reset();
          setSelectedScenario(next);
          setConnectionStatus("idle");
        }
      }
    },
    [recommendedScenarios, runner, selectedScenario.id]
  );

  const handleWsMessage = useCallback(
    (message: { snapshot: NonNullable<typeof runner.snapshot> }) => {
      runner.receiveSnapshot(message.snapshot);
    },
    [runner]
  );

  const handleWsStatus = useCallback(
    (status: "open" | "closed" | "error") => {
      if (status === "open") {
        setConnectionStatus("connected");
      } else if (status === "error") {
        setConnectionStatus("polling");
      } else if (connectionStatus !== "polling") {
        setConnectionStatus("offline");
      }
    },
    [connectionStatus, runner]
  );

  useMeetingWebSocket(
    runner.meetingId,
    Boolean(runner.meetingId && !runner.useLocalFallback),
    handleWsMessage,
    handleWsStatus
  );

  useEffect(() => {
    if (runner.meetingId && !runner.useLocalFallback && connectionStatus === "idle") {
      setConnectionStatus("connecting");
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
            status={runner.useLocalFallback ? "offline" : connectionStatus}
            warning={runner.backendWarning}
          />
        </div>
      </header>

      {runner.backendWarning ? (
        <div className="warning-banner">{runner.backendWarning}</div>
      ) : null}

      <div className="dashboard-grid">
        <div className="left-stack">
          <ScenarioSelector
            scenarios={visibleScenarios}
            mode={scenarioMode}
            selectedId={selectedScenario.id}
            onModeChange={handleScenarioModeChange}
            onSelect={handleScenarioSelect}
          />
          <InterviewRoom
            participants={runner.participants}
            snapshot={runner.snapshot}
          />
          <div className="feed-grid">
            <TranscriptPanel items={runner.transcript} />
            <EventTimeline items={runner.timeline} />
          </div>
        </div>

        <div className="right-stack">
          <CandidateDecisionPanel
            snapshot={runner.snapshot}
            participants={runner.participants}
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
          <DemoNarrationPanel
            scenario={selectedScenario}
            snapshot={runner.snapshot}
            status={runner.status}
          />
        </div>

        <EvidencePanel snapshot={runner.snapshot} />
        <EvaluationCriteriaPanel snapshot={runner.snapshot} />
      </div>
    </main>
  );
}
