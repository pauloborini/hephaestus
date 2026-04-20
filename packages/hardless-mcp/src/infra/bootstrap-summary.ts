import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import type { ActivationDecision, DiscoveredSource, HardlessPaths, SourceFragment } from '../domain/index.js';

export interface WriteBootstrapSummaryOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  sources: DiscoveredSource[];
  fragments: SourceFragment[];
  activation: ActivationDecision;
  bootstrappedAt: string;
  refreshedAt?: string;
}

export async function writeBootstrapSummary(
  options: WriteBootstrapSummaryOptions,
): Promise<string> {
  const foundSources = options.sources.filter((source) => source.exists);
  const missingSources = options.sources.filter((source) => !source.exists);
  const ambiguousFragments = options.fragments.filter((fragment) => fragment.ambiguity !== 'low');
  const fallbackApplied = options.activation.artifactOrigin !== 'user_dominant';

  const contents = `# Bootstrap Summary

## Activation

- confidence score: ${options.activation.confidenceScore}
- activation threshold: ${options.activation.threshold}
- activation status: ${options.activation.status}
- operator confirmation required: ${options.activation.requiresOperatorConfirmation ? 'yes' : 'no'}

## Timeline

- bootstrapped at: ${options.bootstrappedAt}
- refreshed at: ${options.refreshedAt ?? 'not refreshed yet'}

## Sources Found

${foundSources.map((source) => `- ${source.sourcePath} (${source.sourceType})`).join('\n') || '- none'}

## Sources Missing

${missingSources.map((source) => `- ${source.sourcePath} (${source.sourceType})`).join('\n') || '- none'}

## Fragment Summary

- total fragments: ${options.fragments.length}
- ambiguous fragments: ${ambiguousFragments.length}
- task coverage: ${[...new Set(options.fragments.flatMap((fragment) => fragment.taskTypes))].join(', ') || 'none'}

## Fallbacks

- fallback applied: ${fallbackApplied ? 'yes' : 'no'}
- dominant origin: ${options.activation.artifactOrigin}
- reasons:
${options.activation.reasons.map((reason) => `  - ${reason}`).join('\n')}
`;

  const summaryPath = path.join(options.paths.reportsDir, 'bootstrap-summary.md');
  await writeFile(summaryPath, `${contents}\n`, 'utf8');

  return path.relative(options.workspaceRoot, summaryPath) || summaryPath;
}
