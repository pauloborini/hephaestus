# Hardless Method

Este diretorio registra o metodo canônico que o `Hardless MCP` quer operacionalizar.

Ele **nao** existe como um `AGENTS.md` para ser obedecido cegamente por um agente externo. Ele existe como material de produto e referencia para:

- design do bootstrap;
- definicao de artefatos em `.hardless/`;
- modelagem da triagem e do roteamento;
- traducao de regras cruas do usuario para contexto operacional curado.

## Origem conceitual

O desenho desta camada foi inspirado por um padrao de projeto real baseado em:

- `entrypoint` de workflow;
- tipagem primaria da tarefa;
- indices por tipo;
- regras obrigatorias em ordem;
- referencias sob gatilho;
- checklist contextual;
- regra de precedencia.

No Hardless MCP, esses conceitos foram renomeados para evitar confusao entre:

- fonte do usuario;
- metodo do produto;
- artefatos operacionais derivados.

## Como ler este diretorio

- `workflow-canon.md`: ritual principal do produto.
- `task-taxonomy.md`: tipagem primaria de tarefas e sinais de escalonamento.
- `context-loading.md`: como o runtime decide o que carregar.
- `validation-gates.md`: validacoes e guardrails transversais.
- `source-ingestion-map.md`: como inputs do usuario entram no sistema.

## Papel no alpha

No alpha, este diretorio deve servir como:

- referencia para `design.md`;
- base para schemas e manifestos do bootstrap;
- insumo para as tools do MCP ligadas a triagem e roteamento.
