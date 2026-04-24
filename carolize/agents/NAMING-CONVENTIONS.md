# Skill: Naming Conventions

## Arquivos

- **snake_case** + sufixos: `note_controller.dart`, `client_dto.dart`

## Classes

- **PascalCase**: `NoteController`, `ClientDto`

## Variáveis e Métodos

- **camelCase**: `clientName`, `getUserById()`

## Constantes

- Use **constantes nomeadas** já existentes (ex: `AppRoutes.*`, `AppFeedbackKeys.*`)
- Use `SCREAMING_SNAKE_CASE` apenas quando fizer sentido (geralmente em constantes muito locais)

## Ordem de Imports

```dart
// 1. Dart SDK
import 'dart:async';

// 2. Flutter
import 'package:flutter/material.dart';

// 3. Pacotes externos
import 'package:get/get.dart';

// 4. Core
import 'package:carolize/core/core.dart';

// 5. Feature
import 'package:carolize/features/client/client.dart';

// 6. Parts
part 'client_store.g.dart';
```

## Nomenclatura de Widgets

### Resumo por Local

| Local | Prefixo | Exemplo |
|-------|---------|---------|
| `packages/app_design` | `Standard*` | `StandardButton`, `StandardFormField` |
| `packages/app_design` (estrutural) | `Base*` | `BaseCard` |
| `lib/core/widgets` | `App*` | `AppDrawer`, `AppDateSelectionWidget` |
| `lib/features/<feature>/presentation/components` | Sem prefixo | `InvoiceCard`, `ClientItem` |

### Sufixos para Features

Siga a tabela de sufixos em [agents/COMPONENTIZATION.md](agents/COMPONENTIZATION.md).

## Imports

### ❌ PROIBIDO

```dart
import '../../core/widgets/app_drawer.dart'; // Relativo
```

### ✅ CORRETO

```dart
import 'package:carolize/core/core.dart'; // Via barrel
import 'package:carolize/features/client/client.dart';
```

## Barrels

Cada módulo deve ter arquivo barrel:

- `core/core.dart`
- `shared/shared.dart`
- `features/<feature>/<feature>.dart`
