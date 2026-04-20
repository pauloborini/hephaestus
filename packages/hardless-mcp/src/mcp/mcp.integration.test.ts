import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function createFixtureWorkspace(): Promise<string> {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'hardless-mcp-server-'));

  await writeFile(path.join(workspaceRoot, 'AGENTS.md'), '# Workflow\nImplement with validation and workflow canon.\n', 'utf8');
  await writeFile(path.join(workspaceRoot, 'README.md'), '# Repo docs\nArchitecture and bootstrap notes.\n', 'utf8');
  await mkdir(path.join(workspaceRoot, '.specs', 'feature-a'), { recursive: true });
  await writeFile(path.join(workspaceRoot, '.specs', 'feature-a', 'tasks.md'), '- [ ] sample feature task\n', 'utf8');

  return workspaceRoot;
}

test('stdio MCP server exposes bootstrap triage context status and refresh tools', async () => {
  const workspaceRoot = await createFixtureWorkspace();
  const client = new Client({
    name: 'hardless-mcp-test-client',
    version: '0.1.0',
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', 'tsx', path.join(process.cwd(), 'packages/hardless-mcp/src/index.ts')],
    cwd: process.cwd(),
    stderr: 'pipe',
  });

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);

    assert.equal(toolNames.includes('hardless.bootstrap'), true);
    assert.equal(toolNames.includes('hardless.refresh'), true);
    assert.equal(toolNames.includes('hardless.triage'), true);
    assert.equal(toolNames.includes('hardless.context'), true);
    assert.equal(toolNames.includes('hardless.status'), true);

    const preBootstrapStatus = await client.callTool({
      name: 'hardless.status',
      arguments: { workspaceRoot },
    });
    assert.notEqual(preBootstrapStatus.isError, true);
    assert.equal((preBootstrapStatus.structuredContent as { workspace: { status: string }; statusReason?: string }).workspace.status, 'not_bootstrapped');
    assert.equal((preBootstrapStatus.structuredContent as { workspace: { status: string }; statusReason?: string }).statusReason, 'workspace_not_bootstrapped');

    const preBootstrapTriage = await client.callTool({
      name: 'hardless.triage',
      arguments: { workspaceRoot, request: 'Implement a small helper for bootstrap logging' },
    });
    assert.notEqual(preBootstrapTriage.isError, true);
    assert.equal((preBootstrapTriage.structuredContent as { triage: { triageState: string; blockedReason?: string } }).triage.triageState, 'blocked');
    assert.equal((preBootstrapTriage.structuredContent as { triage: { triageState: string; blockedReason?: string } }).triage.blockedReason, 'workspace_not_bootstrapped');

    const preBootstrapContext = await client.callTool({
      name: 'hardless.context',
      arguments: { workspaceRoot, request: 'Implement a small helper for bootstrap logging' },
    });
    assert.notEqual(preBootstrapContext.isError, true);
    assert.equal((preBootstrapContext.structuredContent as { triage: { triageState: string; blockedReason?: string } }).triage.triageState, 'blocked');
    assert.equal((preBootstrapContext.structuredContent as { triage: { triageState: string; blockedReason?: string } }).triage.blockedReason, 'workspace_not_bootstrapped');

    const preBootstrapRefresh = await client.callTool({
      name: 'hardless.refresh',
      arguments: { workspaceRoot },
    });
    assert.equal(preBootstrapRefresh.isError, true);
    assert.equal((preBootstrapRefresh.structuredContent as { error: { code: string } }).error.code, 'workspace_not_bootstrapped');

    const bootstrapResult = await client.callTool({
      name: 'hardless.bootstrap',
      arguments: { workspaceRoot },
    });
    assert.notEqual(bootstrapResult.isError, true);

    const statusResult = await client.callTool({
      name: 'hardless.status',
      arguments: { workspaceRoot },
    });
    assert.notEqual(statusResult.isError, true);

    const triageResult = await client.callTool({
      name: 'hardless.triage',
      arguments: { workspaceRoot, request: 'Implement a small helper for bootstrap logging' },
    });
    assert.notEqual(triageResult.isError, true);

    const contextResult = await client.callTool({
      name: 'hardless.context',
      arguments: { workspaceRoot, request: 'Implement a small helper for bootstrap logging' },
    });
    assert.notEqual(contextResult.isError, true);

    const refreshResult = await client.callTool({
      name: 'hardless.refresh',
      arguments: { workspaceRoot },
    });
    assert.notEqual(refreshResult.isError, true);
  } finally {
    await client.close();
    await transport.close();
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
