# REFERENCE: COLOR

## Tokens principais

- Brand: `dynamicBrand`, `brandPrimary`, `brandSecondary`
- Support: `supportBlue`, `supportCyan`
- Feedback: `successColor`, `dangerColor`, `warningColor`, `infoColor`
- Superfície: `backgroundColor`, `surfaceColor`, `surfaceVariant`
- Texto: `textPrimary`, `textSecondary`, `textDisabled`

## Regras de contraste

- Texto principal deve manter contraste AA sobre fundo/superfície.
- Não usar `brandPrimary` como texto em fundo escuro sem validação de contraste.
- Para desabilitado, usar token próprio em vez de opacidade arbitrária.

## Casos comuns

- Card padrão: superfície + texto principal/secundário.
- Ação destrutiva: `dangerColor`.
- Sucesso financeiro: `successColor`.
- Informação neutra: `infoColor`.
