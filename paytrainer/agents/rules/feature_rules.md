# RULES: FEATURE

## Ordem de implementação
1. Criar contratos de domínio (Entity/VO/interfaces).
2. Implementar data layer (DTO/Mapper/Datasource/Repository).
3. Implementar service/store.
4. Implementar UI/página.
5. Registrar DI.

## Estrutura mínima
- `features/<feature>/data/`
- `features/<feature>/domain/`
- `features/<feature>/presentation/`
- `features/<feature>/di/`

## Regras essenciais
- Store não acessa datasource diretamente (pode depender de Repository ou Service da própria feature).
- View/Page não acessa Service (nem Repository) diretamente; usar Store.
- Service sem UI e sem navegação.
- Service deve ser sempre uma classe concreta que estende `Service` (de `paytrainer_utils`) e é usada diretamente pela Store/DI (sem interface/`Impl` separada).
- Dependência entre features só pode acontecer via `Service` marcado como público (registrado na DI); Stores, Repositories e DTOs internos nunca devem ser usados cross-feature.
- Para erro persistente de tela, usar `renderErrorMessage` ou `setRenderError` na Store; reservar `errorMessage` para feedback efêmero/overlay.
- Quando o fluxo precisar distinguir erro de render e última falha lógica, usar `lastErrorMessage` e os helpers `clearRenderError`, `clearLastError` e `clearFeedbackMessages`.
- Mapper obrigatório entre DTO e Entity.
- Navegação sempre por `AppNavigator`.

## Verificação rápida
- Imports por pacote.
- Sem hardcode de contrato inconsistente com backend.
