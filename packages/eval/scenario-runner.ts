export type ScenarioReplayResult<TSnapshot = unknown> = {
  readonly scenarioId: string;
  readonly snapshots: readonly TSnapshot[];
};

export type ScenarioRunner<TScenario = unknown, TSnapshot = unknown> = {
  readonly replay: (scenario: TScenario) => ScenarioReplayResult<TSnapshot>;
};
