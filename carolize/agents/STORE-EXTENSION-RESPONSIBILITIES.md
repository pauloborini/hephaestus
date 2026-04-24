# Store Split Pattern

Guia prático para refatorar uma store grande em uma store principal + arquivos de extensão por responsabilidade.

## Objetivo

Reduzir complexidade de leitura/manutenção sem alterar comportamento:

- manter API pública da store;
- separar casos de uso por arquivo;
- preservar estado reativo, dependências e ciclo de vida no arquivo raiz.

## Quando usar

Use este padrão quando a store:

- concentra CRUD + listagem + busca + navegação + helpers;
- passa de ~200 linhas com múltiplos contextos misturados;
- está difícil de revisar por risco de regressão.

## Estrutura recomendada

```text
presentation/stores/
├── client_store.dart
└── client_store/
    ├── client_store.crud.dart
    ├── client_store.loading.dart
    ├── client_store.search.dart
    ├── client_store.navigation.dart
    └── client_store.helpers.dart
```

## Papel de cada arquivo

### `*_store.dart` (raiz)

- imports;
- `part` declarations;
- classe da store com:
  - injeções/dependências;
  - variáveis de estado (`Rx`, `Rxn`, listas);
  - getters de contexto;
  - `onInit` e `onClose`.

### `*.crud.dart`

- create/update/delete;
- validação de input de fluxo (quando aplicável);
- montagem de entidade para persistência;
- atualização otimista da lista local após sucesso.

### `*.loading.dart`

- carregamento inicial e paginação;
- integração com repository/service para listagem;
- controle de flags de carregamento e `hasMore`.

### `*.search.dart`

- debounce, texto de busca e filtros de busca;
- aplicação/limpeza de filtros de tela;
- acionamento do fluxo de listagem adequado.

### `*.navigation.dart`

- troca de `viewMode` e seleção de item para detalhe/edição/criação;
- sem regras de persistência.

### `*.helpers.dart`

- helpers internos de estado (`setProcessing`, `setLoadingMore`, etc.);
- utilitários de controle de request/concurrency;
- funções privadas de suporte não relacionadas a domínio.

## Regras de ouro

1. Não mudar assinatura de métodos públicos já consumidos pela UI.
2. Não mover estado reativo para arquivos externos à classe raiz.
3. Não misturar responsabilidade entre arquivos (ex.: navegação dentro de loading).
4. Não alterar semântica de loading/success/error durante a extração.
5. Não criar dependência circular entre extensões.
6. Store continua sem `BuildContext` e sem abrir dialog/bottom sheet.

## Passo a passo seguro (sem regressão)

1. Criar pasta da store particionada e adicionar `part` no arquivo raiz.
2. Mover primeiro os métodos de menor risco (`navigation` e `helpers`).
3. Mover `search` e `loading`, preservando ordem lógica de chamadas.
4. Mover `crud` por último, validando uso de estado e callbacks de sucesso.
5. Conferir métodos públicos esperados pela UI.
6. Revisar imports e `part of '../<store>.dart';`.

## Checklist de revisão

- [ ] `onInit`/`onClose` permaneceram no arquivo raiz.
- [ ] Todos os `part` foram declarados no arquivo raiz.
- [ ] Cada arquivo usa `part of '../<store>.dart';`.
- [ ] Métodos públicos continuam disponíveis com mesmos nomes/assinaturas.
- [ ] Estados (`Rx`) não foram duplicados nem renomeados sem necessidade.
- [ ] Fluxos de paginação/busca não perderam proteções de concorrência.
- [ ] Fluxos de feedback (`setError`, `setSuccess`, `handleError`) preservados.

## Prompt reutilizável

Use este prompt base em qualquer projeto:

```md
Refatore a store `<NOME_DA_STORE>` aplicando o padrão "store principal + extensões por responsabilidade".

Requisitos:
- Preserve 100% da API pública e comportamento atual.
- Mantenha no arquivo raiz apenas: estado, dependências, getters, onInit/onClose e `part`.
- Separe em arquivos: `crud`, `loading`, `search`/`filters`, `navigation`, `helpers`.
- Não introduza regras novas de negócio.
- Não altere contratos usados pela UI.
- Entregue com lista final de arquivos criados/alterados.
```

## Prompt mínimo (curto)

```md
Particione a `<NOME_DA_STORE>` no padrão da store principal com `part files` por responsabilidade (`crud`, `loading`, `search/filters`, `navigation`, `helpers`), sem alterar comportamento.
```
