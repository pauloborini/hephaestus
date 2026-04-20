# Cursor Validation Note

## Status

Validacao manual no `Cursor` ainda pendente.

## O Que Ja Foi Verificado

- servidor MCP sobe via `stdio` usando o SDK oficial `@modelcontextprotocol/sdk` v1;
- smoke test local por `StdioClientTransport` cobre:
  - `hardless.bootstrap`
  - `hardless.refresh`
  - `hardless.triage`
  - `hardless.context`
  - `hardless.status`

## O Que Falta Verificar No Cursor

- registro do servidor no cliente MCP do `Cursor`;
- chamada real das cinco tools a partir do cliente prioritario do alpha;
- compatibilidade pratica do fluxo `bootstrap -> triage -> context -> status -> refresh` dentro do cliente.

## Comando Esperado Do Servidor

Executavel do servidor:

```bash
node --import tsx /Volumes/Dados/projetos/hardless-mcp/packages/hardless-mcp/src/index.ts
```
