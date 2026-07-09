export type SpeechSourceKind =
  | "meeting_platform"
  | "meeting_bot"
  | "webrtc_audio"
  | "asr_transcription"
  | "manual_fixture";

export type ParticipantAudioMapping = {
  meetingId: string;
  participantId: string;
  streamId?: string;
  speakerLabel?: string;
  externalUserId?: string;
};

export type SpeechIdentity = {
  meetingId: string;
  streamId?: string;
  speakerLabel?: string;
  externalUserId?: string;
};

export type ParticipantResolution =
  | {
      readonly resolved: true;
      readonly participantId: string;
      readonly mapping: ParticipantAudioMapping;
    }
  | {
      readonly resolved: false;
      readonly reason: string;
    };

export function resolveParticipantId(
  mappings: readonly ParticipantAudioMapping[],
  identity: SpeechIdentity
): ParticipantResolution {
  const meetingMappings = mappings.filter(
    (mapping) => mapping.meetingId === identity.meetingId
  );
  const mapping = meetingMappings.find(
    (item) =>
      (identity.streamId !== undefined && item.streamId === identity.streamId) ||
      (identity.speakerLabel !== undefined &&
        item.speakerLabel === identity.speakerLabel) ||
      (identity.externalUserId !== undefined &&
        item.externalUserId === identity.externalUserId)
  );

  if (!mapping) {
    return {
      resolved: false,
      reason: "No participant mapping exists for the speech observation."
    };
  }

  return {
    resolved: true,
    participantId: mapping.participantId,
    mapping
  };
}
