# Cursor Validation Note

## Status

Validacao manual principal no `Cursor` executada para o fluxo base e para a observabilidade do payload textual em JSON.

## O Que Ja Foi Verificado

- servidor MCP sobe via `stdio` usando o SDK oficial `@modelcontextprotocol/sdk` v1;
- smoke test local por `StdioClientTransport` cobre:
  - `hardless.bootstrap`
  - `hardless.install`
  - `hardless.uninstall`
  - `hardless.repair`
  - `hardless.refresh`
  - `hardless.triage`
  - `hardless.context`
  - `hardless.status`
- o `Cursor` consome o `content.text` JSON das tools principais mesmo quando nao expõe `structuredContent`.

## O Que Ainda Vale Verificar No Cursor

- fluxo completo `bootstrap -> install -> chat natural -> uninstall` em workspace real;
- `repair` apos drift manual de `AGENTS.md` ou `.cursorrules`;
- clareza da UX textual para usuarios que nao conhecem o protocolo do Hardless.

## Comando Esperado Do Servidor

Executavel do servidor:

```bash
node /Volumes/Dados/projetos/hardless-mcp/packages/hardless-mcp/dist/index.js
```
