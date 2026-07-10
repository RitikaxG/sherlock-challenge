import { decisionTracePipeline } from "../../lib/replay-helpers";
import type { CandidateStateSnapshot } from "../../lib/types";

export function PipelineStepper({
  snapshot
}: {
  snapshot: CandidateStateSnapshot | null;
}) {
  const steps = decisionTracePipeline(snapshot);

  return (
    <section className="panel pipeline-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Pipeline trace</p>
          <h2>Event to decision path</h2>
        </div>
      </div>
      <div className="pipeline-steps">
        {steps.map((step, index) => (
          <article
            className={`pipeline-step ${step.status}`}
            key={`${step.step}_${index}`}
            title={step.summary}
          >
            <span>{index + 1}</span>
            <div>
              <strong>{step.step}</strong>
              <em>{step.status}</em>
              <p>{step.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
