---
updated: 2026-08-29
scope: Organização do processo local do kit Hephaestus
---

# Hephaestus — índice do processo (.app-work)

## Pastas canônicas

| Pasta | Papel |
|---|---|
| `guides/` | packs de execução em andamento (`<NOME>_GUIDE/` com INTENT, GUIDE, LEDGER e `plans/`) |
| `brainstorming/` | caderno de processo — ao fechar, roteia e não permanece como referência viva |
| `references/` | refs open source de terceiros — SEMPRE gitignored; único lugar de clones |
| `issues/` | registro único de defeitos (`ISSUE-NNN`, ciclo OPEN → FIXED → VERIFIED → CLOSED) |

## Regras de ouro

- `.app-work/` é processo: **nunca** insumo de regra — verdade vigente só em `_app-vault/docs/decisions/` (cláusulas `### DEC-NNN`).
- Uma cópia canônica por arquivo: cópia idêntica em outro lugar é lixo; antes de remover, provar duplicata byte a byte (`cmp`).
- **Espelho do archive (concluído, mover não duplicar):** `guides/<PACK>/` → `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`; `brainstorming/<tema>/` fechado → `archive/perguntas/<tema>/`; PRD aposentado → `archive/prds/`; roadmap de marco → `archive/roadmap/<MARCO>_<YYYY-MM>/`. Issues não espelham (registro único).
- Guia convertido a pack descarta o monolítico.
- Cada pasta com muito conteúdo tem seu próprio `README.md` (ex.: `issues/README.md`, `archive/README.md`) — o índice não duplica conteúdo de pasta.
- `.app-work/` inteiro é oculto à busca (`rg --files` não o varre); o que não for promovido a decisão está efetivamente perdido — registrar `Candidatos a decisão` no `LEDGER.md` dos packs (SCHEMA §6).
