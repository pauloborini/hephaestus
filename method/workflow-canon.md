# Workflow Canon

## Objetivo

Definir o ritual minimo que o Hardless MCP quer impor antes de qualquer alteracao relevante em codigo.

Este workflow nao representa as regras especificas de um projeto do usuario. Ele representa o metodo do produto.

## Fase 1. Triagem Inicial

Toda solicitacao entra primeiro em triagem.

Saidas permitidas:

- `discussion`
- `fast_mode`
- `spec_flow`
- `blocked`

### Regras basicas

- Se houver pergunta, analise ou opiniao sem pedido explicito de alteracao, cair em `discussion`.
- Se houver pedido de alteracao pequeno, claro e de baixo risco, candidato a `fast_mode`.
- Se houver mudanca mais ampla, ambigua ou arriscada, cair em `spec_flow`.
- Se faltar contexto minimo para decidir com seguranca, cair em `blocked`.

## Fase 2. Tipagem Primaria

Antes de carregar contexto amplo, o runtime precisa escolher um tipo primario de tarefa.

Regras:

- escolher apenas um tipo primario por ciclo;
- em casos mistos, usar o tipo dominante;
- carregar subcontextos adicionais apenas sob gatilho.

## Fase 3. Carregamento Minimo de Contexto

O runtime nao deve abrir tudo.

Ele carrega:

- um indice primario da tarefa;
- no maximo um subindice de cenario, quando aplicavel;
- regras obrigatorias ligadas ao tipo;
- referencias apenas sob gatilho.

## Fase 4. Confirmacao de Contexto

Antes de qualquer execucao relevante, o sistema deve ser capaz de declarar:

- qual foi o tipo escolhido;
- quais fontes e artefatos foram carregados;
- qual e o escopo resumido da tarefa;
- por que a tarefa foi enquadrada em `discussion`, `fast_mode`, `spec_flow` ou `blocked`.

## Fase 5. Execucao com Gate

Cada modo executa com exigencia minima diferente:

- `discussion`: sem alteracao de codigo;
- `fast_mode`: plano curto + execucao + validacao minima;
- `spec_flow`: artefatos de spec + implementacao + validacao;
- `blocked`: pedir complemento ou aprovar fallback.

## Regras Anti-Loop

- apos poucos ciclos de leitura sem progresso, gerar artefato concreto;
- se o contexto continuar insuficiente, explicitar bloqueio em vez de continuar pesquisando indefinidamente;
- nao expandir contexto sem justificar o gatilho.

## Intencao de Produto

O ponto aqui nao e tornar o agente mais verboso. E impedir improviso operacional.
