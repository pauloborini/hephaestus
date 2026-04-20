import path from 'node:path';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import type { FragmentsManifest, HardlessPaths, ProvenanceManifest, SourceFragment } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { HARDLESS_SCHEMA_VERSIONS } from '../shared/index.js';

export interface WriteFragmentArtifactsOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  fragments: SourceFragment[];
}

export async function writeFragmentArtifacts(
  options: WriteFragmentArtifactsOptions,
): Promise<{ fragmentsManifest: FragmentsManifest; provenanceManifest: ProvenanceManifest }> {
  const fragmentsManifestPath = path.join(options.paths.manifestsDir, 'fragments.json');
  const provenanceManifestPath = path.join(options.paths.manifestsDir, 'provenance.json');

  await Promise.all([
    rm(options.paths.fragmentsBySourceDir, { recursive: true, force: true }),
    rm(options.paths.fragmentsByTopicDir, { recursive: true, force: true }),
  ]);

  await Promise.all([
    mkdir(options.paths.fragmentsBySourceDir, { recursive: true }),
    mkdir(options.paths.fragmentsByTopicDir, { recursive: true }),
  ]);

  const groupedBySource = groupBy(options.fragments, (fragment) => fragment.sourceId);
  const groupedByTopic = groupBy(options.fragments, (fragment) => fragment.topic);

  await Promise.all([
    ...writeGroupedFragments(options.paths.fragmentsBySourceDir, groupedBySource),
    ...writeGroupedFragments(options.paths.fragmentsByTopicDir, groupedByTopic),
  ]);

  const fragmentsPayload: FragmentsManifest = {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.fragments,
    fragments: options.fragments,
  };

  const provenancePayload: ProvenanceManifest = {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.provenance,
    artifacts: [
      {
        artifact: '.hardless/manifests/fragments.json',
        sourceIds: [...new Set(options.fragments.map((fragment) => fragment.sourceId))],
        fragmentIds: options.fragments.map((fragment) => fragment.fragmentId),
      },
    ],
    fragments: options.fragments.map((fragment) => ({
      fragmentId: fragment.fragmentId,
      sourceId: fragment.sourceId,
      sourcePath: fragment.sourcePath,
      topic: fragment.topic,
    })),
  };

  await Promise.all([
    writeFile(fragmentsManifestPath, `${JSON.stringify(fragmentsPayload, null, 2)}\n`, 'utf8'),
    writeFile(provenanceManifestPath, `${JSON.stringify(provenancePayload, null, 2)}\n`, 'utf8'),
  ]);

  return {
    fragmentsManifest: fragmentsPayload,
    provenanceManifest: provenancePayload,
  };
}

function groupBy<T>(items: T[], selector: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const key = selector(item);
    const existing = groups.get(key);

    if (existing) {
      existing.push(item);
      return;
    }

    groups.set(key, [item]);
  });

  return groups;
}

function writeGroupedFragments(directory: string, groups: Map<string, SourceFragment[]>): Promise<void>[] {
  return [...groups.entries()].map(([groupKey, fragments]) =>
    writeFile(
      path.join(directory, `${sanitizeGroupKey(groupKey)}.json`),
      `${JSON.stringify({ fragments }, null, 2)}\n`,
      'utf8',
    ),
  );
}

function sanitizeGroupKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

export async function readFragmentsManifest(paths: HardlessPaths): Promise<FragmentsManifest> {
  const manifestPath = path.join(paths.manifestsDir, 'fragments.json');
  return readRequiredRuntimeJson<FragmentsManifest>(manifestPath, paths.root);
}

export async function readProvenanceManifest(paths: HardlessPaths): Promise<ProvenanceManifest> {
  const manifestPath = path.join(paths.manifestsDir, 'provenance.json');
  return readRequiredRuntimeJson<ProvenanceManifest>(manifestPath, paths.root);
}

async function readRequiredRuntimeJson<T>(filePath: string, workspaceRoot: string): Promise<T> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof SyntaxError || (isNodeError(error) && error.code === 'ENOENT')) {
      throw new HardlessWorkspaceError({
        code: 'runtime_state_corrupted',
        message: `Required runtime manifest is missing or corrupted: ${filePath}`,
        workspaceRoot,
        sourcePath: filePath,
        cause: error,
      });
    }

    throw new HardlessWorkspaceError({
      code: 'runtime_state_unreadable',
      message: `Required runtime manifest could not be read: ${filePath}`,
      workspaceRoot,
      sourcePath: filePath,
      cause: error,
    });
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
