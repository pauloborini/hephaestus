import { mkdir, readFile, writeFile } from 'node:fs/promises';

import type { FileSystemPort } from './filesystem.js';

export class NodeFileSystem implements FileSystemPort {
  async ensureDirectories(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => mkdir(path, { recursive: true })));
  }

  async readText(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }

  async writeText(path: string, contents: string): Promise<void> {
    await writeFile(path, contents, 'utf8');
  }
}
