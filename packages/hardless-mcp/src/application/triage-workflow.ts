import path from 'node:path';

import type { TriageTaskResult } from './contracts.js';
import type { WorkspaceStatusReason } from '../infra/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { buildWorkspaceContext } from './bootstrap.js';
import { readWorkspaceRuntimeState } from '../infra/index.js';
import { triageWorkspaceRequest } from '../runtime/index.js';

export interface TriageWorkspaceInput {
  workspaceRoot: string;
  request: string;
}

export async function triageTask(
  input: TriageWorkspaceInput,
): Promise<TriageTaskResult> {
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const runtimeState = await readWorkspaceRuntimeState({
    workspaceManifestPath: path.join(workspace.paths.manifestsDir, 'workspace.json'),
    routingManifestPath: path.join(workspace.paths.manifestsDir, 'routing.json'),
  });

  if (runtimeState.operationalState !== 'ready' && runtimeState.operationalState !== 'pending_activation') {
    return {
      workspace: {
        ...workspace,
        status: runtimeState.workspaceStatus,
        bootstrappedAt: runtimeState.workspaceManifest?.bootstrappedAt,
        refreshedAt: runtimeState.workspaceManifest?.refreshedAt,
        activationStatus: runtimeState.workspaceManifest?.activationStatus,
        confidenceScore: runtimeState.workspaceManifest?.confidenceScore,
      },
      triage: {
        taskType: 'feature',
        triageState: 'blocked',
        rationale: [`workspace_status=${runtimeState.workspaceStatus}`],
        blockedReason: runtimeState.statusReason,
        triggerSignals: [],
        promotedToSpecFlow: false,
        contextBundle: {
          workspaceRoot: input.workspaceRoot,
          paths: workspace.paths,
          loadedArtifacts: [],
          loadedMaterialTypes: [],
          taskType: 'feature',
          triageState: 'blocked',
          requiredBundles: [],
          triggeredBundles: [],
          references: [],
          stale: false,
        },
        gateDecision: {
          canWrite: false,
          canConclude: false,
          reasons: [runtimeState.statusReason ?? 'workspace_unavailable'],
        },
        shortPlan: [],
        recommendedNextStep:
          runtimeState.statusReason === 'workspace_not_bootstrapped'
            ? 'run hardless.bootstrap'
            : 'repair runtime state before retrying triage',
      },
    };
  }

  let triage;

  try {
    triage = await triageWorkspaceRequest({
      request: input.request,
      workspace: {
        ...workspace,
        status: runtimeState.workspaceStatus,
        bootstrappedAt: runtimeState.workspaceManifest?.bootstrappedAt,
        refreshedAt: runtimeState.workspaceManifest?.refreshedAt,
        activationStatus: runtimeState.workspaceManifest?.activationStatus,
        confidenceScore: runtimeState.workspaceManifest?.confidenceScore,
      },
    });
  } catch (error) {
    if (!(error instanceof HardlessWorkspaceError)) {
      throw error;
    }

    return {
      workspace: {
        ...workspace,
        status: 'degraded',
        bootstrappedAt: runtimeState.workspaceManifest?.bootstrappedAt,
        refreshedAt: runtimeState.workspaceManifest?.refreshedAt,
        activationStatus: runtimeState.workspaceManifest?.activationStatus,
        confidenceScore: runtimeState.workspaceManifest?.confidenceScore,
      },
      triage: {
        taskType: 'feature',
        triageState: 'blocked',
        rationale: ['runtime_artifact_load_failed'],
        blockedReason: toRuntimeBlockedReason(error),
        triggerSignals: [],
        promotedToSpecFlow: false,
        contextBundle: {
          workspaceRoot: input.workspaceRoot,
          paths: workspace.paths,
          loadedArtifacts: [],
          loadedMaterialTypes: [],
          taskType: 'feature',
          triageState: 'blocked',
          requiredBundles: [],
          triggeredBundles: [],
          references: [],
          stale: false,
        },
        gateDecision: {
          canWrite: false,
          canConclude: false,
          reasons: [toRuntimeBlockedReason(error)],
        },
        shortPlan: [],
        recommendedNextStep: 'repair runtime state before retrying triage',
      },
    };
  }

  return {
    workspace: {
      ...workspace,
      status: triage.contextBundle.stale ? 'stale_with_warning' : runtimeState.workspaceStatus,
      bootstrappedAt: runtimeState.workspaceManifest?.bootstrappedAt,
      refreshedAt: runtimeState.workspaceManifest?.refreshedAt,
      activationStatus: runtimeState.workspaceManifest?.activationStatus,
      confidenceScore: runtimeState.workspaceManifest?.confidenceScore,
    },
    triage,
  };
}

function toRuntimeBlockedReason(error: HardlessWorkspaceError): WorkspaceStatusReason {
  return error.code === 'runtime_state_unreadable' ? 'runtime_state_unreadable' : 'runtime_state_corrupted';
}
