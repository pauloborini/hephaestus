import { createHash } from 'node:crypto';

import type {
  HardlessPaths,
  SourceSnapshotRecord,
  WorkspaceContext,
} from '../domain/index.js';
import { HARDLESS_DEFAULTS, buildHardlessPaths } from '../shared/index.js';

export function buildWorkspaceContext(workspaceRoot: string): WorkspaceContext {
  const paths = buildHardlessPaths(workspaceRoot);

  return {
    workspaceId: createWorkspaceId(workspaceRoot),
    workspaceRoot,
    paths,
    status: 'not_bootstrapped',
    runtimeMode: HARDLESS_DEFAULTS.runtimeMode,
    activeWorkspace: true,
  };
}

export function createWorkspaceId(workspaceRoot: string): string {
  return `hardless-${createHash('sha256').update(workspaceRoot).digest('hex').slice(0, 12)}`;
}

export function mergeWorkspaceSnapshotState(
  workspace: WorkspaceContext,
  snapshotRecords: SourceSnapshotRecord[],
): WorkspaceContext {
  const confidenceScore = snapshotRecords.length > 0 ? 0.2 : 0;

  return {
    ...workspace,
    paths: workspace.paths as HardlessPaths,
    bootstrappedAt: new Date().toISOString(),
    confidenceScore,
  };
}
