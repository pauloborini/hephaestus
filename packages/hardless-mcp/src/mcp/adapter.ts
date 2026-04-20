import type {
  BootstrapWorkspaceResult,
  InstallWorkspaceResult,
  LoadContextResult,
  RepairWorkspaceResult,
  RefreshWorkspaceResult,
  TriageTaskResult,
  UninstallWorkspaceResult,
  WorkspaceStatusResult,
} from '../application/index.js';

export interface McpToolAdapter {
  bootstrap(workspaceRoot: string): Promise<BootstrapWorkspaceResult>;
  install(workspaceRoot: string): Promise<InstallWorkspaceResult>;
  uninstall(workspaceRoot: string): Promise<UninstallWorkspaceResult>;
  repair(workspaceRoot: string): Promise<RepairWorkspaceResult>;
  refresh(workspaceRoot: string): Promise<RefreshWorkspaceResult>;
  triage(request: string, workspaceRoot: string): Promise<TriageTaskResult>;
  context(request: string, workspaceRoot: string): Promise<LoadContextResult>;
  status(workspaceRoot: string): Promise<WorkspaceStatusResult>;
}
