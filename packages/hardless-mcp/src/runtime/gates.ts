import type { HardlessTriageState } from '../domain/index.js';
import type { RuntimeGateDecision } from './contracts.js';

export function evaluateRuntimeGates(input: {
  triageState: HardlessTriageState;
  stale: boolean;
  validationDeclared: boolean;
  fallbackApplied: boolean;
}): RuntimeGateDecision {
  const reasons: string[] = [];

  if (input.triageState === 'blocked') {
    reasons.push('blocked_tasks_cannot_write');
  }

  if (input.stale) {
    reasons.push('stale_context_requires_reconciliation');
  }

  if (input.fallbackApplied) {
    reasons.push('fallback_context_must_be_disclosed');
  }

  if (!input.validationDeclared) {
    reasons.push('validation_is_required_before_conclusion');
  }

  return {
    canWrite: input.triageState !== 'blocked' && input.triageState !== 'discussion' && !input.stale,
    canConclude:
      input.triageState !== 'blocked' &&
      input.triageState !== 'discussion' &&
      !input.stale &&
      input.validationDeclared,
    reasons,
  };
}
