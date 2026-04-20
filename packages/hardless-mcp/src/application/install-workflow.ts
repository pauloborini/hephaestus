import path from 'node:path';

import type { InstallWorkspaceResult } from './contracts.js';
import type { WorkspaceContext } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { installManagedRuntime, readWorkspaceRuntimeState } from '../infra/index.js';
import { buildWorkspaceContext } from './bootstrap.js';

export interface InstallWorkspaceInput {
  workspaceRoot: string;
  installedAt?: string;
}

export async function installWorkspace(
  input: InstallWorkspaceInput,
): Promise<InstallWorkspaceResult> {
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const runtimeState = await readWorkspaceRuntimeState({
    workspaceManifestPath: path.join(workspace.paths.manifestsDir, 'workspace.json'),
    routingManifestPath: path.join(workspace.paths.manifestsDir, 'routing.json'),
  });

  if (runtimeState.operationalState === 'not_bootstrapped') {
    throw new HardlessWorkspaceError({
      code: 'workspace_not_bootstrapped',
      message: 'Workspace is not bootstrapped. Run hardless.bootstrap before hardless.install.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  if (runtimeState.operationalState === 'corrupted_runtime_state') {
    throw new HardlessWorkspaceError({
      code: 'runtime_state_corrupted',
      message: 'Workspace runtime state is corrupted. Repair or rebuild .hardless artifacts before install.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  if (runtimeState.operationalState === 'runtime_state_unreadable') {
    throw new HardlessWorkspaceError({
      code: 'runtime_state_unreadable',
      message: 'Workspace runtime state could not be read. Fix permissions or IO issues before install.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  const result = await installManagedRuntime({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    installedAt: input.installedAt,
  });

  return {
    workspace: hydrateWorkspace(workspace, runtimeState),
    installationManifest: result.installationManifest,
    managedSurfaces: result.managedSurfaces,
    manifestPath: result.manifestPath,
    recommendedNextStep: 'use Hardless naturally in your client so the managed instructions route tasks through the runtime',
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
