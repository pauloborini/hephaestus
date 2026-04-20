import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { HardlessWorkspaceError } from '../domain/index.js';
import {
  bootstrapWorkspace,
  getWorkspaceStatus,
  loadContextForRequest,
  refreshWorkspace,
  triageTask,
  type BootstrapWorkspaceResult,
  type LoadContextResult,
  type RefreshWorkspaceResult,
  type TriageTaskResult,
  type WorkspaceStatusResult,
} from '../application/index.js';
import type { McpToolAdapter } from './adapter.js';

export class HardlessMcpSdkAdapter implements McpToolAdapter {
  async bootstrap(workspaceRoot: string): Promise<BootstrapWorkspaceResult> {
    return bootstrapWorkspace({ workspaceRoot });
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
        content: [{ type: 'text', text: `Bootstrapped workspace ${workspaceRoot} with status ${result.workspaceManifest.status}.` }],
        structuredContent: toStructuredContent(result),
      };
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
          content: [{ type: 'text', text: `Refresh finished with drift status ${result.driftReport.status}.` }],
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
            text:
              result.triage.triageState === 'blocked' && result.triage.blockedReason
                ? `Triage blocked: ${result.triage.blockedReason}.`
                : `Triage classified the request as ${result.triage.triageState}.`,
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
            text:
              result.triage.triageState === 'blocked' && result.triage.blockedReason
                ? `Context loading blocked: ${result.triage.blockedReason}.`
                : `Loaded context for ${result.triage.triageState} with ${result.context.loadedArtifacts.length} artifacts.`,
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
            text: result.statusReason
              ? `Workspace status is ${result.workspace.status} (${result.statusReason}).`
              : `Workspace status is ${result.workspace.status}.`,
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

function toToolErrorResult(error: unknown, workspaceRoot: string): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
} {
  if (error instanceof HardlessWorkspaceError) {
    return {
      isError: true,
      content: [{ type: 'text', text: `${error.code}: ${error.message}` }],
      structuredContent: toStructuredContent({
        error: {
          code: error.code,
          message: error.message,
          workspaceRoot: error.workspaceRoot,
          sourcePath: error.sourcePath,
        },
      }),
    };
  }

  return {
    isError: true,
    content: [{ type: 'text', text: 'unexpected_runtime_error' }],
    structuredContent: toStructuredContent({
      error: {
        code: 'unexpected_runtime_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        workspaceRoot,
      },
    }),
  };
}
