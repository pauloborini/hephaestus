# Skill: UI/Design

> **FILOSOFIA**: "Flat, Sharp, Minimalist" - Sem sombras excessivas, bordas retas, foco no conteúdo.

## Quando Usar

Use esta skill sempre que você precisar:

- Criar/alterar qualquer UI
- Escolher cores, espaçamentos, tipografia, tamanhos e ícones
- Revisar se uma tela está respeitando o design system

## 1. Bordas (Border Radius)

**REGRA DE OURO**: O padrão é **0px**. Não arredonde nada a menos que seja input.

Observação: os tokens de radius existem em `context.spacing.*`.
Regra do projeto: **inputs têm 2px**.

- Você **NUNCA** deve hardcode (`BorderRadius.circular(2)`)
- Você **SEMPRE** deve usar `context.spacing.inputRadius`
- Se `context.spacing.inputRadius` ainda estiver em `0.0`, isso é um ajuste a ser feito no design system (não na tela)

| Elemento | Valor | Token |
|----------|-------|-------|
| Cards | **0px** | `context.spacing.cardRadius` |
| Botões | **0px** | `context.spacing.buttonRadius` |
| Dialogs | **0px** | `context.spacing.dialogRadius` |
| Inputs | **2px** | `context.spacing.inputRadius` |
| Imagens | **0px** | `context.spacing.radiusNone` |

### ❌ PROIBIDO

```dart
borderRadius: BorderRadius.circular(8),
borderRadius: BorderRadius.circular(12),
borderRadius: BorderRadius.circular(16),
```

### ✅ CORRETO

```dart
borderRadius: BorderRadius.circular(context.spacing.cardRadius), // 0
borderRadius: BorderRadius.circular(context.spacing.inputRadius), // input radius (design system)
```

## 2. Ícones

**REGRA**: Sempre use `phosphor_flutter` com estilo `Regular`.

### ❌ PROIBIDO

```dart
Icon(Icons.person)
Icon(Icons.home)
Icon(Icons.settings)
```

### ✅ CORRETO

```dart
Icon(PhosphorIconsRegular.user, size: 20.icon)
Icon(PhosphorIconsRegular.house, size: 24.icon)
Icon(PhosphorIconsRegular.gear, size: 20.icon)
```

## 3. Cores

**REGRA**: Sempre use `context.colors.*`. Nunca cores hardcoded.

### ❌ PROIBIDO

```dart
color: Colors.red,
color: Colors.blue,
color: Color(0xFF123456),
backgroundColor: Colors.white,
```

### ✅ CORRETO

```dart
color: context.colors.primaryColor,
color: context.colors.textSecondary,
backgroundColor: context.colors.surfaceColor,
backgroundColor: context.colors.surfaceVariant,
color: context.colors.error,
color: context.colors.success,
```

## 4. Tipografia

**REGRA**: Sempre use `context.textStyles.*`. Fonte padrão: `Outfit`.

### ❌ PROIBIDO

```dart
style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)
style: TextStyle(color: Colors.black)
```

### ✅ CORRETO

```dart
style: context.textStyles.headingTitle
style: context.textStyles.h2
style: context.textStyles.bodyText
style: context.textStyles.bodyText.copyWith(color: context.colors.textSecondary)
```

## 5. Responsividade (.adaptive)

**REGRA**: Toda dimensão fixa DEVE usar `.adaptive`.

### ❌ PROIBIDO

```dart
SizedBox(height: 16)
Padding(padding: EdgeInsets.all(20))
width: 100,
```

### ✅ CORRETO

```dart
SizedBox(height: 16.adaptive)
Padding(padding: EdgeInsets.all(20.adaptive))
width: 100.adaptive,
```

## Checklist de QA Visual

Antes de finalizar qualquer UI:

- [ ] Bordas são 0px (exceto inputs)?
- [ ] Ícones são Phosphor (`PhosphorIconsRegular.*`)?
- [ ] Cores vêm de `context.colors.*`?
- [ ] Textos usam `context.textStyles.*`?
- [ ] Dimensões usam `.adaptive`?
- [ ] Sem valores hardcoded?
