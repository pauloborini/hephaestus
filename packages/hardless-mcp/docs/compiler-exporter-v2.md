# Hardless V2 - Compiler/Exporter Architecture

## Objetivo

Definir o pivot do Hardless de um produto centrado em MCP para um produto centrado em compilacao de instrucoes.

O problema que esta proposta resolve e simples:

- MCP e uma superficie de transporte de tool, nao uma garantia de enforcement;
- se o cliente nao chamar a tool, o ritual do Hardless nao roda;
- para este produto, isso quebra o valor principal.

Logo, o objetivo da V2 nao e "melhorar o MCP". O objetivo e mover o enforcement para os artefatos gerados no workspace final do usuario.

## Tese de Produto

O Hardless deve operar como um compilador de contexto operacional:

1. recebe fontes cruas do usuario;
2. quebra, classifica e reconcilia esse material;
3. sintetiza artefatos menores, rastreaveis e consistentes;
4. exporta um pacote pronto para ser colocado no repo do usuario;
5. faz o agente encontrar naturalmente um `AGENTS.md` centralizador e arquivos fragmentados, sem depender de tool call.

## O Que Muda

### V1 Alpha atual

Produto descrito e estruturado como:

- servidor MCP local;
- bootstrap em `.hardless/`;
- tools como `hardless.bootstrap`, `hardless.triage`, `hardless.context`;
- instalacao gerenciada para tentar dar precedencia ao Hardless no repo do usuario.

### V2 proposta

Produto principal passa a ser:

- compiler/exporter remoto ou hospedado;
- ingestao de multiplas fontes do usuario;
- pipeline hibrido deterministico + LLM;
- preview e validacao do resultado;
- export de pacote repo-native pronto.

MCP deixa de ser o centro do produto. No maximo, pode sobreviver depois como interface secundaria de manutencao, reparo ou refresh local.

## Principios

### 1. Fonte do usuario nao e runtime

O produto nao deve usar `AGENTS.md` cru como contrato direto de execucao.

As fontes cruas podem ser:

- boas, ruins ou contraditorias;
- monoliticas ou fragmentadas;
- completas ou incompletas;
- especificas de uma IDE ou de varias.

O Hardless precisa transformar esse material em artefatos operacionais menores.

### 1.5. Estrutura pode ser reaproveitada, identidade nao

O Hardless pode reaproveitar padroes estruturais observados em projetos reais, mas nao deve carregar para o produto:

- nome de projeto real;
- dominio de negocio real;
- exemplos textuais identificaveis;
- nomes de pacotes, apps ou modulos herdados;
- qualquer referencia que revele a origem do material-base.

Para artefatos distribuidos, exemplos e templates, a regra e:

- copiar a estrutura;
- neutralizar o vocabulário;
- anonimizar a proveniencia;
- expor apenas o modelo canônico resultante.

### 2. Enforcement vem do artefato final

O fluxo precisa ser encontrado naturalmente pelo agente no repo final:

- `AGENTS.md` central forte;
- `agents/index/*.md`;
- `agents/rules/*.md`;
- `agents/reference/*.md`;
- `agents/memory/*.md`, quando aplicavel.

### 3. Pipeline hibrido

Nao basta heuristica pura.
Nao basta LLM pura.

O caminho correto e:

- determinismo para discovery, splitting, manifests, precedencia e validacao estrutural;
- LLM para normalizacao, rotulagem, sintese, reescrita e consolidacao semantica.

### 4. Proveniencia obrigatoria

Toda regra relevante gerada precisa manter ligacao com a origem:

- qual arquivo entrou;
- qual trecho originou o artefato;
- se a saida veio de copia, consolidacao ou inferencia;
- qual foi o nivel de confianca.

Sem isso, o usuario nao confia no pacote.

### 5. `AGENTS.md` nao carrega regra de dominio

Na V2, o `AGENTS.md` gerado na raiz deve ser enxuto e operacional.

Ele deve conter:

- bootstrap;
- precedencia;
- triagem;
- orcamento de contexto;
- regras anti-loop;
- apontadores para os arquivos fragmentados.

Ele nao deve virar deposito das regras especificas do usuario.

## Arquitetura Proposta

## Camadas

### 1. Ingestion Core

Responsavel por:

- receber uploads ou texto colado;
- detectar tipo de fonte;
- normalizar encoding e formato;
- versionar snapshots da sessao.

Entradas aceitas inicialmente:

- `AGENTS.md`
- `CLAUDE.md`
- `cloud.md`
- `.cursorrules`
- docs arquiteturais
- specs em markdown
- diretorios compactados

### 2. Deterministic Compiler

Responsavel por:

- `discover`
- `snapshot`
- `fragment`
- `classify`
- `route`
- gerar manifests intermediarios

Essa camada nao depende de MCP.
Essa camada deve continuar sendo o backbone do produto.

### 3. LLM Synthesis Layer

Responsavel por:

- renomear e consolidar fragmentos;
- transformar texto cru em regras operacionais claras;
- separar index, rules, reference e memory;
- produzir um `AGENTS.md` centralizador padrao;
- detectar duplicacoes, contradicoes e lacunas.

Essa camada nao escreve artefato final sem schema e sem validacao posterior.

### 4. Validation Layer

Responsavel por:

- checar se toda saida obrigatoria existe;
- garantir estrutura minima do pacote exportado;
- validar precedencia e links internos;
- garantir ausencia de arquivos vazios ou incoerentes;
- marcar pontos onde a sintese ainda dependeu de heuristica fraca.

### 5. Export Layer

Responsavel por:

- montar arvore final do workspace;
- incluir manifests de proveniencia;
- gerar preview legivel;
- exportar `.zip`.

## Fluxo End-to-End

1. Usuario envia uma ou mais fontes.
2. Sistema descobre e tipa as entradas.
3. Sistema gera snapshots internos da sessao.
4. Sistema fragmenta os documentos.
5. Sistema classifica fragmentos por topico, task type e funcao operacional.
6. Sistema consolida o material com LLM em uma estrutura-alvo padrao.
7. Sistema valida estrutura, precedencia, cobertura e proveniencia.
8. Sistema mostra preview.
9. Sistema exporta pacote pronto.

## Estrutura de Saida Proposta

```text
AGENTS.md
agents/
  index/
    feature.md
    ui.md
    contract.md
    navigation.md
    shared.md
    security.md
    diagnostic.md
    refactoring.md
    testing.md
  rules/
    architecture_rules.md
    patterns_rules.md
    domain_rules.md
    feature_rules.md
    ui_rules.md
    navigation_rules.md
    shared_rules.md
    security_rules.md
    contract_rules.md
  reference/
    api_contract_reference.md
    components_examples.md
    domain_examples.md
  memory/
    extended-memory.md
.hardless/
  manifests/
    provenance.json
    compilation.json
    routing.json
  reports/
    compilation-summary.md
```

Observacoes:

- a arvore exata pode variar por projeto;
- o importante e manter contratos previsiveis;
- `memory/` deve ser opcional;
- `.hardless/` deve guardar metadados do compilador, nao virar dependencia de runtime obrigatoria do agente.
- templates, referencias e exemplos publicos devem usar nomenclatura neutra.

## Papel de Cada Tipo de Artefato

### `AGENTS.md`

Entry point operacional unico.

Conteudo esperado:

- bootstrap de configuracao;
- workflow principal;
- regras de precedencia;
- regra de memoria complementar;
- confirmacao de contexto;
- orcamento de contexto;
- regras anti-loop;
- regras universais minimas.

### `agents/index/*.md`

Roteadores por tipo de tarefa.

Devem dizer:

- quais regras sao obrigatorias;
- quais referencias so entram sob gatilho;
- quais checklists existem.

### `agents/rules/*.md`

Regras operacionais fragmentadas do usuario, ja normalizadas.

Devem conter:

- regra clara;
- escopo;
- exemplos quando necessario;
- pouca redundancia.

### `agents/reference/*.md`

Material de apoio, nao obrigatorio por default.

Serve para:

- exemplos;
- contratos longos;
- tabelas;
- referencia visual;
- exemplos de arquitetura.

### `.hardless/manifests/*.json`

Metadados de compilacao e rastreabilidade.

Devem responder:

- de onde veio cada bloco;
- quando foi compilado;
- qual versao do compilador gerou;
- quais conflitos ou inferencias ocorreram.

## Politica De Nomenclatura Publica

Material distribuivel do Hardless nao deve citar projetos reais usados como inspiracao estrutural.

Usar apenas nomes neutros, por exemplo:

- `canonical-structure`
- `baseline-project`
- `reference-workspace`
- `project-alpha`
- `fragmented-reference`

Evitar:

- nomes de clientes;
- nomes de produtos internos;
- URLs, e-mails ou contratos reais;
- exemplos que revelem stack ou dominio de origem sem necessidade.

## O Que Reaproveitar Do Repo Atual

## Reaproveitamento forte

Esses componentes ja apontam para a direcao certa e devem ser preservados com refactor, nao reescritos do zero:

- `method/source-ingestion-map.md`
- `method/context-loading.md`
- `method/workflow-canon.md`
- `method/task-taxonomy.md`
- `method/validation-gates.md`
- `src/infra/fragment-extractor.ts`
- `src/shared/fragment-classification.ts`
- pipeline de bootstrap que ja executa `discover -> snapshot -> fragment`
- manifests de fonte, fragmento e proveniencia

Motivo:

- essa base ja separa fonte crua de artefato operacional;
- ja existe mentalidade de pipeline;
- o investimento estrutural nao foi perdido.

## Reaproveitamento parcial

Esses componentes continuam uteis, mas precisam mudar de responsabilidade ou linguagem de contrato:

- `src/application/bootstrap-workflow.ts`
- `src/application/contracts.ts`
- `src/infra/routing-manifest.ts`
- `src/infra/rule-bundles.ts`
- `src/infra/task-indexes.ts`
- `src/infra/bootstrap-summary.ts`

Motivo:

- a ideia ainda serve;
- o contrato atual esta contaminado por semantica de workspace runtime e MCP.

## O Que Sai Do Caminho Critico

Esses componentes nao precisam necessariamente sumir, mas deixam de ser core do produto:

- `src/mcp/*`
- `src/application/context-workflow.ts`
- `src/runtime/*` como camada principal de uso
- instrucoes do README baseadas em `hardless.bootstrap` e `hardless.context`

Motivo:

- tudo isso pressupoe um cliente chamando a tool certa;
- esse e o gargalo de produto que queremos eliminar.

## Novo Modelo de Pacotes

Uma forma limpa de reorganizar o monorepo:

### `packages/hardless-core`

Contem:

- discovery;
- snapshot;
- fragmentacao;
- classificacao;
- manifests;
- schemas;
- validadores estruturais.

Zero dependencia de MCP.

### `packages/hardless-compiler`

Contem:

- orquestracao da compilacao;
- prompts e contratos da camada LLM;
- reconciliacao;
- montagem da estrutura final;
- preview e export bundle.

### `packages/hardless-web`

Contem:

- upload;
- configuracao da compilacao;
- preview;
- download do `.zip`;
- historico de compilacoes, se necessario.

### `packages/hardless-mcp` ou `packages/hardless-local`

Opcional e secundario.

Pode sobreviver para:

- refresh local;
- repair;
- aplicar patch incremental no workspace do usuario;
- integracoes futuras em IDE.

Mas nao deve mais definir o produto.

## Contratos Novos

## Input contract

Cada fonte de entrada deve ter ao menos:

- `sourceId`
- `sourceType`
- `displayName`
- `rawContents` ou `archiveEntry`
- `origin`
- `userPriority`

## Intermediate fragment contract

Cada fragmento deve registrar:

- `fragmentId`
- `sourceId`
- `locator`
- `rawText`
- `normalizedText`
- `topic`
- `taskTypes`
- `operationalRoleCandidate`
- `confidence`
- `ambiguity`

## Synthesized artifact contract

Cada artefato gerado deve registrar:

- `artifactType`
- `outputPath`
- `title`
- `body`
- `derivedFromFragments`
- `conflictsResolved`
- `inferenceLevel`
- `validationStatus`

## Compilation manifest

Manifest final da sessao deve registrar:

- entradas recebidas;
- versao do compilador;
- estrutura exportada;
- avisos;
- conflitos;
- pontos de baixa confianca;
- hash do bundle exportado.

## Regras de Conflito

V1 do compilador deve tratar conflito de forma explicita.

Prioridade sugerida:

1. entrypoint principal do usuario, se claramente declarado;
2. regras fragmentadas especializadas do usuario;
3. referencias e docs complementares;
4. inferencia do compilador;
5. fallback do metodo Hardless.

Regras:

- nunca esconder conflito estrutural;
- nunca fundir regras contraditorias sem marcar consolidacao;
- quando a confianca cair abaixo do limiar, emitir aviso no preview e no manifest;
- permitir ao usuario escolher entre modos como `strict`, `balanced` e `salvage`.

## Qualidade Minima Antes De Exportar

Nao exportar bundle como valido se:

- faltar `AGENTS.md`;
- faltar ao menos um index;
- existir artefato quebrado por referencia interna inexistente;
- houver arquivo estrutural obrigatorio vazio;
- a proveniencia estiver ausente;
- a compilacao depender majoritariamente de inferencia sem fonte suficiente.

## Sequencia De Migracao

### Fase 1

Reposicionar o projeto conceitualmente:

- atualizar docs para declarar o pivot;
- parar de vender MCP como core;
- tratar `packages/hardless-mcp` atual como alpha tecnico, nao como produto final.

### Fase 2

Extrair o nucleo reutilizavel:

- mover pipeline deterministico para um pacote `hardless-core`;
- isolar contratos sem semantica MCP;
- estabilizar schemas de fonte, fragmento e artefato sintetizado.

### Fase 3

Criar o compilador real:

- adicionar camada de sintese assistida;
- gerar preview;
- gerar bundle exportavel;
- validar qualidade minima.

### Fase 4

Criar interface de produto:

- web app ou studio;
- upload das fontes;
- configuracoes de compilacao;
- preview do resultado;
- download do bundle.

### Fase 5

Decidir o papel residual do MCP:

- remover;
- congelar;
- ou manter apenas como repair/apply local.

## Decisoes Recomendadas Agora

1. Assumir oficialmente que MCP nao e mais o centro do produto.
2. Manter o trabalho de pipeline deterministico como investimento valido.
3. Definir o schema do pacote exportado antes de mexer em UI.
4. Fazer preview e proveniencia como parte obrigatoria do produto, nao feature futura.
5. Segurar qualquer nova expansao do adapter MCP ate o compilador existir.

## Decisoes Ruins A Evitar

- insistir em MCP como enforcement;
- deixar a LLM escrever estrutura final sem schema;
- gerar zip sem manifest de proveniencia;
- tentar suportar todas as IDEs com instalacao automatica antes de fechar o compilador;
- empurrar toda a confianca para prompt engineering.

## Perguntas Em Aberto

- o pacote exportado deve incluir `.hardless/` por default ou apenas quando o usuario pedir modo avancado?
- o preview deve permitir edicao manual ou apenas regeneracao?
- a compilacao sera stateless por upload ou com workspace salvo por projeto?
- a memoria persistente do usuario entra como classe propria de artefato ou apenas como subtype de regra?

## Conclusao

O alpha atual provou que a direcao correta do Hardless nao e "mais MCP".

O que ele provou de fato foi:

- a pipeline deterministica faz sentido;
- separar fonte crua de artefato operacional faz sentido;
- fragmentacao e roteamento fazem sentido;
- o enforcement precisa estar no pacote final encontrado pelo agente, nao em tool call opcional.

Portanto, a V2 deve ser tratada como um compiler/exporter repo-native com pipeline hibrido e artefatos verificaveis.
