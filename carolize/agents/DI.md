# Skill: Dependency Injection

## Quando Usar

Use esta skill sempre que você precisar:

- Criar uma feature nova e registrar `Datasource`/`Repository`/`Store`
- Adicionar um `Service` compartilhado (registrado em `SharedDI`)
- Entender por que `Get.find<T>()` não encontra uma dependência

## Estrutura

Cada feature deve ter `lib/features/<feature>/di/<feature>_di.dart`.

## Classe Base

No Carolize, `DIContainer` **já é** um `Bindings` do GetX, e o método correto a implementar é `dependencies()`.

```dart
class ClientDI extends DIContainer {
  @override
  void dependencies() {
    // 1. Datasources
    Get.lazyPut<ClientDatasource>(() => ClientDatasourceImpl(), fenix: true);
    
    // 2. Repositories
    Get.lazyPut<ClientRepository>(
      () => ClientRepositoryImpl(Get.find()),
      fenix: true,
    );
    
    // 3. Services (se necessário)
    // Get.lazyPut<ClientService>(...);
    
    // 4. Stores
    Get.lazyPut<ClientStore>(
      () => ClientStore(Get.find()),
      fenix: true,
    );
  }
}
```

## Ordem de Registro

1. **Datasources** - Acesso a dados
2. **Repositories** - Lógica de persistência
3. **Services** - Lógica compartilhada (se existir)
4. **Stores** - Controllers de UI

## Regras

### Sobre `lazyPut` vs `put`

- `Get.lazyPut(..., fenix: true)`:
  - **Padrão para feature**
  - Sobe a instância “sob demanda” e permite reconstrução automática
- `Get.put(..., permanent: true)`:
  - **Apenas para serviços globais realmente necessários**
  - Ex: `AuthService`, `SettingsService`, `LocalizationService`

### ✅ CORRETO

```dart
Get.lazyPut<Service>(() => ServiceImpl(), fenix: true); // Feature
Get.put<AuthService>(AuthService(), permanent: true);    // Global
```

### ❌ PROIBIDO

```dart
// Não criar Bindings avulsos fora do padrão do projeto
class ClientBinding extends Bindings { /* ... */ }

// Evitar permanent: true sem necessidade real
Get.put<ClientStore>(..., permanent: true);
```

## Inicialização Global

```dart
// main.dart
void main() async {
  await AppDependencies.init();
  runApp(const AppWidget());
}
```

## Registro Central (AppDependencies)

O projeto usa um agregador que chama `dependencies()` de cada container:

- `SharedDI()` deve vir antes das features
- Features podem depender de serviços registrados em `SharedDI`

## Referências

- Feature DI: [service_di.dart](file:///Volumes/Dados/projetos/carolize/lib/features/service/di/service_di.dart)
- Shared DI: [shared_di.dart](file:///Volumes/Dados/projetos/carolize/lib/shared/di/shared_di.dart)

## Checklist de DI

- [ ] O arquivo está em `lib/features/<feature>/di/<feature>_di.dart`?
- [ ] A classe estende `DIContainer` e implementa `dependencies()`?
- [ ] A ordem está: Datasource → Repository → (Service) → Store?
- [ ] `Get.find()` resolve tudo na hora do registro?
- [ ] Só usei `permanent: true` quando realmente necessário?
