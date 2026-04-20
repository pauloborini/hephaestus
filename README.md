# Hardless MCP

Servidor MCP local e workflow-first do ecossistema Hardless.

## O que e

O Hardless MCP transforma um workspace real em um ambiente operado pelo ritual do Hardless:

- bootstrap repo-native em `.hardless/`
- triagem `discussion` / `fast_mode` / `spec_flow`
- contexto curado por bundles e indexes, em vez de leitura crua do projeto
- instalacao gerenciada para dar precedencia ao Hardless em `AGENTS.md` e `.cursorrules`

O MCP roda localmente porque precisa ler e escrever no workspace do usuario. O valor do produto nesta fase nao esta em cloud runtime, e sim em workflow consistente, contexto observavel e rollback seguro.

## O que nao e

- nao e um servidor web remoto;
- nao substitui as tools de codigo do cliente;
- nao faz takeover estrito do projeto do usuario por padrao;
- nao depende de `AGENTS.md` cru como contrato direto de runtime.

## Pre-requisitos

- `Node.js >= 22`
- `pnpm`
- um cliente MCP com suporte a `stdio`
- `Cursor` e o cliente principal validado no v1

## Instalar dependencias e build

```bash
pnpm install
pnpm build
```

## Rodar localmente

```bash
pnpm start
```

O processo sobe um servidor MCP via `stdio`. Se ele parecer "parado", isso esta correto: ele esta aguardando um cliente MCP conectar.

## Configuracao no Cursor

Adicione este servidor ao arquivo de MCP Servers do Cursor:

```json
{
  "mcpServers": {
    "hardless": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Volumes/Dados/projetos/hardless-mcp/packages/hardless-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

Depois:

1. salve o arquivo;
2. reinicie o Cursor;
3. abra o workspace alvo;
4. confirme que `hardless` aparece conectado.

## Fluxo recomendado no workspace do usuario

Sequencia recomendada:

1. `hardless.status`
2. `hardless.bootstrap`
3. `hardless.install`
4. `hardless.triage`
5. `hardless.context`
6. `hardless.refresh`

## Como usar no chat do Cursor

Exemplos para colar no chat:

### Verificar estado do workspace

```text
Use tool hardless.status with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

### Bootstrap do workspace

```text
Use tool hardless.bootstrap with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

### Instalar precedencia do Hardless nas instrucoes do projeto

```text
Use tool hardless.install with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

### Triar uma tarefa

```text
Use tool hardless.triage with:
{
  "workspaceRoot": "/abs/path/to/workspace",
  "request": "Create feature and update docs"
}
```

### Carregar contexto minimo

```text
Use tool hardless.context with:
{
  "workspaceRoot": "/abs/path/to/workspace",
  "request": "Implement a small helper for bootstrap logging"
}
```

### Reconciliar drift

```text
Use tool hardless.refresh with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

### Remover a instalacao gerenciada

```text
Use tool hardless.uninstall with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

### Reparar a instalacao gerenciada

```text
Use tool hardless.repair with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

## O que `hardless.install` faz

`hardless.install`:

- detecta `AGENTS.md` e `.cursorrules`;
- cria backups em `.hardless/backups/`;
- injeta um bloco Hardless gerenciado no topo das superficies suportadas;
- preserva o conteudo original abaixo do bloco gerenciado;
- grava `.hardless/manifests/installation.json`.

`hardless.uninstall`:

- restaura backups originais quando existirem;
- remove arquivos criados apenas pelo Hardless;
- remove o manifest de instalacao.

`hardless.repair`:

- recompõe o bloco gerenciado;
- preserva o conteudo atual do usuario abaixo do bloco;
- atualiza `lastRepairedAt` no manifest.

## Como interpretar os estados

- `not_bootstrapped`: o workspace ainda nao tem runtime Hardless ativo
- `pending_activation`: o bootstrap terminou, mas o pacote curado ainda esta abaixo do limiar de ativacao automatica
- `ready`: runtime ativo e pronto para uso
- `degraded`: existe drift, corrupcao ou leitura incompleta que exige atencao

Razoes comuns:

- `workspace_not_bootstrapped`
- `workspace_pending_activation`
- `runtime_state_corrupted`
- `runtime_state_unreadable`

## O que existe em `.hardless/`

- `manifests/`: estado estrutural do runtime, incluindo `workspace.json` e `installation.json`
- `sources/`: snapshots e referencias das fontes ingeridas
- `fragments/`: material intermediario por fonte e por topico
- `rules/`: bundles `required`, `triggered` e `fallback`
- `indexes/`: lookup rapido por task type e referencias
- `routing/`: politicas de triagem e escalacao
- `reports/`: relatorios de bootstrap e drift
- `backups/`: backups dos arquivos tocados por `hardless.install`

## Troubleshooting

### O Cursor nao mostra as tools do Hardless

- confirme `pnpm build`
- confirme o caminho do `dist/index.js`
- reinicie o Cursor depois de salvar a configuracao MCP

### `dist/index.js` nao existe

Rode:

```bash
pnpm build
```

O caminho correto do artefato compilado e:

`/Volumes/Dados/projetos/hardless-mcp/packages/hardless-mcp/dist/index.js`

### `hardless.install` falha com `workspace_not_bootstrapped`

Execute primeiro:

1. `hardless.bootstrap`
2. `hardless.install`

### O usuario editou `AGENTS.md` manualmente e o bloco quebrou

Use:

```text
Use tool hardless.repair with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

### Quero desfazer a integracao automatica

Use:

```text
Use tool hardless.uninstall with:
{
  "workspaceRoot": "/abs/path/to/workspace"
}
```

## Estrutura do repositorio

- `.specs/features/hardless-mcp/`: requisitos, design, tasks e decisoes
- `method/`: metodo canônico do produto
- `packages/hardless-mcp/`: pacote principal do servidor MCP
