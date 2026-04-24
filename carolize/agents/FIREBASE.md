# Skill: Firebase

> **PADRÃO**: Firestore + Firebase Auth com tratamento centralizado de erros

## Quando Usar

Use esta skill sempre que você precisar:

- Criar/alterar coleções/documentos no Firestore
- Escrever ou ajustar um Datasource (queries, paginação)
- Definir índices compostos
- Revisar regras de segurança (Security Rules)
- Implementar busca via `searchableWords`

## Estrutura de Collections

### Convenções

- Collections em **plural** e **camelCase**: `appointments`, `clients`, `services`
- Documentos com ID automático do Firestore
- Campos em **camelCase**: `userId`, `createdAt`, `searchableWords`

Observação prática: muitas entidades do projeto também mantêm um campo de id semântico (ex: `serviceId`, `revenueId`) e fazem fallback em `json['id']` quando o datasource injeta o `doc.id`.

### Estrutura Padrão de Documento

```javascript
{
  "id": "auto-generated",
  "userId": "user-uid",
  "name": "Nome do item",
  "searchableWords": ["nome", "n", "no", "nom"],
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

## Searchable Words (Busca Full-Text)

```dart
// No Adapter (toDto)
searchableWords: FirestoreHelpers.generateSearchableWords(entity.name),

// Query
.where('searchableWords', arrayContains: searchTerm.toLowerCase())
```

## Timestamps

### Leitura (fromJson)

```dart
createdAt: FirestoreHelpers.timestampToDateTime(json['createdAt']) 
    ?? DateTime.now().toUtc(),
```

### Escrita (toCreateJson)

```dart
'createdAt': FirestoreHelpers.dateTimeToFirestore(createdAt),
// Em updates, é comum usar serverTimestamp para auditoria:
'updatedAt': FieldValue.serverTimestamp(),
```

## Datasource (Leitura Recomendada)

No Carolize, prefira usar os helpers para extrair `doc.id` e gerar `Map<String, dynamic>` consistente.

### Ler lista (QuerySnapshot → List<DTO>)

```dart
final snapshot = await _collection
    .where('userId', isEqualTo: userId)
    .orderBy('createdAt', descending: true)
    .get();

final dataList = FirestoreHelpers.queryToList(snapshot);
return dataList.map(ServiceDto.fromJson).toList();
```

### Ler doc único

```dart
final doc = await _collection.doc(id).get();
final data = FirestoreHelpers.extractDocData(doc);
return ServiceDto.fromJson(data);
```

## Mutações em `expenses` e `revenues`

Escritas de negócio nessas coleções são feitas **somente** via Cloud Function callable `financeMutation` (`functions/src/finance_mutation.js`), para manter summaries, idempotência (`financeMutationLog`) e rate limit centralizados.

Estado atual da estratégia:

- O app usa `FinanceMutationService` com requests tipadas por operação, evitando payload cru espalhado pelos chamadores.
- A callable `financeMutation` exige App Check e valida replay idempotente por `mutationId`.
- A feature `appointment` **não** cria mais `revenue` e não mantém checkout financeiro.
- Nesta fase, `firestore.rules` **não** foram endurecidas para `expenses`/`revenues`, porque o app já está em produção. O enforcement por rules fica para uma etapa posterior.

Operações suportadas no payload:

- CRUD: `create`, `update`, `delete` com `entityType` `expense` ou `revenue` (como já existia).
- `settle_payable` — cria despesa e atualiza `payables` (liquidação).
- `settle_receivable` — cria receita e atualiza `receivables`.
- `recurring_expense_pay`, `recurring_expense_update`, `recurring_expense_undo` — recorrência alinhada a `recurringExpenses`.

O app deve chamar `FinanceMutationService` / datasource compartilhado; não usar `set`/`update`/`delete` diretos no Firestore do cliente para esses fluxos.

Observação operacional:

- A centralização está concluída no **código do app** e no **backend callable**.
- Como as rules ainda permanecem abertas nesta fase, a garantia arquitetural é de aplicação + backend, não de rules. Isso é intencional e temporário.

## Paginação

```dart
Future<List<AppointmentDto>> getAppointments({
  required String userId,
  int? limit,
  String? lastId,
}) async {
  Query query = _collection
      .where('userId', isEqualTo: userId)
      .orderBy('scheduledAt', descending: true);

  if (lastId != null) {
    final lastDoc = await _collection.doc(lastId).get();
    if (lastDoc.exists) query = query.startAfterDocument(lastDoc);
  }

  if (limit != null) query = query.limit(limit);

  final snapshot = await query.get();
  final dataList = FirestoreHelpers.queryToList(snapshot);
  return dataList.map(AppointmentDto.fromJson).toList();
}
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    match /appointments/{id} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
    }
  }
}
```

## Índices Compostos

Necessários para queries com:

- Múltiplos campos em `where()`
- `where()` + `orderBy()` em campos diferentes

```bash
firebase deploy --only firestore:indexes
```

## Remote Config

O projeto usa Firebase Remote Config para:

- **Force update** (versão mínima do app, mensagens, URLs das lojas).
- **Versões dos documentos legais** (termos de uso e política de privacidade).

### Parâmetros legais

- `legal_terms_of_use_version` (STRING): versão corrente dos Termos de Uso.
- `legal_privacy_policy_version` (STRING): versão corrente da Política de Privacidade.

O app compara essas versões com as aceitas no perfil do usuário; se forem diferentes, exige reaceite na tela de reaceite. O controle de versão é feito **somente no Remote Config**, sem depender do Firestore.

### Atualizar versões (Console ou CLI)

- **Console**: [Firebase Console](https://console.firebase.google.com) → projeto → Remote Config → editar parâmetros e publicar.
- **CLI**: usar o template local `remote_config_carolize_2.json`. Inicializar com `firebase init remoteconfig` (se ainda não tiver) e publicar com a REST API ou Admin SDK. Listar versões: `firebase remoteconfig:versions:list`.

Após alterar os valores no Console (ou via API), o app na próxima ativação do RC (splash ou fetch) usará as novas versões.

## Checklist Firebase

- [ ] Collection em plural e camelCase?
- [ ] Documento com `userId`, `createdAt`, `updatedAt`?
- [ ] Campo `searchableWords` se precisar de busca?
- [ ] DTO com `fromJson`, `toJson`, `toCreateJson`?
- [ ] Repository usando `GuardedRepository.guard()`?
- [ ] Mutações em `expenses`/`revenues` apenas via `financeMutation` / `FinanceMutationService`?
- [ ] Security Rules verificando `userId`?
- [ ] Índices criados para queries complexas?
