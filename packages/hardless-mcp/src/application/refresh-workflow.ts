import path from 'node:path';

import type { RefreshWorkspaceResult } from './contracts.js';
import type { SourceFragment, WorkspaceContext, WorkspaceManifest } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import {
  detectDrift,
  discoverSources,
  evaluateActivationDecision,
  extractFragments,
  readWorkspaceRuntimeState,
  readFragmentsManifest,
  readProvenanceManifest,
  readSourcesManifest,
  snapshotSources,
  writeBootstrapSummary,
  writeDriftReport,
  writeFragmentArtifacts,
  writeRoutingArtifacts,
  writeRuleBundles,
  writeSourcesManifest,
  writeTaskIndexes,
  writeWorkspaceManifest,
} from '../infra/index.js';
import { buildWorkspaceContext } from './bootstrap.js';

export interface RefreshWorkspaceInput {
  workspaceRoot: string;
  refreshedAt?: string;
  additionalDocumentationPaths?: string[];
}

export async function refreshWorkspace(
  input: RefreshWorkspaceInput,
): Promise<RefreshWorkspaceResult> {
  const refreshedAt = input.refreshedAt ?? new Date().toISOString();
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const runtimeState = await readWorkspaceRuntimeState({
    workspaceManifestPath: path.join(workspace.paths.manifestsDir, 'workspace.json'),
    routingManifestPath: path.join(workspace.paths.manifestsDir, 'routing.json'),
  });

  if (runtimeState.operationalState === 'not_bootstrapped') {
    throw new HardlessWorkspaceError({
      code: 'workspace_not_bootstrapped',
      message: 'Workspace is not bootstrapped. Run hardless.bootstrap before hardless.refresh.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  if (runtimeState.operationalState === 'corrupted_runtime_state') {
    throw new HardlessWorkspaceError({
      code: 'runtime_state_corrupted',
      message: 'Workspace runtime state is corrupted. Inspect or rebuild .hardless artifacts before refresh.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  if (runtimeState.operationalState === 'runtime_state_unreadable') {
    throw new HardlessWorkspaceError({
      code: 'runtime_state_unreadable',
      message: 'Workspace runtime state could not be read. Fix permissions or IO issues before refresh.',
      workspaceRoot: input.workspaceRoot,
    });
  }

  const bootstrappedAt = runtimeState.workspaceManifest?.bootstrappedAt ?? refreshedAt;

  const [previousSourcesManifest, previousFragmentsManifest, previousProvenanceManifest] = await Promise.all([
    readSourcesManifest(workspace.paths),
    readFragmentsManifest(workspace.paths),
    readProvenanceManifest(workspace.paths),
  ]);

  const sources = await discoverSources({
    workspaceRoot: input.workspaceRoot,
    additionalDocumentationPaths: input.additionalDocumentationPaths,
  });
  const snapshots = await snapshotSources({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    sources,
    takenAt: refreshedAt,
  });

  const driftDetection = detectDrift({
    previousSourcesManifest,
    currentSources: sources,
    currentSnapshots: snapshots,
    previousFragmentsManifest,
    previousProvenanceManifest,
    detectedAt: refreshedAt,
  });

  const changedSnapshots = snapshots.filter((snapshot) => driftDetection.changedSourceIds.includes(snapshot.sourceId));
  const refreshedFragments =
    changedSnapshots.length === 0
      ? previousFragmentsManifest.fragments
      : mergeFragments(
          previousFragmentsManifest.fragments,
          await extractFragments({
            workspaceRoot: input.workspaceRoot,
            snapshots: changedSnapshots,
            extractedAt: refreshedAt,
          }),
          driftDetection.changedSourceIds,
        );

  const sourcesManifest = await writeSourcesManifest({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    sources,
    snapshots,
  });
  const { fragmentsManifest, provenanceManifest } = await writeFragmentArtifacts({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    fragments: refreshedFragments,
  });

  const activation = evaluateActivationDecision({ sources, fragments: refreshedFragments });
  const routingManifest = await writeRoutingArtifacts({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    taskTypes: [...new Set(refreshedFragments.flatMap((fragment) => fragment.taskTypes))],
  });
  const { requiredBundles, triggeredBundles } = await writeRuleBundles({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    fragments: refreshedFragments,
    dominantOrigin: activation.artifactOrigin,
  });
  await writeTaskIndexes({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    fragments: refreshedFragments,
    requiredBundles,
    triggeredBundles,
  });

  const changedFragmentAmbiguity = calculateChangedFragmentAmbiguity(
    refreshedFragments,
    driftDetection.changedSourceIds,
  );
  const workspaceStatus: WorkspaceManifest['status'] =
    changedFragmentAmbiguity > 0 ? 'degraded' : activation.status === 'auto_activated' ? 'ready' : 'pending_activation';

  const workspaceManifest = await writeWorkspaceManifest({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    workspace,
    activation,
    bootstrappedAt,
    refreshedAt,
    statusOverride: workspaceStatus,
  });
  const summaryPath = await writeBootstrapSummary({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    sources,
    fragments: refreshedFragments,
    activation,
    bootstrappedAt,
    refreshedAt,
  });

  const finalizedDriftReport = {
    ...driftDetection.driftReport,
    status:
      driftDetection.changedSourceIds.length === 0
        ? 'clean'
        : changedFragmentAmbiguity > 0
          ? 'degraded'
          : 'clean',
    summary:
      driftDetection.changedSourceIds.length === 0
        ? 'No source drift detected.'
        : changedFragmentAmbiguity > 0
          ? `Refreshed changed sources, but ambiguity persists in ${changedFragmentAmbiguity} refreshed fragment(s).`
          : `Refreshed ${driftDetection.changedSourceIds.length} changed source(s) without residual drift warnings.`,
  } as const;

  await writeDriftReport({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    driftReport: finalizedDriftReport,
  });

  const hydratedWorkspace: WorkspaceContext = {
    ...workspace,
    status: workspaceManifest.status,
    bootstrappedAt,
    refreshedAt,
    activationStatus: activation.status,
    confidenceScore: activation.confidenceScore,
  };

  return {
    workspace: hydratedWorkspace,
    driftReport: finalizedDriftReport,
    sourcesManifest,
    fragmentsManifest,
    provenanceManifest,
    workspaceManifest,
    routingManifest,
    summaryPath,
  };
}

function mergeFragments(
  previousFragments: SourceFragment[],
  changedFragments: SourceFragment[],
  changedSourceIds: string[],
): SourceFragment[] {
  const unchangedFragments = previousFragments.filter((fragment) => !changedSourceIds.includes(fragment.sourceId));
  return [...unchangedFragments, ...changedFragments];
}

function calculateChangedFragmentAmbiguity(
  fragments: SourceFragment[],
  changedSourceIds: string[],
): number {
  const changedFragments = fragments.filter((fragment) => changedSourceIds.includes(fragment.sourceId));
  const directlyAmbiguous = changedFragments.filter((fragment) => fragment.ambiguity !== 'low').length;
  const sourceTopicSpread = new Map<string, Set<string>>();

  changedFragments.forEach((fragment) => {
    const topics = sourceTopicSpread.get(fragment.sourceId) ?? new Set<string>();
    topics.add(fragment.topic);
    sourceTopicSpread.set(fragment.sourceId, topics);
  });

  const multiTopicSources = [...sourceTopicSpread.values()].filter((topics) => topics.size > 1).length;
  return directlyAmbiguous + multiTopicSources;
}
