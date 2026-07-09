import type { ExtractedSignal, ParticipantSignalSummary } from "./signal-types.ts";

export function clampStrength(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function createSignal(signal: ExtractedSignal): ExtractedSignal {
  return {
    ...signal,
    strength: clampStrength(signal.strength),
    specificity:
      signal.specificity ??
      (signal.strength >= 0.75
        ? "strong"
        : signal.strength >= 0.4
          ? "medium"
          : "weak")
  };
}

export function summarizeSignals(
  participantId: string,
  signals: readonly ExtractedSignal[]
): ParticipantSignalSummary {
  const participantSignals = signals.filter(
    (signal) => signal.participantId === participantId
  );

  return {
    participantId,
    signals: participantSignals,
    positiveStrength: participantSignals
      .filter((signal) => signal.direction === "positive")
      .reduce((total, signal) => total + signal.strength, 0),
    negativeStrength: participantSignals
      .filter((signal) => signal.direction === "negative")
      .reduce((total, signal) => total + signal.strength, 0),
    neutralCount: participantSignals.filter(
      (signal) => signal.direction === "neutral"
    ).length
  };
}
