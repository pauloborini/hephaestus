# Padrão: Lazy Loading com Cache em Stores

> **Status**: Aprovado  
> **Data**: 2026-04-08  
> **Origem**: Análise comparativa entre `AppointmentStore` e `ClientStore`

---

## Contexto

O projeto possui múltiplas features com listagens paginadas (lazy loading) que seguem o mesmo fluxo:
1. Buscar dados paginados do backend
2. Armazenar em cache local
3. Servir do cache quando disponível
4. Suportar "load more" incremental

Dois modelos surgiram organicamente (`AppointmentStore` e `ClientStore`) com diferenças sutis mas impactantes. Este documento define o **padrão canônico** a ser seguido em todas as features.

---

## Decisões de Design

| Decisão | Fonte Original | Justificativa |
|---|---|---|
| Cache **antes** do loading state | `AppointmentStore` | Zero flicker — se há cache, a lista aparece instantaneamente sem spinner |
| `_nextListRequestId` + `_isStaleRequest` | `ClientStore` | Proteção contra race conditions em fetches concorrentes |
| `_finishListRequest` centralizado | `ClientStore` | DRY — evita duplicação do `if/else` de loading em cada método |
| Modularização por extensão (`part`) | `ClientStore` | Escalabilidade e legibilidade em stores complexas |
| Guard de `loadMore` no topo | Ambos | Padrão consistente e early return claro |

---

## Anti-Padrões Identificados

### ❌ Setar loading antes de checar cache

```dart
// ERRADO — causa flash de estado vazio
setLoading(true);
items.clear();
hasMore.value = true;

final cached = _cacheService.getCachedItems(userId: userId);
if (cached != null) {
  items.assignAll(cached.items);
  _finishListRequest(loadMore: false);
  return;
}
```

**Problema**: A lista é limpa e o spinner aparece por pelo menos um frame antes de o cache ser aplicado. Isso causa flicker visual perceptível.

### ❌ Fetch sem stale request guard

```dart
// ERRADO — vulnerável a race conditions
final result = await _repository.getItems(...);
result.when(handleError, (fetched) {
  items.assignAll(fetched); // ← pode sobrescrever dados de um fetch mais recente
});
```

**Problema**: Se dois fetches são disparados em sequência rápida (troca de filtro, scroll rápido), o primeiro pode retornar depois do segundo e sobrescrever a lista com dados desatualizados.

---

## Padrão Canônico

### Estrutura do Método de Fetch

```dart
Future<void> _fetchItems({bool loadMore = false}) async {
  final userId = _userId;
  if (userId == null) return;

  // ┌─────────────────────────────────────────────┐
  // │ 1. LOAD MORE: guard rápido                  │
  // └─────────────────────────────────────────────┘
  if (loadMore) {
    if (!hasMore.value || isLoadingMore.value) return;
    setLoadingMore(true);
  } else {
    // ┌─────────────────────────────────────────────┐
    // │ 2. CACHE FIRST: tenta resolver sem spinner  │
    // └─────────────────────────────────────────────┘
    final cached = _cacheService.getCachedItems(userId: userId);
    if (cached != null) {
      items.assignAll(cached.items);
      hasMore.value = cached.hasMore;
      return; // ← sem loading, sem clear, sem flicker
    }

    // ┌─────────────────────────────────────────────┐
    // │ 3. SEM CACHE: agora sim, mostra loading     │
    // └─────────────────────────────────────────────┘
    setLoading(true);
    items.clear();
    hasMore.value = true;
  }

  // ┌─────────────────────────────────────────────┐
  // │ 4. STALE REQUEST GUARD                      │
  // └─────────────────────────────────────────────┘
  final requestId = _nextListRequestId();

  // ┌─────────────────────────────────────────────┐
  // │ 5. FETCH REMOTO                             │
  // └─────────────────────────────────────────────┘
  final result = await _repository.getItems(
    userId: userId,
    limit: pageSize,
    lastItem: loadMore && items.isNotEmpty ? items.last : null,
  );

  // ┌─────────────────────────────────────────────┐
  // │ 6. STALE CHECK                              │
  // └─────────────────────────────────────────────┘
  if (_isStaleRequest(requestId)) return;

  // ┌─────────────────────────────────────────────┐
  // │ 7. PROCESSAR RESULTADO + CACHE              │
  // └─────────────────────────────────────────────┘
  result.when(handleError, (fetched) {
    final snapshot = _cacheService.storeItems(
      userId: userId,
      items: fetched,
      hasMore: fetched.length == pageSize,
      append: loadMore,
    );
    items.assignAll(snapshot.items);
    hasMore.value = snapshot.hasMore;
  });

  // ┌─────────────────────────────────────────────┐
  // │ 8. CLEANUP CENTRALIZADO                     │
  // └─────────────────────────────────────────────┘
  _finishListRequest(loadMore: loadMore);
}
```

### Helpers (herdados da AppStore)

Todos os helpers de lazy loading vivem na `AppStore` (`lib/core/utils/abstractions/app_store.dart`).
As stores filhas **não precisam redeclarar** nenhum deles:

```dart
// Já disponíveis em qualquer AppStore:
abstract class AppStore extends Store {
  final isLoadingMore = false.obs;
  int _listRequestId = 0;

  int nextListRequestId() { ... }
  bool isStaleRequest(int requestId) { ... }
  void finishListRequest({required bool loadMore}) { ... }
  void setLoadingMore(bool loading) { ... }
}
```

> **Nota**: Os nomes são **sem underscore** (`nextListRequestId`, não `_nextListRequestId`) para que extensions em arquivos `part` possam acessá-los.

### Método `loadMore` Público

```dart
Future<void> loadMoreItems() async {
  await _fetchItems(loadMore: true);
}
```

---

## Variações Permitidas

### Fetch com filtros adicionais

Filtros (datas, status, etc.) são passados como parâmetros extras. A ordem dos 8 passos **não muda**:

```dart
Future<void> _fetchItems({bool loadMore = false}) async {
  // ... passos 1-3 iguais, mas cache key inclui filtros:
  final cached = _cacheService.getCachedItems(
    userId: userId,
    startDate: startDateFilter.value,
    endDate: endDateFilter.value,
  );
  // ... passos 4-8 iguais
}
```

### Fetch com cursor especial (ex: birthday)

Quando o cursor de paginação depende de um campo que pode ser null (ex: `birthDate`), adicionar guard no step 1:

```dart
if (loadMore) {
  if (!hasMore.value || isLoadingMore.value) return;
  // Guard adicional: cursor inválido
  if (items.isNotEmpty && items.last.birthDate == null) {
    hasMore.value = false;
    return;
  }
  setLoadingMore(true);
}
```

### Search com debounce

A busca textual segue o mesmo padrão dos 8 passos, mas encapsulada em um `Timer`:

```dart
void searchItems(String query) {
  _searchTimer?.cancel();
  if (query.isEmpty) {
    isSearching.value = false;
    _fetchItems();
    return;
  }
  _searchTimer = Timer(const Duration(milliseconds: 500), () {
    isSearching.value = true;
    _searchItems(query);
  });
}

Future<void> _searchItems(String query, {bool loadMore = false}) async {
  // Mesmos 8 passos, usando cache/repository de search
}
```

---

## Modularização Recomendada

Para stores com mais de ~150 linhas, usar extensões via `part`:

```
stores/
├── my_store.dart              # State + onInit + onClose
└── my_store/
    ├── my_store.loading.dart   # Fetch, loadMore, cache
    ├── my_store.search.dart    # Search com debounce
    ├── my_store.crud.dart      # Create, update, delete
    ├── my_store.helpers.dart   # setLoadingMore, requestId, etc.
    └── my_store.navigation.dart # viewMode, selectedItem, etc.
```

---

## Checklist de Conformidade

Ao criar ou revisar uma store com lazy loading, verificar:

- [ ] Cache é checado **antes** de setar `setLoading(true)` e `items.clear()`
- [ ] `_nextListRequestId` é chamado **antes** do `await`
- [ ] `_isStaleRequest` é checado **depois** do `await` e **antes** de processar o resultado
- [ ] `_finishListRequest` é chamado no final (nunca duplicado inline)
- [ ] `loadMore` guard impede chamadas duplas (`isLoadingMore` + `hasMore`)
- [ ] `hasMore` é calculado como `fetched.length == pageSize`
- [ ] Resultado é armazenado no cache **antes** de atribuir à lista observável
- [ ] `items.assignAll(snapshot.items)` é usado (não `addAll` direto)

---

## Referência

| Store | Status de Conformidade |
|---|---|
| `AppointmentStore` | ⚠️ Falta stale request guard |
| `ClientStore` (loading) | ⚠️ `_fetchNewClients` seta loading antes do cache |
| `ClientStore` (birthday) | ✅ Conforme |
| `ClientStore` (search) | ✅ Conforme |
| `ServiceStore` | ✅ Conforme |
| `MaterialStore` | ✅ Conforme |
| `InvoiceStore` | ✅ Conforme |
| `RevenueStore` | ✅ Conforme |
| `ExpenseStore` | ✅ Conforme |
| `ReportsStore` | ✅ Conforme (usa pattern próprio) |
