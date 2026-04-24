# REFERENCE: API CONTRACT FLOW

## Fluxo feature-first

1. App modela payload ideal para a feature.
2. Auditoria identifica gaps com backend/OpenAPI.
3. Documento de spec backend formaliza proposta.
4. Contrato acordado vira referência estável.

## Estrutura recomendada de spec

- Endpoint (método + path)
- Headers
- Path/query/body
- Regras de validação
- Response de sucesso
- Response de erro
- Enums usados (valores reais do código)

## Checklist rápido

- IDs semânticos
- Enums canônicos
- Monetário em centavos
- Datas ISO8601 UTC
- Paginação `{data, pagination}`
- Erros com `{code, message, details}`
