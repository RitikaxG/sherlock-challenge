import { createSignal } from "./evidence.ts";
import { defaultFusionConfig } from "./fusion-config.ts";
import { safeNumber } from "./helpers.ts";
import type { CandidateSessionState } from "./session-state.ts";
import type { ExtractedSignal } from "./signal-types.ts";

export function extractBehaviorSignals(
  state: CandidateSessionState
): ExtractedSignal[] {
  const latestTimestampSec = Math.max(
    0,
    ...state.events.map((event) => event.timestampSec)
  );

  return state.participants.flatMap((participant) => {
    const signals: ExtractedSignal[] = [];
    const speakingDurationSec = safeNumber(
      state.participantSpeakingDurationSec[participant.id]
    );
    const latestSpeakingEvent = state.events
      .filter(
        (event) =>
          event.type === "speaking_activity" &&
          event.participantId === participant.id
      )
      .at(-1);
    const latestWebcamEvent = state.events
      .filter(
        (event) =>
          event.type === "webcam_changed" && event.participantId === participant.id
      )
      .at(-1);
    const latestScreenShareEvent = state.events
      .filter(
        (event) =>
          event.type === "screen_share_changed" &&
          event.participantId === participant.id
      )
      .at(-1);

    if (speakingDurationSec > 0) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "speaking_activity",
          direction: "positive",
          strength: Math.min(0.35, 0.1 + speakingDurationSec / 600),
          reason: "Participant has spoken during the meeting.",
          source: "behavior",
          specificity: "weak",
          timestampSec: latestSpeakingEvent?.timestampSec,
          sourceEventIds: latestSpeakingEvent?.sourceEventId
            ? [latestSpeakingEvent.sourceEventId]
            : undefined,
          expiresAtSec:
            latestSpeakingEvent?.timestampSec !== undefined
              ? latestSpeakingEvent.timestampSec +
                defaultFusionConfig.behaviorSignalTtlSec
              : undefined,
          isPersistent: false
        })
      );
    } else if (latestTimestampSec >= 600) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "long_silence",
          direction: "neutral",
          strength: 0.15,
          reason:
            "Participant has no speaking activity after enough meeting time has elapsed.",
          source: "behavior",
          specificity: "weak",
          timestampSec: latestTimestampSec,
          isPersistent: false
        })
      );
    }

    if (state.webcamOnByParticipant[participant.id]) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "webcam_on",
          direction: "positive",
          strength: 0.12,
          reason: "Participant has webcam enabled.",
          source: "behavior",
          specificity: "weak",
          timestampSec: latestWebcamEvent?.timestampSec,
          expiresAtSec:
            latestWebcamEvent?.timestampSec !== undefined
              ? latestWebcamEvent.timestampSec +
                defaultFusionConfig.behaviorSignalTtlSec
              : undefined,
          isPersistent: false
        })
      );
    }

    if (state.screenShareByParticipant[participant.id]) {
      signals.push(
        createSignal({
          participantId: participant.id,
          kind: "screen_share",
          direction: "positive",
          strength: 0.1,
          reason: "Participant is sharing their screen.",
          source: "behavior",
          specificity: "weak",
          timestampSec: latestScreenShareEvent?.timestampSec,
          expiresAtSec:
            latestScreenShareEvent?.timestampSec !== undefined
              ? latestScreenShareEvent.timestampSec +
                defaultFusionConfig.behaviorSignalTtlSec
              : undefined,
          isPersistent: false
        })
      );
    }

    return signals;
  });
}
