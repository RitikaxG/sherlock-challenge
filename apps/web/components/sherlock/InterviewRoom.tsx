import { ParticipantTile } from "./ParticipantTile";
import type {
  CandidateStateSnapshot,
  ParticipantRuntimeState
} from "../../lib/types";

export function InterviewRoom({
  participants,
  snapshot
}: {
  participants: ParticipantRuntimeState[];
  snapshot: CandidateStateSnapshot | null;
}) {
  return (
    <section className="panel room-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Interview room</p>
          <h2>Participant streams</h2>
        </div>
        {snapshot?.state === "AMBIGUOUS" ? (
          <span className="warning-badge">intentionally not selecting</span>
        ) : null}
      </div>
      <div className="participant-grid">
        {participants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            snapshot={snapshot}
          />
        ))}
      </div>
    </section>
  );
}
