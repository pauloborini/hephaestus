import type {
  ActivationDecision,
  DiscoveredSource,
  DriftReport,
  FragmentsManifest,
  ProvenanceManifest,
  RoutingManifest,
  RuleBundle,
  SourceFragment,
  SourcesManifest,
  TaskTypeIndexEntry,
  TriggeredReference,
  WorkspaceManifest,
  WorkspaceContext,
} from '../domain/index.js';
import type { WorkspaceStatusReason } from '../infra/index.js';
import type { RuntimeContextBundle, RuntimeTriageResponse } from '../runtime/index.js';

export interface BootstrapWorkspaceResult {
  workspace: WorkspaceContext;
  sourcesManifest: SourcesManifest;
  fragmentsManifest: FragmentsManifest;
  provenanceManifest: ProvenanceManifest;
  sources: DiscoveredSource[];
  fragments: SourceFragment[];
  activation: ActivationDecision;
  workspaceManifest: WorkspaceManifest;
  routingManifest: RoutingManifest;
  requiredBundles: RuleBundle[];
  triggeredBundles: RuleBundle[];
  fallbackBundles: RuleBundle[];
  taskTypeIndexes: TaskTypeIndexEntry[];
  references: TriggeredReference[];
  summaryPath: string;
}

export interface RefreshWorkspaceResult {
  workspace: WorkspaceContext;
  driftReport: DriftReport;
  sourcesManifest: SourcesManifest;
  fragmentsManifest: FragmentsManifest;
  provenanceManifest: ProvenanceManifest;
  workspaceManifest: WorkspaceManifest;
  routingManifest: RoutingManifest;
  summaryPath: string;
}

export interface TriageTaskInput {
  request: string;
  workspace: WorkspaceContext;
}

export interface TriageTaskResult {
  workspace: WorkspaceContext;
  triage: RuntimeTriageResponse;
}

export interface LoadContextResult {
  workspace: WorkspaceContext;
  triage: RuntimeTriageResponse;
  context: RuntimeContextBundle;
}

export interface WorkspaceStatusResult {
  workspace: WorkspaceContext;
  statusReason?: WorkspaceStatusReason;
  workspaceManifest?: WorkspaceManifest;
  driftReport?: DriftReport;
}
