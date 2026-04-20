import type {
  DiscoveredSource,
  DriftImpact,
  DriftReport,
  FragmentsManifest,
  ProvenanceManifest,
  SourceSnapshotRecord,
  SourcesManifest,
  SourceFragment,
} from '../domain/index.js';

export interface DetectDriftOptions {
  previousSourcesManifest: SourcesManifest;
  currentSources: DiscoveredSource[];
  currentSnapshots: SourceSnapshotRecord[];
  previousFragmentsManifest: FragmentsManifest;
  previousProvenanceManifest: ProvenanceManifest;
  detectedAt?: string;
}

export interface DriftDetectionResult {
  changedSourceIds: string[];
  impacts: DriftImpact[];
  driftReport: DriftReport;
}

export function detectDrift(options: DetectDriftOptions): DriftDetectionResult {
  const previousById = new Map(options.previousSourcesManifest.sources.map((source) => [source.sourceId, source]));
  const currentSnapshotById = new Map(options.currentSnapshots.map((snapshot) => [snapshot.sourceId, snapshot]));

  const changedSourceIds = options.currentSources
    .filter((source) => {
      const previous = previousById.get(source.sourceId);
      const currentSnapshot = currentSnapshotById.get(source.sourceId);

      if (!previous) {
        return source.exists;
      }

      const previousHash = previous.hash;
      const currentHash = currentSnapshot?.hash;
      const previousStatus = previous.discoveryStatus;
      return previousStatus !== source.discoveryStatus || previousHash !== currentHash;
    })
    .map((source) => source.sourceId);

  const impacts = mapDriftImpacts({
    changedSourceIds,
    previousFragments: options.previousFragmentsManifest.fragments,
    previousProvenance: options.previousProvenanceManifest,
  });
  const status =
    changedSourceIds.length === 0 ? 'clean' : impacts.some((impact) => impact.affectedArtifacts.length > 3) ? 'degraded' : 'stale';

  return {
    changedSourceIds,
    impacts,
    driftReport: {
      status,
      changedSourceIds,
      impacts,
      detectedAt: options.detectedAt ?? new Date().toISOString(),
      summary:
        changedSourceIds.length === 0
          ? 'No source drift detected.'
          : `Detected drift in ${changedSourceIds.length} source(s) with ${impacts.length} impact map(s).`,
    },
  };
}

function mapDriftImpacts(input: {
  changedSourceIds: string[];
  previousFragments: SourceFragment[];
  previousProvenance: ProvenanceManifest;
}): DriftImpact[] {
  if (input.changedSourceIds.length === 0) {
    return [];
  }

  return input.changedSourceIds.map((sourceId) => {
    const affectedFragments = input.previousFragments
      .filter((fragment) => fragment.sourceId === sourceId)
      .map((fragment) => fragment.fragmentId);
    const affectedArtifacts = new Set<string>();

    input.previousProvenance.artifacts.forEach((artifact) => {
      if (artifact.sourceIds.includes(sourceId) || artifact.fragmentIds.some((fragmentId) => affectedFragments.includes(fragmentId))) {
        affectedArtifacts.add(artifact.artifact);
      }
    });

    input.previousFragments
      .filter((fragment) => fragment.sourceId === sourceId)
      .forEach((fragment) => {
        fragment.taskTypes.forEach((taskType) => {
          affectedArtifacts.add(`.hardless/rules/required/required_${taskType}.json`);
          affectedArtifacts.add(`.hardless/rules/triggered/triggered_${taskType}.json`);
          affectedArtifacts.add(`.hardless/indexes/task-types/${taskType}.json`);
        });
      });

    affectedArtifacts.add('.hardless/manifests/sources.json');
    affectedArtifacts.add('.hardless/manifests/fragments.json');
    affectedArtifacts.add('.hardless/manifests/provenance.json');
    affectedArtifacts.add('.hardless/manifests/workspace.json');
    affectedArtifacts.add('.hardless/manifests/routing.json');
    affectedArtifacts.add('.hardless/reports/bootstrap-summary.md');

    return {
      sourceId,
      affectedFragments,
      affectedArtifacts: [...affectedArtifacts],
    };
  });
}
