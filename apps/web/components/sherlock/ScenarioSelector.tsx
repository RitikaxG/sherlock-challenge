import type { DemoScenario } from "../../lib/types";

export function ScenarioSelector({
  scenarios,
  selectedId,
  onSelect
}: {
  scenarios: DemoScenario[];
  selectedId: string;
  onSelect: (scenario: DemoScenario) => void;
}) {
  return (
    <section className="panel setup-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Demo setup</p>
          <h2>Edge-case scenario</h2>
        </div>
        <span className="count-badge">{scenarios.length} fixtures</span>
      </div>
      <div className="scenario-list">
        {scenarios.map((scenario) => (
          <button
            className={`scenario-card ${scenario.id === selectedId ? "selected" : ""}`}
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            type="button"
          >
            <span>{scenario.id.slice(0, 2)}</span>
            <strong>{scenario.edgeCase}</strong>
            <small>{scenario.expectedState}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
