# Hardless MCP

Servidor MCP local e workflow-first do ecossistema Hardless.

## Objetivo

Este repositorio existe para validar e evoluir o nucleo portavel do Hardless:

- bootstrap repo-native em `.hardless/`
- triagem `discussion` / `fast_mode` / `spec_flow`
- ingestao e fragmentacao de regras do projeto do usuario
- artefatos operacionais curados para runtime

## Estrutura inicial

- `.specs/features/hardless-mcp/`: visao, requisitos e decisoes
- `method/`: metodo canônico e mapeamento conceitual inspirado por workflows reais baseados em `AGENTS.md` + indices + regras + referencias
- `packages/hardless-mcp/`: pacote inicial do servidor MCP

## Proximo passo

Ler os artefatos em `.specs/features/hardless-mcp/` e consolidar `design.md` antes da implementacao relevante.
