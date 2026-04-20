import path from 'node:path';
import { readFile } from 'node:fs/promises';

import type { WorkspaceStatusResult } from './contracts.js';
import type { DriftReport } from '../domain/index.js';
import { buildWorkspaceContext } from './bootstrap.js';
import { readWorkspaceRuntimeState } from '../infra/index.js';

export interface GetWorkspaceStatusInput {
  workspaceRoot: string;
}

export async function getWorkspaceStatus(
  input: GetWorkspaceStatusInput,
): Promise<WorkspaceStatusResult> {
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const [runtimeState, driftReport] = await Promise.all([
    readWorkspaceRuntimeState({
      workspaceManifestPath: path.join(workspace.paths.manifestsDir, 'workspace.json'),
      routingManifestPath: path.join(workspace.paths.manifestsDir, 'routing.json'),
    }),
    readOptionalJson<DriftReport>(path.join(workspace.paths.reportsDir, 'drift.json')),
  ]);

  return {
    workspace: {
      ...workspace,
      status: runtimeState.workspaceStatus,
      bootstrappedAt: runtimeState.workspaceManifest?.bootstrappedAt,
      refreshedAt: runtimeState.workspaceManifest?.refreshedAt,
      activationStatus: runtimeState.workspaceManifest?.activationStatus,
      confidenceScore: runtimeState.workspaceManifest?.confidenceScore,
    },
    statusReason: runtimeState.statusReason,
    workspaceManifest: runtimeState.workspaceManifest,
    driftReport,
  };
}

async function readOptionalJson<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}
