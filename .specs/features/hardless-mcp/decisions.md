# Decisions - Hardless MCP

## Como usar este arquivo

Este arquivo registra decisoes fechadas especificas da iniciativa `Hardless MCP`.

Regras:

- toda decisao estavel desta iniciativa deve entrar aqui antes de orientar implementacao relevante;
- este arquivo complementa, e nao substitui, as decisoes globais do produto;
- quando uma decisao mudar, a anterior deve ser marcada como `superseded` e uma nova deve ser criada;
- requisitos dizem o que o MCP precisa fazer; este arquivo registra como escolhemos fazer.

Status validos:

- `accepted`
- `superseded`
- `proposed`

---

## D-001 - Implementar o Hardless MCP dentro do monorepo atual

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Precisamos validar o Hardless MCP rapidamente sem abrir outro repositorio, duplicar stack e perder reaproveitamento do nucleo do produto.

### Decisao

O Hardless MCP sera implementado dentro deste mesmo monorepo, como um novo pacote em `packages/`.

### Consequencias

- o MCP pode reutilizar `harness-core`, `repo-sensor`, `agent-runtime` e `shared`;
- o desktop podera consumir o mesmo nucleo depois;
- evitamos dispersao prematura de arquitetura e infraestrutura.

---

## D-002 - O Hardless MCP sera workflow-first, nao context-first

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Servidores MCP genericos de contexto tendem a entregar scaffolds, memoria e ferramentas, mas deixam o fluxo de engenharia frouxo. Isso nao expressa o diferencial desejado para o Hardless.

### Decisao

O eixo principal do Hardless MCP sera o ritual operacional:

- triagem inicial;
- classificacao da tarefa;
- decisao entre `discussion`, `fast mode`, `spec flow` ou `blocked`;
- gates de execucao e validacao;
- consumo de artefatos curados pelo Hardless.

### Consequencias

- contexto existe para servir o workflow;
- o valor do produto nao depende de uma UI propria neste alpha;
- as tools do MCP precisam refletir fases e gates, nao apenas leitura de arquivos.

---

## D-003 - Arquivos do usuario sao fontes de ingestao, nao contrato cru de runtime

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Projetos diferentes terao `AGENTS.md`, `CLAUDE.md`, `cloud.md` e docs com niveis muito diferentes de qualidade. Apoiar o runtime diretamente nesses arquivos geraria fragilidade, custo de contexto e inconsistencias.

### Decisao

Arquivos do usuario serao tratados como fontes de entrada para um bootstrap do Hardless. O runtime passara a operar prioritariamente sobre os artefatos derivados em `.hardless/`.

### Consequencias

- o Hardless ganha um contrato operacional estavel;
- regras do usuario continuam preservadas como input;
- o sistema precisa manter proveniencia e drift entre fonte e derivado.

---

## D-004 - O bootstrap sera hibrido e rastreavel

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Deixar a LLM preencher livremente os arquivos do Hardless cria risco de artefatos genericos, omissoes e alucinacao de regras que o projeto nunca teve.

### Decisao

O bootstrap combinara:

- descoberta deterministica de fontes;
- snapshots das fontes;
- fragmentacao semi-deterministica;
- sintese assistida por LLM com schema e limites;
- manifestos de proveniencia, confianca e drift.

### Consequencias

- reduzimos dependencia de geracao livre;
- a qualidade do bootstrap passa a depender tambem de heuristicas e contratos claros;
- fica possivel reconciliar artefatos sem refazer tudo do zero.

---

## D-005 - Fast mode e spec flow serao caminhos explicitamente distintos

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Um dos problemas do uso atual de LLM para codigo e tratar toda solicitacao com a mesma cerimonia ou sem cerimonia nenhuma. Isso produz desperdicio nas tarefas pequenas e improviso perigoso nas grandes.

### Decisao

O Hardless MCP tera dois caminhos operacionais principais apos a triagem:

- `fast mode` para mudancas pequenas, claras e de baixo risco;
- `spec flow` para mudancas maiores, ambiguas ou arriscadas.

Tambem havera os estados `discussion` e `blocked` antes de qualquer escrita.

### Consequencias

- o produto consegue equilibrar velocidade e disciplina;
- a triagem se torna uma parte central do runtime;
- o alpha precisa registrar criterios de promocao de `fast mode` para `spec flow`.
