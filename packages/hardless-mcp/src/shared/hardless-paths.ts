import type { HardlessPaths } from '../domain/index.js';

export const HARDLESS_SCHEMA_VERSIONS = {
  workspace: '1',
  sources: '1',
  fragments: '1',
  routing: '1',
  provenance: '1',
} as const;

export const HARDLESS_DIRECTORY_NAMES = {
  root: '.hardless',
  manifests: 'manifests',
  sources: 'sources',
  snapshots: 'snapshots',
  rawIndex: 'raw-index',
  fragments: 'fragments',
  bySource: 'by-source',
  byTopic: 'by-topic',
  rules: 'rules',
  required: 'required',
  triggered: 'triggered',
  fallback: 'fallback',
  indexes: 'indexes',
  taskTypes: 'task-types',
  references: 'references',
  routing: 'routing',
  memory: 'memory',
  reports: 'reports',
} as const;

export const HARDLESS_DEFAULTS = {
  activationThreshold: 0.75,
  runtimeMode: 'workflow_first',
} as const;

function joinPath(...segments: string[]): string {
  return segments.join('/');
}

export function buildHardlessPaths(workspaceRoot: string): HardlessPaths {
  const hardlessRoot = joinPath(workspaceRoot, HARDLESS_DIRECTORY_NAMES.root);
  const sourcesDir = joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.sources);
  const fragmentsDir = joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.fragments);
  const rulesDir = joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.rules);
  const indexesDir = joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.indexes);

  return {
    root: workspaceRoot,
    hardlessRoot,
    manifestsDir: joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.manifests),
    sourcesDir,
    sourceSnapshotsDir: joinPath(sourcesDir, HARDLESS_DIRECTORY_NAMES.snapshots),
    sourceRawIndexDir: joinPath(sourcesDir, HARDLESS_DIRECTORY_NAMES.rawIndex),
    fragmentsDir,
    fragmentsBySourceDir: joinPath(fragmentsDir, HARDLESS_DIRECTORY_NAMES.bySource),
    fragmentsByTopicDir: joinPath(fragmentsDir, HARDLESS_DIRECTORY_NAMES.byTopic),
    rulesDir,
    requiredRulesDir: joinPath(rulesDir, HARDLESS_DIRECTORY_NAMES.required),
    triggeredRulesDir: joinPath(rulesDir, HARDLESS_DIRECTORY_NAMES.triggered),
    fallbackRulesDir: joinPath(rulesDir, HARDLESS_DIRECTORY_NAMES.fallback),
    indexesDir,
    taskTypeIndexesDir: joinPath(indexesDir, HARDLESS_DIRECTORY_NAMES.taskTypes),
    referencesIndexesDir: joinPath(indexesDir, HARDLESS_DIRECTORY_NAMES.references),
    routingDir: joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.routing),
    memoryDir: joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.memory),
    reportsDir: joinPath(hardlessRoot, HARDLESS_DIRECTORY_NAMES.reports),
  };
}

export function listHardlessDirectories(paths: HardlessPaths): string[] {
  return [
    paths.hardlessRoot,
    paths.manifestsDir,
    paths.sourcesDir,
    paths.sourceSnapshotsDir,
    paths.sourceRawIndexDir,
    paths.fragmentsDir,
    paths.fragmentsBySourceDir,
    paths.fragmentsByTopicDir,
    paths.rulesDir,
    paths.requiredRulesDir,
    paths.triggeredRulesDir,
    paths.fallbackRulesDir,
    paths.indexesDir,
    paths.taskTypeIndexesDir,
    paths.referencesIndexesDir,
    paths.routingDir,
    paths.memoryDir,
    paths.reportsDir,
  ];
}
