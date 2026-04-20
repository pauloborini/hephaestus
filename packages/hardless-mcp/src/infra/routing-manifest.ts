import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import type { HardlessPaths, RoutingManifest, TaskType } from '../domain/index.js';
import { HARDLESS_SCHEMA_VERSIONS, listHardlessDirectories } from '../shared/index.js';
import { HARDLESS_ESCALATION_RULES, HARDLESS_TRIAGE_POLICY } from '../shared/bootstrap-method.js';

export interface WriteRoutingArtifactsOptions {
  workspaceRoot: string;
  paths: HardlessPaths;
  taskTypes: TaskType[];
}

export async function writeRoutingArtifacts(
  options: WriteRoutingArtifactsOptions,
): Promise<RoutingManifest> {
  const routingManifest: RoutingManifest = {
    schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
    triageStates: HARDLESS_TRIAGE_POLICY.map((entry) => entry.state),
    taskTypeIndexes: Object.fromEntries(
      options.taskTypes.map((taskType) => [taskType, `.hardless/indexes/task-types/${taskType}.json`]),
    ),
    escalationRules: [...HARDLESS_ESCALATION_RULES],
    blockingPolicy: {
      mode: 'conservative',
      blockOnRelevantUncertainty: true,
    },
    fallbackPolicy: {
      allowHardlessDefaults: true,
      requireDisclosure: true,
    },
  };

  const triagePolicyPath = path.join(options.paths.routingDir, 'triage-policy.json');
  const escalationPolicyPath = path.join(options.paths.routingDir, 'escalation-policy.json');
  const manifestPath = path.join(options.paths.manifestsDir, 'routing.json');

  await Promise.all([
    writeFile(
      triagePolicyPath,
      `${JSON.stringify(
        {
          schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
          states: HARDLESS_TRIAGE_POLICY,
        },
        null,
        2,
      )}\n`,
      'utf8',
    ),
    writeFile(
      escalationPolicyPath,
      `${JSON.stringify(
        {
          schemaVersion: HARDLESS_SCHEMA_VERSIONS.routing,
          rules: HARDLESS_ESCALATION_RULES,
        },
        null,
        2,
      )}\n`,
      'utf8',
    ),
    writeFile(manifestPath, `${JSON.stringify(routingManifest, null, 2)}\n`, 'utf8'),
  ]);

  return routingManifest;
}
