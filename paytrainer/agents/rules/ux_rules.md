# RULES: UX

## Papel por camada
- Store sinaliza estado persistente e resultado.
- View renderiza loading, empty state, error state e conteúdo com base no estado persistente da Store.
- Feedback efêmero de overlay continua vindo da Store/AppStore, mas não deve ser usado como fonte de verdade para decidir renderização.

## Estados obrigatórios
- Loading.
- Empty state.
- Error state com ação de retry.
- Success com feedback curto.

## Feedback
- Snackbar/toast/overlay disparado pelo canal de feedback da Store/AppStore.
- Ações destrutivas com confirmação.

## Fluxo de resultado
- Em sucesso, retornar resultado pela rota quando necessário.
- Evitar pop duplo em cascata sem controle de estado.
