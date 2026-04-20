export const HARDLESS_TRIAGE_STATES = [
  'discussion',
  'fast_mode',
  'spec_flow',
  'blocked',
] as const;

export type HardlessTriageState = (typeof HARDLESS_TRIAGE_STATES)[number];

export const HARDLESS_RUNTIME_MODES = ['workflow_first'] as const;
export type HardlessRuntimeMode = (typeof HARDLESS_RUNTIME_MODES)[number];

export const WORKSPACE_STATUSES = [
  'not_bootstrapped',
  'ready',
  'pending_activation',
  'stale_with_warning',
  'degraded',
  'disabled',
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const ACTIVATION_STATUSES = [
  'auto_activated',
  'pending_activation',
  'manually_activated',
  'activation_blocked',
] as const;

export type ActivationStatus = (typeof ACTIVATION_STATUSES)[number];

export const SOURCE_TYPES = [
  'agents_md',
  'claude_md',
  'cloud_md',
  'cursor_rules',
  'specs_directory',
  'repository_docs',
  'other',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const DISCOVERY_STATUSES = ['found', 'missing', 'ignored'] as const;
export type DiscoveryStatus = (typeof DISCOVERY_STATUSES)[number];

export const INGESTION_STATUSES = [
  'pending',
  'ingested',
  'failed',
  'skipped',
] as const;

export type IngestionStatus = (typeof INGESTION_STATUSES)[number];

export const DISCOVERY_MODES = ['deterministic', 'configured'] as const;
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

export const AMBIGUITY_LEVELS = ['low', 'medium', 'high'] as const;
export type AmbiguityLevel = (typeof AMBIGUITY_LEVELS)[number];

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const ARTIFACT_ORIGINS = ['user_dominant', 'hardless_fallback', 'mixed'] as const;
export type ArtifactOrigin = (typeof ARTIFACT_ORIGINS)[number];

export const DRIFT_STATUSES = ['clean', 'stale', 'degraded'] as const;
export type DriftStatus = (typeof DRIFT_STATUSES)[number];

export const TASK_TYPES = [
  'feature',
  'ui',
  'contract',
  'navigation',
  'shared',
  'security',
  'diagnostic',
  'refactoring',
  'testing',
] as const;

export type TaskType = (typeof TASK_TYPES)[number];
