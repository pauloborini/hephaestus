import path from 'node:path';
import { readFile } from 'node:fs/promises';

import type {
  HardlessPaths,
  RoutingManifest,
  RuleBundle,
  TaskType,
  TaskTypeIndexEntry,
  TriggeredReference,
  WorkspaceManifest,
} from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';

export interface RuntimeArtifacts {
  workspaceManifest: WorkspaceManifest;
  routingManifest: RoutingManifest;
}

export async function loadRuntimeArtifacts(paths: HardlessPaths): Promise<RuntimeArtifacts> {
  const [workspaceManifest, routingManifest] = await Promise.all([
    readJsonFile<WorkspaceManifest>(path.join(paths.manifestsDir, 'workspace.json'), paths.root),
    readJsonFile<RoutingManifest>(path.join(paths.manifestsDir, 'routing.json'), paths.root),
  ]);

  return { workspaceManifest, routingManifest };
}

export async function loadTaskTypeIndex(paths: HardlessPaths, taskType: TaskType): Promise<TaskTypeIndexEntry> {
  return readJsonFile<TaskTypeIndexEntry>(path.join(paths.taskTypeIndexesDir, `${taskType}.json`), paths.root);
}

export async function loadRuleBundle(workspaceRoot: string, relativePath: string): Promise<RuleBundle> {
  return readJsonFile<RuleBundle>(path.join(workspaceRoot, relativePath), workspaceRoot);
}

export async function loadTriggeredReference(
  paths: HardlessPaths,
  referenceId: string,
): Promise<TriggeredReference> {
  return readJsonFile<TriggeredReference>(path.join(paths.referencesIndexesDir, `${referenceId}.json`), paths.root);
}

async function readJsonFile<T>(filePath: string, workspaceRoot: string): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof SyntaxError || (isNodeError(error) && error.code === 'ENOENT')) {
      throw new HardlessWorkspaceError({
        code: 'runtime_state_corrupted',
        message: `Runtime state artifact is missing or corrupted: ${filePath}`,
        workspaceRoot,
        sourcePath: filePath,
        cause: error,
      });
    }

    throw new HardlessWorkspaceError({
      code: 'runtime_state_unreadable',
      message: `Runtime state artifact could not be read: ${filePath}`,
      workspaceRoot,
      sourcePath: filePath,
      cause: error,
    });
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
