import path from 'node:path';
import { stat } from 'node:fs/promises';

import type { DiscoveredSource } from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { buildSourceDiscoveryTargets } from '../shared/source-discovery.js';
import { validateWorkspaceRoot } from './workspace-validation.js';

export interface DiscoverSourcesOptions {
  workspaceRoot: string;
  additionalDocumentationPaths?: string[];
}

export async function discoverSources(
  options: DiscoverSourcesOptions,
): Promise<DiscoveredSource[]> {
  await validateWorkspaceRoot(options.workspaceRoot);

  const targets = buildSourceDiscoveryTargets(options.additionalDocumentationPaths);

  return Promise.all(
    targets.map(async (target) => {
      const absolutePath = path.join(options.workspaceRoot, target.relativePath);

      try {
        const entryStats = await stat(absolutePath);
        const exists = target.kind === 'directory' ? entryStats.isDirectory() : entryStats.isFile();

        return {
          sourceId: target.sourceId,
          sourcePath: target.relativePath,
          sourceType: target.sourceType,
          discoveryStatus: exists ? 'found' : 'missing',
          discoveryMode: 'deterministic',
          exists,
        } satisfies DiscoveredSource;
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;

        if (nodeError.code === 'ENOENT') {
          return {
            sourceId: target.sourceId,
            sourcePath: target.relativePath,
            sourceType: target.sourceType,
            discoveryStatus: 'missing',
            discoveryMode: 'deterministic',
            exists: false,
          } satisfies DiscoveredSource;
        }

        throw new HardlessWorkspaceError({
          code: 'source_read_failed',
          message: `Failed to inspect source: ${target.relativePath}`,
          workspaceRoot: options.workspaceRoot,
          sourcePath: target.relativePath,
          cause: error,
        });
      }
    }),
  );
}
