# RULES: COLOR

## Princípio
- Usar somente tokens semânticos via `context.colors.*`.

## Proibições
- `Colors.*`.
- `Color(0x...)`.
- Definições ad-hoc de contraste sem token.

## Hierarquia
- Fundo em `backgroundColor`.
- Superfície em `surfaceColor` ou variantes semânticas.
- Texto em `textPrimary`, `textSecondary`, `textDisabled`.

## Feedback
- Sucesso: `successColor`.
- Erro: `dangerColor`.
- Aviso: `warningColor`.
- Info: `infoColor`.
