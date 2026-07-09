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
          <p className="eyebrow">Replay driver</p>
          <h2>Send fixture events to the backend</h2>
        </div>
        <span className="count-badge">
          {currentEventIndex}/{totalEvents} events
        </span>
      </div>
      <p className="control-explainer">
        This simulates the meeting bot. Each action posts participant,
        metadata, transcript, or LLM evidence events to `apps/http`; the page
        only displays backend snapshots.
      </p>
      <div className="replay-state-line">
        <span>Status</span>
        <strong>{status}</strong>
      </div>
      <div className="control-row">
        <button className="primary-button" onClick={onStart} type="button">
          Run replay
        </button>
        <button onClick={onPause} type="button">
          Pause
        </button>
        <button onClick={onResume} type="button">
          Resume
        </button>
        <button onClick={onStep} type="button">
          Send next event
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
