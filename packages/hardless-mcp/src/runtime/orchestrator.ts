import type { WorkspaceContext } from '../domain/index.js';
import type { RuntimeTriageResponse } from './contracts.js';
import { loadContextBundle } from './context-loader.js';
import { evaluateRuntimeGates } from './gates.js';
import { loadRuntimeArtifacts } from './runtime-store.js';
import { classifyRequest, shouldPromoteToSpecFlow } from './triage.js';

export async function triageWorkspaceRequest(input: {
  request: string;
  workspace: WorkspaceContext;
}): Promise<RuntimeTriageResponse> {
  const classification = classifyRequest(input.request);
  const runtimeArtifacts = await loadRuntimeArtifacts(input.workspace.paths);
  const contextBundle = await loadContextBundle({
    workspaceRoot: input.workspace.workspaceRoot,
    paths: input.workspace.paths,
    taskType: classification.taskType,
    triageState: classification.state,
    triggerSignals: classification.triggerSignals,
  });

  const promotedToSpecFlow =
    classification.state === 'fast_mode' &&
    shouldPromoteToSpecFlow({
      request: input.request,
      triggerSignals: classification.triggerSignals,
      triggeredBundleCount: contextBundle.triggeredBundles.length,
      referenceCount: contextBundle.references.length,
    });

  const triageState = promotedToSpecFlow ? 'spec_flow' : classification.state;
  const gateDecision = evaluateRuntimeGates({
    triageState,
    stale: contextBundle.stale || runtimeArtifacts.workspaceManifest.status === 'stale_with_warning',
    validationDeclared: triageState === 'discussion' ? false : true,
    fallbackApplied: runtimeArtifacts.workspaceManifest.activationStatus !== 'auto_activated',
  });

  const shortPlan =
    triageState === 'fast_mode'
      ? [
          'Confirmar o tipo primario e os bundles carregados.',
          'Executar a mudanca pequena no escopo declarado.',
          'Rodar validacao minima antes de concluir.',
        ]
      : triageState === 'spec_flow'
        ? [
            'Registrar o escopo amplo e as regras carregadas.',
            'Expandir para fluxo estruturado com artefatos quando necessario.',
            'Executar com validacao e gates fortes.',
          ]
        : [];

  return {
    taskType: classification.taskType,
    triageState,
    rationale: [
      ...classification.rationale,
      `workspace_status=${runtimeArtifacts.workspaceManifest.status}`,
      `activation_status=${runtimeArtifacts.workspaceManifest.activationStatus}`,
    ],
    blockedReason: classification.blockedReason,
    triggerSignals: classification.triggerSignals,
    promotedToSpecFlow,
    contextBundle: {
      ...contextBundle,
      triageState,
    },
    gateDecision,
    shortPlan,
    recommendedNextStep:
      triageState === 'fast_mode'
        ? 'seguir com plano curto e validacao minima'
        : triageState === 'spec_flow'
          ? 'abrir ou atualizar artefatos do spec flow antes da escrita ampla'
          : triageState === 'blocked'
            ? 'pedir contexto adicional ou reconciliar artefatos'
            : 'responder sem alterar codigo',
  };
}
