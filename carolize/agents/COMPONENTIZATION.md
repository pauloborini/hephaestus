# Skill: Componentization

> **REGRA ABSOLUTA**: Consulte esta skill ANTES de criar qualquer componente.

## Estrutura de Localização

```
Standard* → packages/app_design     (Design System - genéricos)
Base*     → packages/app_design     (Componentes estruturais)
App*      → lib/core/widgets        (App-level - conectam services)
Sem prefixo → lib/features/<feature>/presentation/components (Específicos)
```

## Checklist de Decisão

| Pergunta | Sim → Local | Prefixo |
|----------|-------------|---------|
| Widget é genérico para qualquer app? | `packages/app_design` | `Standard*` |
| Widget é estrutural base? | `packages/app_design` | `Base*` |
| Widget conecta services globais? | `lib/core/widgets` | `App*` |
| Widget depende de entity da feature? | `lib/features/<feature>/presentation/components` | Sem prefixo |
| Widget é usado só nesta feature? | `lib/features/<feature>/presentation/components` | Sem prefixo |

## ❌ PROIBIDO

```dart
// Criar componente privado quando já existe padrão:
class _MyCustomButton extends StatelessWidget // ❌ Use StandardButton

// Criar widget em local errado:
// lib/core/widgets/invoice_card.dart // ❌ Deveria estar em feature
// lib/features/client/presentation/components/standard_text.dart // ❌ Deveria estar em app_design
```

## ✅ CORRETO

### Package (Design System)

```dart
// packages/app_design/lib/src/widgets/standard_button.dart
class StandardButton extends StatefulWidget { ... }

// packages/app_design/lib/src/widgets/base_card.dart  
class BaseCard extends StatelessWidget { ... }
```

### Core (App-level)

```dart
// lib/core/widgets/app_drawer.dart
class AppDrawer extends StatelessWidget {
  // Conecta ao serviço de navegação/auth
}

// lib/core/widgets/app_date_selection_widget.dart
class AppDateSelectionWidget extends StatelessWidget {
  // Wrapper que conecta StandardDateSelectionWidget ao LocalizationService
}
```

### Feature (Específico)

```dart
// lib/features/invoicing/presentation/components/invoice_card.dart
class InvoiceCard extends StatefulWidget {
  final InvoiceEntity invoice; // Depende de entity da feature
}

// lib/features/client/presentation/components/client_item.dart
class ClientItem extends StatefulWidget {
  final ClientEntity client;
}
```

## Sufixos para Features

| Sufixo | Uso |
|--------|-----|
| `*Card` | Cards que exibem entidade completa |
| `*Item` | Itens em listas (ListView, GridView) |
| `*Form` | Formulários específicos |
| `*SearchWidget` | Widgets de busca/autocomplete |
| `*Filters` | Componentes de filtro |
| `*View` | Views/páginas específicas |

## Checklist Pré-Criação

Antes de criar componente, responda:

- [ ] Já existe um componente padrão (`Standard*`) que faz isso?
- [ ] Se é genérico, estou criando em `packages/app_design`?
- [ ] Se conecta services, estou criando em `lib/core/widgets` com prefixo `App*`?
- [ ] Se é específico da feature, estou criando em `lib/features/<feature>/presentation/components`?
- [ ] A nomenclatura segue o padrão correto?
