# Tooling & Produtividade

## Visão Geral

Este guia reúne as ferramentas, scripts e configurações que otimizam o desenvolvimento no Carolize.

## Ferramentas Obrigatórias

| Ferramenta | Versão | Instalação |
|------------|--------|------------|
| **Flutter SDK** | ^3.9.2 | [flutter.dev](https://flutter.dev/docs/get-started/install) |
| **Dart SDK** | (incluído no Flutter) | - |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **Firebase CLI** | Latest | `npm install -g firebase-tools` |
| **Git** | 2.30+ | Pré-instalado ou via Homebrew |

### Verificar Instalação

```bash
# Flutter
flutter doctor

# Node.js
node --version
npm --version

# Firebase
firebase --version
```

## Automação Recomendada

### Scripts Úteis

```bash
# Atualizar todas as dependências
flutter pub upgrade

# Gerar código (build_runner, freezed, etc.)
dart run build_runner build --delete-conflicting-outputs

# Limpar projeto
flutter clean && flutter pub get

# Analisar + formatar
flutter analyze && dart format lib/
```

### Aliases Sugeridos

Adicione ao seu `.zshrc` ou `.bashrc`:

```bash
# Flutter
alias fpg="flutter pub get"
alias fpu="flutter pub upgrade"
alias fr="flutter run"
alias fb="flutter build"
alias fa="flutter analyze"
alias ft="flutter test"
alias fc="flutter clean"

# Carolize específico
alias carolize="cd /Volumes/Dados/projetos/carolize"
alias land="cd /Volumes/Dados/projetos/carolize/landing-page && npm run dev"
alias docs="cd /Volumes/Dados/projetos/carolize/docs/portal && npm run dev"
```

## Configuração de IDE

### VS Code

**Extensões Recomendadas:**
- Dart
- Flutter
- Error Lens
- GitLens
- Thunder Client (API testing)
- Markdown All in One

**settings.json:**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "dart.lineLength": 80,
  "dart.previewFlutterUiGuides": true,
  "[dart]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  }
}
```

### IntelliJ IDEA / Android Studio

**Plugins:**
- Flutter
- Dart
- GitToolBox

**Live Templates:**
```dart
// stful: StatefulWidget
// stless: StatelessWidget
// gstore: GetX Store boilerplate
```

## Ferramentas de Debug

### Flutter DevTools

```bash
# Iniciar DevTools
flutter pub global activate devtools
flutter pub global run devtools
```

**Recursos:**
- Inspector de widgets
- Timeline de performance
- Memory profiler
- Network tab

### Firebase Emulators

```bash
# Iniciar emuladores locais
firebase emulators:start

# Com UI
firebase emulators:start --ui
```

## Formatação & Linting

### analysis_options.yaml

```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - prefer_const_constructors
    - prefer_const_declarations
    - avoid_print
    - require_trailing_commas

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
```

### Pré-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/sh
flutter analyze
if [ $? -ne 0 ]; then
  echo "❌ Flutter analyze falhou!"
  exit 1
fi

dart format --set-exit-if-changed lib/
if [ $? -ne 0 ]; then
  echo "❌ Código não formatado!"
  exit 1
fi

echo "✅ Checks passaram!"
```

## Geração de Assets

O projeto usa `flutter_assets_generator`:

```yaml
# pubspec.yaml
flutter_assets_generator:
  output_dir: core/constants
  auto_detection: true
  class_name: Assets
```

```bash
# Regenerar assets
flutter pub run flutter_assets_generator
```

## Produtividade

### Snippets Personalizados

**VS Code (dart.json):**
```json
{
  "GetX Store": {
    "prefix": "gstore",
    "body": [
      "class ${1:Name}Store extends GetxController {",
      "  final Rx<${1:Name}State> state = ${1:Name}State.initial().obs;",
      "",
      "  Future<void> load() async {",
      "    state.value = ${1:Name}State.loading();",
      "    // TODO: implement",
      "  }",
      "}"
    ]
  }
}
```

### Atalhos Úteis

| Ação | VS Code | Android Studio |
|------|---------|----------------|
| Rodar app | F5 | Shift+F10 |
| Hot reload | Ctrl+Shift+F5 | Ctrl+\ |
| Buscar arquivo | Ctrl+P | Ctrl+Shift+N |
| Refatorar | F2 | Shift+F6 |

## Recursos Relacionados

- Fluxo de trabalho: ver `AGENTS.md` (seção de Planejamento)
- [testing-strategy.md](TESTING-STRATEGY.md) - Estratégia de testes
