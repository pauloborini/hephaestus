import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';

import { HardlessWorkspaceError } from '../domain/index.js';

export async function validateWorkspaceRoot(workspaceRoot: string): Promise<void> {
  let workspaceStats;

  try {
    workspaceStats = await stat(workspaceRoot);
  } catch (error) {
    throw new HardlessWorkspaceError({
      code: 'workspace_not_found',
      message: `Workspace root not found: ${workspaceRoot}`,
      workspaceRoot,
      cause: error,
    });
  }

  if (!workspaceStats.isDirectory()) {
    throw new HardlessWorkspaceError({
      code: 'workspace_not_directory',
      message: `Workspace root is not a directory: ${workspaceRoot}`,
      workspaceRoot,
    });
  }

  try {
    await access(workspaceRoot, constants.R_OK | constants.W_OK);
  } catch (error) {
    throw new HardlessWorkspaceError({
      code: 'workspace_access_denied',
      message: `Workspace root must be readable and writable: ${workspaceRoot}`,
      workspaceRoot,
      cause: error,
    });
  }
}
