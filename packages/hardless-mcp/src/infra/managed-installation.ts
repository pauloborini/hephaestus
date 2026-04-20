import { createHash } from 'node:crypto';
import path from 'node:path';
import { readFile, unlink, writeFile } from 'node:fs/promises';

import type {
  HardlessPaths,
  InstallationManifest,
  InstallationSurfaceManifestEntry,
  ManagedInstallationMode,
  ManagedSurfaceType,
} from '../domain/index.js';
import { HardlessWorkspaceError } from '../domain/index.js';
import { HARDLESS_SCHEMA_VERSIONS, listHardlessDirectories } from '../shared/index.js';
import { NodeFileSystem } from './node-filesystem.js';

const fileSystem = new NodeFileSystem();

const MANAGED_BLOCK_START = 'HARDLESS_MANAGED_BLOCK_START';
const MANAGED_BLOCK_END = 'HARDLESS_MANAGED_BLOCK_END';

export const MANAGED_INSTALLATION_MODE: ManagedInstallationMode = 'managed_safe';
export const MANAGED_INSTALLATION_TEMPLATE_VERSION = 'managed-safe-v1';

interface ManagedSurfaceDefinition {
  surfaceType: ManagedSurfaceType;
  targetPath: string;
  backupFileName: string;
  managedBlockId: string;
}

const MANAGED_SURFACES: ManagedSurfaceDefinition[] = [
  {
    surfaceType: 'agents_md',
    targetPath: 'AGENTS.md',
    backupFileName: 'AGENTS.md.original',
    managedBlockId: 'hardless-managed-agents-v1',
  },
  {
    surfaceType: 'cursor_rules',
    targetPath: '.cursorrules',
    backupFileName: '.cursorrules.original',
    managedBlockId: 'hardless-managed-cursorrules-v1',
  },
];

export interface InstallManagedRuntimeOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  installedAt?: string;
}

export interface UninstallManagedRuntimeOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
}

export interface RepairManagedRuntimeOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  repairedAt?: string;
}

export async function installManagedRuntime(
  options: InstallManagedRuntimeOptions,
): Promise<{ installationManifest: InstallationManifest; manifestPath: string; managedSurfaces: InstallationSurfaceManifestEntry[] }> {
  await fileSystem.ensureDirectories(listHardlessDirectories(options.paths));

  const installedAt = options.installedAt ?? new Date().toISOString();
  const existingManifest = await readOptionalInstallationManifest(options.paths);
  const previousSurfaces = new Map((existingManifest?.surfaces ?? []).map((surface) => [surface.surfaceType, surface]));

  const managedSurfaces = await Promise.all(
    MANAGED_SURFACES.map((surface) =>
      installManagedSurface({
        workspaceRoot: options.workspaceRoot,
        paths: options.paths,
        surface,
        previousSurface: previousSurfaces.get(surface.surfaceType),
      }),
    ),
  );

  const installationManifest: InstallationManifest = {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.installation,
    workspaceRoot: options.workspaceRoot,
    installedAt: existingManifest?.installedAt ?? installedAt,
    lastRepairedAt: existingManifest?.lastRepairedAt,
    mode: MANAGED_INSTALLATION_MODE,
    templateVersion: MANAGED_INSTALLATION_TEMPLATE_VERSION,
    surfaces: managedSurfaces,
  };

  const manifestPath = await writeInstallationManifest(options.paths, installationManifest);
  return {
    installationManifest,
    manifestPath,
    managedSurfaces,
  };
}

export async function uninstallManagedRuntime(
  options: UninstallManagedRuntimeOptions,
): Promise<{ restoredSurfaces: InstallationSurfaceManifestEntry[]; removedManifestPath: string }> {
  const installationManifest = await readInstallationManifest(options.paths);
  const restoredSurfaces = await Promise.all(
    installationManifest.surfaces.map((surface) =>
      uninstallManagedSurface({
        workspaceRoot: options.workspaceRoot,
        surface,
      }),
    ),
  );

  await Promise.all(
    installationManifest.surfaces
      .map((surface) => surface.backupPath)
      .filter((backupPath): backupPath is string => Boolean(backupPath))
      .map(async (backupPath) => {
        try {
          await unlink(path.join(options.workspaceRoot, backupPath));
        } catch (error) {
          if (!isNodeError(error) || error.code !== 'ENOENT') {
            throw new HardlessWorkspaceError({
              code: 'installation_surface_write_failed',
              message: `Failed to remove backup artifact: ${backupPath}`,
              workspaceRoot: options.workspaceRoot,
              sourcePath: backupPath,
              cause: error,
            });
          }
        }
      }),
  );

  const manifestPath = installationManifestPath(options.paths);
  await unlink(manifestPath).catch((error: unknown) => {
    if (!isNodeError(error) || error.code !== 'ENOENT') {
      throw new HardlessWorkspaceError({
        code: 'installation_surface_write_failed',
        message: 'Failed to remove installation manifest.',
        workspaceRoot: options.workspaceRoot,
        sourcePath: path.relative(options.workspaceRoot, manifestPath),
        cause: error,
      });
    }
  });

  return {
    restoredSurfaces,
    removedManifestPath: toWorkspaceRelative(options.workspaceRoot, manifestPath),
  };
}

export async function repairManagedRuntime(
  options: RepairManagedRuntimeOptions,
): Promise<{ installationManifest: InstallationManifest; manifestPath: string; repairedSurfaces: InstallationSurfaceManifestEntry[] }> {
  await fileSystem.ensureDirectories(listHardlessDirectories(options.paths));

  const repairedAt = options.repairedAt ?? new Date().toISOString();
  const installationManifest = await readInstallationManifest(options.paths);
  const manifestSurfaces = new Map(installationManifest.surfaces.map((surface) => [surface.surfaceType, surface]));

  const repairedSurfaces = await Promise.all(
    MANAGED_SURFACES.map((surface) =>
      repairManagedSurface({
        workspaceRoot: options.workspaceRoot,
        paths: options.paths,
        surface,
        manifestSurface: manifestSurfaces.get(surface.surfaceType),
      }),
    ),
  );

  const updatedManifest: InstallationManifest = {
    ...installationManifest,
    lastRepairedAt: repairedAt,
    surfaces: repairedSurfaces,
  };

  const manifestPath = await writeInstallationManifest(options.paths, updatedManifest);
  return {
    installationManifest: updatedManifest,
    manifestPath,
    repairedSurfaces,
  };
}

export async function readOptionalInstallationManifest(paths: HardlessPaths): Promise<InstallationManifest | undefined> {
  const manifestPath = installationManifestPath(paths);

  try {
    const raw = await readFile(manifestPath, 'utf8');
    return JSON.parse(raw) as InstallationManifest;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return undefined;
    }

    throw toInstallationManifestReadError(paths.root, manifestPath, error);
  }
}

export async function readInstallationManifest(paths: HardlessPaths): Promise<InstallationManifest> {
  const manifest = await readOptionalInstallationManifest(paths);

  if (!manifest) {
    throw new HardlessWorkspaceError({
      code: 'installation_not_found',
      message: 'Hardless installation manifest not found. Run hardless.install first.',
      workspaceRoot: paths.root,
      sourcePath: path.relative(paths.root, installationManifestPath(paths)),
    });
  }

  return manifest;
}

async function installManagedSurface(input: {
  workspaceRoot: string;
  paths: HardlessPaths;
  surface: ManagedSurfaceDefinition;
  previousSurface?: InstallationSurfaceManifestEntry;
}): Promise<InstallationSurfaceManifestEntry> {
  const targetAbsolutePath = path.join(input.workspaceRoot, input.surface.targetPath);
  const currentContents = await readOptionalSurfaceFile(input.workspaceRoot, input.surface.targetPath);
  const parsedCurrent = parseManagedSurface(currentContents, false);

  if (parsedCurrent.conflict) {
    throw new HardlessWorkspaceError({
      code: 'installation_conflict_detected',
      message: `Managed block conflict detected in ${input.surface.targetPath}. Repair or clean the file before reinstalling.`,
      workspaceRoot: input.workspaceRoot,
      sourcePath: input.surface.targetPath,
    });
  }

  const existedBefore =
    input.previousSurface?.existedBefore ?? (currentContents !== undefined && !parsedCurrent.hasManagedBlock);
  const preservedContents = parsedCurrent.preservedContent;
  const backupPath = existedBefore ? path.join('.hardless', 'backups', input.surface.backupFileName) : undefined;

  if (existedBefore && backupPath) {
    const backupAbsolutePath = path.join(input.workspaceRoot, backupPath);
    const backupContents = await readOptionalSurfaceFile(input.workspaceRoot, backupPath);

    if (backupContents === undefined) {
      await writeManagedFile(input.workspaceRoot, backupPath, preservedContents);
    } else if (!parsedCurrent.hasManagedBlock && hashText(backupContents) !== hashText(preservedContents)) {
      await writeManagedFile(input.workspaceRoot, backupPath, preservedContents);
    }
  }

  const renderedContents = renderManagedSurface(input.surface, preservedContents);
  await writeManagedFile(input.workspaceRoot, input.surface.targetPath, renderedContents);

  return {
    surfaceType: input.surface.surfaceType,
    targetPath: input.surface.targetPath,
    status:
      currentContents === undefined
        ? 'created_managed'
        : parsedCurrent.hasManagedBlock
          ? renderedContents === currentContents
            ? 'already_managed'
            : 'updated_managed'
          : 'installed',
    backupPath,
    originalHash: existedBefore ? hashText(preservedContents) : undefined,
    managedBlockId: input.surface.managedBlockId,
    existedBefore,
  };
}

async function uninstallManagedSurface(input: {
  workspaceRoot: string;
  surface: InstallationSurfaceManifestEntry;
}): Promise<InstallationSurfaceManifestEntry> {
  const targetAbsolutePath = path.join(input.workspaceRoot, input.surface.targetPath);

  if (input.surface.existedBefore) {
    if (!input.surface.backupPath) {
      throw new HardlessWorkspaceError({
        code: 'installation_state_corrupted',
        message: `Missing backup metadata for ${input.surface.targetPath}.`,
        workspaceRoot: input.workspaceRoot,
        sourcePath: input.surface.targetPath,
      });
    }

    const backupContents = await readOptionalSurfaceFile(input.workspaceRoot, input.surface.backupPath);

    if (backupContents === undefined) {
      throw new HardlessWorkspaceError({
        code: 'installation_state_corrupted',
        message: `Backup file missing for ${input.surface.targetPath}.`,
        workspaceRoot: input.workspaceRoot,
        sourcePath: input.surface.backupPath,
      });
    }

    await writeManagedFile(input.workspaceRoot, input.surface.targetPath, backupContents);
    return {
      ...input.surface,
      status: 'restored_from_backup',
    };
  }

  try {
    await unlink(targetAbsolutePath);
    return {
      ...input.surface,
      status: 'removed_managed',
    };
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {
        ...input.surface,
        status: 'already_removed',
      };
    }

    throw new HardlessWorkspaceError({
      code: 'installation_surface_write_failed',
      message: `Failed to remove managed surface: ${input.surface.targetPath}`,
      workspaceRoot: input.workspaceRoot,
      sourcePath: input.surface.targetPath,
      cause: error,
    });
  }
}

async function repairManagedSurface(input: {
  workspaceRoot: string;
  paths: HardlessPaths;
  surface: ManagedSurfaceDefinition;
  manifestSurface?: InstallationSurfaceManifestEntry;
}): Promise<InstallationSurfaceManifestEntry> {
  const existingSurface = input.manifestSurface;

  if (!existingSurface) {
    throw new HardlessWorkspaceError({
      code: 'installation_state_corrupted',
      message: `Installation manifest is missing surface metadata for ${input.surface.targetPath}.`,
      workspaceRoot: input.workspaceRoot,
      sourcePath: input.surface.targetPath,
    });
  }

  if (existingSurface.existedBefore && existingSurface.backupPath) {
    const backupContents = await readOptionalSurfaceFile(input.workspaceRoot, existingSurface.backupPath);

    if (backupContents === undefined) {
      throw new HardlessWorkspaceError({
        code: 'installation_state_corrupted',
        message: `Backup file missing for ${input.surface.targetPath}.`,
        workspaceRoot: input.workspaceRoot,
        sourcePath: existingSurface.backupPath,
      });
    }
  }

  const currentContents = await readOptionalSurfaceFile(input.workspaceRoot, input.surface.targetPath);
  const parsedCurrent = parseManagedSurface(currentContents, true);
  const preservedContents =
    currentContents === undefined
      ? existingSurface.existedBefore && existingSurface.backupPath
        ? (await readOptionalSurfaceFile(input.workspaceRoot, existingSurface.backupPath)) ?? ''
        : ''
      : parsedCurrent.preservedContent;

  const renderedContents = renderManagedSurface(input.surface, preservedContents);
  await writeManagedFile(input.workspaceRoot, input.surface.targetPath, renderedContents);

  return {
    ...existingSurface,
    status:
      currentContents !== undefined &&
      parsedCurrent.hasManagedBlock &&
      !parsedCurrent.conflict &&
      renderedContents === currentContents
        ? 'already_managed'
        : 'repaired_managed',
    originalHash: existingSurface.existedBefore ? existingSurface.originalHash ?? hashText(preservedContents) : undefined,
  };
}

async function writeInstallationManifest(paths: HardlessPaths, manifest: InstallationManifest): Promise<string> {
  const manifestPath = installationManifestPath(paths);
  await writeManagedFile(paths.root, toWorkspaceRelative(paths.root, manifestPath), `${JSON.stringify(manifest, null, 2)}\n`);
  return toWorkspaceRelative(paths.root, manifestPath);
}

function installationManifestPath(paths: HardlessPaths): string {
  return path.join(paths.manifestsDir, 'installation.json');
}

async function readOptionalSurfaceFile(workspaceRoot: string, relativePath: string): Promise<string | undefined> {
  try {
    return await readFile(path.join(workspaceRoot, relativePath), 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return undefined;
    }

    throw new HardlessWorkspaceError({
      code: 'installation_surface_unreadable',
      message: `Failed to read managed surface: ${relativePath}`,
      workspaceRoot,
      sourcePath: relativePath,
      cause: error,
    });
  }
}

async function writeManagedFile(workspaceRoot: string, relativePath: string, contents: string): Promise<void> {
  try {
    await fileSystem.writeText(path.join(workspaceRoot, relativePath), contents.endsWith('\n') ? contents : `${contents}\n`);
  } catch (error) {
    throw new HardlessWorkspaceError({
      code: 'installation_surface_write_failed',
      message: `Failed to write managed surface: ${relativePath}`,
      workspaceRoot,
      sourcePath: relativePath,
      cause: error,
    });
  }
}

function renderManagedSurface(surface: ManagedSurfaceDefinition, preservedContents: string): string {
  const instructions = buildManagedInstructions(surface);
  const preserved = preservedContents.replace(/^\s+/, '');
  return preserved.length > 0 ? `${instructions}\n\n${preserved}` : `${instructions}\n`;
}

function buildManagedInstructions(surface: ManagedSurfaceDefinition): string {
  return [
    `${MANAGED_BLOCK_START} surface=${surface.surfaceType} blockId=${surface.managedBlockId} mode=${MANAGED_INSTALLATION_MODE} templateVersion=${MANAGED_INSTALLATION_TEMPLATE_VERSION}`,
    '# Hardless Runtime Instructions',
    '',
    'This workspace is managed by Hardless.',
    '',
    'Before acting on implementation tasks, the agent must:',
    '1. Treat `.hardless/` as the operational source of truth for workflow routing and contextual loading.',
    '2. Check workspace state through Hardless before coding.',
    '3. Use Hardless triage before choosing between fast execution and broader planning.',
    '4. Load Hardless context before implementation when runtime artifacts exist.',
    '5. Use preserved project instructions below as supporting material, but do not bypass the Hardless workflow.',
    '',
    'Use these Hardless artifacts when relevant:',
    '- `.hardless/manifests/workspace.json`',
    '- `.hardless/rules/required/*`',
    '- `.hardless/rules/triggered/*`',
    '- `.hardless/indexes/task-types/*`',
    '- `.hardless/reports/*`',
    '',
    'If `.hardless/` is missing or stale, recover through Hardless bootstrap/refresh instead of bypassing the workflow.',
    MANAGED_BLOCK_END,
  ].join('\n');
}

function parseManagedSurface(contents: string | undefined, permissive: boolean): {
  hasManagedBlock: boolean;
  preservedContent: string;
  conflict: boolean;
} {
  if (contents === undefined) {
    return { hasManagedBlock: false, preservedContent: '', conflict: false };
  }

  const lines = contents.split(/\r?\n/);
  const startIndexes = lines
    .map((line, index) => (line.startsWith(MANAGED_BLOCK_START) ? index : -1))
    .filter((index) => index >= 0);
  const endIndexes = lines
    .map((line, index) => (line === MANAGED_BLOCK_END ? index : -1))
    .filter((index) => index >= 0);

  if (startIndexes.length === 0 && endIndexes.length === 0) {
    return { hasManagedBlock: false, preservedContent: contents, conflict: false };
  }

  if (startIndexes.length !== 1 || endIndexes.length !== 1 || endIndexes[0] < startIndexes[0]) {
    return permissive
      ? { hasManagedBlock: false, preservedContent: contents, conflict: false }
      : { hasManagedBlock: false, preservedContent: contents, conflict: true };
  }

  const preservedLines = [...lines.slice(0, startIndexes[0]), ...lines.slice(endIndexes[0] + 1)];
  const preservedContent = preservedLines.join('\n').replace(/^\s+/, '');
  const hasNonWhitespaceBeforeBlock = lines.slice(0, startIndexes[0]).join('\n').trim().length > 0;

  if (hasNonWhitespaceBeforeBlock && !permissive) {
    return { hasManagedBlock: false, preservedContent: contents, conflict: true };
  }

  return {
    hasManagedBlock: true,
    preservedContent,
    conflict: false,
  };
}

function hashText(contents: string): string {
  return `sha256:${createHash('sha256').update(contents).digest('hex')}`;
}

function toInstallationManifestReadError(
  workspaceRoot: string,
  manifestPath: string,
  error: unknown,
): HardlessWorkspaceError {
  if (error instanceof SyntaxError) {
    return new HardlessWorkspaceError({
      code: 'installation_state_corrupted',
      message: 'Hardless installation manifest is corrupted.',
      workspaceRoot,
      sourcePath: path.relative(workspaceRoot, manifestPath),
      cause: error,
    });
  }

  return new HardlessWorkspaceError({
    code: 'installation_surface_unreadable',
    message: 'Hardless installation manifest could not be read.',
    workspaceRoot,
    sourcePath: path.relative(workspaceRoot, manifestPath),
    cause: error,
  });
}

function toWorkspaceRelative(workspaceRoot: string, absolutePath: string): string {
  return path.relative(workspaceRoot, absolutePath) || '.';
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
