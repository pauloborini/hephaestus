import type { HardlessPaths, TaskType } from '../domain/index.js';
import type { RuntimeContextBundle, RuntimeTriggerSignal } from './contracts.js';
import { loadRuleBundle, loadTaskTypeIndex, loadTriggeredReference } from './runtime-store.js';

export async function loadContextBundle(options: {
  workspaceRoot: string;
  paths: HardlessPaths;
  taskType: TaskType;
  triageState: RuntimeContextBundle['triageState'];
  triggerSignals: RuntimeTriggerSignal[];
}): Promise<RuntimeContextBundle> {
  const index = await loadTaskTypeIndex(options.paths, options.taskType);
  const requiredBundles = index.requiredBundles;
  const triggerSignals = new Set(options.triggerSignals);
  const triggeredBundles = triggerSignals.has('needs_triggered_context') ? index.triggeredBundles.slice(0, 1) : [];
  const referenceIds = triggerSignals.has('needs_references') ? index.referenceIds.slice(0, 2) : [];

  const loadedArtifacts = [...requiredBundles, ...triggeredBundles];
  const loadedMaterialTypes: RuntimeContextBundle['loadedMaterialTypes'] = ['required'];

  if (triggeredBundles.length > 0) {
    loadedMaterialTypes.push('triggered');
  }

  if (referenceIds.length > 0) {
    loadedMaterialTypes.push('references');
  }

  await Promise.all([
    ...requiredBundles.map((bundlePath) => loadRuleBundle(options.workspaceRoot, bundlePath)),
    ...triggeredBundles.map((bundlePath) => loadRuleBundle(options.workspaceRoot, bundlePath)),
    ...referenceIds.map((referenceId) => loadTriggeredReference(options.paths, referenceId)),
  ]);

  return {
    workspaceRoot: options.workspaceRoot,
    paths: options.paths,
    loadedArtifacts,
    loadedMaterialTypes,
    taskType: options.taskType,
    triageState: options.triageState,
    requiredBundles,
    triggeredBundles,
    references: referenceIds,
    stale: index.stale,
  };
}
