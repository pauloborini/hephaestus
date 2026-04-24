# RULES: ARCHITECTURE

## Estrutura do monorepo
- `apps/paytrainer_pro/` e `apps/paytrainer_student/` consomem funcionalidades via packages.
- Não duplicar lógica entre apps.

## Camadas por feature
- `data/`: DTO, datasource, mapper, repository.
- `domain/`: entity, VO, contratos.
- `presentation/`: store, pages, widgets.
- `di/`: registros de dependência.

## Regras de dependência
- `core/` não depende de `features`.
- `shared/` não depende de `features/*`.
- `features/*` não importa `presentation/`, `data/` ou `domain/` de outra feature.
- Dependência cross-feature só pode acontecer via `Service` explícito (classe concreta que estende `Service`), registrado na DI como service “público”.
- Evitar ciclos entre services (ex.: `AService` → `BService` → `AService`); se aparecer, reavaliar limites de domínio/shared.
## Store (GetX)
- Não recebe `BuildContext`.
- Não abre dialog/bottom sheet.
- Usa `setLoading`, `setSuccess`, `setWarning`, `setInfo`.
- Usa `setError` apenas como feedback efêmero/overlay.
- Usa `setRenderError`, `clearRenderError`, `clearLastError` e `clearFeedbackMessages` quando precisa separar erro persistente de UI do feedback transitório.
- `renderErrorMessage` é o estado persistente para tela de erro/vazio com retry; `lastErrorMessage` guarda a última falha para lógica de fluxo.
- Consome `AppAsyncResult<T>` com `.when(success, failure)`.

## View / Page
- Não chama Service nem Repository diretamente.
- Toda orquestração (obter dados, validar, redirecionar) passa pela Store.
- A View apenas dispara ações na Store e reage ao estado persistente (Obx, etc.).
- Para estados de erro renderizável, a View lê `renderErrorMessage`; não usar `errorMessage` para decidir erro, empty state ou retry.

## Service
- Centraliza estado compartilhado ou fluxo de domínio que precisa ser reutilizado (dentro da mesma feature ou entre features).
- Não navega e não mostra UI.
- Sempre retorna `AppAsyncResult<T>`.
- Deve sempre estender `Service` (de `paytrainer_utils`), nunca `GetxService` diretamente.
- Não criar interface dedicada para Service (evitar pares `XService` + `XServiceImpl`); a dependência e o registro de DI devem apontar para a classe concreta que estende `Service`.
- Nem toda feature precisa de Service; se não houver necessidade de estado compartilhado/reuso, a Store pode depender diretamente do Repository da própria feature (nunca do datasource).


## Repository
- Orquestra local/remote/cache.
- Não conhece UI.

## DTO / Entity / Mapper
- DTO serializa/deserializa JSON.
- Mapper converte DTO ↔ Entity.
- Entity não depende de Flutter.

## DI
- Ordem de registro: datasource → repository → service → store.
- Preferir `Get.lazyPut(..., fenix: true)`.

## Navegação
- Sempre usar `AppNavigator`.
- Proibido `Get.toNamed()` e `Navigator.pushNamed()`.

## Imports
- Sempre `package:...`.
- Proibido import relativo (`../../`).
