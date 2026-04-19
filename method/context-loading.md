# Context Loading Strategy

## Objetivo

Definir como o Hardless MCP reduz contexto e evita carregar documentos demais a cada solicitacao.

## Camadas de Contexto

### 1. Metodo do Hardless

Contexto estavel do produto:

- workflow canônico;
- taxonomia de tarefa;
- gates universais;
- regras de proveniencia e drift.

### 2. Artefatos Curados do Workspace

Contexto operacional derivado em `.hardless/`:

- indices por tipo;
- regras fragmentadas;
- manifestos de roteamento;
- memoria do workspace;
- relatorios de drift.

### 3. Fontes Cruas do Usuario

Contexto de origem:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- `.specs/`
- docs arquiteturais

Essas fontes so devem ser relidas diretamente quando:

- o bootstrap ainda nao ocorreu;
- foi detectado drift;
- houve ambiguidade que os artefatos curados nao conseguem resolver.

## Orcamento Inicial de Contexto

Antes do primeiro artefato concreto, o runtime deve tentar operar com:

- 1 tipo primario;
- 1 subcenario, quando necessario;
- regras obrigatorias desse tipo;
- no maximo 2 referencias sob gatilho.

## Tipos de Material Carregado

- `required`: obrigatorio para o tipo atual
- `triggered`: carregado apenas se um sinal especifico aparecer
- `fallback`: carregado quando faltam artefatos suficientes
- `stale`: carregado com aviso porque pode estar desatualizado

## Intencao de Produto

O agente nao deve navegar pelo repositorio inteiro para cada pedido. O runtime deve entregar o pacote minimo viavel de contexto.
