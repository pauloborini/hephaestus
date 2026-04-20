import type {
  BootstrapWorkspaceResult,
  LoadContextResult,
  RefreshWorkspaceResult,
  TriageTaskResult,
  WorkspaceStatusResult,
} from '../application/index.js';

export interface McpToolAdapter {
  bootstrap(workspaceRoot: string): Promise<BootstrapWorkspaceResult>;
  refresh(workspaceRoot: string): Promise<RefreshWorkspaceResult>;
  triage(request: string, workspaceRoot: string): Promise<TriageTaskResult>;
  context(request: string, workspaceRoot: string): Promise<LoadContextResult>;
  status(workspaceRoot: string): Promise<WorkspaceStatusResult>;
}
