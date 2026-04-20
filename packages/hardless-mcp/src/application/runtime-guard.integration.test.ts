import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  getWorkspaceStatus,
  loadContextForRequest,
  refreshWorkspace,
  triageTask,
} from './index.js';
import { bootstrapWorkspace } from './bootstrap-workflow.js';
import { HardlessWorkspaceError } from '../domain/index.js';

async function createFixtureWorkspace(): Promise<string> {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'hardless-app-guard-'));

  await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '# Workflow\nImplement with validation.\n', 'utf8');
  await writeFile(path.join(workspaceRoot, 'README.md'), '# Repo docs\nArchitecture notes.\n', 'utf8');
  await mkdir(path.join(workspaceRoot, '.specs', 'feature-a'), { recursive: true });
  await writeFile(path.join(workspaceRoot, '.specs', 'feature-a', 'tasks.md'), '- [ ] sample feature task\n', 'utf8');

  return workspaceRoot;
}

test('triage before bootstrap returns blocked structured response', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    const result = await triageTask({
      workspaceRoot,
      request: 'Implement a small helper for bootstrap logging',
    });

    assert.equal(result.workspace.status, 'not_bootstrapped');
    assert.equal(result.triage.triageState, 'blocked');
    assert.equal(result.triage.blockedReason, 'workspace_not_bootstrapped');
    assert.equal(result.triage.recommendedNextStep, 'run hardless.bootstrap');
    assert.deepEqual(result.triage.contextBundle.loadedMaterialTypes, []);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('context before bootstrap returns minimal blocked context', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    const result = await loadContextForRequest({
      workspaceRoot,
      request: 'Implement a small helper for bootstrap logging',
    });

    assert.equal(result.workspace.status, 'not_bootstrapped');
    assert.equal(result.triage.triageState, 'blocked');
    assert.equal(result.triage.blockedReason, 'workspace_not_bootstrapped');
    assert.deepEqual(result.context.requiredBundles, []);
    assert.deepEqual(result.context.triggeredBundles, []);
    assert.deepEqual(result.context.references, []);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('refresh before bootstrap fails with structured operational error', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await assert.rejects(
      refreshWorkspace({ workspaceRoot }),
      (error: unknown) =>
        error instanceof HardlessWorkspaceError && error.code === 'workspace_not_bootstrapped',
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('status returns not_bootstrapped only when manifest is absent', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    const result = await getWorkspaceStatus({ workspaceRoot });

    assert.equal(result.workspace.status, 'not_bootstrapped');
    assert.equal(result.statusReason, 'workspace_not_bootstrapped');
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('status returns degraded when workspace manifest JSON is invalid', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    await writeFile(path.join(workspaceRoot, '.hardless/manifests/workspace.json'), '{invalid', 'utf8');

    const result = await getWorkspaceStatus({ workspaceRoot });

    assert.equal(result.workspace.status, 'degraded');
    assert.equal(result.statusReason, 'runtime_state_corrupted');
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('status returns degraded when workspace manifest cannot be read', async () => {
  const workspaceRoot = await createFixtureWorkspace();
  const manifestPath = path.join(workspaceRoot, '.hardless/manifests/workspace.json');

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    await chmod(manifestPath, 0o000);

    const result = await getWorkspaceStatus({ workspaceRoot });

    assert.equal(result.workspace.status, 'degraded');
    assert.equal(result.statusReason, 'runtime_state_unreadable');
  } finally {
    await chmod(manifestPath, 0o644).catch(() => undefined);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
