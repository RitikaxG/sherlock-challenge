import type { DemoScenario } from "../../lib/types";

export function ScenarioSelector({
  scenarios,
  mode,
  selectedId,
  onModeChange,
  onSelect
}: {
  scenarios: DemoScenario[];
  mode: "recommended" | "all";
  selectedId: string;
  onModeChange: (mode: "recommended" | "all") => void;
  onSelect: (scenario: DemoScenario) => void;
}) {
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0];

  return (
    <section className="panel setup-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Demo setup</p>
          <h2>Scenario and participant metadata</h2>
        </div>
        <span className="count-badge">{scenarios.length} fixtures</span>
      </div>
      <label className="scenario-dropdown">
        <span>Available edge/test cases</span>
        <select
          value={selectedId}
          onChange={(event) => {
            const next = scenarios.find(
              (scenario) => scenario.id === event.target.value
            );
            if (next) {
              onSelect(next);
            }
          }}
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.id.slice(0, 2)} - {scenario.edgeCase} ({scenario.expectedState})
            </option>
          ))}
        </select>
      </label>
      <div className="scenario-mode-toggle" role="group" aria-label="Scenario list mode">
        <span>Show</span>
        <button
          className={mode === "recommended" ? "selected" : ""}
          onClick={() => onModeChange("recommended")}
          type="button"
        >
          Recommended demo path
        </button>
        <button
          className={mode === "all" ? "selected" : ""}
          onClick={() => onModeChange("all")}
          type="button"
        >
          All scenarios
        </button>
      </div>

      {selectedScenario ? (
        <div className="scenario-detail">
          <div className="scenario-summary">
            <div>
              <span>Case</span>
              <strong>{selectedScenario.title}</strong>
            </div>
            <div>
              <span>Expected state</span>
              <strong>{selectedScenario.expectedState}</strong>
            </div>
            <div>
              <span>Expected stream</span>
              <strong>{selectedScenario.expectedSelectedCandidateId ?? "none"}</strong>
            </div>
            <div>
              <span>Replay events</span>
              <strong>{selectedScenario.events.length}</strong>
            </div>
          </div>

          <div className="metadata-table">
            <div className="metadata-head">
              <span>Participant</span>
              <span>Display metadata</span>
              <span>Email / role hints</span>
              <span>Join metadata</span>
            </div>
            {selectedScenario.participants.map((participant) => (
              <div className="metadata-row" key={participant.id}>
                <span>{participant.id}</span>
                <span>{participant.currentName ?? participant.displayName}</span>
                <span>
                  {participant.email ?? "no email"} ·{" "}
                  {participant.isKnownInterviewerHint
                    ? "known interviewer"
                    : "no interviewer hint"}
                </span>
                <span>
                  joined {participant.joinedAtSec ?? "unknown"}s
                  {participant.leftAtSec !== undefined
                    ? ` · left ${participant.leftAtSec}s`
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
