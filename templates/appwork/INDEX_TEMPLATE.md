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
| `guides/` | packs de execução em andamento (`<NOME>_GUIDE/` com INTENT, GUIDE, LEDGER e `plans/`) |
| `brainstorming/` | caderno de processo — ao fechar, roteia e não permanece como referência viva |
| `prd/` | propostas datadas — nem sempre cumpridas na totalidade; não são contrato |
| `references/` | refs open source de terceiros — SEMPRE gitignored |
| `private/` | área privada (sessões, roadmap, research, ops, auditorias) — SEMPRE gitignored |
| `issues/` | registro único de defeitos (`ISSUE-NNN`, ciclo OPEN → FIXED → VERIFIED → CLOSED) |
| `archive/` | espelho de concluídos (`guides/`, `perguntas/`, `prds/`) + depósito livre do usuário — apagável |

## Regras de ouro

- `.app-work/` é processo: **nunca** insumo de regra — verdade vigente só em `_app-vault/docs/decisions/` (cláusulas `### DEC-NNN`).
- Uma cópia canônica por arquivo: cópia idêntica em outro lugar é lixo; antes de remover, provar duplicata byte a byte (`cmp`).
- **Espelho do archive (concluído, mover não duplicar):** `guides/<PACK>/` → `archive/guides/<PACK>/`; `brainstorming/<tema>/` fechado → `archive/perguntas/<tema>/`; PRD aposentado → `archive/prds/`. Issues não espelham (registro único).
- Guia convertido a pack descarta o monolítico.
- Cada pasta com muito conteúdo tem seu próprio `README.md` (ex.: `issues/README.md`, `archive/README.md`) — o índice não duplica conteúdo de pasta.
- `.app-work/` inteiro é oculto à busca (`rg --files` não o varre); o que não for promovido a decisão está efetivamente perdido — registrar `Candidatos a decisão` no `LEDGER.md` dos packs (SCHEMA §6).
