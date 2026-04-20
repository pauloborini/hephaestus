import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import type { ActivationDecision, HardlessPaths, WorkspaceContext, WorkspaceManifest } from '../domain/index.js';
import { HARDLESS_DEFAULTS, HARDLESS_SCHEMA_VERSIONS } from '../shared/index.js';
import { HARDLESS_METHOD_VERSION } from '../shared/bootstrap-method.js';

export interface WriteWorkspaceManifestOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  workspace: WorkspaceContext;
  activation: ActivationDecision;
  bootstrappedAt: string;
  refreshedAt?: string;
  statusOverride?: WorkspaceManifest['status'];
}

export async function writeWorkspaceManifest(
  options: WriteWorkspaceManifestOptions,
): Promise<WorkspaceManifest> {
  const manifest: WorkspaceManifest = {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.workspace,
    workspaceRoot: options.workspace.workspaceRoot,
    workspaceId: options.workspace.workspaceId,
    bootstrappedAt: options.bootstrappedAt,
    refreshedAt: options.refreshedAt,
    methodVersion: HARDLESS_METHOD_VERSION,
    status:
      options.statusOverride ??
      (options.activation.status === 'auto_activated' ? 'ready' : 'pending_activation'),
    activationStatus: options.activation.status,
    confidenceScore: options.activation.confidenceScore,
    activationThreshold: HARDLESS_DEFAULTS.activationThreshold,
    activeRuntimeMode: options.workspace.runtimeMode,
  };

  const manifestPath = path.join(options.paths.manifestsDir, 'workspace.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return manifest;
}
