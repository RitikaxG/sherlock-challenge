import {
  decisionSummary,
  findParticipantName,
  formatPercent,
  inferMargin
} from "../../lib/decision-copy";
import type {
  CandidateStateSnapshot,
  ParticipantRuntimeState
} from "../../lib/types";

export function CandidateDecisionPanel({
  snapshot,
  participants
}: {
  snapshot: CandidateStateSnapshot | null;
  participants: ParticipantRuntimeState[];
}) {
  const margin = inferMargin(snapshot);
  const selectedName = findParticipantName(
    snapshot?.selectedCandidateId ?? null,
    participants
  );

  return (
    <section className={`panel decision-panel state-${snapshot?.state ?? "INSUFFICIENT_DATA"}`}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Candidate decision</p>
          <h2>{snapshot?.state ?? "Waiting for meeting"}</h2>
        </div>
        <span className="confidence-chip">{formatPercent(snapshot?.confidence ?? 0)}</span>
      </div>
      <div className="decision-hero">
        <span>Selected stream</span>
        <strong>{selectedName}</strong>
        <small>{snapshot?.selectedCandidateId ?? "No candidate selected"}</small>
      </div>
      <div className="decision-stats">
        <div>
          <span>Margin</span>
          <strong>{margin === null ? "n/a" : formatPercent(margin)}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{snapshot?.timestampSec ?? 0}s</strong>
        </div>
      </div>
      <div className="leaderboard">
        <div className="leaderboard-heading">
          <strong>Top streams</strong>
          <span>Backend ranking</span>
        </div>
        {(snapshot?.participants ?? []).slice(0, 4).length === 0 ? (
          <p>No participant scores yet.</p>
        ) : (
          snapshot?.participants.slice(0, 4).map((participant, index) => {
            const selected = snapshot.selectedCandidateId === participant.participantId;
            const competing =
              snapshot.state === "AMBIGUOUS" &&
              snapshot.participants
                .slice(0, 2)
                .some((item) => item.participantId === participant.participantId);
            const runtimeName = findParticipantName(
              participant.participantId,
              participants
            );

            return (
              <div
                className={`leaderboard-row ${selected ? "selected" : ""} ${competing ? "competing" : ""}`}
                key={participant.participantId}
              >
                <span>{index + 1}</span>
                <strong>
                  {participant.participantId} / {runtimeName}
                </strong>
                <em>{formatPercent(participant.confidence)}</em>
              </div>
            );
          })
        )}
      </div>
      <div className="why-box">
        <strong>Why</strong>
        <p>{decisionSummary(snapshot)}</p>
      </div>
      <div className="boundary-note">
        Candidate participant stream identified only. Human identity verification and fraud detection are not performed here.
      </div>
    </section>
  );
}
