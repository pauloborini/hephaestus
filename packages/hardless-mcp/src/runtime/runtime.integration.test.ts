import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { bootstrapWorkspace, buildWorkspaceContext } from '../application/index.js';
import { triageWorkspaceRequest } from './orchestrator.js';

async function createFixtureWorkspace(): Promise<string> {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'hardless-runtime-'));

  await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '# Workflow\nImplement with validation and workflow canon.\n', 'utf8');
  await writeFile(path.join(workspaceRoot, 'README.md'), '# Repo docs\nArchitecture and bootstrap notes.\n', 'utf8');
  await mkdir(path.join(workspaceRoot, '.specs', 'feature-a'), { recursive: true });
  await writeFile(path.join(workspaceRoot, '.specs', 'feature-a', 'tasks.md'), '- [ ] sample feature task\n', 'utf8');

  return workspaceRoot;
}

test('runtime triage returns discussion for non-editing requests', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    const workspace = buildWorkspaceContext(workspaceRoot);
    const response = await triageWorkspaceRequest({
      request: 'What is the current bootstrap status?',
      workspace,
    });

    assert.equal(response.triageState, 'discussion');
    assert.equal(response.gateDecision.canWrite, false);
    assert.equal(response.shortPlan.length, 0);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('runtime triage returns fast_mode with short plan for small changes', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    const workspace = buildWorkspaceContext(workspaceRoot);
    const response = await triageWorkspaceRequest({
      request: 'Implement a small helper for bootstrap logging',
      workspace,
    });

    assert.equal(response.triageState, 'fast_mode');
    assert.equal(response.shortPlan.length > 0, true);
    assert.equal(response.contextBundle.requiredBundles.length > 0, true);
    assert.equal(response.contextBundle.triggeredBundles.length, 0);
    assert.equal(response.contextBundle.references.length, 0);
    assert.deepEqual(response.contextBundle.loadedMaterialTypes, ['required']);
    assert.deepEqual(response.triggerSignals, []);
    assert.equal(response.recommendedNextStep, 'seguir com plano curto e validacao minima');
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('runtime triage returns spec_flow for risky requests', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    const workspace = buildWorkspaceContext(workspaceRoot);
    const response = await triageWorkspaceRequest({
      request: 'Implement a contract migration across multiple modules and architecture layers',
      workspace,
    });

    assert.equal(response.triageState, 'spec_flow');
    assert.equal(response.shortPlan.length > 0, true);
    assert.equal(response.recommendedNextStep, 'abrir ou atualizar artefatos do spec flow antes da escrita ampla');
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('runtime triage promotes fast_mode to spec_flow when context expands', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    const workspace = buildWorkspaceContext(workspaceRoot);
    const response = await triageWorkspaceRequest({
      request: 'Create feature and update docs',
      workspace,
    });

    assert.equal(response.triageState, 'spec_flow');
    assert.equal(response.promotedToSpecFlow, true);
    assert.equal(response.contextBundle.triggeredBundles.length > 0, true);
    assert.equal(response.contextBundle.references.length > 0, true);
    assert.equal(response.triggerSignals.includes('multi_area_change'), true);
    assert.equal(response.triggerSignals.includes('needs_references'), true);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('runtime triage blocks when context is insufficient', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-19T00:00:00.000Z',
    });
    const workspace = buildWorkspaceContext(workspaceRoot);
    const response = await triageWorkspaceRequest({
      request: 'Implement something, not sure where because context is unknown',
      workspace,
    });

    assert.equal(response.triageState, 'blocked');
    assert.equal(response.gateDecision.canWrite, false);
    assert.equal(response.recommendedNextStep, 'pedir contexto adicional ou reconciliar artefatos');
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
