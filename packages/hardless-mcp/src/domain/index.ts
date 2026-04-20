export {
  ACTIVATION_STATUSES,
  AMBIGUITY_LEVELS,
  ARTIFACT_ORIGINS,
  CONFIDENCE_LEVELS,
  DISCOVERY_MODES,
  DISCOVERY_STATUSES,
  DRIFT_STATUSES,
  HARDLESS_RUNTIME_MODES,
  HARDLESS_TRIAGE_STATES,
  INGESTION_STATUSES,
  SOURCE_TYPES,
  TASK_TYPES,
  WORKSPACE_STATUSES,
} from './enums.js';

export type {
  ActivationStatus,
  AmbiguityLevel,
  ArtifactOrigin,
  ConfidenceLevel,
  DiscoveryMode,
  DiscoveryStatus,
  DriftStatus,
  HardlessRuntimeMode,
  HardlessTriageState,
  IngestionStatus,
  SourceType,
  TaskType,
  WorkspaceStatus,
} from './enums.js';

export { HardlessWorkspaceError, WORKSPACE_ERROR_CODES } from './errors.js';

export type {
  ActivationDecision,
  DiscoveredSource,
  DriftImpact,
  DriftReport,
  FragmentsManifest,
  FragmentLocator,
  HardlessPaths,
  InstallationManifest,
  InstallationSurfaceManifestEntry,
  InstallationSurfaceStatus,
  ManagedInstallationMode,
  ManagedSurfaceType,
  ProvenanceManifest,
  RoutingManifest,
  RuleBundle,
  SourceFragment,
  SourceSnapshotRecord,
  SourcesManifest,
  TaskTypeIndexEntry,
  TriageRationale,
  TriageResult,
  TriggeredReference,
  WorkspaceManifest,
  WorkspaceContext,
} from './models.js';

export type { WorkspaceErrorCode } from './errors.js';
