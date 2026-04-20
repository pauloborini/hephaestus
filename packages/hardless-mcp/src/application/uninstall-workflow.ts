import path from 'node:path';

import type { UninstallWorkspaceResult } from './contracts.js';
import type { WorkspaceContext } from '../domain/index.js';
import { readWorkspaceRuntimeState, uninstallManagedRuntime } from '../infra/index.js';
import { buildWorkspaceContext } from './bootstrap.js';

export interface UninstallWorkspaceInstallationInput {
  workspaceRoot: string;
}

export async function uninstallWorkspaceInstallation(
  input: UninstallWorkspaceInstallationInput,
): Promise<UninstallWorkspaceResult> {
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const runtimeState = await readWorkspaceRuntimeState({
    workspaceManifestPath: path.join(workspace.paths.manifestsDir, 'workspace.json'),
    routingManifestPath: path.join(workspace.paths.manifestsDir, 'routing.json'),
  });
  const result = await uninstallManagedRuntime({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
  });

  return {
    workspace: hydrateWorkspace(workspace, runtimeState),
    restoredSurfaces: result.restoredSurfaces,
    removedManifestPath: result.removedManifestPath,
    recommendedNextStep: 'the workspace instructions are back to their original state; run hardless.install again to re-enable automatic routing',
  };
}

function hydrateWorkspace(
  workspace: WorkspaceContext,
  runtimeState: Awaited<ReturnType<typeof readWorkspaceRuntimeState>>,
): WorkspaceContext {
  return {
    ...workspace,
    status: runtimeState.workspaceStatus,
    bootstrappedAt: runtimeState.workspaceManifest?.bootstrappedAt,
    refreshedAt: runtimeState.workspaceManifest?.refreshedAt,
    activationStatus: runtimeState.workspaceManifest?.activationStatus,
    confidenceScore: runtimeState.workspaceManifest?.confidenceScore,
  };
}
