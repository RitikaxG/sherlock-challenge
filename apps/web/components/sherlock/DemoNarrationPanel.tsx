import { getScenarioResult } from "../../lib/scenario-results";
import type {
  CandidateStateSnapshot,
  DemoScenario,
  ReplayStatus
} from "../../lib/types";

export function DemoNarrationPanel({
  scenario,
  snapshot,
  status
}: {
  scenario: DemoScenario;
  snapshot: CandidateStateSnapshot | null;
  status: ReplayStatus;
}) {
  const result = getScenarioResult(scenario, snapshot, status);

  return (
    <section className="panel narration-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Demo script</p>
          <h2>What to say</h2>
        </div>
      </div>
      <p>{scenario.demoExplanation}</p>
      <ul>
        {scenario.whatToSay.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="expected-box">
        <span>Expected</span>
        <strong>{scenario.expectedState}</strong>
        <small>{scenario.expectedSelectedCandidateId ?? "no selected candidate"}</small>
      </div>
      <div className={`scenario-result-box result-${result.status}`}>
        <span>Expected vs actual</span>
        <strong>
          {result.status === "pending"
            ? "waiting for replay completion"
            : result.status.toUpperCase()}
        </strong>
        <small>
          Expected: {result.expectedState} /{" "}
          {result.expectedSelectedCandidateId ?? "no selected candidate"}
        </small>
        <small>
          Actual: {result.actualState ?? "not available"} /{" "}
          {result.actualSelectedCandidateId ?? "no selected candidate"}
        </small>
      </div>
    </section>
  );
}
