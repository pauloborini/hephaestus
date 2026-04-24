# RULES: VO/ENUM

## Escolha de tipo
- Enum: conjunto fechado de valores.
- VO: valor com validação, transformação ou invariante.
- Primitivo: quando não houver regra de domínio.

## Enums
- Valores canônicos e consistentes.
- Parsing explícito e falha para valor inválido.

## Value Objects
- `parse`/`tryParse` quando houver validação relevante.
- Manter comportamento determinístico e imutável.
- Evitar lógica de infraestrutura dentro de VO.

## Serialização
- DTO serializa valor primitivo.
- Mapper converte entre DTO e VO/Enum.
