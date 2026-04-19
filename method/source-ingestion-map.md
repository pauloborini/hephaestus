# Source Ingestion Map

## Objetivo

Explicar como fontes do usuario entram no sistema sem virarem instrucoes cruas de runtime.

## Principio Central

`fonte do usuario != artefato operacional`

O usuario pode ter:

- um `AGENTS.md` excelente;
- um `AGENTS.md` ruim;
- nenhuma regra explicita;
- varias fontes parciais e contraditorias.

O Hardless precisa operar em todos esses cenarios.

## Pipeline

1. `discover`
   Encontrar fontes relevantes do workspace.

2. `snapshot`
   Registrar copia ou referencia estavel das fontes.

3. `fragment`
   Quebrar material grande em unidades menores e classificaveis.

4. `classify`
   Associar fragmentos a temas operacionais.

5. `synthesize`
   Produzir artefatos curados com schema e limites.

6. `route`
   Gerar manifestos de carregamento e escalonamento.

7. `reconcile`
   Revisar ou atualizar quando houver drift ou ambiguidade.

## Mapeamento Conceitual

Padrao observado em projetos reais:

- `entrypoint global`
- `indices por tipo`
- `regras obrigatorias`
- `referencias sob gatilho`
- `checklists`
- `precedencia`

Traducao para o Hardless MCP:

- `entrypoint global` -> `workflow-canon`
- `indices por tipo` -> `task indexes` em `.hardless/indexes/`
- `regras obrigatorias` -> `required rule bundles`
- `referencias sob gatilho` -> `triggered references`
- `checklists` -> `validation packs`
- `precedencia` -> `routing and precedence manifest`

## Observacao Importante

O Hardless nao deve chamar essa camada de `agents/` dentro do proprio produto, porque isso mistura:

- o metodo do Hardless;
- as fontes do usuario;
- e as regras finais curadas do runtime.

## Intencao de Produto

A ingestao existe para transformar material heterogeneo do projeto em um contrato operacional menor, rastreavel e utilizavel.
