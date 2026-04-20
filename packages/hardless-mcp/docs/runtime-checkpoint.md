# Runtime Checkpoint

## Objetivo

Registrar que bootstrap curado, triagem workflow-first e drift detection ja formam um alpha coerente antes da superficie MCP final.

## Estado Atual

- bootstrap cria `.hardless/` com manifests, bundles, indexes e reports operacionais;
- ativacao do pacote curado respeita limiar de confianca e pode exigir confirmacao explicita;
- runtime classifica pedidos em `discussion`, `fast_mode`, `spec_flow` e `blocked`;
- `fast_mode` devolve plano curto e pode ser promovido para `spec_flow`;
- gates universais impedem escrita em `discussion` e `blocked`;
- refresh parcial detecta drift, mapeia blast radius minimo e reescreve apenas o necessario no fluxo derivado;
- refresh marca `degraded` quando a reconciliacao ainda deixa ambiguidade operacional relevante.

## Evidencia Automatizada

Validacoes cobrindo bootstrap, runtime e refresh:

- `pnpm typecheck`
- `node --import tsx --test packages/hardless-mcp/src/infra/bootstrap.integration.test.ts packages/hardless-mcp/src/infra/refresh.integration.test.ts packages/hardless-mcp/src/runtime/runtime.integration.test.ts`

## Riscos Restantes Antes Das Tools MCP

- ainda nao existe adapter MCP real nem contrato de tools exposto ao cliente;
- o runtime ainda opera por chamadas locais de aplicacao, nao por um servidor MCP completo;
- falta publicar `hardless.bootstrap`, `hardless.refresh`, `hardless.triage`, `hardless.context` e `hardless.status`.
