# Skill: Domain

> **PADRÃO**: DTO ↔ Adapter ↔ Entity (separação de responsabilidades)

## Quando Usar

Use esta skill sempre que você precisar:

- Criar/alterar DTOs que persistem no Firestore
- Criar/alterar Adapters para converter DTO ↔ Entity
- Criar/alterar Entities (regras de negócio)
- Decidir onde colocar validações e campos técnicos (ex: `searchableWords`, `nameLowerCase`)

## Estrutura de Arquivos

```
features/<feature>/
├── data/
│   ├── dtos/<feature>_dto.dart        # Serialização
│   ├── adapters/<feature>_adapter.dart # Conversão
│   └── datasources/<feature>_datasource.dart
└── domain/
    └── entities/<feature>_entity.dart  # Regras de negócio
```

## DTO (Data Transfer Object)

**Responsabilidade**: APENAS serialização JSON ↔ objeto

Observação: no Carolize, o DTO costuma ter campos técnicos auxiliares para busca, como:

- `searchableWords`
- `nameLowerCase`

### Métodos Obrigatórios

| Método | Uso |
|--------|-----|
| `fromJson()` | Firestore/JSON → DTO |
| `toJson()` | Serialização completa (opcional, quando útil) |
| `toCreateJson()` | Criação (sem `id`) |
| `toUpdateJson()` | Update (sem `createdAt`) |

Observação prática:

- Em algumas features, existe `toJson()` (ex: receitas/despesas).
- Em outras, o DTO usa apenas `toCreateJson()`/`toUpdateJson()`.
- O importante é que **a camada de dados consiga criar e atualizar** sem vazar regra de negócio.

### Uso correto do `toJson`

- **Backend**: use `toCreateJson()`/`toUpdateJson()` para remover campos sensiveis (ex.: `userId`).
- **Cache local**: `toJson()` pode incluir campos sensiveis quando for seguro armazenar localmente.
- **Regra**: `toJson()` so deve ser usado quando for seguro enviar todos os campos.

```dart
class ServiceDto {
  final String serviceId; // ID semântico
  final String userId;
  final String name;
  final DateTime createdAt;

  factory ServiceDto.fromJson(Map<String, dynamic> json) {
    final name = json['name'] as String? ?? '';
    return ServiceDto(
      serviceId: (json['serviceId'] ?? json['id']) as String? ?? '',
      userId: json['userId'] as String? ?? '',
      name: name,
      createdAt: FirestoreHelpers.timestampToDateTime(json['createdAt']) ?? DateTime.now().toUtc(),
    );
  }

  Map<String, dynamic> toCreateJson() => {
    'userId': userId,
    'name': name,
    'createdAt': FirestoreHelpers.dateTimeToFirestore(createdAt),
  };
}
```

### Timestamps: quando usar `FieldValue.serverTimestamp()`

Alguns DTOs usam `FieldValue.serverTimestamp()` (principalmente em `updatedAt`) para auditoria.
Isso é aceitável e comum no projeto.

- `createdAt`:
  - pode ser um `DateTime` convertido com `FirestoreHelpers.dateTimeToFirestore(createdAt)`
  - ou `FieldValue.serverTimestamp()` se a estratégia for “servidor manda”
- `updatedAt`:
  - normalmente `FieldValue.serverTimestamp()`

## Adapter

**Responsabilidade**: APENAS conversão DTO ↔ Entity

### ❌ PROIBIDO no Adapter

- `fromJson()` / `toJson()` (ficam no DTO)
- Regras de negócio
- Validações

### ✅ CORRETO

```dart
class ServiceAdapter {
  static ServiceEntity toEntity(ServiceDto dto) {
    return ServiceEntity(
      id: dto.serviceId,
      userId: dto.userId,
      name: dto.name,
    );
  }

  static ServiceDto toDto(ServiceEntity entity) {
    return ServiceDto(
      serviceId: entity.id,
      userId: entity.userId,
      name: entity.name,
      searchableWords: FirestoreHelpers.generateSearchableWords(entity.name),
    );
  }
}
```

## Entity

**Responsabilidade**: Regras de negócio, validações, helpers de domínio

### Regras

- **Dart puro** (sem dependências Flutter)
- `copyWith` NÃO edita `id`, `createdAt`, `updatedAt`
- Pode conter validações e comportamentos

```dart
class ServiceEntity {
  final String id;
  final String userId;
  final String name;
  final double price;

  bool get isFree => price == 0;
  
  ServiceEntity copyWith({
    String? name, // ✅ Pode editar
    double? price, // ✅ Pode editar
    // NÃO inclui id, createdAt, updatedAt
  });
}
```

## IDs Semânticos

Use IDs com nomes descritivos, não genéricos:

| ❌ Errado | ✅ Correto |
|-----------|------------|
| `id` | `serviceId` |
| `id` | `clientId` |
| `id` | `appointmentId` |
| `id` | `planId` |

### Regra prática

- No Firestore, você pode ter:
  - um `doc.id` do Firestore
  - e um campo de id semântico no JSON (`serviceId`)
- Quando ler, dê fallback para `json['id']` se a datasource injeta esse campo.

## Contrato entre DTOs de features (snapshot)

Quando uma feature precisa de dados de outra feature (snapshot cross‑feature):

- **Proibido importar DTO/Entity de outra feature** (nem de `data/` nem de `domain/` da feature origem).
- **DTO consumidor é um snapshot** com subset de campos do DTO origem.
- **Campos comuns devem manter os mesmos nomes** para garantir compatibilidade.
- **Contrato mínimo via interface/mixin em `shared/domain/contracts/`** com getters dos campos obrigatórios.
- **Chaves de Firestore opcionais**: usar constantes compartilhadas em `shared/domain/contracts/` para evitar divergência de nomes.

Checklist Domain

- [ ] DTO tem `fromJson` e `toCreateJson`/`toUpdateJson` (e `toJson` quando necessário)?
- [ ] Adapter tem apenas `toEntity` e `toDto`?
- [ ] Entity é Dart puro (sem Flutter)?
- [ ] IDs são semânticos (`featureId`)?
- [ ] `copyWith` não edita campos de sistema?
- [ ] Snapshot cross‑feature não importa DTO/Entity de outra feature
- [ ] Snapshot mantém nomes idênticos aos campos do DTO origem
