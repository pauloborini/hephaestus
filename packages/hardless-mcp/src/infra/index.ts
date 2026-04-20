export type { FileSystemPort, WorkspaceFileSystemContext } from './filesystem.js';
export { writeBootstrapSummary } from './bootstrap-summary.js';
export type { WriteBootstrapSummaryOptions } from './bootstrap-summary.js';
export { evaluateActivationDecision } from './confidence-evaluator.js';
export type { EvaluateActivationOptions } from './confidence-evaluator.js';
export { detectDrift } from './drift-monitor.js';
export type { DetectDriftOptions, DriftDetectionResult } from './drift-monitor.js';
export { writeDriftReport } from './drift-report.js';
export { extractFragments } from './fragment-extractor.js';
export type { ExtractFragmentsOptions } from './fragment-extractor.js';
export { writeFragmentArtifacts } from './fragment-manifest.js';
export { readFragmentsManifest, readProvenanceManifest } from './fragment-manifest.js';
export type { WriteFragmentArtifactsOptions } from './fragment-manifest.js';
export {
  installManagedRuntime,
  MANAGED_INSTALLATION_MODE,
  MANAGED_INSTALLATION_TEMPLATE_VERSION,
  readInstallationManifest,
  readOptionalInstallationManifest,
  repairManagedRuntime,
  uninstallManagedRuntime,
} from './managed-installation.js';
export type {
  InstallManagedRuntimeOptions,
  RepairManagedRuntimeOptions,
  UninstallManagedRuntimeOptions,
} from './managed-installation.js';
export { NodeFileSystem } from './node-filesystem.js';
export { writeRoutingArtifacts } from './routing-manifest.js';
export type { WriteRoutingArtifactsOptions } from './routing-manifest.js';
export { writeRuleBundles } from './rule-bundles.js';
export type { WriteRuleBundlesOptions } from './rule-bundles.js';
export { writeSourcesManifest } from './source-manifest.js';
export { readSourcesManifest } from './source-manifest.js';
export type { WriteSourcesManifestOptions } from './source-manifest.js';
export { discoverSources } from './source-discovery.js';
export type { DiscoverSourcesOptions } from './source-discovery.js';
export { snapshotSources } from './snapshot-store.js';
export type { SnapshotSourcesOptions } from './snapshot-store.js';
export { writeTaskIndexes } from './task-indexes.js';
export type { WriteTaskIndexesOptions } from './task-indexes.js';
export { validateWorkspaceRoot } from './workspace-validation.js';
export { writeWorkspaceManifest } from './workspace-manifest.js';
export type { WriteWorkspaceManifestOptions } from './workspace-manifest.js';
export { readWorkspaceRuntimeState } from './workspace-runtime-state.js';
export type {
  ReadWorkspaceRuntimeStateOptions,
  RuntimeStateSnapshot,
  WorkspaceOperationalState,
  WorkspaceStatusReason,
} from './workspace-runtime-state.js';
