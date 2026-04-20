# Foundation Checkpoint

## Objetivo

Registrar a checagem curta de aderencia entre a fundacao inicial do pacote e o `design.md` antes de implementar IO real de bootstrap.

## Checklist

- [x] `packages/hardless-mcp` segue como pacote principal isolado do alpha.
- [x] A arvore inicial separa `application`, `domain`, `infra`, `runtime`, `mcp` e `shared`.
- [x] O contrato MCP ficou atras de `McpToolAdapter`, sem vazar detalhes de SDK para `application` ou `runtime`.
- [x] Tipos centrais do alpha existem em um ponto de export unico no dominio.
- [x] Paths e schemas de `.hardless/` estao centralizados em helpers reutilizaveis.
- [x] O entrypoint do pacote nao e mais um scaffold vazio.

## Observacoes

- Esta fundacao ainda nao executa bootstrap real, triagem ou drift.
- O proximo passo correto e adicionar o pipeline deterministico de discovery e snapshot, sem pular direto para sintese ou adapter MCP real.
