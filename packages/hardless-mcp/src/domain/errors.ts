export const WORKSPACE_ERROR_CODES = [
  'workspace_not_found',
  'workspace_not_directory',
  'workspace_access_denied',
  'source_read_failed',
  'snapshot_write_failed',
  'workspace_not_bootstrapped',
  'runtime_state_corrupted',
  'runtime_state_unreadable',
  'installation_not_found',
  'installation_state_corrupted',
  'installation_surface_unreadable',
  'installation_surface_write_failed',
  'installation_conflict_detected',
] as const;

export type WorkspaceErrorCode = (typeof WORKSPACE_ERROR_CODES)[number];

export class HardlessWorkspaceError extends Error {
  readonly code: WorkspaceErrorCode;
  readonly workspaceRoot: string;
  readonly sourcePath?: string;
  readonly cause?: unknown;

  constructor(options: {
    code: WorkspaceErrorCode;
    message: string;
    workspaceRoot: string;
    sourcePath?: string;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'HardlessWorkspaceError';
    this.code = options.code;
    this.workspaceRoot = options.workspaceRoot;
    this.sourcePath = options.sourcePath;
    this.cause = options.cause;
  }
}
