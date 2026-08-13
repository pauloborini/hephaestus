# Estrutura do kit

Afeta: [governanca-kit]

### DEC-002 — Concluídos espelham para o archive

Artefato concluído sai da pasta viva e vai para a pasta correspondente em `archive/` (mover, não
duplicar): `guides/<NOME>_GUIDE/` → `archive/guides/<NOME>_GUIDE/` (pack preservado; arquivo solto
sob `archive/guides/`), `brainstorming/<tema>/` fechado → `archive/perguntas/<tema>/`, PRD
aposentado → `archive/prds/`. Não espelham: issues (registro único), `references/`/`private/`
(gitignored). `done/` foi removido da lista fechada; conteúdo legado sob `.app-work/done/` migra
para `archive/guides/` na próxima execução. Catálogo mantém destino `.app-work/archive/guides/`;
a cascata expande para o path do pack.

_Alterado 2026-08-13 — era: guide executado em `.app-work/done/YYYY-MM/semana-WW_MM-DD_a_MM-DD/<NOME>_GUIDE/` (pack) ou arquivo solto sob a semana, segmentado por semana ISO (segunda–domingo, mês = mês da segunda, data = momento em que entra em `done/`); path segmentado canônico (não-toque), flat migra. Motivo: unificar com o espelho do archive adotado no DailyPace (padrão da skill organizar-app-work); elimina a dupla regra de arquivamento entre kit e skill._

### DEC-003 — Versão do kit distribuível é inteiro monotônico

Versão pública do kit = inteiro positivo monotônico (`1`, `2`, `3`…). Fonte canônica:
`manifests/kit-manifest.json:version`. Tag Git anotada `vN`. Artefato `hephaestus-N.zip`.
Pasta interna do zip continua fixa `hephaestus/` (sem `N` no nome). Próxima release = `N+1`
sempre — sem semver, sem patch/minor.

### DEC-004 — Adopt materializa decisões canônicas na mesma execução

Modo `adopt` só fecha completo quando regras de produto encontradas (inclusive sob alias
`.app-vault/` / `_app-vault/` fora de `docs/decisions/`, `DECISOES_*`, headings `### D\d+`,
seções “Decisões fechadas”) viram `### DEC-NNN` em `docs/decisions/` na mesma execução.
Não-toque não se aplica a path sob o root do vault fora da lista fechada de SCHEMA §2.
Alias de root não isenta promoção. Scaffold vazio de `docs/decisions/` com material de decisão
ainda vivo = adoção incompleta (`needs-followup`).

## Histórico

- 2026-08-11 — DEC-001 removida. Era: blocos delimitados por `hephaestus:immutable` preservados
  byte a byte, com marcador malformado bloqueando a execução. Motivo: o marcador existia para
  preservar conteúdo do AppVault num `AGENTS.md` que o Hephaestus não controlava. Com a absorção
  do AppVault, não há mais dois produtos e a âncora vira conteúdo gerado. Blindagem de conteúdo de
  terceiros passa a ser declarada por lista opt-in em `.app-work/hephaestus-state.json`.
