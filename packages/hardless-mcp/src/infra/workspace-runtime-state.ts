import path from 'node:path';
import { readFile } from 'node:fs/promises';

import type { RoutingManifest, WorkspaceManifest, WorkspaceStatus } from '../domain/index.js';

export type WorkspaceStatusReason =
  | 'workspace_not_bootstrapped'
  | 'runtime_state_corrupted'
  | 'runtime_state_unreadable'
  | 'workspace_degraded'
  | 'workspace_pending_activation';

export type WorkspaceOperationalState =
  | 'ready'
  | 'pending_activation'
  | 'degraded'
  | 'not_bootstrapped'
  | 'corrupted_runtime_state'
  | 'runtime_state_unreadable';

export interface RuntimeStateSnapshot {
  workspaceStatus: WorkspaceStatus;
  operationalState: WorkspaceOperationalState;
  statusReason?: WorkspaceStatusReason;
  workspaceManifest?: WorkspaceManifest;
  routingManifest?: RoutingManifest;
}

export interface ReadWorkspaceRuntimeStateOptions {
  workspaceManifestPath: string;
  routingManifestPath?: string;
}

interface JsonReadResult<T> {
  kind: 'ok' | 'missing' | 'corrupted' | 'unreadable';
  value?: T;
  error?: unknown;
}

export async function readWorkspaceRuntimeState(
  options: ReadWorkspaceRuntimeStateOptions,
): Promise<RuntimeStateSnapshot> {
  const workspaceManifestResult = await readJsonStateFile<WorkspaceManifest>(options.workspaceManifestPath);

  if (workspaceManifestResult.kind === 'missing') {
    return {
      workspaceStatus: 'not_bootstrapped',
      operationalState: 'not_bootstrapped',
      statusReason: 'workspace_not_bootstrapped',
    };
  }

  if (workspaceManifestResult.kind === 'corrupted') {
    return {
      workspaceStatus: 'degraded',
      operationalState: 'corrupted_runtime_state',
      statusReason: 'runtime_state_corrupted',
    };
  }

  if (workspaceManifestResult.kind === 'unreadable') {
    return {
      workspaceStatus: 'degraded',
      operationalState: 'runtime_state_unreadable',
      statusReason: 'runtime_state_unreadable',
    };
  }

  const workspaceManifest = workspaceManifestResult.value as WorkspaceManifest;

  if (!options.routingManifestPath) {
    return {
      workspaceStatus: workspaceManifest.status,
      operationalState: deriveOperationalState(workspaceManifest.status),
      statusReason: deriveStatusReason(workspaceManifest.status),
      workspaceManifest,
    };
  }

  const routingManifestResult = await readJsonStateFile<RoutingManifest>(options.routingManifestPath);

  if (routingManifestResult.kind === 'missing' || routingManifestResult.kind === 'corrupted') {
    return {
      workspaceStatus: 'degraded',
      operationalState: 'corrupted_runtime_state',
      statusReason: 'runtime_state_corrupted',
      workspaceManifest,
    };
  }

  if (routingManifestResult.kind === 'unreadable') {
    return {
      workspaceStatus: 'degraded',
      operationalState: 'runtime_state_unreadable',
      statusReason: 'runtime_state_unreadable',
      workspaceManifest,
    };
  }

  return {
    workspaceStatus: workspaceManifest.status,
    operationalState: deriveOperationalState(workspaceManifest.status),
    statusReason: deriveStatusReason(workspaceManifest.status),
    workspaceManifest,
    routingManifest: routingManifestResult.value,
  };
}

async function readJsonStateFile<T>(filePath: string): Promise<JsonReadResult<T>> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return {
      kind: 'ok',
      value: JSON.parse(raw) as T,
    };
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return { kind: 'missing' };
    }

    if (error instanceof SyntaxError) {
      return { kind: 'corrupted', error };
    }

    return { kind: 'unreadable', error };
  }
}

function deriveOperationalState(status: WorkspaceStatus): WorkspaceOperationalState {
  if (status === 'ready') {
    return 'ready';
  }

  if (status === 'pending_activation') {
    return 'pending_activation';
  }

  if (status === 'not_bootstrapped') {
    return 'not_bootstrapped';
  }

  return 'degraded';
}

function deriveStatusReason(status: WorkspaceStatus): WorkspaceStatusReason | undefined {
  if (status === 'degraded' || status === 'stale_with_warning' || status === 'disabled') {
    return 'workspace_degraded';
  }

  if (status === 'pending_activation') {
    return 'workspace_pending_activation';
  }

  return undefined;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
