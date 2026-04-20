import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

import type {
  ArtifactOrigin,
  HardlessPaths,
  RuleBundle,
  SourceFragment,
  TaskType,
} from '../domain/index.js';
import { TASK_TYPES } from '../domain/index.js';
import { HARDLESS_SCHEMA_VERSIONS } from '../shared/index.js';
import {
  HARDLESS_FALLBACK_RULES,
  HARDLESS_REQUIRED_METHOD_RULES,
  HARDLESS_TRIGGERED_METHOD_RULES,
} from '../shared/bootstrap-method.js';

export interface WriteRuleBundlesOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  fragments: SourceFragment[];
  dominantOrigin: ArtifactOrigin;
}

export async function writeRuleBundles(
  options: WriteRuleBundlesOptions,
): Promise<{
  requiredBundles: RuleBundle[];
  triggeredBundles: RuleBundle[];
  fallbackBundles: RuleBundle[];
}> {
  await Promise.all([
    mkdir(options.paths.requiredRulesDir, { recursive: true }),
    mkdir(options.paths.triggeredRulesDir, { recursive: true }),
    mkdir(options.paths.fallbackRulesDir, { recursive: true }),
  ]);

  const requiredBundles = await Promise.all(
    TASK_TYPES.map((taskType) =>
      writeBundle({
        directory: options.paths.requiredRulesDir,
        bundle: buildTaskBundle('required', taskType, options.fragments, options.dominantOrigin),
      }),
    ),
  );
  const triggeredBundles = await Promise.all(
    TASK_TYPES.map((taskType) =>
      writeBundle({
        directory: options.paths.triggeredRulesDir,
        bundle: buildTaskBundle('triggered', taskType, options.fragments, options.dominantOrigin),
      }),
    ),
  );
  const fallbackBundle = await writeBundle({
    directory: options.paths.fallbackRulesDir,
    bundle: buildFallbackBundle(options.dominantOrigin),
  });

  return {
    requiredBundles,
    triggeredBundles,
    fallbackBundles: [fallbackBundle],
  };
}

function buildTaskBundle(
  bundleType: 'required' | 'triggered',
  taskType: TaskType,
  fragments: SourceFragment[],
  dominantOrigin: ArtifactOrigin,
): RuleBundle {
  const methodRules =
    bundleType === 'required' ? HARDLESS_REQUIRED_METHOD_RULES[taskType] : HARDLESS_TRIGGERED_METHOD_RULES[taskType];
  const workspaceRules = fragments
    .filter((fragment) => fragment.taskTypes.includes(taskType))
    .slice(0, bundleType === 'required' ? 4 : 2)
    .map((fragment) => ({
      id: fragment.fragmentId,
      summary: `Fragmento ${fragment.topic} derivado de ${fragment.sourcePath}`,
      source: 'workspace_fragment' as const,
      sourcePath: fragment.sourcePath,
      fragmentId: fragment.fragmentId,
    }));

  return {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
    bundleType,
    bundleId: `${bundleType}_${taskType}`,
    taskType,
    dominantSource: workspaceRules.length > 0 ? dominantOrigin : 'hardless_fallback',
    fallbackApplied: workspaceRules.length === 0,
    rules: [
      ...methodRules.map((summary, index) => ({
        id: `${bundleType}_${taskType}_method_${index + 1}`,
        summary,
        source: 'hardless_method' as const,
      })),
      ...workspaceRules,
    ],
  };
}

function buildFallbackBundle(dominantOrigin: ArtifactOrigin): RuleBundle {
  return {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
    bundleType: 'fallback',
    bundleId: 'fallback_default',
    dominantSource: dominantOrigin === 'user_dominant' ? 'mixed' : 'hardless_fallback',
    fallbackApplied: true,
    rules: HARDLESS_FALLBACK_RULES.map((summary, index) => ({
      id: `fallback_default_${index + 1}`,
      summary,
      source: 'hardless_method' as const,
    })),
  };
}

async function writeBundle(options: { directory: string; bundle: RuleBundle }): Promise<RuleBundle> {
  const filePath = path.join(options.directory, `${options.bundle.bundleId}.json`);
  await writeFile(filePath, `${JSON.stringify(options.bundle, null, 2)}\n`, 'utf8');
  return options.bundle;
}
