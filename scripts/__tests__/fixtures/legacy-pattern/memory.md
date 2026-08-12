# Fixture com padrões legados

Este arquivo existe para provar que `scripts/__tests__/` é isento do gate de
padrões legados do `scripts/validate-skill-kit.mjs` (mesma isenção que o
próprio validador tem). Ele contém, de propósito, as strings que o gate caça:

- `memory/` (referência ao sistema de memória do cliente)
- `project-context`
- `extended-memory`

O conteúdo é deliberadamente não-neutro: o teste AC-1.4.2 exige que o kit
inteiro passe no validador mesmo com este arquivo presente dentro de
`scripts/__tests__/fixtures/`.
