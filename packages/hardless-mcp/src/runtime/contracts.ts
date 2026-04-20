import type { HardlessPaths, HardlessTriageState, TaskType } from '../domain/index.js';
import type { WorkspaceStatusReason } from '../infra/index.js';

export const RUNTIME_TRIGGER_SIGNALS = [
  'needs_triggered_context',
  'needs_references',
  'contract_change',
  'multi_area_change',
  'high_ambiguity',
] as const;

export type RuntimeTriggerSignal = (typeof RUNTIME_TRIGGER_SIGNALS)[number];

export interface RuntimeContextBundle {
  workspaceRoot: string;
  paths: HardlessPaths;
  loadedArtifacts: string[];
  loadedMaterialTypes: Array<'required' | 'triggered' | 'references'>;
  taskType: TaskType;
  triageState: HardlessTriageState;
  requiredBundles: string[];
  triggeredBundles: string[];
  references: string[];
  stale: boolean;
}

export interface RuntimeGateDecision {
  canWrite: boolean;
  canConclude: boolean;
  reasons: string[];
}

export interface RuntimeTriageResponse {
  taskType: TaskType;
  triageState: HardlessTriageState;
  rationale: string[];
  blockedReason?: WorkspaceStatusReason | 'insufficient_context_signal';
  triggerSignals: RuntimeTriggerSignal[];
  promotedToSpecFlow: boolean;
  contextBundle: RuntimeContextBundle;
  gateDecision: RuntimeGateDecision;
  shortPlan: string[];
  recommendedNextStep?: string;
}
