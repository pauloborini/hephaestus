# Estrutura do kit

Afeta: [governanca-kit]

## Histórico

- 2026-08-11 — DEC-001 removida. Era: blocos delimitados por `hephaestus:immutable` preservados
  byte a byte, com marcador malformado bloqueando a execução. Motivo: o marcador existia para
  preservar conteúdo do AppVault num `AGENTS.md` que o Hephaestus não controlava. Com a absorção
  do AppVault, não há mais dois produtos e a âncora vira conteúdo gerado. Blindagem de conteúdo de
  terceiros passa a ser declarada por lista opt-in em `.app-work/hephaestus-state.json`.
