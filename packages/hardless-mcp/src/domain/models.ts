import type {
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

export interface HardlessPaths {
  root: string;
  hardlessRoot: string;
  manifestsDir: string;
  sourcesDir: string;
  sourceSnapshotsDir: string;
  sourceRawIndexDir: string;
  fragmentsDir: string;
  fragmentsBySourceDir: string;
  fragmentsByTopicDir: string;
  rulesDir: string;
  requiredRulesDir: string;
  triggeredRulesDir: string;
  fallbackRulesDir: string;
  indexesDir: string;
  taskTypeIndexesDir: string;
  referencesIndexesDir: string;
  routingDir: string;
  memoryDir: string;
  reportsDir: string;
}

export interface WorkspaceContext {
  workspaceId: string;
  workspaceRoot: string;
  paths: HardlessPaths;
  status: WorkspaceStatus;
  runtimeMode: HardlessRuntimeMode;
  activeWorkspace: boolean;
  bootstrappedAt?: string;
  refreshedAt?: string;
  activationStatus?: ActivationStatus;
  confidenceScore?: number;
}

export interface DiscoveredSource {
  sourceId: string;
  sourcePath: string;
  sourceType: SourceType;
  discoveryStatus: DiscoveryStatus;
  discoveryMode: DiscoveryMode;
  exists: boolean;
  hash?: string;
  snapshotPath?: string;
  lastSeenAt?: string;
  errorMessage?: string;
}

export interface SourceSnapshotRecord {
  sourceId: string;
  sourcePath: string;
  sourceType: SourceType;
  snapshotPath: string;
  hash: string;
  ingestionStatus: IngestionStatus;
  lastSeenAt: string;
}

export interface FragmentLocator {
  heading?: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface SourceFragment {
  fragmentId: string;
  sourceId: string;
  sourcePath: string;
  sourceType: SourceType;
  topic: string;
  taskTypes: TaskType[];
  locator: FragmentLocator;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  ambiguity: AmbiguityLevel;
  derivedFrom: 'deterministic_fragmentation' | 'assisted_classification';
  extractedAt: string;
}

export interface TriageRationale {
  summary: string;
  signals: string[];
  blockingReason?: string;
}

export interface TriageResult {
  state: HardlessTriageState;
  taskType: TaskType;
  rationale: TriageRationale;
  requiresValidation: boolean;
  recommendedNextStep?: string;
  shortPlan?: string[];
}

export interface DriftImpact {
  sourceId: string;
  affectedFragments: string[];
  affectedArtifacts: string[];
}

export interface DriftReport {
  status: DriftStatus;
  changedSourceIds: string[];
  impacts: DriftImpact[];
  detectedAt: string;
  summary: string;
}

export interface ActivationDecision {
  status: ActivationStatus;
  confidenceScore: number;
  threshold: number;
  artifactOrigin: ArtifactOrigin;
  reasons: string[];
  requiresOperatorConfirmation: boolean;
}

export interface WorkspaceManifest {
  schemaVersion: string;
  workspaceRoot: string;
  workspaceId: string;
  bootstrappedAt: string;
  refreshedAt?: string;
  methodVersion: string;
  status: WorkspaceStatus;
  activationStatus: ActivationStatus;
  confidenceScore: number;
  activationThreshold: number;
  activeRuntimeMode: HardlessRuntimeMode;
}

export interface RoutingManifest {
  schemaVersion: string;
  triageStates: HardlessTriageState[];
  taskTypeIndexes: Partial<Record<TaskType, string>>;
  escalationRules: string[];
  blockingPolicy: {
    mode: 'conservative';
    blockOnRelevantUncertainty: boolean;
  };
  fallbackPolicy: {
    allowHardlessDefaults: boolean;
    requireDisclosure: boolean;
  };
}

export interface RuleBundle {
  schemaVersion: string;
  bundleType: 'required' | 'triggered' | 'fallback';
  bundleId: string;
  taskType?: TaskType;
  dominantSource: ArtifactOrigin;
  fallbackApplied: boolean;
  rules: Array<{
    id: string;
    summary: string;
    source: 'hardless_method' | 'workspace_fragment';
    sourcePath?: string;
    fragmentId?: string;
  }>;
}

export interface TaskTypeIndexEntry {
  schemaVersion: string;
  taskType: TaskType;
  requiredBundles: string[];
  triggeredBundles: string[];
  referenceIds: string[];
  stale: boolean;
}

export interface TriggeredReference {
  schemaVersion: string;
  referenceId: string;
  taskType?: TaskType;
  topic: string;
  sourcePath: string;
  fragmentIds: string[];
}

export interface SourcesManifest {
  schemaVersion: string;
  sources: Array<{
    sourceId: string;
    sourcePath: string;
    sourceType: SourceType;
    discoveryMode: DiscoveryMode;
    discoveryStatus: DiscoveryStatus;
    snapshotPath?: string;
    hash?: string;
    ingestionStatus: IngestionStatus;
    lastSeenAt?: string;
    errorMessage?: string;
  }>;
}

export interface FragmentsManifest {
  schemaVersion: string;
  fragments: SourceFragment[];
}

export interface ProvenanceManifest {
  schemaVersion: string;
  artifacts: Array<{
    artifact: string;
    sourceIds: string[];
    fragmentIds: string[];
  }>;
  fragments: Array<{
    fragmentId: string;
    sourceId: string;
    sourcePath: string;
    topic: string;
  }>;
}
