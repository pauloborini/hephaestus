# Skill: Navigation

> **REGRA ABSOLUTA**: Toda navegação DEVE usar `AppNavigator`. Nunca use `Get.to()`, `Get.back()`, `Navigator.push()` ou qualquer navegação direta.

## Quando Usar

Use esta skill sempre que você precisar:

- Navegar para outra tela
- Substituir a rota atual (ex: após login)
- Limpar a pilha (ex: splash → home)
- Voltar (pop)
- Passar `arguments` ou usar `path params`

## Métodos Permitidos

| Método | Quando Usar |
|--------|-------------|
| `AppNavigator.pushNamed(route, ...)` | Push para uma rota |
| `AppNavigator.pushReplacementNamed(route, ...)` | Substituir rota atual (replacement) |
| `AppNavigator.pushNamedAndRemoveUntil(route, ...)` | Limpar stack e ir para rota |
| `AppNavigator.pop()` | Voltar (pop) |
| `AppNavigator.popUntilFirst()` | Voltar até a primeira rota |

## ❌ PROIBIDO

```dart
// NUNCA USE ESTES:
Get.to(SomePage());
Get.toNamed('/route');
Get.back();           // ⚠️ MUITO COMUM - NUNCA USE
Get.off(SomePage());
Navigator.push(context, ...);
Navigator.pop(context);
```

## ✅ CORRETO

```dart
// SEMPRE USE AppNavigator:
AppNavigator.pushNamed(AppRoutes.home);
AppNavigator.pushReplacementNamed(AppRoutes.login);
AppNavigator.pushNamedAndRemoveUntil(AppRoutes.home);
AppNavigator.pop();
AppNavigator.popUntilFirst();
```

## Arguments (Passagem de Dados)

Use `arguments` para passar dados simples para a próxima rota:

```dart
AppNavigator.pushNamed(
  AppRoutes.invoiceList,
  arguments: {
    'source': 'home',
  },
);
```

## Path Params (Rotas com parâmetros)

Se a rota usa `:id` (ou similar), use `pathParamsKey`/`pathParamsValue`:

```dart
AppNavigator.pushNamed(
  '/invoices/:invoiceId',
  pathParamsKey: 'invoiceId',
  pathParamsValue: invoiceId,
);
```

## Callback pós-fechamento (futureFunction)

Use `futureFunction` quando você precisa executar algo após a rota fechar:

```dart
AppNavigator.pushNamed(
  AppRoutes.clientForm,
  futureFunction: () {
    // ex: recarregar lista após voltar do formulário
    store.fetchClients();
  },
);
```

## Regras de Localização

| Cenário | Onde Navegar |
|---------|--------------|
| Navegação com lógica de negócio | No **Controller/Store** |
| Navegação simples (ex: botão cancelar) | Na **View** |
| Dialogs e BottomSheets | Na **View** (nunca no controller) |

### Criterio objetivo

**Navegacao simples**

- Apenas abrir/fechar rota, dialog ou bottom sheet.
- Nenhuma validacao, persistencia, regra de negocio ou chamada async antes de navegar.

**Navegacao com logica de negocio**

- Existe qualquer metodo executado antes da navegacao (validacao, persistencia, transformacao, chamada async).
- O resultado dessa execucao altera o destino, o estado ou a decisao de navegar.

## Exemplo Completo

### No Store (com lógica)

```dart
class LoginStore extends AppStore {
  Future<void> signIn() async {
    setLoading(true);
    final result = await _authService.signIn();
    result.when(
      (error) => handleError(error),
      (success) {
        setSuccess(AppFeedbackKeys.loginSuccess);
        AppNavigator.pushNamedAndRemoveUntil(AppRoutes.home); // ✅ Navegação no store
      },
    );
    setLoading(false);
  }
}
```

### Na View (simples)

```dart
StandardButton(
  label: 'Cancelar',
  onPressed: () => AppNavigator.pop(), // ✅ Navegação simples na view
)
```

## Checklist Pré-Navegação

Antes de adicionar navegação, verifique:

- [ ] Estou usando `AppNavigator.*`?
- [ ] NÃO estou usando `Get.to()`, `Get.back()`, `Navigator.*`?
- [ ] Se há lógica de negócio, a navegação está no controller?
- [ ] Se é simples, a navegação está na view?
- [ ] Dialogs/BottomSheets são abertos na view?
