# RULES: NAVIGATION

## Rotas
- Navegação sempre via `AppNavigator`.
- Proibido uso direto de `Get.toNamed()` e `Navigator.pushNamed()`.

## Responsabilidades
- Controller/Store orquestra fluxo.
- View executa abertura de dialog/bottom sheet.

## Retorno de fluxo
- Preferir retorno explícito de resultado por rota.
- Evitar dependência de estado global para refletir ação anterior.

## Deep links
- Manter parsing e redirecionamento centralizado no fluxo de navegação do app.
