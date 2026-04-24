# INDEX: DIAGNOSTIC

## Regras obrigatórias (ordem)
1. `agents/rules/architecture_rules.md`
2. `agents/rules/patterns_rules.md`

## Subíndices por cenário (escolher 1 quando aplicável)
- `agents/index/diagnostic_i18n.md` para strings hardcoded, chaves de tradução e feedback translator.
- `agents/index/diagnostic_backend_codes.md` para códigos de erro backend, mapeamentos e classificação.

## Referências sob gatilho
- Ler `agents/reference/domain_examples.md` se a investigação atingir DTO/Entity/Mapper.

## Regra de execução para casos mistos
- Manter `diagnostic` como tipo primário.
- Carregar primeiro um subíndice de diagnóstico.
- Ler `agents/index/contract.md` apenas se houver mudança efetiva em DTO/Entity/Mapper/contrato.
