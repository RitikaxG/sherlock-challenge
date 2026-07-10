import { formatPercent } from "../../lib/decision-copy";
import type {
  CandidateStateSnapshot,
  ParticipantRuntimeState
} from "../../lib/types";

export function ParticipantTile({
  participant,
  snapshot
}: {
  participant: ParticipantRuntimeState;
  snapshot: CandidateStateSnapshot | null;
}) {
  const score = snapshot?.participants.find(
    (item) => item.participantId === participant.id
  );
  const selected = snapshot?.selectedCandidateId === participant.id;
  const topTwo = snapshot?.state === "AMBIGUOUS"
    ? snapshot.participants.slice(0, 2).some((item) => item.participantId === participant.id)
    : false;

  return (
    <article className={`participant-tile ${selected ? "selected" : ""} ${topTwo ? "competing" : ""}`}>
      <div className="tile-video">
        <div className="avatar">{participant.currentDisplayName.slice(0, 1).toUpperCase()}</div>
        {participant.speaking ? <span className="speaking-ring" /> : null}
      </div>
      <div className="tile-content">
        <div className="tile-title-row">
          <h3>{participant.currentDisplayName}</h3>
          <span className={`state-badge ${participant.joined ? "ok" : "muted"}`}>
            {participant.joined ? "joined" : "not joined"}
          </span>
        </div>
        <p>{participant.id}</p>
        {participant.email ? <p>{participant.email}</p> : null}
        <div className="tile-badges">
          <span>{participant.isKnownInterviewerHint ? "known interviewer" : "unknown/participant"}</span>
          <span>{participant.webcamOn ? "webcam on" : "webcam off"}</span>
          <span>{participant.sharingScreen ? "sharing" : "not sharing"}</span>
          {selected ? <span className="candidate-badge">selected stream</span> : null}
          {!selected && participant.isKnownInterviewerHint ? (
            <span className="warning-badge">known interviewer</span>
          ) : null}
          {topTwo ? <span className="warning-badge">competing candidate</span> : null}
        </div>
        <div className="score-row">
          <span>Candidate confidence</span>
          <strong>{formatPercent(score?.confidence ?? 0)}</strong>
        </div>
        <div className="meter">
          <span style={{ width: `${Math.round((score?.confidence ?? 0) * 100)}%` }} />
        </div>
      </div>
    </article>
  );
}
