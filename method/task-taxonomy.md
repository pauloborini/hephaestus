# Task Taxonomy

## Objetivo

Definir uma taxonomia inicial de tipos de tarefa para o alpha do Hardless MCP.

Esta taxonomia nao pretende ser definitiva. Ela existe para orientar triagem, roteamento e carregamento minimo de contexto.

## Tipos Primarios Iniciais

| Tipo | Uso esperado |
|------|--------------|
| `feature` | nova capacidade, fluxo, camada ou integracao |
| `ui` | interface, layout, componente, apresentacao |
| `contract` | DTO, schema, API, serializacao, mapeamento |
| `navigation` | rotas, fluxo entre telas, guards, transicoes |
| `shared` | utilitarios, tipos, modulos compartilhados, convencoes comuns |
| `security` | segredos, permissao, boundary, PII, risco operacional |
| `diagnostic` | investigacao, bug, regressao, comportamento inesperado |
| `refactoring` | reorganizacao, simplificacao, melhoria estrutural |
| `testing` | criacao, ajuste ou execucao de testes e validacao |

## Subtipos por Cenario

O alpha deve suportar subtipos sob gatilho, em vez de transformar toda triagem em arvore profunda.

Exemplos:

- `diagnostic/i18n`
- `diagnostic/backend_contract`
- `feature/api_surface`
- `ui/component_extraction`

## Sinais de Escalonamento

Mesmo com tipo primario definido, a tarefa pode subir de `fast_mode` para `spec_flow` quando houver:

- impacto em varias areas do repo;
- mudança de contrato;
- risco de regressao ou remocao implicita;
- ausencia de regra suficiente no contexto carregado;
- contradicao entre fontes do projeto;
- necessidade de design ou decisao estrutural.

## Intencao de Produto

O valor da tipagem nao esta em rotular a tarefa. Esta em carregar pouco, cedo e com criterio.
