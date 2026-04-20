import type { HardlessPaths } from '../domain/index.js';

export interface FileSystemPort {
  ensureDirectories(paths: string[]): Promise<void>;
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
}

export interface WorkspaceFileSystemContext {
  paths: HardlessPaths;
  workspaceRoot: string;
}
