import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { bootstrapWorkspace, refreshWorkspace } from '../application/index.js';

async function createFixtureWorkspace(): Promise<string> {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'hardless-refresh-'));

  await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '# Workflow\nImplement with validation.\n', 'utf8');
  await writeFile(path.join(workspaceRoot, 'README.md'), '# Repo docs\nArchitecture notes.\n', 'utf8');
  await mkdir(path.join(workspaceRoot, '.specs', 'feature-a'), { recursive: true });
  await writeFile(path.join(workspaceRoot, '.specs', 'feature-a', 'tasks.md'), '- [ ] sample feature task\n', 'utf8');

  return workspaceRoot;
}

test('refresh reports clean when no source changed', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });

    const result = await refreshWorkspace({
      workspaceRoot,
      refreshedAt: '2026-04-19T01:00:00.000Z',
    });

    assert.equal(result.driftReport.status, 'clean');
    assert.equal(result.driftReport.changedSourceIds.length, 0);
    assert.equal(result.workspaceManifest.status === 'pending_activation' || result.workspaceManifest.status === 'ready', true);
    assert.equal(result.workspaceManifest.bootstrappedAt, '2026-04-19T00:00:00.000Z');
    assert.equal(result.workspaceManifest.refreshedAt, '2026-04-19T01:00:00.000Z');
    assert.equal(result.workspace.bootstrappedAt, '2026-04-19T00:00:00.000Z');
    assert.equal(result.workspace.refreshedAt, '2026-04-19T01:00:00.000Z');
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('refresh detects changed source and writes drift report with impacts', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    await writeFile(
      path.join(workspaceRoot, 'AGENTS.md'),
      '# Workflow\nImplement with validation and architecture guidance.\n# Architecture\nUpdate runtime and workflow.\n',
      'utf8',
    );

    const result = await refreshWorkspace({
      workspaceRoot,
      refreshedAt: '2026-04-19T02:00:00.000Z',
    });

    const driftReport = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/reports/drift.json'), 'utf8'),
    ) as {
      status: string;
      changedSourceIds: string[];
      impacts: Array<{ sourceId: string; affectedFragments: string[]; affectedArtifacts: string[] }>;
    };

    assert.equal(result.driftReport.changedSourceIds.includes('src_agents_md'), true);
    assert.equal(driftReport.changedSourceIds.includes('src_agents_md'), true);
    assert.equal(
      driftReport.impacts.some(
        (impact) =>
          impact.sourceId === 'src_agents_md' &&
          impact.affectedFragments.length > 0 &&
          impact.affectedArtifacts.includes('.hardless/manifests/fragments.json'),
      ),
      true,
    );
    assert.equal(result.fragmentsManifest.fragments.some((fragment) => fragment.sourceId === 'src_agents_md'), true);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('refresh marks workspace as degraded when ambiguity persists after partial reconciliation', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    await writeFile(
      path.join(workspaceRoot, 'AGENTS.md'),
      '# Workflow\nImplement workflow and triage.\n# Architecture\nAdapter runtime package domain.\n',
      'utf8',
    );

    const result = await refreshWorkspace({
      workspaceRoot,
      refreshedAt: '2026-04-19T03:00:00.000Z',
    });

    assert.equal(result.driftReport.status, 'degraded');
    assert.equal(result.workspaceManifest.status, 'degraded');
    assert.match(result.driftReport.summary, /ambiguity persists/);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
