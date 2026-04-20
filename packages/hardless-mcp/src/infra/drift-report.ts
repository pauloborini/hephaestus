import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import type { DriftReport, HardlessPaths } from '../domain/index.js';

export async function writeDriftReport(options: {
  workspaceRoot: string;
  paths: HardlessPaths;
  driftReport: DriftReport;
}): Promise<string> {
  const reportPath = path.join(options.paths.reportsDir, 'drift.json');
  await writeFile(reportPath, `${JSON.stringify(options.driftReport, null, 2)}\n`, 'utf8');
  return path.relative(options.workspaceRoot, reportPath) || reportPath;
}
