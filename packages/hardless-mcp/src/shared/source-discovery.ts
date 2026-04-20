import path from 'node:path';

import type { SourceType } from '../domain/index.js';

type DiscoveryKind = 'file' | 'directory';

export interface SourceDiscoveryTarget {
  sourceId: string;
  relativePath: string;
  sourceType: SourceType;
  kind: DiscoveryKind;
}

export const CORE_SOURCE_DISCOVERY_TARGETS: SourceDiscoveryTarget[] = [
  {
    sourceId: 'src_agents_md',
    relativePath: 'AGENTS.md',
    sourceType: 'agents_md',
    kind: 'file',
  },
  {
    sourceId: 'src_claude_md',
    relativePath: 'CLAUDE.md',
    sourceType: 'claude_md',
    kind: 'file',
  },
  {
    sourceId: 'src_cloud_md',
    relativePath: 'cloud.md',
    sourceType: 'cloud_md',
    kind: 'file',
  },
  {
    sourceId: 'src_cursor_rules',
    relativePath: '.cursorrules',
    sourceType: 'cursor_rules',
    kind: 'file',
  },
  {
    sourceId: 'src_specs_directory',
    relativePath: '.specs',
    sourceType: 'specs_directory',
    kind: 'directory',
  },
  {
    sourceId: 'src_readme_md',
    relativePath: 'README.md',
    sourceType: 'repository_docs',
    kind: 'file',
  },
  {
    sourceId: 'src_docs_directory',
    relativePath: 'docs',
    sourceType: 'repository_docs',
    kind: 'directory',
  },
];

export function buildSourceDiscoveryTargets(
  additionalDocumentationPaths: string[] = [],
): SourceDiscoveryTarget[] {
  const extraTargets = additionalDocumentationPaths.map((relativePath) => ({
    sourceId: createSourceId(relativePath),
    relativePath,
    sourceType: 'repository_docs' as const,
    kind: inferDiscoveryKind(relativePath),
  }));

  return dedupeTargets([...CORE_SOURCE_DISCOVERY_TARGETS, ...extraTargets]);
}

function dedupeTargets(targets: SourceDiscoveryTarget[]): SourceDiscoveryTarget[] {
  const unique = new Map<string, SourceDiscoveryTarget>();

  for (const target of targets) {
    unique.set(target.relativePath, target);
  }

  return [...unique.values()];
}

function inferDiscoveryKind(relativePath: string): DiscoveryKind {
  return path.extname(relativePath) === '' ? 'directory' : 'file';
}

function createSourceId(relativePath: string): string {
  return `src_${relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
}
