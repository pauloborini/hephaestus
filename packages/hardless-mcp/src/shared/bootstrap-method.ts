import type { HardlessTriageState, TaskType } from '../domain/index.js';

export const HARDLESS_METHOD_VERSION = 'alpha-1';

export const HARDLESS_ESCALATION_RULES = [
  'multi_area_change',
  'contract_change',
  'high_ambiguity',
  'contradictory_sources',
  'missing_validation',
] as const;

export const HARDLESS_TRIAGE_POLICY: Array<{
  state: HardlessTriageState;
  description: string;
}> = [
  {
    state: 'discussion',
    description: 'Responder sem alterar codigo quando a solicitacao for apenas pergunta, analise ou opiniao.',
  },
  {
    state: 'fast_mode',
    description: 'Permitir mudancas pequenas, claras e de baixo risco com plano curto antes da escrita.',
  },
  {
    state: 'spec_flow',
    description: 'Escalar mudancas amplas, ambiguas ou arriscadas para fluxo estruturado com artefatos.',
  },
  {
    state: 'blocked',
    description: 'Bloquear quando faltar contexto minimo, validacao ou quando houver contradicao relevante.',
  },
];

export const HARDLESS_REQUIRED_METHOD_RULES: Record<TaskType, string[]> = {
  feature: [
    'Escolher um unico tipo primario antes de expandir contexto.',
    'Entregar plano curto e validacao minima quando a tarefa for elegivel a fast mode.',
  ],
  ui: [
    'Carregar apenas contexto minimo do tipo atual antes de alterar interface.',
    'Explicitar referencias sob gatilho em vez de abrir o repositorio inteiro.',
  ],
  contract: [
    'Escalar para spec flow quando houver mudanca de contrato ou ambiguidade relevante.',
    'Preservar proveniencia entre fonte, fragmento e artefato curado.',
  ],
  navigation: [
    'Usar apenas o contexto essencial do fluxo atual e do subcenario acionado.',
    'Bloquear quando a navegacao exigir contexto insuficiente ou contraditorio.',
  ],
  shared: [
    'Evitar improviso estrutural sem passar antes por triagem e gates.',
    'Explicitar fallback quando o pacote curado nao tiver cobertura suficiente.',
  ],
  security: [
    'Adotar postura conservadora diante de qualquer incerteza relevante.',
    'Nunca esconder risco operacional ou impacto colateral.',
  ],
  diagnostic: [
    'Priorizar contexto minimo, sinais concretos e validacao deterministica quando existir.',
    'Bloquear ou escalar quando o diagnostico depender de contexto ausente.',
  ],
  refactoring: [
    'Promover para spec flow quando o impacto sair de baixo risco ou atingir varias areas.',
    'Nao concluir sem validacao declarada.',
  ],
  testing: [
    'Registrar claramente qual validacao foi executada e qual nao foi.',
    'Usar checklists curados do workspace quando existirem.',
  ],
};

export const HARDLESS_TRIGGERED_METHOD_RULES: Record<TaskType, string[]> = {
  feature: ['Escalar quando houver impacto em varias areas ou falta de regra suficiente.'],
  ui: ['Escalar quando surgir necessidade de design estrutural ou ambiguidade alta.'],
  contract: ['Escalar quando houver contradicao entre fontes ou mudanca de boundary.'],
  navigation: ['Escalar quando a tarefa tocar guards, rotas e validacao de fluxo ao mesmo tempo.'],
  shared: ['Escalar quando a mudanca shared puder contaminar varios fluxos.'],
  security: ['Bloquear por padrao diante de incerteza sobre permissao, segredo ou boundary.'],
  diagnostic: ['Escalar quando o bug indicar regressao ampla ou contrato quebrado.'],
  refactoring: ['Escalar quando a simplificacao afetar contratos ou comportamento observavel.'],
  testing: ['Carregar referencias adicionais apenas quando o cenario exigir subcenario especifico.'],
};

export const HARDLESS_FALLBACK_RULES = [
  'Usar workflow canonico, taxonomia e gates universais do Hardless quando o workspace nao cobrir o caso.',
  'Declarar explicitamente qualquer fallback aplicado no bundle curado e no resumo do bootstrap.',
];
