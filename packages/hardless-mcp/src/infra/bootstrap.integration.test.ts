import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { bootstrapWorkspace } from '../application/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { discoverSources } from './index.js';

async function createFixtureWorkspace(): Promise<string> {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'hardless-mcp-'));

  await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '# Agent rules\n', 'utf8');
  await writeFile(path.join(workspaceRoot, 'README.md'), '# Repo docs\n', 'utf8');
  await mkdir(path.join(workspaceRoot, '.specs', 'feature-a'), { recursive: true });
  await writeFile(path.join(workspaceRoot, '.specs', 'feature-a', 'tasks.md'), '- [ ] sample\n', 'utf8');

  return workspaceRoot;
}

test('discovery and snapshot create source manifest and snapshot artifacts', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    const result = await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });

    assert.equal(result.sources.some((source) => source.sourcePath === 'AGENTS.md' && source.exists), true);
    assert.equal(result.sources.some((source) => source.sourcePath === 'CLAUDE.md' && !source.exists), true);
    assert.equal(result.fragments.length > 0, true);
    assert.equal(result.fragments.some((fragment) => fragment.topic === 'workflow'), true);
    assert.equal(result.workspaceManifest.status, 'pending_activation');
    assert.equal(result.activation.requiresOperatorConfirmation, true);
    assert.equal(result.routingManifest.taskTypeIndexes.feature, '.hardless/indexes/task-types/feature.json');
    assert.equal(result.requiredBundles.some((bundle) => bundle.taskType === 'feature'), true);
    assert.equal(result.triggeredBundles.some((bundle) => bundle.taskType === 'feature'), true);
    assert.equal(result.fallbackBundles.length, 1);

    const sourcesManifest = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/manifests/sources.json'), 'utf8'),
    ) as {
      sources: Array<{ sourcePath: string; snapshotPath?: string }>;
    };
    const fragmentsManifest = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/manifests/fragments.json'), 'utf8'),
    ) as { fragments: Array<{ sourcePath: string; taskTypes: string[] }> };
    const provenanceManifest = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/manifests/provenance.json'), 'utf8'),
    ) as { artifacts: Array<{ artifact: string }> };
    const workspaceManifest = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/manifests/workspace.json'), 'utf8'),
    ) as { activationStatus: string; confidenceScore: number };
    const routingManifest = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/manifests/routing.json'), 'utf8'),
    ) as { taskTypeIndexes: Record<string, string> };
    const featureIndex = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/indexes/task-types/feature.json'), 'utf8'),
    ) as { requiredBundles: string[]; triggeredBundles: string[]; referenceIds: string[] };
    const bootstrapSummary = await readFile(path.join(workspaceRoot, result.summaryPath), 'utf8');
    const requiredFeatureBundle = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/rules/required/required_feature.json'), 'utf8'),
    ) as { rules: Array<{ source: string }>; fallbackApplied: boolean };
    const triggeredFeatureBundle = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/rules/triggered/triggered_feature.json'), 'utf8'),
    ) as { rules: Array<{ source: string }> };

    assert.equal(sourcesManifest.sources.some((source) => source.sourcePath === 'AGENTS.md'), true);
    assert.equal(
      sourcesManifest.sources.some(
        (source) => source.sourcePath === '.specs' && source.snapshotPath?.endsWith('src_specs_directory.json'),
      ),
      true,
    );
    assert.equal(
      fragmentsManifest.fragments.some(
        (fragment) => fragment.sourcePath === 'AGENTS.md' && fragment.taskTypes.length > 0,
      ),
      true,
    );
    assert.equal(
      fragmentsManifest.fragments.some(
        (fragment) => fragment.sourcePath === '.specs' && fragment.taskTypes.includes('feature'),
      ),
      true,
    );
    assert.equal(provenanceManifest.artifacts.some((artifact) => artifact.artifact.endsWith('fragments.json')), true);
    assert.equal(workspaceManifest.activationStatus, 'pending_activation');
    assert.equal(workspaceManifest.confidenceScore < 0.75, true);
    assert.equal(routingManifest.taskTypeIndexes.feature, '.hardless/indexes/task-types/feature.json');
    assert.equal(featureIndex.requiredBundles.includes('.hardless/rules/required/required_feature.json'), true);
    assert.equal(featureIndex.triggeredBundles.includes('.hardless/rules/triggered/triggered_feature.json'), true);
    assert.equal(featureIndex.referenceIds.length > 0, true);
    assert.equal(requiredFeatureBundle.rules.some((rule) => rule.source === 'hardless_method'), true);
    assert.equal(triggeredFeatureBundle.rules.some((rule) => rule.source === 'hardless_method'), true);
    assert.equal(requiredFeatureBundle.fallbackApplied, false);
    assert.match(bootstrapSummary, /activation status: pending_activation/);
    assert.match(bootstrapSummary, /fallback applied:/);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('invalid workspace raises structured error', async () => {
  await assert.rejects(
    discoverSources({ workspaceRoot: path.join(os.tmpdir(), 'hardless-missing-workspace') }),
    (error: unknown) =>
      error instanceof HardlessWorkspaceError && error.code === 'workspace_not_found',
  );
});
