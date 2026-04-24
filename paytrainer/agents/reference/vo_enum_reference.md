# REFERENCE: VO/ENUM

## Decision tree rápido

```text
Conjunto fechado?
├─ Sim -> Enum
└─ Não
   ├─ Tem validação/invariante? -> VO
   └─ Não -> Primitivo
```

## Exemplo de Enum com parsing explícito

```dart
enum PaymentStatus {
  pending,
  completed,
  failed;

  static PaymentStatus fromString(String value) => switch (value.toUpperCase()) {
    'PENDING' => PaymentStatus.pending,
    'COMPLETED' => PaymentStatus.completed,
    'FAILED' => PaymentStatus.failed,
    _ => throw FormatException('PaymentStatus inválido: $value'),
  };

  String get value => name.toUpperCase();
}
```

## Exemplo de VO

```dart
class Email {
  const Email(this.value);

  final String value;

  static Email parse(String raw) {
    final normalized = raw.trim().toLowerCase();
    final isValid = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(normalized);
    if (!isValid) {
      throw FormatException('Email inválido: $raw');
    }
    return Email(normalized);
  }

  static Email? tryParse(String raw) {
    try {
      return parse(raw);
    } on FormatException {
      return null;
    }
  }
}
```
