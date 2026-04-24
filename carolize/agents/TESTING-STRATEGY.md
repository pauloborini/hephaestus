# Estratégia de Testes

## Visão Geral

Este documento descreve a estratégia de testes para garantir qualidade e estabilidade do Carolize.

## Tipos de Teste

### Unit Tests

- **Framework**: `flutter_test`
- **Localização**: `test/` (raiz do projeto)
- **Naming**: `*_test.dart`
- **Foco**: Lógica de negócio, stores, repositories

```dart
// test/features/dashboard/stores/dashboard_store_test.dart
void main() {
  group('DashboardStore', () {
    late DashboardStore store;
    late MockDashboardRepository mockRepository;

    setUp(() {
      mockRepository = MockDashboardRepository();
      store = DashboardStore(repository: mockRepository);
    });

    test('deve carregar métricas com sucesso', () async {
      when(mockRepository.getMetrics())
          .thenAnswer((_) async => Right(mockMetrics));

      await store.loadData();

      expect(store.state.value.isSuccess, true);
    });
  });
}
```

### Widget Tests

- **Framework**: `flutter_test`
- **Localização**: `test/widgets/`
- **Naming**: `*_widget_test.dart`
- **Foco**: Componentes de UI isolados

```dart
// test/widgets/standard_button_test.dart
void main() {
  testWidgets('StandardButton exibe texto corretamente', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: StandardButton(
          text: 'Confirmar',
          onPressed: () {},
        ),
      ),
    );

    expect(find.text('Confirmar'), findsOneWidget);
  });
}
```

### Integration Tests

- **Framework**: `integration_test`
- **Localização**: `integration_test/`
- **Naming**: `*_integration_test.dart`
- **Foco**: Fluxos completos de usuário

```dart
// integration_test/login_flow_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('fluxo de login completo', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Verificar tela de login
    expect(find.text('Entrar com Google'), findsOneWidget);
    
    // Simular login... (mock necessário)
  });
}
```

## Executando Testes

### Comandos

```bash
# Todos os testes unitários
flutter test

# Teste específico
flutter test test/features/dashboard/stores/dashboard_store_test.dart

# Com coverage
flutter test --coverage

# Watch mode (rerun on change)
flutter test --watch

# Integration tests (device necessário)
flutter test integration_test/
```

### Coverage Report

```bash
# Gerar coverage
flutter test --coverage

# Visualizar (instalar lcov)
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## Quality Gates

### Requisitos Mínimos

| Métrica | Mínimo | Ideal |
|---------|--------|-------|
| **Cobertura total** | 60% | 80%+ |
| **Cobertura de stores** | 80% | 90%+ |
| **Cobertura de entities** | 90% | 100% |
| **Testes passando** | 100% | 100% |

### Pré-Merge Checks

- [ ] Todos os testes passando
- [ ] Sem warnings do `flutter analyze`
- [ ] Código formatado (`dart format`)
- [ ] Novas features têm testes

## Mocking

### Bibliotecas Recomendadas

- **mockito**: Mocks e stubs
- **mocktail**: Alternativa mais simples
- **fake_async**: Testes de timers

```dart
// Exemplo com mockito
@GenerateMocks([DashboardRepository])
void main() {
  late MockDashboardRepository mockRepo;
  
  setUp(() {
    mockRepo = MockDashboardRepository();
  });
}
```

## Testes de Landing Page

### Status Atual

Não há setup de testes automatizados configurado para a landing page.

### Quando necessário

Se for adicionado, padronizar com Jest + Testing Library e documentar o script no
package.json da landing-page.

## Troubleshooting

### Teste Flaky

1. Verificar `pumpAndSettle()` vs `pump()`
2. Aumentar timeout se necessário
3. Isolar dependências externas com mocks

### Erro de Golden Test

```bash
# Atualizar goldens
flutter test --update-goldens
```

### CI/CD

```yaml
# .github/workflows/test.yml (exemplo)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test --coverage
```

## Recursos Relacionados

- Fluxo de trabalho: ver `AGENTS.md` (seção de Planejamento)
- [Flutter Testing Docs](https://docs.flutter.dev/testing) - Documentação oficial
