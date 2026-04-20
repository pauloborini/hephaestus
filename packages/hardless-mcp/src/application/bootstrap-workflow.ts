import type { BootstrapWorkspaceResult, TriageTaskInput } from './contracts.js';
import type { WorkspaceContext } from '../domain/index.js';
import {
  discoverSources,
  evaluateActivationDecision,
  extractFragments,
  snapshotSources,
  writeBootstrapSummary,
  writeFragmentArtifacts,
  writeRoutingArtifacts,
  writeRuleBundles,
  writeSourcesManifest,
  writeTaskIndexes,
  writeWorkspaceManifest,
} from '../infra/index.js';
import { buildWorkspaceContext } from './bootstrap.js';

export interface BootstrapWorkspaceInput {
  workspaceRoot: string;
  bootstrappedAt?: string;
  additionalDocumentationPaths?: string[];
}

export async function bootstrapWorkspace(
  input: BootstrapWorkspaceInput,
): Promise<BootstrapWorkspaceResult> {
  const bootstrappedAt = input.bootstrappedAt ?? new Date().toISOString();
  const workspace = buildWorkspaceContext(input.workspaceRoot);
  const sources = await discoverSources({
    workspaceRoot: input.workspaceRoot,
    additionalDocumentationPaths: input.additionalDocumentationPaths,
  });
  const snapshots = await snapshotSources({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    sources,
    takenAt: bootstrappedAt,
  });

  const sourcesManifest = await writeSourcesManifest({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    sources,
    snapshots,
  });

  const fragments = await extractFragments({
    workspaceRoot: input.workspaceRoot,
    snapshots,
    extractedAt: bootstrappedAt,
  });

  const { fragmentsManifest, provenanceManifest } = await writeFragmentArtifacts({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    fragments,
  });

  const activation = evaluateActivationDecision({ sources, fragments });
  const routingManifest = await writeRoutingArtifacts({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    taskTypes: [...new Set(fragments.flatMap((fragment) => fragment.taskTypes))],
  });
  const { requiredBundles, triggeredBundles, fallbackBundles } = await writeRuleBundles({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    fragments,
    dominantOrigin: activation.artifactOrigin,
  });
  const { taskTypeIndexes, references } = await writeTaskIndexes({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    fragments,
    requiredBundles,
    triggeredBundles,
  });
  const workspaceManifest = await writeWorkspaceManifest({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    workspace,
    activation,
    bootstrappedAt,
    refreshedAt: undefined,
  });
  const summaryPath = await writeBootstrapSummary({
    workspaceRoot: input.workspaceRoot,
    paths: workspace.paths,
    sources,
    fragments,
    activation,
    bootstrappedAt,
    refreshedAt: undefined,
  });

  const hydratedWorkspace: WorkspaceContext = {
    ...workspace,
    status: workspaceManifest.status,
    bootstrappedAt,
    refreshedAt: undefined,
    activationStatus: activation.status,
    confidenceScore: activation.confidenceScore,
  };

  return {
    workspace: hydratedWorkspace,
    sourcesManifest,
    fragmentsManifest,
    provenanceManifest,
    sources,
    fragments,
    activation,
    workspaceManifest,
    routingManifest,
    requiredBundles,
    triggeredBundles,
    fallbackBundles,
    taskTypeIndexes,
    references,
    summaryPath,
  };
}
