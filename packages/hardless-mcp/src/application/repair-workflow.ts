import path from 'node:path';

import type { RepairWorkspaceResult } from './contracts.js';
import type { WorkspaceContext } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { readWorkspaceRuntimeState, repairManagedRuntime } from '../infra/index.js';
import { buildWorkspaceContext } from './bootstrap.js';

export interface RepairWorkspaceInstallationInput {
  workspaceRoot: string;
  repairedAt?: string;
}

export async function repairWorkspaceInstallation(
  input: RepairWorkspaceInstallationInput,
): Promise<RepairWorkspaceResult> {
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const runtimeState = await readWorkspaceRuntimeState({
    workspaceManifestPath: path.join(workspace.paths.manifestsDir, 'workspace.json'),
    routingManifestPath: path.join(workspace.paths.manifestsDir, 'routing.json'),
  });

  if (runtimeState.operationalState === 'not_bootstrapped') {
    throw new HardlessWorkspaceError({
      code: 'workspace_not_bootstrapped',
      message: 'Workspace is not bootstrapped. Run hardless.bootstrap before hardless.repair.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  if (runtimeState.operationalState === 'corrupted_runtime_state') {
    throw new HardlessWorkspaceError({
      code: 'runtime_state_corrupted',
      message: 'Workspace runtime state is corrupted. Repair or rebuild .hardless artifacts before hardless.repair.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  if (runtimeState.operationalState === 'runtime_state_unreadable') {
    throw new HardlessWorkspaceError({
      code: 'runtime_state_unreadable',
      message: 'Workspace runtime state could not be read. Fix permissions or IO issues before hardless.repair.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  const result = await repairManagedRuntime({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    repairedAt: input.repairedAt,
  });

  return {
    workspace: hydrateWorkspace(workspace, runtimeState),
    installationManifest: result.installationManifest,
    repairedSurfaces: result.repairedSurfaces,
    manifestPath: result.manifestPath,
    recommendedNextStep: 'ask the client to follow Hardless normally; the managed instructions were repaired in the supported surfaces',
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
