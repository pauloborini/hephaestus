# RULES: PATTERNS

## IDs e naming
- Nunca usar `id` genérico.
- Sempre usar IDs semânticos: `userId`, `planId`, `trainerId`, `studentId`.
- Evitar `type` e `status` genéricos; qualificar por domínio.

## Campos e contrato
- Nome de campo em DTO/Entity deve ser idêntico ao backend JSON.
- Enums em UPPERCASE e grafia única.

## Monetário
- Sempre `int` em centavos com sufixo `*Cents`.
- Não coexistir `price` e `priceCents` para o mesmo conceito.

## Datas
- ISO 8601 em UTC para persistência e retorno.
- Mesmo campo não alterna entre `date` e `dateTime`.

## Paginação
- Envelope padrão: `{ data, pagination }`.

## Erros
- Payload padrão: `{ code, message, details }`.

## Campos de pessoa
- `fullName`, `phoneNumber`.

## Booleans
- `true/false` com prefixos semânticos: `is`, `has`, `can`.

## Cliente/app
- Usar `appType` com valores `TRAINER` e `STUDENT`.

## Evolução de código
- Evitar `typedef` para compatibilidade temporária entre modelos/entidades.
- Preferir solução definitiva no código (contrato e nomenclatura finais), sem workaround.
