import type { DemoScenario } from "../../lib/types";

export function DemoNarrationPanel({ scenario }: { scenario: DemoScenario }) {
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
    </section>
  );
}
