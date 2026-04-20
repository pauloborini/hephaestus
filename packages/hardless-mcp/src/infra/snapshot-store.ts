import { createHash } from 'node:crypto';
import path from 'node:path';
import { copyFile, readdir, readFile, stat, writeFile } from 'node:fs/promises';

import type { DiscoveredSource, HardlessPaths, SourceSnapshotRecord } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { listHardlessDirectories } from '../shared/index.js';
import { NodeFileSystem } from './node-filesystem.js';
import { validateWorkspaceRoot } from './workspace-validation.js';

const fileSystem = new NodeFileSystem();

export interface SnapshotSourcesOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  sources: DiscoveredSource[];
  takenAt?: string;
}

export async function snapshotSources(
  options: SnapshotSourcesOptions,
): Promise<SourceSnapshotRecord[]> {
  await validateWorkspaceRoot(options.workspaceRoot);
  await fileSystem.ensureDirectories(listHardlessDirectories(options.paths));

  const takenAt = options.takenAt ?? new Date().toISOString();
  const existingSources = options.sources.filter((source) => source.exists);

  return Promise.all(
    existingSources.map(async (source) => {
      const sourceAbsolutePath = path.join(options.workspaceRoot, source.sourcePath);

      try {
        const sourceStats = await stat(sourceAbsolutePath);

        if (sourceStats.isDirectory()) {
          const snapshotPath = path.join(options.paths.sourceSnapshotsDir, `${source.sourceId}.json`);
          const entries = await collectDirectoryEntries(sourceAbsolutePath);
          const payload = JSON.stringify(
            {
              sourceId: source.sourceId,
              sourcePath: source.sourcePath,
              sourceType: source.sourceType,
              kind: 'directory_reference',
              entries,
            },
            null,
            2,
          );

          await writeFile(snapshotPath, `${payload}\n`, 'utf8');

          return {
            sourceId: source.sourceId,
            sourcePath: source.sourcePath,
            sourceType: source.sourceType,
            snapshotPath: toWorkspaceRelative(options.workspaceRoot, snapshotPath),
            hash: hashText(payload),
            ingestionStatus: 'ingested',
            lastSeenAt: takenAt,
          } satisfies SourceSnapshotRecord;
        }

        const extension = path.extname(source.sourcePath) || '.txt';
        const snapshotPath = path.join(options.paths.sourceSnapshotsDir, `${source.sourceId}${extension}`);
        const contents = await readFile(sourceAbsolutePath, 'utf8');

        await copyFile(sourceAbsolutePath, snapshotPath);

        return {
          sourceId: source.sourceId,
          sourcePath: source.sourcePath,
          sourceType: source.sourceType,
          snapshotPath: toWorkspaceRelative(options.workspaceRoot, snapshotPath),
          hash: hashText(contents),
          ingestionStatus: 'ingested',
          lastSeenAt: takenAt,
        } satisfies SourceSnapshotRecord;
      } catch (error) {
        throw new HardlessWorkspaceError({
          code: 'snapshot_write_failed',
          message: `Failed to snapshot source: ${source.sourcePath}`,
          workspaceRoot: options.workspaceRoot,
          sourcePath: source.sourcePath,
          cause: error,
        });
      }
    }),
  );
}

async function collectDirectoryEntries(directoryPath: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = prefix ? path.posix.join(prefix, entry.name) : entry.name;

    if (entry.isDirectory()) {
      results.push(relativePath);
      results.push(...(await collectDirectoryEntries(path.join(directoryPath, entry.name), relativePath)));
      continue;
    }

    if (entry.isFile()) {
      results.push(relativePath);
    }
  }

  return results;
}

function hashText(contents: string): string {
  return `sha256:${createHash('sha256').update(contents).digest('hex')}`;
}

function toWorkspaceRelative(workspaceRoot: string, absolutePath: string): string {
  return path.relative(workspaceRoot, absolutePath) || '.';
}
