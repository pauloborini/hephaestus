---
updated: <AAAA-MM-DD>
scope: <frase curta do que o processo do projeto cobre>
---

# <Projeto> — índice do processo (.app-work)

<!--
  Mapa, não conteúdo — mesmo padrão do INDEX.md do vault (SCHEMA §3). Teto ~100 linhas:
  ultrapassou, o índice virou conteúdo: refatorar.

  O corpo tem exatamente duas seções: Pastas canônicas e Regras de ouro.
  Não acrescentar seção nova.

  NUNCA entra aqui:
    - valor vigente de decisão (o valor mora em _app-vault/docs/decisions/)
    - conteúdo de guide, brainstorm, PRD ou issue
    - listagem de planos, tasks ou sprints

  Este arquivo é a âncora do AGENTS.md: é o mapa de organização do processo, não fonte de regra.
  O próprio .app-work/ inteiro é proibido como insumo de regra (SCHEMA §2.1 e §8).

  Remover estes comentários ao instanciar.
-->

## Pastas canônicas

| Pasta | Papel |
|---|---|
| `hephaestus-state.json` | estado versionado do kit (raiz) |
| `guides/` | packs de execução em andamento (`<NOME>_GUIDE/` com INTENT, GUIDE, LEDGER e `plans/`) |
| `guides/legados/` | monolíticos ainda citados sem pack próprio |
| `roadmap/` | fila viva versionada (`ROADMAP.md` + slices/) — nunca em `private/` |
| `brainstorming/` | caderno de processo — ao fechar, roteia e não permanece como referência viva |
| `prd/` | propostas datadas — nem sempre cumpridas na totalidade; não são contrato |
| `docs/` | docs de operação/produto vivos; omitir se vazio |
| `references/` | refs open source de terceiros — SEMPRE gitignored; único lugar de clones |
| `private/` | área privada (`auditorias/`, `ops/`, `research/`, `notes/`) — SEMPRE gitignored |
| `issues/` | registro único de defeitos (`ISSUE-NNN`, ciclo OPEN → FIXED → VERIFIED → CLOSED) |
| `archive/` | espelho datado (`guides/<YYYY-MM>/semana-<N>/`, `perguntas/`, `prds/`, `roadmap/<MARCO>_<YYYY-MM>/`) + depósito nominado — apagável |

## Regras de ouro

- `.app-work/` é processo: **nunca** insumo de regra — verdade vigente só em `_app-vault/docs/decisions/` (cláusulas `### DEC-NNN`).
- Uma cópia canônica por arquivo: cópia idêntica em outro lugar é lixo; antes de remover, provar duplicata byte a byte (`cmp`).
- **Espelho do archive (concluído, mover não duplicar):** `guides/<PACK>/` → `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`; `brainstorming/<tema>/` fechado → `archive/perguntas/<tema>/`; PRD aposentado → `archive/prds/`; roadmap de marco → `archive/roadmap/<MARCO>_<YYYY-MM>/`. Issues não espelham (registro único).
- Guia convertido a pack descarta o monolítico.
- Cada pasta com muito conteúdo tem seu próprio `README.md` (ex.: `issues/README.md`, `archive/README.md`) — o índice não duplica conteúdo de pasta.
- `.app-work/` inteiro é oculto à busca (`rg --files` não o varre); o que não for promovido a decisão está efetivamente perdido — registrar `Candidatos a decisão` no `LEDGER.md` dos packs (SCHEMA §6).
