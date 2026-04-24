# REFERENCE: COMPONENTS EXAMPLES

## Estrutura por seção em tela complexa

```text
presentation/
  components/
    section_header/
      section_header_widget.dart
    section_plan_cards/
      section_plan_cards_widget.dart
    section_summary/
      section_summary_widget.dart
```

## Exemplo de barrel

```dart
export 'section_header/section_header_widget.dart';
export 'section_plan_cards/section_plan_cards_widget.dart';
export 'section_summary/section_summary_widget.dart';
```

## Regra prática

- Se um bloco visual tiver responsabilidades próprias e mais de um parâmetro de entrada, extrair para arquivo dedicado.
