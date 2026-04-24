# RULES: SHARED PACKAGE

## Quando usar `paytrainer_shared`
- VOs de domínio usados em ambos os apps.
- Enums de domínio usados em ambos os apps.

## Quando não usar
- Enums técnicos/infra: usar `paytrainer_utils`.
- Itens específicos de um app: manter no próprio app.
- UI/design: `paytrainer_design`.
- Rede/http: `paytrainer_infrastructure`.

## Critério de entrada
- Se não for consumido pelos dois apps, não vai para `paytrainer_shared`.
