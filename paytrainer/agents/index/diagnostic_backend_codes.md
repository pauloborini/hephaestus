# INDEX: DIAGNOSTIC BACKEND CODES

## Quando usar
- Levantamento de códigos de erro vindos do backend.
- Análise de mapeamento em `ErrorClassifier` e `FeedbackTranslator`.
- Identificação de códigos sem constante/chave de tradução.

## Regras obrigatórias (ordem)
1. `agents/rules/contract_rules.md`
2. `agents/rules/openapi_rules.md`
3. `agents/rules/patterns_rules.md`

## Referências sob gatilho
- Ler `agents/reference/api_contract_reference.md` para auditoria contra contrato backend.
- Ler `agents/index/diagnostic_i18n.md` se houver hardcoded user-facing na camada de UI.
