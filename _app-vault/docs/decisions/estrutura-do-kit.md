# Estrutura do kit

Afeta: [governanca-kit]

### DEC-002 — Guides em done/ segmentados por mês e semana ISO

Guide executado vive em `.app-work/done/YYYY-MM/semana-WW_MM-DD_a_MM-DD/<NOME>_GUIDE/` (pack) ou
arquivo solto sob a pasta da semana. Semana ISO (segunda–domingo); pasta do mês = mês da segunda;
data = momento em que o guide entra em `done/` (ou é reorganizado). Path já segmentado é canônico
(não-toque); flat sob `done/` migra. A raiz da lista fechada continua `done/` — só muda o nesting.
Catálogo mantém destino `.app-work/done/`; a cascata expande para o path da semana.

### DEC-003 — Versão do kit distribuível é inteiro monotônico

Versão pública do kit = inteiro positivo monotônico (`1`, `2`, `3`…). Fonte canônica:
`manifests/kit-manifest.json:version`. Tag Git anotada `vN`. Artefato `hephaestus-N.zip`.
Pasta interna do zip continua fixa `hephaestus/` (sem `N` no nome). Próxima release = `N+1`
sempre — sem semver, sem patch/minor.

## Histórico

- 2026-08-11 — DEC-001 removida. Era: blocos delimitados por `hephaestus:immutable` preservados
  byte a byte, com marcador malformado bloqueando a execução. Motivo: o marcador existia para
  preservar conteúdo do AppVault num `AGENTS.md` que o Hephaestus não controlava. Com a absorção
  do AppVault, não há mais dois produtos e a âncora vira conteúdo gerado. Blindagem de conteúdo de
  terceiros passa a ser declarada por lista opt-in em `.app-work/hephaestus-state.json`.
