# Skill: Error Handling

> **REGRA CRÍTICA**: Use KEYS para tradução, NUNCA mensagens em linguagem natural.

## Quando Usar

Use esta skill sempre que você precisar:

- Lançar um erro (`AppException`)
- Definir `fallbackMessageKey` em um `GuardedRepository.guard()`
- Interpretar/propagar erros do Firebase/Firestore
- Garantir que a UI mostre feedback padronizado (Overlay)

## AppException

```dart
// ❌ ERRADO - Mensagem em português
throw const AppException('Você não tem permissão');
throw const AppException('Agendamento não encontrado');

// ✅ CORRETO - Key para tradução
throw const AppException(AppFeedbackKeys.appointmentAccessDenied);
throw const AppException(AppFeedbackKeys.appointmentNotFound);
```

## AppFeedbackKeys

Centralizadas em `lib/core/constants/app_feedback_keys.dart`:

```dart
class AppFeedbackKeys {
  static const String appointmentNotFound = 'appointment_not_found';
  static const String appointmentAccessDenied = 'appointment_access_denied';
  static const String errorFetchAppointments = 'error_fetch_appointments';
  // ...
}
```

## Tradução e Exibição (Store → Overlay)

No Carolize, a Store padrão (`AppStore`) traduz keys e exibe feedback usando `OverlayService`.

- `setError(key)` / `setSuccess(key)` / `setWarning(key)` / `setInfo(key)`
- `handleError(AppException error)` escolhe a key apropriada e decide entre warning vs error

## GuardedRepository

```dart
class ServiceRepositoryImpl extends GuardedRepository {
  @override
  AppAsyncResult<List<ServiceEntity>> getServices({required String userId}) {
    return guard(
      action: () async {
        final dtos = await _dataSource.getServices(userId: userId);
        return dtos.map(ServiceAdapter.toEntity).toList();
      },
      fallbackMessageKey: AppFeedbackKeys.errorFetchServices, // ✅ Key!
    );
  }
}
```

## Fluxo de Erros

```
Firestore → Datasource (throws) → Repository (guard) → Service → Store → View
```

1. **Datasource**: Pode lançar exceções (não trata)
2. **Repository**: Usa `guard()` para capturar e converter
3. **Service**: Recebe `AppAsyncResult` e repassa
4. **Store**: Usa `.when()` para decidir `setError` ou `setSuccess`
5. **View**: Feedback é exibido via Overlay (integrado no `AppStore`)

## Store - Consumindo Erros

```dart
final result = await _service.getData();
result.when(
  (error) {
    handleError(error); // Traduz key e mostra overlay
    setLoading(false);
  },
  (data) {
    // Sucesso
  },
);
```

## Padrão de Keys

| Contexto | Formato | Exemplo |
|----------|---------|---------|
| Não encontrado | `<entity>_not_found` | `appointment_not_found` |
| Sem permissão | `<entity>_access_denied` | `client_access_denied` |
| Erro de busca | `error_fetch_<entities>` | `error_fetch_services` |
| Erro de criação | `error_create_<entity>` | `error_create_client` |
| Erro de update | `error_update_<entity>` | `error_update_service` |
| Erro de delete | `error_delete_<entity>` | `error_delete_expense` |

## Códigos Firebase

| Código | Tratamento |
|--------|------------|
| `permission-denied` | Mapear para key de acesso negado |
| `not-found` | Mapear para key de não encontrado |
| `unauthenticated` | Redirecionar para login |
