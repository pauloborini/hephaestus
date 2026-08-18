# Estrutura do kit

Afeta: [governanca-kit]

### DEC-002 — Concluídos espelham para o archive

Artefato concluído sai da pasta viva e vai para a pasta correspondente em `archive/` (mover, não
duplicar): `guides/<PACK>/` com Plano F `CONCLUÍDO` ou STALE → `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`
(arquivo solto sob a mesma semana civil), `brainstorming/<tema>/` fechado → `archive/perguntas/<tema>/`,
PRD aposentado → `archive/prds/`. Semana civil: 1–7, 8–14, 15–21, 22–28, 29–31. Data de pack = Plano F
em `plans/F-fechamento.md` (`Status: CONCLUÍDO`); fallback = momento do roteamento. **Proibido**
`archive/guides/<PACK>/` flat (sem `<YYYY-MM>/semana-<N>/`). Path já datado = canônico (não-toque
exceto higiene de duplicata byte a byte). Não espelham: issues (registro único), `references/`/`private/`
(gitignored). `done/` foi removido da lista fechada; conteúdo legado sob `.app-work/done/` e flat
`archive/guides/<PACK>/` migram para o espelho datado na próxima execução. Catálogo mantém destino
`.app-work/archive/guides/`; a cascata expande para `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`.

_Alterado 2026-08-17 — era: `guides/<NOME>_GUIDE/` → `archive/guides/<NOME>_GUIDE/` (flat, sem segmentação temporal). Motivo: formato imposto da spec §4.3 — pack concluído/STALE em `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`; proibido flat; data = Plano F `Status: CONCLUÍDO` senão momento do roteamento._

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

### DEC-005 — Schema fechado de `.app-work/` (roadmap, docs, legados)

Lista fechada do processo: vivo inclui `guides/<NOME>_GUIDE/`, `guides/legados/`, `roadmap/`
(`ROADMAP.md` + slices — única fila de promoção, **versionada**, nunca em `private/`), `docs/`
vivos (omitir se vazio), `brainstorming/`, `prd/`, `issues/`, `references/` (único lugar de clones
OSS, gitignored) e `private/` só `auditorias/`, `ops/`, `research/`, `notes/` (gitignored).
`done/` continua morto: legado migra ao espelho datado. Archive não é “qualquer pasta”: espelho
imposto (`guides/<YYYY-MM>/semana-<N>/`, `perguntas/`, `prds/`, `roadmap/<MARCO>_<YYYY-MM>/`) e
depósito nominado (`docs/`, `backlogs/`, `plans/`, `sprints/`, `features/`, `design-prototipos/`,
`produto/`, `qa/`, `releases/`, `evidence/`, `issues/<YYYY>/`). Overlay de state não inventa pasta.
Higiene no `maintain`/`adopt` reclassifica path fora desta lista.

### DEC-006 — Padrão novo vira pack-candidate, não overlay de pasta

Path ou pasta de processo fora da lista fechada (SCHEMA §4) enfileira pergunta
`includeInPack` (texto fixo em `prompts/interview.md`). Sim: destino neste run +
entrada em `.hephaestus/pack-candidates.json` (efêmero). Não: pasta já listada
no schema; último recurso `.app-work/archive/docs/`. Sem resposta: run `blocked`
/ closeout `needs-followup`. `routing.overlay` **não** evolui o schema e **não**
recebe pasta nova. `promote-to-catalog` permanece só para linha de catálogo de
tipo já previsto (ex. glob em `drift-catalog`). Skill instalada não é editada.

## Histórico

- 2026-08-11 — DEC-001 removida. Era: blocos delimitados por `hephaestus:immutable` preservados
  byte a byte, com marcador malformado bloqueando a execução. Motivo: o marcador existia para
  preservar conteúdo do AppVault num `AGENTS.md` que o Hephaestus não controlava. Com a absorção
  do AppVault, não há mais dois produtos e a âncora vira conteúdo gerado. Blindagem de conteúdo de
  terceiros passa a ser declarada por lista opt-in em `.app-work/hephaestus-state.json`.
