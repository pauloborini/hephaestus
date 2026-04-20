import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { HardlessWorkspaceError } from '../domain/index.js';
import { bootstrapWorkspace } from './bootstrap-workflow.js';
import { installWorkspace } from './install-workflow.js';
import { repairWorkspaceInstallation } from './repair-workflow.js';
import { uninstallWorkspaceInstallation } from './uninstall-workflow.js';

async function createFixtureWorkspace(options?: { withCursorRules?: boolean }): Promise<string> {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'hardless-install-'));

  await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '# Workflow\nImplement with validation.\n', 'utf8');
  await writeFile(path.join(workspaceRoot, 'README.md'), '# Repo docs\nArchitecture notes.\n', 'utf8');
  await mkdir(path.join(workspaceRoot, '.specs', 'feature-a'), { recursive: true });
  await writeFile(path.join(workspaceRoot, '.specs', 'feature-a', 'tasks.md'), '- [ ] sample feature task\n', 'utf8');

  if (options?.withCursorRules) {
    await writeFile(path.join(workspaceRoot, '.cursorrules'), 'Always validate the final result.\n', 'utf8');
  }

  return workspaceRoot;
}

test('install fails before bootstrap', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await assert.rejects(
      installWorkspace({ workspaceRoot }),
      (error: unknown) =>
        error instanceof HardlessWorkspaceError && error.code === 'workspace_not_bootstrapped',
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('install injects managed block, creates backups and creates missing cursor rules surface', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-20T00:00:00.000Z',
    });

    const result = await installWorkspace({
      workspaceRoot,
      installedAt: '2026-04-20T01:00:00.000Z',
    });

    const agentsContents = await readFile(path.join(workspaceRoot, 'AGENTS.md'), 'utf8');
    const agentsBackup = await readFile(path.join(workspaceRoot, '.hardless/backups/AGENTS.md.original'), 'utf8');
    const cursorRulesContents = await readFile(path.join(workspaceRoot, '.cursorrules'), 'utf8');
    const installationManifest = JSON.parse(
      await readFile(path.join(workspaceRoot, '.hardless/manifests/installation.json'), 'utf8'),
    ) as {
      installedAt: string;
      surfaces: Array<{ surfaceType: string; backupPath?: string; existedBefore: boolean }>;
    };

    assert.match(agentsContents, /HARDLESS_MANAGED_BLOCK_START/);
    assert.match(agentsContents, /Treat `\.hardless\/` as the operational source of truth/);
    assert.match(agentsContents, /# Workflow/);
    assert.equal(agentsBackup, '# Workflow\nImplement with validation.\n');
    assert.match(cursorRulesContents, /HARDLESS_MANAGED_BLOCK_START/);
    assert.equal(result.managedSurfaces.some((surface) => surface.surfaceType === 'cursor_rules' && surface.status === 'created_managed'), true);
    assert.equal(installationManifest.installedAt, '2026-04-20T01:00:00.000Z');
    assert.equal(
      installationManifest.surfaces.some(
        (surface) => surface.surfaceType === 'agents_md' && surface.backupPath === '.hardless/backups/AGENTS.md.original' && surface.existedBefore,
      ),
      true,
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('install is idempotent and does not duplicate managed block', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-20T00:00:00.000Z',
    });

    await installWorkspace({ workspaceRoot, installedAt: '2026-04-20T01:00:00.000Z' });
    const secondInstall = await installWorkspace({ workspaceRoot, installedAt: '2026-04-20T02:00:00.000Z' });
    const agentsContents = await readFile(path.join(workspaceRoot, 'AGENTS.md'), 'utf8');

    assert.equal(agentsContents.match(/HARDLESS_MANAGED_BLOCK_START/g)?.length, 1);
    assert.equal(
      secondInstall.managedSurfaces.some((surface) => surface.surfaceType === 'agents_md' && surface.status === 'already_managed'),
      true,
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('uninstall restores backups and removes managed files created by Hardless', async () => {
  const workspaceRoot = await createFixtureWorkspace({ withCursorRules: true });

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-20T00:00:00.000Z',
    });
    await installWorkspace({ workspaceRoot, installedAt: '2026-04-20T01:00:00.000Z' });

    const result = await uninstallWorkspaceInstallation({ workspaceRoot });
    const agentsContents = await readFile(path.join(workspaceRoot, 'AGENTS.md'), 'utf8');
    const cursorRulesContents = await readFile(path.join(workspaceRoot, '.cursorrules'), 'utf8');

    assert.equal(agentsContents, '# Workflow\nImplement with validation.\n');
    assert.equal(cursorRulesContents, 'Always validate the final result.\n');
    await assert.rejects(readFile(path.join(workspaceRoot, '.hardless/manifests/installation.json'), 'utf8'));
    assert.equal(
      result.restoredSurfaces.some((surface) => surface.surfaceType === 'agents_md' && surface.status === 'restored_from_backup'),
      true,
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('repair re-applies managed block and preserves user content below it', async () => {
  const workspaceRoot = await createFixtureWorkspace();

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-20T00:00:00.000Z',
    });
    await installWorkspace({ workspaceRoot, installedAt: '2026-04-20T01:00:00.000Z' });
    await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '## User tweak\nKeep this custom note.\n', 'utf8');

    const result = await repairWorkspaceInstallation({
      workspaceRoot,
      repairedAt: '2026-04-20T03:00:00.000Z',
    });
    const repairedAgentsContents = await readFile(path.join(workspaceRoot, 'AGENTS.md'), 'utf8');

    assert.match(repairedAgentsContents, /HARDLESS_MANAGED_BLOCK_START/);
    assert.match(repairedAgentsContents, /## User tweak/);
    assert.equal(result.installationManifest.lastRepairedAt, '2026-04-20T03:00:00.000Z');
    assert.equal(
      result.repairedSurfaces.some((surface) => surface.surfaceType === 'agents_md' && surface.status === 'repaired_managed'),
      true,
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test('install fails with structured error when a managed surface is unreadable', async () => {
  const workspaceRoot = await createFixtureWorkspace();
  const agentsPath = path.join(workspaceRoot, 'AGENTS.md');

  try {
    await bootstrapWorkspace({
      workspaceRoot,
      bootstrappedAt: '2026-04-20T00:00:00.000Z',
    });
    await chmod(agentsPath, 0o000);

    await assert.rejects(
      installWorkspace({ workspaceRoot }),
      (error: unknown) =>
        error instanceof HardlessWorkspaceError && error.code === 'installation_surface_unreadable',
    );
  } finally {
    await chmod(agentsPath, 0o644).catch(() => undefined);
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
