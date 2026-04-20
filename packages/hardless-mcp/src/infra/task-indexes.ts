import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

import type {
  HardlessPaths,
  RuleBundle,
  SourceFragment,
  TaskTypeIndexEntry,
  TriggeredReference,
} from '../domain/index.js';
import { TASK_TYPES } from '../domain/index.js';
import { HARDLESS_SCHEMA_VERSIONS } from '../shared/index.js';

export interface WriteTaskIndexesOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  fragments: SourceFragment[];
  requiredBundles: RuleBundle[];
  triggeredBundles: RuleBundle[];
}

export async function writeTaskIndexes(
  options: WriteTaskIndexesOptions,
): Promise<{ taskTypeIndexes: TaskTypeIndexEntry[]; references: TriggeredReference[] }> {
  await Promise.all([
    mkdir(options.paths.taskTypeIndexesDir, { recursive: true }),
    mkdir(options.paths.referencesIndexesDir, { recursive: true }),
  ]);

  const references = buildTriggeredReferences(options.fragments);
  const referencesByTaskType = new Map<string, TriggeredReference[]>();

  for (const reference of references) {
    if (!reference.taskType) {
      continue;
    }

    const existing = referencesByTaskType.get(reference.taskType) ?? [];
    existing.push(reference);
    referencesByTaskType.set(reference.taskType, existing);
  }

  const taskTypeIndexes = await Promise.all(
    TASK_TYPES.map(async (taskType) => {
      const entry: TaskTypeIndexEntry = {
        schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
        taskType,
        requiredBundles: options.requiredBundles
          .filter((bundle) => bundle.taskType === taskType)
          .map((bundle) => `.hardless/rules/required/${bundle.bundleId}.json`),
        triggeredBundles: options.triggeredBundles
          .filter((bundle) => bundle.taskType === taskType)
          .map((bundle) => `.hardless/rules/triggered/${bundle.bundleId}.json`),
        referenceIds: (referencesByTaskType.get(taskType) ?? []).map((reference) => reference.referenceId),
        stale: false,
      };

      await writeFile(
        path.join(options.paths.taskTypeIndexesDir, `${taskType}.json`),
        `${JSON.stringify(entry, null, 2)}\n`,
        'utf8',
      );

      return entry;
    }),
  );

  await Promise.all(
    references.map((reference) =>
      writeFile(
        path.join(options.paths.referencesIndexesDir, `${reference.referenceId}.json`),
        `${JSON.stringify(reference, null, 2)}\n`,
        'utf8',
      ),
    ),
  );

  return {
    taskTypeIndexes,
    references,
  };
}

function buildTriggeredReferences(fragments: SourceFragment[]): TriggeredReference[] {
  const bySourceAndTopic = new Map<string, SourceFragment[]>();

  for (const fragment of fragments) {
    const key = `${fragment.sourcePath}::${fragment.topic}`;
    const existing = bySourceAndTopic.get(key) ?? [];
    existing.push(fragment);
    bySourceAndTopic.set(key, existing);
  }

  return [...bySourceAndTopic.entries()].slice(0, 12).map(([key, groupedFragments]) => {
    const [sourcePath, topic] = key.split('::');
    const dominantTaskType = groupedFragments[0]?.taskTypes[0];

    return {
      schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
      referenceId: `ref_${groupedFragments[0]?.sourceId ?? 'unknown'}_${topic.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
      taskType: dominantTaskType,
      topic,
      sourcePath,
      fragmentIds: groupedFragments.map((fragment) => fragment.fragmentId),
    };
  });
}
