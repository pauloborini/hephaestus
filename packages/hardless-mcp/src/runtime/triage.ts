import type { HardlessTriageState, TaskType } from '../domain/index.js';
import type { RuntimeTriggerSignal } from './contracts.js';

const TASK_TYPE_HINTS: Array<{ taskType: TaskType; keywords: string[] }> = [
  { taskType: 'diagnostic', keywords: ['bug', 'erro', 'regress', 'issue', 'fix'] },
  { taskType: 'contract', keywords: ['contract', 'schema', 'dto', 'api', 'endpoint'] },
  { taskType: 'ui', keywords: ['ui', 'layout', 'screen', 'component', 'button'] },
  { taskType: 'navigation', keywords: ['route', 'navigation', 'redirect', 'guard'] },
  { taskType: 'security', keywords: ['secret', 'permission', 'security', 'token'] },
  { taskType: 'testing', keywords: ['test', 'coverage', 'assert'] },
  { taskType: 'refactoring', keywords: ['refactor', 'cleanup', 'simplify'] },
  { taskType: 'shared', keywords: ['shared', 'common', 'utility', 'helper'] },
  { taskType: 'feature', keywords: ['create', 'implement', 'add', 'build', 'bootstrap'] },
];

const DISCUSSION_HINTS = ['why', 'what', 'como', 'por que', 'should', '?'];
const HIGH_RISK_HINTS = ['multiple', 'several', 'contract', 'architecture', 'migrate', 'refactor all', 'broad'];
const BLOCKED_HINTS = ['not sure', 'talvez', 'sem contexto', 'unknown'];

export interface TriageClassification {
  state: HardlessTriageState;
  taskType: TaskType;
  rationale: string[];
  triggerSignals: RuntimeTriggerSignal[];
  blockedReason?: 'insufficient_context_signal';
}

export function classifyRequest(request: string): TriageClassification {
  const normalized = request.toLowerCase();
  const taskType = inferTaskType(normalized);
  const rationale: string[] = [`task_type=${taskType}`];
  const triggerSignals = inferTriggerSignals(normalized);

  if (isDiscussion(normalized)) {
    rationale.push('detected_discussion_request');
    return { state: 'discussion', taskType, rationale, triggerSignals };
  }

  if (BLOCKED_HINTS.some((hint) => normalized.includes(hint))) {
    rationale.push('insufficient_context_signal');
    return {
      state: 'blocked',
      taskType,
      rationale,
      triggerSignals: uniqueSignals([...triggerSignals, 'high_ambiguity']),
      blockedReason: 'insufficient_context_signal',
    };
  }

  if (HIGH_RISK_HINTS.some((hint) => normalized.includes(hint)) || normalized.length > 140) {
    rationale.push('high_risk_or_broad_scope');
    return {
      state: 'spec_flow',
      taskType,
      rationale,
      triggerSignals: uniqueSignals([...triggerSignals, 'high_ambiguity']),
    };
  }

  rationale.push('small_clear_change_candidate');
  return { state: 'fast_mode', taskType, rationale, triggerSignals };
}

export function shouldPromoteToSpecFlow(input: {
  request: string;
  triggerSignals: RuntimeTriggerSignal[];
  triggeredBundleCount: number;
  referenceCount: number;
}): boolean {
  const normalized = input.request.toLowerCase();
  const signalSet = new Set(input.triggerSignals);

  return (
    signalSet.has('contract_change') ||
    signalSet.has('high_ambiguity') ||
    input.triggeredBundleCount > 1 ||
    (signalSet.has('multi_area_change') && input.triggeredBundleCount >= 1) ||
    (signalSet.has('multi_area_change') && input.referenceCount >= 1) ||
    input.referenceCount > 2 ||
    (HIGH_RISK_HINTS.some((hint) => normalized.includes(hint)) && signalSet.has('needs_triggered_context'))
  );
}

function inferTriggerSignals(request: string): RuntimeTriggerSignal[] {
  const signals = new Set<RuntimeTriggerSignal>();

  if (
    request.includes('contract') ||
    request.includes('schema') ||
    request.includes('dto') ||
    request.includes('api') ||
    request.includes('endpoint')
  ) {
    signals.add('contract_change');
    signals.add('needs_triggered_context');
    signals.add('needs_references');
  }

  if (
    request.includes('docs') ||
    request.includes('readme') ||
    request.includes('reference') ||
    request.includes('spec')
  ) {
    signals.add('needs_references');
  }

  if (
    request.includes(' and ') ||
    request.includes('multiple') ||
    request.includes('several') ||
    request.includes('across') ||
    request.includes('multi')
  ) {
    signals.add('multi_area_change');
    signals.add('needs_triggered_context');
  }

  if (HIGH_RISK_HINTS.some((hint) => request.includes(hint))) {
    signals.add('high_ambiguity');
    signals.add('needs_triggered_context');
  }

  return [...signals];
}

function uniqueSignals(signals: RuntimeTriggerSignal[]): RuntimeTriggerSignal[] {
  return [...new Set(signals)];
}

function inferTaskType(request: string): TaskType {
  for (const entry of TASK_TYPE_HINTS) {
    if (entry.keywords.some((keyword) => request.includes(keyword))) {
      return entry.taskType;
    }
  }

  return 'feature';
}

function isDiscussion(request: string): boolean {
  return DISCUSSION_HINTS.some((hint) => request.includes(hint)) && !request.includes('implement') && !request.includes('fix');
}
