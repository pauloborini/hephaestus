# RULES: DOMAIN

## DTO
- Responsável por `fromJson`, `toJson`, `toCreateJson`, `toUpdateJson`.
- Sem regra de negócio na DTO.
- Em escrita, excluir campos read-only e timestamps imutáveis.

## Mapper
- Apenas conversão DTO ↔ Entity.
- Não serializa JSON.

## Entity
- Dart puro, imutável.
- `copyWith` não pode alterar campos imutáveis (`*Id`, `createdAt`).

## Value Objects
- Usar quando houver validação/invariante de domínio.
- Compartilhado em `paytrainer_shared`; específico no app.

## Enums
- Usar para conjunto fechado de valores.
- Parsing explícito e falha em valor inválido.

## Fluxo de dados
- Leitura: JSON → DTO → Mapper → Entity.
- Escrita: Entity → Mapper → DTO → `toCreateJson`/`toUpdateJson`.

## Naming obrigatório
- IDs semânticos sempre.
- Campos de backend preservados literalmente.
- Monetário em `*Cents`.
