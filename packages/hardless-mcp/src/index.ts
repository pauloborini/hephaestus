export * from './application/index.js';
export * from './domain/index.js';
export * from './infra/index.js';
export * from './mcp/index.js';
export * from './runtime/index.js';
export * from './shared/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { startHardlessMcpServer } from './mcp/index.js';

export type HardlessMcpStatus = 'foundation_ready';

export function getHardlessMcpStatus(): HardlessMcpStatus {
  return 'foundation_ready';
}

function isMainModule(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(process.argv[1]) === currentFile;
}

if (isMainModule()) {
  void startHardlessMcpServer();
}
