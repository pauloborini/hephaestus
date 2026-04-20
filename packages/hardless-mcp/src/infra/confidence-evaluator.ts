import type { ActivationDecision, ArtifactOrigin, DiscoveredSource, SourceFragment } from '../domain/index.js';
import { HARDLESS_DEFAULTS } from '../shared/index.js';

export interface EvaluateActivationOptions {
  sources: DiscoveredSource[];
  fragments: SourceFragment[];
}

export function evaluateActivationDecision(
  options: EvaluateActivationOptions,
): ActivationDecision {
  const foundSources = options.sources.filter((source) => source.exists).length;
  const missingSources = options.sources.filter((source) => !source.exists).length;
  const ambiguityPenalty = options.fragments.filter((fragment) => fragment.ambiguity !== 'low').length * 0.04;
  const highConfidenceFragments = options.fragments.filter((fragment) => fragment.confidence >= 0.8).length;
  const taskCoverage = new Set(options.fragments.flatMap((fragment) => fragment.taskTypes)).size;

  const sourceCoverageScore = foundSources === 0 ? 0 : Math.min(0.35, foundSources * 0.08);
  const fragmentCoverageScore = Math.min(0.35, options.fragments.length * 0.03);
  const confidenceBoost = Math.min(0.2, highConfidenceFragments * 0.02);
  const taskCoverageBoost = Math.min(0.12, taskCoverage * 0.02);
  const missingPenalty = Math.min(0.18, missingSources * 0.02);

  const rawScore =
    0.2 + sourceCoverageScore + fragmentCoverageScore + confidenceBoost + taskCoverageBoost - ambiguityPenalty - missingPenalty;
  const confidenceScore = Number(Math.max(0, Math.min(0.98, rawScore)).toFixed(2));
  const status = confidenceScore >= HARDLESS_DEFAULTS.activationThreshold ? 'auto_activated' : 'pending_activation';
  const artifactOrigin = inferArtifactOrigin(foundSources, missingSources);

  const reasons = [
    `found_sources=${foundSources}`,
    `missing_sources=${missingSources}`,
    `fragments=${options.fragments.length}`,
    `ambiguous_fragments=${options.fragments.filter((fragment) => fragment.ambiguity !== 'low').length}`,
    `task_coverage=${taskCoverage}`,
  ];

  return {
    status,
    confidenceScore,
    threshold: HARDLESS_DEFAULTS.activationThreshold,
    artifactOrigin,
    reasons,
    requiresOperatorConfirmation: status !== 'auto_activated',
  };
}

function inferArtifactOrigin(foundSources: number, missingSources: number): ArtifactOrigin {
  if (foundSources === 0 || foundSources <= missingSources) {
    return 'hardless_fallback';
  }

  if (missingSources === 0) {
    return 'user_dominant';
  }

  return 'mixed';
}
