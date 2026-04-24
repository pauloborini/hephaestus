# REFERENCE: DOMAIN EXAMPLES

## Exemplo de DTO

```dart
class PlanDto {
  const PlanDto({
    required this.planId,
    required this.name,
    required this.priceCents,
    required this.createdAt,
  });

  factory PlanDto.fromJson(Map<String, dynamic> json) => PlanDto(
    planId: json['planId'] as String,
    name: json['name'] as String,
    priceCents: json['priceCents'] as int,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  final String planId;
  final String name;
  final int priceCents;
  final DateTime createdAt;

  Map<String, dynamic> toCreateJson() => {
    'name': name,
    'priceCents': priceCents,
  };
}
```

## Exemplo de Mapper

```dart
class PlanMapper {
  const PlanMapper._();

  static PlanEntity toEntity(PlanDto dto) => PlanEntity(
    planId: dto.planId,
    name: dto.name,
    priceCents: dto.priceCents,
    createdAt: dto.createdAt,
  );

  static PlanDto toDto(PlanEntity entity) => PlanDto(
    planId: entity.planId,
    name: entity.name,
    priceCents: entity.priceCents,
    createdAt: entity.createdAt,
  );
}
```

## Exemplo de Entity com copyWith seguro

```dart
class PlanEntity {
  const PlanEntity({
    required this.planId,
    required this.name,
    required this.priceCents,
    required this.createdAt,
  });

  final String planId;
  final String name;
  final int priceCents;
  final DateTime createdAt;

  PlanEntity copyWith({
    String? name,
    int? priceCents,
  }) => PlanEntity(
    planId: planId,
    name: name ?? this.name,
    priceCents: priceCents ?? this.priceCents,
    createdAt: createdAt,
  );
}
```
