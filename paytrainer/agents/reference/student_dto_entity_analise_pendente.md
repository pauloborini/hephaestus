# Análise Pendente - DTOs/Entities Student (Fora do Escopo Atual)

## Objetivo
Registrar os artefatos explicitamente removidos do escopo de ajustes atuais para revisão técnica posterior, com calma.

## Itens Diferidos

1. `apps/paytrainer_student/lib/features/home/data/dtos/payment_transaction_dto.dart`
- Contexto: equivalente funcional ao `TransactionDTO` do app Pro.
- Motivo: possui divergências que serão tratadas em análise dedicada.

2. `apps/paytrainer_student/lib/features/home/domain/entities/payment_transaction_entity.dart`
- Contexto: equivalente funcional ao `TransactionEntity` do app Pro.
- Motivo: divergências de modelagem e semântica para revisar em separado.


5. `apps/paytrainer_student/lib/features/profile/data/dtos/profile_dto.dart`
- Contexto: subconjunto do `ProfileDTO` do Pro.
- Motivo: consistência de modelo será revisada em fluxo separado.

6. `apps/paytrainer_student/lib/features/profile/domain/entities/profile_entity.dart`
- Contexto: subconjunto do `ProfileEntity` do Pro.
- Motivo: divergência em `copyWith` e preservação de campos para decidir com calma.

## Regra de Escopo
Os arquivos acima permanecem fora do escopo dos ajustes atuais até nova solicitação explícita.
