import { readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ScenarioFileSchema, type ScenarioFile } from "@sherlock/shared";

const packageDir = dirname(fileURLToPath(import.meta.url));
export const defaultScenarioDirectory = resolve(packageDir, "../../scenarios");

export async function listScenarioFiles(
  scenarioPath = defaultScenarioDirectory
): Promise<string[]> {
  const resolvedPath = resolve(scenarioPath);
  const stats = statSync(resolvedPath);

  if (stats.isFile()) {
    return [resolvedPath];
  }

  const entries = await readdir(resolvedPath);
  return entries
    .filter((entry) => entry.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => join(resolvedPath, entry));
}

export function loadScenarioFile(filePath: string): ScenarioFile {
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  return ScenarioFileSchema.parse(parsed);
}

export async function loadScenarios(
  scenarioPath = defaultScenarioDirectory
): Promise<ScenarioFile[]> {
  const files = await listScenarioFiles(scenarioPath);
  return files.map(loadScenarioFile);
}
