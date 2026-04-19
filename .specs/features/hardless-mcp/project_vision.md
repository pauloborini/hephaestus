# Project Vision - Hardless MCP

## Contexto

O produto principal do Hardless continua sendo um app desktop repo-native. Porem, existe uma oportunidade de entregar valor mais cedo criando uma superficie complementar com time-to-value menor: um `MCP` local orientado a workflow, bootstrap de contexto e enforcement operacional leve dentro do editor do usuario.

Essa iniciativa nao tenta substituir o produto desktop. Ela existe para:

- validar o conceito central de harness em um projeto real antes de concluir o app completo;
- reutilizar parte do nucleo conceitual do Hardless em uma superficie mais simples de instalar;
- permitir que o usuario aplique o workflow do Hardless em clientes que ja suportam MCP;
- provar que o diferencial do produto nao esta apenas na UI desktop, mas no ritual operacional e na camada de contexto curado.

## Tese do Produto

O `Hardless MCP` nao deve competir como "mais um servidor MCP com utilitarios de codigo".

Ele deve competir por:

- impor um workflow canônico de engenharia antes da execucao;
- distinguir discussao, fast mode e spec flow antes de tocar no codigo;
- curar e fragmentar regras do projeto do usuario em vez de depender de prompts gigantes;
- registrar proveniencia, confianca e drift das regras derivadas;
- funcionar como nucleo portavel do harness, reaproveitavel depois pelo app desktop.

## Problema Que Queremos Resolver

Hoje, mesmo em clientes que suportam MCP, a maioria dos fluxos continua frouxa:

- o agente pode pular triagem;
- o contexto do projeto fica dependente de arquivos gigantes e pouco operacionais;
- regras do usuario ficam espalhadas em `AGENTS.md`, `CLAUDE.md`, docs e convencoes nao fragmentadas;
- tarefas simples e tarefas complexas entram no mesmo ritual ad hoc;
- a camada de "context engineering" costuma gerar scaffolds genericos sem rastreabilidade suficiente.

O Hardless MCP quer atacar exatamente isso:

- transformar regras dispersas em contexto operacional menor e rastreavel;
- carregar apenas o necessario para cada tipo de tarefa;
- escalar de `fast mode` para `spec flow` com criterio explicito;
- manter um bootstrap auditavel em vez de confiar cegamente na LLM.

## Proposta de Valor

Para o usuario tecnico, o Hardless MCP deve entregar 4 promessas principais:

1. `Workflow antes de implementacao`
   O agente nao deveria partir para codigo sem antes classificar o pedido e decidir o fluxo correto.

2. `Bootstrap repo-native`
   O MCP le as fontes reais do projeto, fragmenta as regras, cria artefatos operacionais e preserva a origem de cada decisao derivada.

3. `Fast mode sem teatro`
   Mudancas pequenas nao precisam atravessar uma cerimonia pesada de spec.

4. `Spec flow quando realmente importa`
   Mudancas maiores ou mais arriscadas devem cair em um fluxo estruturado com requirements, design, tasks e gates.

## Usuario Inicial

Usuario inicial recomendado:

- founder tecnico;
- senior/staff engineer;
- tech lead que ja usa Cursor, VS Code, Windsurf ou outro cliente com MCP;
- desenvolvedor que quer disciplinar o uso de LLM no proprio projeto sem mudar de editor.

Usuario inicial nao recomendado:

- time que quer zero setup local;
- usuario nao tecnico;
- contexto enterprise com politica forte de aprovacao centralizada desde o primeiro dia;
- quem quer um copiloto generico sem aceitar workflow.

## Diferenciacao

O Hardless MCP deve ser `workflow-first`, nao `context-first`.

Isso implica:

- o diretorio e os artefatos do Hardless existem para servir o fluxo operacional;
- o bootstrap nao gera documentos genericos "bonitos", e sim artefatos curados para roteamento;
- o agente trabalha em cima do contexto derivado do Hardless, nao diretamente em cima dos arquivos crus do usuario;
- o diferencial principal e a disciplina operacional, nao a quantidade de templates ou integrações.

## Principios de Produto

### 1. Workflow canônico do Hardless

O MCP deve levar seu proprio ritual operacional, independentemente de o projeto do usuario ter ou nao um `AGENTS.md` bem escrito.

### 2. Regras do usuario como input, nao como contrato de runtime

Arquivos do usuario sao fontes de ingestao. O contrato operacional do runtime passa a ser o conjunto curado de artefatos gerados pelo Hardless.

### 3. LLM assistida, nao soberana

A LLM pode reorganizar, sintetizar e preencher lacunas controladas, mas nao deve ser a unica fonte de estrutura, roteamento ou proveniencia.

### 4. Um workspace por vez

O MCP deve herdar o principio de profundidade por workspace do produto principal.

### 5. Rastreabilidade como requisito, nao bonus

Toda regra derivada importante deve apontar de onde veio, qual e seu nivel de confianca e quando foi reconciliada.

## Estrategia de Bootstrap

O bootstrap do Hardless MCP deve ser hibrido:

- descoberta deterministica das fontes do projeto;
- snapshot local das fontes relevantes;
- fragmentacao semi-deterministica;
- classificacao e sintese assistidas;
- producao de artefatos operacionais do Hardless;
- revisao e reconciliacao quando houver ambiguidade.

O bootstrap existe para reduzir dependencia de prompt livre e para impedir que o sistema alucine um conjunto de regras que o projeto nunca teve.

## Superficies do Produto

### Superficie inicial

- servidor MCP local;
- diretoria `.hardless/` dentro do workspace alvo;
- comandos de initialize/bootstrap;
- tools de triagem, roteamento, leitura de regras e checagem de drift.

### Superficies futuras

- extensao fina de editor para setup, toggle e status;
- app desktop consumindo o mesmo nucleo de workflow e bootstrap.

## Nao Objetivos do Alpha

Nao perseguir no alpha:

- reimplementar um IDE inteiro via MCP;
- substituir as tools nativas de edicao do cliente;
- forcar obediencia absoluta de qualquer LLM por meio do MCP sozinho;
- gerar documentacao perfeita e completa de todo projeto no primeiro bootstrap;
- suportar todos os clientes e variacoes de editor com a mesma profundidade desde o dia zero.

## Resultado Esperado do Alpha

Ao fim do alpha, queremos conseguir instalar o Hardless MCP em um projeto real e observar o seguinte comportamento:

- o workspace e inicializado com artefatos proprios do Hardless;
- o agente classifica o pedido antes de implementar;
- tarefas simples seguem um caminho curto e verificavel;
- tarefas complexas escalam para um fluxo spec-driven;
- regras do projeto deixam de depender de um unico arquivo gigante e passam a existir como fragmentos operacionais menores;
- o usuario consegue pausar ou desativar o Hardless quando quiser codar fora do ritual.
