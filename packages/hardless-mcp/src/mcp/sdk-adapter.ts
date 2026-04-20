import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { HardlessWorkspaceError } from '../domain/index.js';
import {
  bootstrapWorkspace,
  getWorkspaceStatus,
  installWorkspace,
  loadContextForRequest,
  repairWorkspaceInstallation,
  refreshWorkspace,
  triageTask,
  uninstallWorkspaceInstallation,
  type BootstrapWorkspaceResult,
  type InstallWorkspaceResult,
  type LoadContextResult,
  type RepairWorkspaceResult,
  type RefreshWorkspaceResult,
  type TriageTaskResult,
  type UninstallWorkspaceResult,
  type WorkspaceStatusResult,
} from '../application/index.js';
import type { McpToolAdapter } from './adapter.js';

export class HardlessMcpSdkAdapter implements McpToolAdapter {
  async bootstrap(workspaceRoot: string): Promise<BootstrapWorkspaceResult> {
    return bootstrapWorkspace({ workspaceRoot });
  }

  async install(workspaceRoot: string): Promise<InstallWorkspaceResult> {
    return installWorkspace({ workspaceRoot });
  }

  async uninstall(workspaceRoot: string): Promise<UninstallWorkspaceResult> {
    return uninstallWorkspaceInstallation({ workspaceRoot });
  }

  async repair(workspaceRoot: string): Promise<RepairWorkspaceResult> {
    return repairWorkspaceInstallation({ workspaceRoot });
  }

  async refresh(workspaceRoot: string): Promise<RefreshWorkspaceResult> {
    return refreshWorkspace({ workspaceRoot });
  }

  async triage(request: string, workspaceRoot: string): Promise<TriageTaskResult> {
    return triageTask({ workspaceRoot, request });
  }

  async context(request: string, workspaceRoot: string): Promise<LoadContextResult> {
    return loadContextForRequest({ workspaceRoot, request });
  }

  async status(workspaceRoot: string): Promise<WorkspaceStatusResult> {
    return getWorkspaceStatus({ workspaceRoot });
  }
}

export function createHardlessMcpServer(adapter: McpToolAdapter = new HardlessMcpSdkAdapter()): McpServer {
  const server = new McpServer(
    {
      name: 'hardless-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  server.registerTool(
    'hardless.bootstrap',
    {
      title: 'Hardless Bootstrap',
      description: 'Initialize the Hardless alpha artifacts for a workspace.',
      inputSchema: {
        workspaceRoot: z.string(),
      },
    },
    async ({ workspaceRoot }) => {
      const result = await adapter.bootstrap(workspaceRoot);
      return {
        content: [{ type: 'text', text: toJsonText(buildBootstrapTextPayload(result)) }],
        structuredContent: toStructuredContent(result),
      };
    },
  );

  server.registerTool(
    'hardless.install',
    {
      title: 'Hardless Install',
      description: 'Inject managed Hardless instructions into supported workspace surfaces.',
      inputSchema: {
        workspaceRoot: z.string(),
      },
    },
    async ({ workspaceRoot }) => {
      try {
        const result = await adapter.install(workspaceRoot);
        return {
          content: [{ type: 'text', text: toJsonText(buildInstallTextPayload(result)) }],
          structuredContent: toStructuredContent(result),
        };
      } catch (error) {
        return toToolErrorResult(error, workspaceRoot);
      }
    },
  );

  server.registerTool(
    'hardless.uninstall',
    {
      title: 'Hardless Uninstall',
      description: 'Restore original workspace instructions and remove managed Hardless installation state.',
      inputSchema: {
        workspaceRoot: z.string(),
      },
    },
    async ({ workspaceRoot }) => {
      try {
        const result = await adapter.uninstall(workspaceRoot);
        return {
          content: [{ type: 'text', text: toJsonText(buildUninstallTextPayload(result)) }],
          structuredContent: toStructuredContent(result),
        };
      } catch (error) {
        return toToolErrorResult(error, workspaceRoot);
      }
    },
  );

  server.registerTool(
    'hardless.repair',
    {
      title: 'Hardless Repair',
      description: 'Repair managed Hardless instructions when supported workspace surfaces drift.',
      inputSchema: {
        workspaceRoot: z.string(),
      },
    },
    async ({ workspaceRoot }) => {
      try {
        const result = await adapter.repair(workspaceRoot);
        return {
          content: [{ type: 'text', text: toJsonText(buildRepairTextPayload(result)) }],
          structuredContent: toStructuredContent(result),
        };
      } catch (error) {
        return toToolErrorResult(error, workspaceRoot);
      }
    },
  );

  server.registerTool(
    'hardless.refresh',
    {
      title: 'Hardless Refresh',
      description: 'Refresh changed sources and reconcile curried Hardless artifacts incrementally.',
      inputSchema: {
        workspaceRoot: z.string(),
      },
    },
    async ({ workspaceRoot }) => {
      try {
        const result = await adapter.refresh(workspaceRoot);
        return {
          content: [{ type: 'text', text: toJsonText(buildRefreshTextPayload(result)) }],
          structuredContent: toStructuredContent(result),
        };
      } catch (error) {
        return toToolErrorResult(error, workspaceRoot);
      }
    },
  );

  server.registerTool(
    'hardless.triage',
    {
      title: 'Hardless Triage',
      description: 'Classify a request into discussion, fast_mode, spec_flow or blocked.',
      inputSchema: {
        workspaceRoot: z.string(),
        request: z.string(),
      },
    },
    async ({ workspaceRoot, request }) => {
      const result = await adapter.triage(request, workspaceRoot);
      return {
        content: [
          {
            type: 'text',
            text: toJsonText(buildTriageTextPayload(result)),
          },
        ],
        structuredContent: toStructuredContent(result),
      };
    },
  );

  server.registerTool(
    'hardless.context',
    {
      title: 'Hardless Context',
      description: 'Load the minimum context bundle for the current request.',
      inputSchema: {
        workspaceRoot: z.string(),
        request: z.string(),
      },
    },
    async ({ workspaceRoot, request }) => {
      const result = await adapter.context(request, workspaceRoot);
      return {
        content: [
          {
            type: 'text',
            text: toJsonText(buildContextTextPayload(result)),
          },
        ],
        structuredContent: toStructuredContent(result),
      };
    },
  );

  server.registerTool(
    'hardless.status',
    {
      title: 'Hardless Status',
      description: 'Read current workspace bootstrap and drift status without side effects.',
      inputSchema: {
        workspaceRoot: z.string(),
      },
    },
    async ({ workspaceRoot }) => {
      const result = await adapter.status(workspaceRoot);
      return {
        content: [
          {
            type: 'text',
            text: toJsonText(buildStatusTextPayload(result)),
          },
        ],
        structuredContent: toStructuredContent(result),
      };
    },
  );

  return server;
}

export async function startHardlessMcpServer(): Promise<void> {
  const server = createHardlessMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function toStructuredContent(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function toJsonText(value: unknown): string {
  return JSON.stringify(value);
}

function toToolErrorResult(error: unknown, workspaceRoot: string): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
} {
  if (error instanceof HardlessWorkspaceError) {
    const payload = {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        workspaceRoot: error.workspaceRoot,
        sourcePath: error.sourcePath,
      },
    };

    return {
      isError: true,
      content: [{ type: 'text', text: toJsonText(payload) }],
      structuredContent: toStructuredContent(payload),
    };
  }

  const payload = {
    ok: false,
    error: {
      code: 'unexpected_runtime_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      workspaceRoot,
    },
  };

  return {
    isError: true,
    content: [{ type: 'text', text: toJsonText(payload) }],
    structuredContent: toStructuredContent(payload),
  };
}

function buildBootstrapTextPayload(result: BootstrapWorkspaceResult) {
  return {
    ok: true,
    tool: 'hardless.bootstrap',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    activation: {
      status: result.activation.status,
      confidenceScore: result.activation.confidenceScore,
      threshold: result.activation.threshold,
      requiresOperatorConfirmation: result.activation.requiresOperatorConfirmation,
    },
    artifacts: {
      sourceCount: result.sources.length,
      fragmentCount: result.fragments.length,
      requiredBundleCount: result.requiredBundles.length,
      triggeredBundleCount: result.triggeredBundles.length,
      referenceCount: result.references.length,
      summaryPath: result.summaryPath,
    },
  };
}

function buildRefreshTextPayload(result: RefreshWorkspaceResult) {
  return {
    ok: true,
    tool: 'hardless.refresh',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    drift: {
      status: result.driftReport.status,
      changedSourceIds: result.driftReport.changedSourceIds,
      detectedAt: result.driftReport.detectedAt,
      summary: result.driftReport.summary,
    },
    artifacts: {
      summaryPath: result.summaryPath,
      workspaceManifestStatus: result.workspaceManifest.status,
    },
  };
}

function buildInstallTextPayload(result: InstallWorkspaceResult) {
  return {
    ok: true,
    tool: 'hardless.install',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    installation: {
      mode: result.installationManifest.mode,
      installedAt: result.installationManifest.installedAt,
      lastRepairedAt: result.installationManifest.lastRepairedAt,
      manifestPath: result.manifestPath,
      templateVersion: result.installationManifest.templateVersion,
      surfaces: result.managedSurfaces,
    },
    recommendedNextStep: result.recommendedNextStep,
  };
}

function buildUninstallTextPayload(result: UninstallWorkspaceResult) {
  return {
    ok: true,
    tool: 'hardless.uninstall',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    installation: {
      removedManifestPath: result.removedManifestPath,
      surfaces: result.restoredSurfaces,
    },
    recommendedNextStep: result.recommendedNextStep,
  };
}

function buildRepairTextPayload(result: RepairWorkspaceResult) {
  return {
    ok: true,
    tool: 'hardless.repair',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    installation: {
      mode: result.installationManifest.mode,
      installedAt: result.installationManifest.installedAt,
      lastRepairedAt: result.installationManifest.lastRepairedAt,
      manifestPath: result.manifestPath,
      templateVersion: result.installationManifest.templateVersion,
      surfaces: result.repairedSurfaces,
    },
    recommendedNextStep: result.recommendedNextStep,
  };
}

function buildTriageTextPayload(result: TriageTaskResult) {
  return {
    ok: true,
    tool: 'hardless.triage',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    triage: {
      taskType: result.triage.taskType,
      triageState: result.triage.triageState,
      blockedReason: result.triage.blockedReason,
      triggerSignals: result.triage.triggerSignals,
      promotedToSpecFlow: result.triage.promotedToSpecFlow,
      recommendedNextStep: result.triage.recommendedNextStep,
    },
    context: {
      loadedMaterialTypes: result.triage.contextBundle.loadedMaterialTypes,
      requiredBundles: result.triage.contextBundle.requiredBundles,
      triggeredBundles: result.triage.contextBundle.triggeredBundles,
      references: result.triage.contextBundle.references,
      stale: result.triage.contextBundle.stale,
    },
  };
}

function buildContextTextPayload(result: LoadContextResult) {
  return {
    ok: true,
    tool: 'hardless.context',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    triage: {
      taskType: result.triage.taskType,
      triageState: result.triage.triageState,
      blockedReason: result.triage.blockedReason,
      triggerSignals: result.triage.triggerSignals,
      promotedToSpecFlow: result.triage.promotedToSpecFlow,
    },
    context: {
      loadedArtifacts: result.context.loadedArtifacts,
      loadedMaterialTypes: result.context.loadedMaterialTypes,
      requiredBundles: result.context.requiredBundles,
      triggeredBundles: result.context.triggeredBundles,
      references: result.context.references,
      stale: result.context.stale,
    },
  };
}

function buildStatusTextPayload(result: WorkspaceStatusResult) {
  return {
    ok: true,
    tool: 'hardless.status',
    workspace: {
      root: result.workspace.workspaceRoot,
      status: result.workspace.status,
      bootstrappedAt: result.workspace.bootstrappedAt,
      refreshedAt: result.workspace.refreshedAt,
      activationStatus: result.workspace.activationStatus,
      confidenceScore: result.workspace.confidenceScore,
    },
    statusReason: result.statusReason,
    drift: result.driftReport
      ? {
          status: result.driftReport.status,
          changedSourceIds: result.driftReport.changedSourceIds,
          detectedAt: result.driftReport.detectedAt,
          summary: result.driftReport.summary,
        }
      : undefined,
  };
}
