# Skill: Architecture

> **PADRÃO**: Clean Architecture + GetX (monorepo)

## Quando Usar

Use esta skill sempre que você precisar:

- **Criar uma feature nova** (estrutura e responsabilidades por camada)
- **Adicionar um fluxo de dados** (Firestore → UI)
- **Criar/alterar Store/Service/Repository/Datasource**
- **Dúvida de “onde colocar esse código?”**

## Decisão Rápida (Onde esse código deve viver?)

- **[UI]** Layout, widgets, dialogs/bottom sheets, form validation visual
- **[Store]** Estado reativo e orquestração do caso de uso da tela (loading/success/error, navegação, chamar services/repositories)
- **[CacheService]** Snapshot/index em memória, sem IO remoto, cache cross-feature ou de reentrada
- **[CacheCoordinator]** Orquestrador de orçamento de memória (Budget 48MB) e poda automática baseado em Score de uso (Recência/Frequência)
- **[Service]** Orquestração operacional transitória, integração reutilizável, sinal leve ou regra compartilhada sob demanda
- **[Repository]** Boundary de dados: conversão DTO↔Entity, `guard()` e fallback de erro
- **[Datasource]** Firestore/HTTP/SDK calls “cruas” (pode lançar exceção)
- **[Entity]** Regras de negócio e helpers de domínio (Dart puro)

## Estrutura de Camadas

```
lib/
├── core/           # Infraestrutura e fundações (theme, navegação, widgets padrão, Cache Abstractions)
├── shared/         # Lógica compartilhada (entities globais, services, Cache Coordinators)
└── features/
    └── <feature>/
        ├── data/           # DTOs, datasources, adapters, repositories
        ├── domain/         # Entities, value objects, interfaces
        ├── presentation/   # Stores, pages, components
        └── di/             # Injeção de dependências
```

## Regras de Dependência

- `core/` → Só pacotes externos
- `shared/` → Pode depender de `core/`, NÃO de `features/*`
- `features/*` → Pode depender de `core/` e `shared/`

## Contrato entre DTOs de features (anti‑acoplamento)

Quando uma feature precisa de dados de outra feature (ex.: atendimento precisa de snapshot de cliente):

- **Proibido importar DTO/Entity de outra feature.**
- **DTO consumidor é um snapshot** com subset de campos do DTO de origem.
- **Campos comuns devem manter os mesmos nomes** entre DTOs.
- **Contrato mínimo via interface/mixin em `shared/domain/contracts/`.**

Detalhamento e checklist completos em [agents/DOMAIN.md](agents/DOMAIN.md).

## Store (AppStore)

### ✅ PODE

- Usar `setLoading`, `setError`, `setSuccess`
- Acessar Repository diretamente (dados exclusivos da feature)
- Acessar Service (dados compartilhados/cache)
- Navegar via `AppNavigator`
- Processar `AppAsyncResult` via `.when()`

### ❌ NÃO PODE

- Receber `BuildContext`
- Abrir dialogs/bottom sheets
- Acessar datasources diretamente

```dart
class LoginStore extends AppStore {
  Future<void> signIn() async {
    setLoading(true);
    final result = await _authService.signIn();
    result.when(
      (error) => handleError(error),
      (success) {
        setSuccess(AppFeedbackKeys.loginSuccess);
        AppNavigator.pushNamedAndRemoveUntil(AppRoutes.home);
      },
    );
    setLoading(false);
  }
}
```

### Padrão Recomendado (store orientada a “caso de uso da tela”)

- **[input]** Validar dados de entrada (validação simples) pode estar no Store
- **[execução]** Chamar service/repository
- **[cache]** Usar `CacheService` oficial quando houver cache de domínio documentado
- **[resultado]** Consumir `AppAsyncResult` via `.when()`
- **[efeito]** Atualizar estado + navegar via `AppNavigator`

## CacheService (Quando Usar)

### ✅ CRIAR CacheService quando

- O domínio precisa reaproveitar snapshot entre reentradas
- Existe ganho real de UX/custo ao evitar novo `load` remoto
- O cache precisa ser compartilhado entre features
- O cache pode ser isolado por `userId + contextId`

### Regras do CacheService

- É **cache-only**
- Não depende de `Repository`
- Não depende de `Datasource`
- Não faz leitura nem escrita remota
- Mantém snapshot, índice e metadados de escopo
- Pode sobreviver à troca de aba quando documentado como cache oficial do domínio

### Padrão oficial

- `Store` faz `cache-first`
- Em `cache hit`, hidrata UI a partir do `CacheService`
- Em `cache miss`, a própria `Store` chama `Repository`
- Após resposta remota, a `Store` popula o `CacheService`
- Após mutação, a `Store` aplica patch local na UI e no cache

## Service (Quando Usar)

### ✅ CRIAR Service quando

- Existe orquestração reutilizável entre features
- Há integração entre domínios ou SDKs externos
- Precisa manter um sinal leve ou coordenação operacional
- A lógica não cabe apenas em Store ou Repository

### ❌ NÃO CRIAR Service quando

- Seria apenas ponte Store→Repository
- O único objetivo seria manter cache vivo
- Dados são exclusivos de uma feature e sem reuso real
- Pode ser resolvido com `CacheService` + `Repository`

### Regras do Service

- Sempre retorna `AppAsyncResult<T>` (nunca void)
- Não navega
- Não mostra snackbars/dialogs
- Não deve depender de permanecer vivo só para sustentar cache
- Quando transitório, pode ser descartado junto com a feature
- Quando persistente, precisa de exceção explícita documentada

### Exemplo mental atual

- `ClientCacheService`, `ServiceCacheService`, `AppointmentCacheService` e `RecurringExpenseCacheService`
  são caches runtime oficiais
- `AppointmentService` existe como sinal leve para integração com calendário
- `FinanceService` é exceção híbrida documentada de query + cache

### Exemplo legado que não é mais o padrão para novos domínios

```dart
class ServiceService {
  final ServiceRepository _repository;

  final Rxn<List<ServiceEntity>> _cached = Rxn<List<ServiceEntity>>();
  List<ServiceEntity>? get cached => _cached.value;

  ServiceService(this._repository);

  AppAsyncResult<List<ServiceEntity>> getServices({
    required String userId,
    bool forceRefresh = false,
  }) {
    if (!forceRefresh && _cached.value != null) {
      return Future.value(Success(_cached.value!));
    }

    return _repository.getServices(userId: userId).map((items) {
      _cached.value = items;
      return items;
    });
  }
}
```

## Repository (GuardedRepository)

```dart
class ServiceRepositoryImpl extends GuardedRepository implements ServiceRepository {
  @override
  AppAsyncResult<List<ServiceEntity>> getServices({required String userId}) {
    return guard(
      action: () async {
        final dtos = await _dataSource.getServices(userId: userId);
        return dtos.map(ServiceAdapter.toEntity).toList();
      },
      fallbackMessageKey: AppFeedbackKeys.errorFetchServices,
    );
  }
}
```

## Datasource (Regra de Ouro)

- Datasource **não decide UX** e **não traduz erro**
- Datasource pode:
  - Ler/escrever no Firestore
  - Retornar DTOs
  - Lançar exceções do SDK

Exemplo:

```dart
class ServiceDatasourceImpl implements ServiceDatasource {
  final CollectionReference _collection;

  ServiceDatasourceImpl(this._collection);

  @override
  Future<List<ServiceDto>> getServices({required String userId}) async {
    final snapshot = await _collection
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .get();

    final dataList = FirestoreHelpers.queryToList(snapshot);
    return dataList.map(ServiceDto.fromJson).toList();
  }
}
```

## Anti-patterns (PROIBIDOS)

- Store recebendo `BuildContext`
- Store abrindo dialog/bottom sheet
- Service navegando
- UI acessando repository/datasource
- Imports relativos (`../../`)
- DTO com regras de negócio
- Entity com dependências Flutter
- Adapter com `fromJson/toJson` (deve ficar no DTO)
- `Service` persistente carregando backend só para segurar cache
- misturar `CacheService` com `Service` operacional no mesmo ownership sem justificativa

## Armadilhas Comuns (E como decidir)

- **“Onde coloco a validação?”**
  - **[UI]** Validação visual (required, máscara, estado do form)
  - **[Entity/Domain]** Validação de regra de negócio (ex: `price >= 0`)
  - **[Store]** Validação de fluxo/tela (ex: “se não selecionou cliente, bloquear submit”)
- **“Coloco no Service ou no Repository?”**
  - Se for **apenas persistência + conversão**, fica no Repository
  - Se for **reutilizado** por múltiplas telas/features, ou precisa de **cache/estado**, Service
- **“É cache ou orquestração?”**
  - Se for **snapshot/index em memória sem IO**, é `CacheService`
  - Se for **coordenação operacional, integração ou sinal leve**, é `Service`
- **“A feature precisa de transação entre coleções?”**
  - Se a operação grava múltiplos documentos de forma atômica, prefira `TransactionRepository` dedicado
  - A Store continua dona do caso de uso da tela; a atomicidade fica na camada de dados

## Fluxo de Dados

```
Firestore → Datasource → Repository → Service (opt) → Store → View
           (throws)     (guard)      (result)       (when)   (UI)

Cache-only:

Store → CacheService
  ↓ miss
Repository → Datasource → Firestore
  ↓ success
Store atualiza UI + CacheService
```

## Lifecycle e Sincronização de Stores

Com a estratégia atual de memória do projeto, a regra padrão é:

- **store de tela descartável**: patch local após mutação + novo `load` ao reentrar;
- **cadeia remota transitória**: `Store`, `Repository`, `Datasource` e `Service` operacional devem poder morrer ao sair da feature;
- **cache cross-feature sob demanda**: só `CacheService` oficial sobrevive quando houver ganho real documentado;
- **sem reatividade global por padrão** entre features invisíveis;
- **`notifyDataChanged` / `updateSignal`** não devem acordar stores descartáveis para fazer leitura remota;
- **exceções precisam ser explícitas**, como a `CalendarStore`.

### Distinção obrigatória

- `CacheCoordinator`: orquestrador de memória global (Budget 48MB), recência ($e^{-h/4}$) e hits.
- `CacheService`: memória runtime, escopo por `userId + contextId`, sem IO remoto.
- `Service`: orquestração operacional, integração ou regra compartilhada transitória.
- `TransactionRepository`: boundary atômico para mutações multi-coleção.

### Gerenciamento Automático de Memória (Budget 48MB)

O Carolize implementa um sistema de coordenação automática de memória para os caches inativos. Quando o app troca de contexto (ex: de PJ para PF) ou quando o orçamento de **48 MB** é atingido, o `ContextCacheCoordinator` executa a poda (*pruning*) dos snapshots baseando-se em um **Score** de relevância.

Os critérios de sobrevivência incluem:
- **Recência** (usado nos últimos minutos);
- **Frequência** (quantidade de cache-hits);
- **Hidratação** (restaurar UI de forma instantânea);
- **Snapshot Canônico** (proteger visões essenciais como o mês atual ou listas principais).

Para detalhes sobre a política de retenção e como implementar novos caches, consulte:
- [agents/CACHE.md](CACHE.md)

### Exceção híbrida explícita

- `FinanceService` permanece como exceção justificada de query + cache para `Dashboard` e `Reports`.
- Mesmo nessa exceção, ele **não** deve atuar como barramento reativo global.

Documento interno de referência:

- [docs/ARCHITECTURE_STORE_LIFECYCLE_AND_SYNC.md](../docs/ARCHITECTURE_STORE_LIFECYCLE_AND_SYNC.md)

## Checklist Final (antes de enviar)

- [ ] A UI não acessa repository/datasource diretamente
- [ ] Store não recebe `BuildContext`
- [ ] Service não navega e não mostra UI
- [ ] Repository estende `GuardedRepository` e usa `guard()`
- [ ] Conversão DTO↔Entity fica no Adapter
- [ ] Entity é Dart puro (sem Flutter)

## Documentação do Projeto

# Arquitetura do Sistema

## Visão Geral

O Carolize implementa uma **Clean Architecture** adaptada para Flutter, com organização **Feature-First** e três pacotes locais que fornecem abstrações reutilizáveis.

## Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                             │
│  Pages • Components • Stores (AppStore extends GetxController)      │
├─────────────────────────────────────────────────────────────────────┤
│                         DOMAIN                                       │
│  Entities (Equatable) • Enums                                       │
├─────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                  │
│  Repositories (GuardedRepository) • Datasources • DTOs • Adapters   │
├─────────────────────────────────────────────────────────────────────┤
│                  LOCAL PACKAGES (Abstrações Base)                    │
│  app_utils • app_infrastructure • app_design                        │
├─────────────────────────────────────────────────────────────────────┤
│                       EXTERNAL SERVICES                              │
│  Firebase (Firestore, Auth) • Stripe • Google Calendar API          │
└─────────────────────────────────────────────────────────────────────┘
```

## Estrutura de Features

Cada feature segue a estrutura padronizada com **5 diretórios** + barrel file:

```
lib/features/{feature_name}/
├── {feature_name}.dart        # Barrel file (exports públicos)
├── data/
│   ├── adapters/              # Conversão DTO ↔ Entity
│   │   └── {name}_adapter.dart
│   ├── datasources/           # Acesso direto ao Firestore
│   │   └── {name}_datasource.dart
│   ├── dtos/                  # Data Transfer Objects
│   │   └── {name}_dto.dart
│   └── repositories/          # Interface + Implementação
│       └── {name}_repository.dart
├── di/                        # Injeção de Dependências
│   └── {feature}_di.dart      # Implementa DIContainer
├── domain/
│   ├── entities/              # Objetos imutáveis (Equatable)
│   │   └── {name}_entity.dart
│   └── enums/                 # Enums específicos da feature
└── presentation/
    ├── components/            # Widgets específicos da feature
    │   └── {name}/
    ├── pages/                 # Telas principais
    │   └── {name}_page.dart
    └── stores/                # Controllers GetX (AppStore)
        └── {name}_store.dart
```

## Pacotes Locais

### app_utils

Abstrações base e utilitários compartilhados:

```dart
// Abstrações principais
Store             // Base para controllers (GetxController + mensagens reativas)
DIContainer       // Interface para módulos de DI
Service           // Interface base para services

// Result Pattern
Result<T>         // Success<T> | Failure<AppException>
AppAsyncResult<T> // Future<Result<T>>

// Exceptions
AppException      // Exceção padrão com key, code, statusCode

// Utilitários
FormValidators    // Validadores de formulário
FormFormatters    // Formatadores (CPF, telefone, moeda, etc.)
```

### app_infrastructure

Infraestrutura de dados e segurança:

```dart
// Repositórios
GuardedRepository   // Wrapper com tratamento de erros centralizado
                    // guard() e guardVoid() - captura AppException e erros inesperados

// Firebase
FirestoreHelpers    // Helpers para queries Firestore
FirebaseExceptionMapper  // Converte FirebaseException → AppException

// Storage
LocalDatasource     // Interface para storage local
AuthLocalStorage    // Tokens e dados de autenticação

// Logging
LogHelper           // Logging categorizado (info, success, error, warning)
```

### app_design

Design system com tokens, temas e componentes:

```dart
// Tokens
AppColors          // Paleta de cores
AppTypography      // Estilos de texto
AppSpacing         // Espaçamentos padronizados

// Componentes Base
BaseCard           // Card com hover overlay
StandardButton     // Botão primário/secundário
StandardBadge      // Badge para status
// ... outros widgets
```

## Padrões de Implementação

### Store (Controller)

Stores estendem `AppStore` que extende `Store` do `app_utils`:

```dart
class AppointmentStore extends AppStore {
  AppointmentStore(this._repository, this._auth);

  final AppointmentRepository _repository;
  final AuthService _auth;

  // Estado reativo com Rx observables
  final appointments = <AppointmentEntity>[].obs;
  final isLoadingMore = false.obs;
  final viewMode = FeatureViewMode.list.obs;

  @override
  void onInit() {
    super.onInit();
    fetchAppointments();
  }

  Future<void> fetchAppointments() async {
    setLoading(true);
    final result = await _repository.getAppointments(userId: _auth.loggedUser!.id);
    
    // Result pattern: when(onError, onSuccess)
    result.when(handleError, appointments.assignAll);
    
    setLoading(false);
  }
}
```

**Características da Store:**
- Extende `AppStore` (que integra com `OverlayService` para mensagens)
- Usa `handleError()` para tratamento padronizado de `AppException`
- Métodos `setLoading()`, `setError()`, `setSuccess()`, `setWarning()`, `setInfo()`
- Estado reativo com `.obs` e `Rx<T>`

### Repository

Repositories extendem `GuardedRepository` para tratamento centralizado de erros:

```dart
abstract class AppointmentRepository {
  AppAsyncResult<List<AppointmentEntity>> getAppointments({...});
  AppAsyncResult<AppointmentEntity> getAppointmentById({...});
  AppAsyncResult<String> addAppointment(AppointmentEntity appointment);
  AppAsyncResult<void> updateAppointment(AppointmentEntity appointment);
  AppAsyncResult<void> deleteAppointment({...});
}

class AppointmentRepositoryImpl extends GuardedRepository 
    implements AppointmentRepository {
  
  AppointmentRepositoryImpl(this._dataSource, this._clientDataSource);

  final AppointmentDataSource _dataSource;
  final AppointClientDataSource _clientDataSource;

  @override
  AppAsyncResult<List<AppointmentEntity>> getAppointments({...}) async {
    return guard(
      action: () async {
        final dtos = await _dataSource.getAppointments(...);
        // Composição: busca dados adicionais e usa Adapter
        return dtos.map((dto) => AppointmentAdapter.toEntity(dto, clientDto)).toList();
      },
      fallbackMessageKey: AppFeedbackKeys.errorFetchAppointments,
    );
  }
}
```

**Características do Repository:**
- Retorna `AppAsyncResult<T>` (Success ou Failure)
- Usa `guard()` para try-catch automático com logging
- Orquestra múltiplos datasources quando necessário
- Usa Adapters para conversão DTO → Entity

### Adapter

Conversão bidirecional entre DTO e Entity:

```dart
class AppointmentAdapter {
  const AppointmentAdapter._();

  static AppointmentEntity toEntity(AppointmentDto dto, AppointClientDto? clientDto) {
    return AppointmentEntity(
      id: dto.id,
      client: clientDto != null ? AppointClientAdapter.toEntity(clientDto) : null,
      services: dto.services.map(AppointServiceAdapter.toEntity).toList(),
      // ... mapeamento completo
    );
  }

  static AppointmentDto toDto(AppointmentEntity entity) {
    return AppointmentDto(
      // ... mapeamento inverso
      searchableClientWords: FirestoreHelpers.generateSearchableWords(entity.clientName),
    );
  }
}
```

### Datasource

Acesso direto ao Firebase Firestore:

```dart
abstract class AppointmentDataSource {
  Future<List<AppointmentDto>> getAppointments({...});
  Future<AppointmentDto?> getAppointmentById({...});
  Future<String> addAppointment(AppointmentDto dto);
  Future<void> updateAppointment(AppointmentDto dto);
  Future<void> deleteAppointment({...});
}

class AppointmentDataSourceImpl implements AppointmentDataSource {
  final _collection = FirebaseFirestore.instance.collection('appointments');

  @override
  Future<List<AppointmentDto>> getAppointments({...}) async {
    final query = _collection
      .where('userId', isEqualTo: userId)
      .orderBy('scheduledAt', descending: true)
      .limit(limit ?? 20);
    
    final snapshot = await query.get();
    return snapshot.docs.map((doc) => AppointmentDto.fromJson(doc.data())).toList();
  }
}
```

### Injeção de Dependências (DI)

Cada feature tem seu container DI implementando `DIContainer`:

```dart
class AppointmentDI implements DIContainer {
  @override
  void dependencies() {
    // Datasources (fenix: true = recria quando removido e usado novamente)
    Get.lazyPut<AppointmentDataSource>(AppointmentDataSourceImpl.new, fenix: true);
    Get.lazyPut<AppointClientDataSource>(AppointClientDataSourceImpl.new, fenix: true);

    // Repositories
    Get.lazyPut<AppointmentRepository>(
      () => AppointmentRepositoryImpl(Get.find(), Get.find()),
      fenix: true,
    );

    // Stores
    Get.lazyPut<AppointmentStore>(
      () => AppointmentStore(Get.find(), Get.find()),
      fenix: true,
    );
  }
}
```

### Entity

Objetos de domínio imutáveis com Equatable:

```dart
class AppointmentEntity extends Equatable {
  const AppointmentEntity({
    required this.id,
    required this.userId,
    required this.clientId,
    required this.clientName,
    required this.services,
    required this.scheduledAt,
    required this.totalPrice,
    this.paidValue,
    // ...
  });

  final String id;
  final String userId;
  final String clientId;
  final String clientName;
  final List<AppointServiceEntity> services;
  final DateTime scheduledAt;
  final double totalPrice;
  final double? paidValue;

  // Getters calculados
  double get remainingAmount => totalPrice - (paidValue ?? 0);
  bool get isFullyPaid => (paidValue ?? 0) >= totalPrice;
  PaymentStatus get paymentStatus => /* ... */;

  @override
  List<Object?> get props => [id, userId, clientId, /* ... */];
}
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                           UI (Page/Widget)                          │
│                                 │                                   │
│                          Obx(() => ...)                             │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                        Store (AppStore)                             │
│                                 │                                   │
│              result.when(handleError, onSuccess)                    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ AppAsyncResult<T>
┌─────────────────────────────────▼───────────────────────────────────┐
│                   Repository (GuardedRepository)                    │
│                                 │                                   │
│            guard(action: () => ..., fallbackMessageKey)             │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                           Datasource                                │
│                                 │                                   │
│                   FirebaseFirestore.instance                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                            Firebase                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Navegação

O `AppNavigator` centraliza a navegação usando GetX:

```dart
class AppNavigator {
  static void pushNamed(String name, {Object? arguments, VoidCallback? futureFunction});
  static void pushReplacementNamed(String name, {...});
  static void pushNamedAndRemoveUntil(String name, {...});
  static void pop();
  static void popUntilFirst();
}
```

## Módulo Shared

Código compartilhado entre features:

```
lib/shared/
├── database/           # Configurações de banco local
├── datasources/        # Datasources compartilhados
├── di/                 # DI compartilhado (SharedDI)
├── domain/
│   └── enums/          # Enums globais (PaymentStatus, etc.)
├── services/           # Services globais (AuthService, etc.)
└── shared.dart         # Barrel file
```

## Decisões Arquiteturais (ADRs)

### ADR-001: Result Pattern

**Decisão**: Usar `Result<T>` (Success | Failure) em vez de try-catch explícito.

**Implementação**: `result.when(onFailure, onSuccess)` para pattern matching.

**Motivação**: Força tratamento explícito de erros, código mais previsível.

### ADR-002: GuardedRepository

**Decisão**: Repositories estendem `GuardedRepository` com `guard()`.

**Implementação**: `guard()` faz try-catch automático, logging, e conversão para Result.

**Motivação**: Tratamento de erros centralizado, menos boilerplate.

### ADR-003: Adapters Separados

**Decisão**: Adapters como classes estáticas fora de Entities/DTOs.

**Motivação**: 
- Entities permanecem puras (sem dependência de DTOs)
- DTOs permanecem simples (apenas serialização)
- Composição de múltiplos DTOs em uma Entity

### ADR-004: Barrel Files por Feature

**Decisão**: Cada feature tem `{feature}.dart` exportando todos os públicos.

**Motivação**: Imports limpos, encapsulamento, facilita refatoração.

### ADR-005: fenix: true no GetX

**Decisão**: Usar `fenix: true` em todos os `lazyPut`.

**Motivação**: Recria a instância se removida e usada novamente, evita erros de "not found".

## Estrutura de Diretórios

| Diretório | Descrição |
|-----------|-----------|
| `lib/features/` | Módulos de negócio (appointment, client, revenue, etc.) |
| `lib/core/` | Configs, rotas, constants, helpers, widgets globais |
| `lib/shared/` | Código compartilhado entre features |
| `packages/app_utils/` | Abstrações base (Store, Result, AppException) |
| `packages/app_infrastructure/` | Infra (GuardedRepository, Firestore helpers) |
| `packages/app_design/` | Design system (tokens, componentes) |

## Recursos Relacionados

- [project-overview.md](PROJECT-OVERVIEW.md) - Visão geral do projeto
- [glossary.md](GLOSSARY.md) - Termos e entidades de domínio
- [security.md](SECURITY.md) - Políticas de segurança
