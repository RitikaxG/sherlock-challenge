import type { ReplaySpeed, ReplayStatus } from "../../lib/types";

const speeds: ReplaySpeed[] = ["0.5x", "1x", "2x", "instant"];

export function ReplayControls({
  status,
  speed,
  currentEventIndex,
  totalEvents,
  onSpeedChange,
  onStart,
  onPause,
  onResume,
  onStep,
  onReset
}: {
  status: ReplayStatus;
  speed: ReplaySpeed;
  currentEventIndex: number;
  totalEvents: number;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
}) {
  return (
    <section className="panel controls-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Scenario replay</p>
          <h2>{status}</h2>
        </div>
        <span className="count-badge">
          {currentEventIndex}/{totalEvents} events
        </span>
      </div>
      <div className="control-row">
        <button className="primary-button" onClick={onStart} type="button">
          Start
        </button>
        <button onClick={onPause} type="button">
          Pause
        </button>
        <button onClick={onResume} type="button">
          Resume
        </button>
        <button onClick={onStep} type="button">
          Step
        </button>
        <button onClick={onReset} type="button">
          Reset
        </button>
      </div>
      <div className="speed-row" role="group" aria-label="Replay speed">
        {speeds.map((item) => (
          <button
            className={item === speed ? "selected" : ""}
            key={item}
            onClick={() => onSpeedChange(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
