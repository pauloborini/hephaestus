import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

import type { DiscoveredSource, HardlessPaths, SourceSnapshotRecord, SourcesManifest } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { HARDLESS_SCHEMA_VERSIONS } from '../shared/index.js';

export interface WriteSourcesManifestOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  sources: DiscoveredSource[];
  snapshots: SourceSnapshotRecord[];
}

export async function writeSourcesManifest(
  options: WriteSourcesManifestOptions,
): Promise<SourcesManifest> {
  const snapshotById = new Map(options.snapshots.map((snapshot) => [snapshot.sourceId, snapshot]));
  const manifestPath = path.join(options.paths.manifestsDir, 'sources.json');

  const payload: SourcesManifest = {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.sources,
    sources: options.sources.map((source) => {
      const snapshot = snapshotById.get(source.sourceId);

      return {
        sourceId: source.sourceId,
        sourcePath: source.sourcePath,
        sourceType: source.sourceType,
        discoveryMode: source.discoveryMode,
        discoveryStatus: source.discoveryStatus,
        snapshotPath: snapshot?.snapshotPath,
        hash: snapshot?.hash,
        ingestionStatus: snapshot?.ingestionStatus ?? 'skipped',
        lastSeenAt: snapshot?.lastSeenAt,
        errorMessage: source.errorMessage,
      };
    }),
  };

  await writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return payload;
}

export async function readSourcesManifest(paths: HardlessPaths): Promise<SourcesManifest> {
  const manifestPath = path.join(paths.manifestsDir, 'sources.json');
  return readRequiredRuntimeJson<SourcesManifest>(manifestPath, paths.root);
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
