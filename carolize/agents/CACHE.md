# Skill: Cache System (Coordenação Automática)

> **PADRÃO**: `ContextCacheCoordinator` + `RuntimeCacheService`

## Visão Geral

O sistema de cache do Carolize evoluiu de simples `Rxn<List<T>>` para uma infraestrutura robusta de **memória resiliente** e **coordenação automática de orçamento**.

O objetivo principal é garantir que snapshots de múltiplos contextos (PF, PJ) convivam em harmonia sem estourar o limite de RAM do dispositivo (Budget: 48MB).

## Camadas do Sistema

1.  **CacheCoordinator (Interface/Serviço)**: Orquestrador global que monitora o uso de memória, rastreia métricas de acesso e executa a poda (*pruning*) se necessário.
2.  **RuntimeCacheService (Classe Base)**: Abstração que gerencia o armazenamento local (`snapshotCache` e `entityIndex`) e se auto-registra no coordenador.
3.  **AppStore (Consumidor)**: O ponto de entrada que decide entre usar o cache (*cache-hit*) ou buscar no backend (*cache-miss*).

---

## Gerenciamento de Memória (Orçamento)

O projeto define um orçamento global dinâmico para os caches:

- **Budget**: 48 MB (definido no `ContextCacheCoordinator`).
- **Verificação**: Ocorre a cada mutação (`store`, `contextSwitch`, `clear`) com um pequeno *debounce*.
- **Retenção Mínima**: Em caso de poda agressiva, o sistema tenta preservar pelo menos **2 snapshots inativos** por cada cache registrado antes de remover tudo.

---

## Política de Retenção (Scoring)

A poda não é aleatória. Cada snapshot inativo recebe um **Score** de sobrevivência baseado em:

| Fator | Peso | Motivação |
| :--- | :--- | :--- |
| **Recência** | Decaimento exponencial ($e^{-hours/4} \times 100$) | Preservar o que foi usado nos últimos minutos/horas. |
| **Frequência (Hits)** | 1 ponto por cada `cache-hit` | Recompensar dados que servem várias telas. |
| **Hidratação** | 1.5 pontos por cada `hydrate` | Recompensar dados que restauram UI rapidamente. |
| **Canônico (Bônus)** | +50 pontos | Proteger visões essenciais (mês atual, lista principal). |
| **Dados** | +10 pontos | Penalizar snapshots vazios. |
| **Tamanho (Penalidade)** | Est. Bytes / Média bytes inativos | Descartar snapshots gigantes para liberar espaço rápido. |

### Snapshots Canônicos (Exemplos)

São consultas "quentes" protegidas pelo bônus:
- Receitas/Despesas do **mês atual**.
- Ciclos de **despesas recorrentes**.
- Listas principais ordenadas por nome (Clientes, Serviços).

---

## Isolamento e Escopo (Contexto)

Todo snapshot é identificado por uma `scopeKey`:
`scopeKey = {userId}_{contextId}`

Isso garante que, ao trocar de "Perfil" (ex: trocar de Clínico PJ para Individual PF), os dados não se misturem e o coordenador saiba quais snapshots estão inativos (e, portanto, elegíveis para poda).

---

## Como Criar um Novo Cache

Para adicionar cache a uma feature:

1.  **Crie o Service**: Estenda `RuntimeCacheService<TEntity, TSnapshot>`.
2.  **Implemente os obrigatórios**:
    - `getEntityId(TEntity)`
    - `getSnapshotItemCount(TSnapshot)`
    - `getSnapshotEntities(TSnapshot)`
3.  **Registre no DI**: Use `lazyPut` com `fenix: true` no `feature_di`. (O registro no coordenador é automático no `onInit`).

### Exemplo de implementação:

```dart
class MyFeatureCacheService extends RuntimeCacheService<MyEntity, List<MyEntity>> {
  @override
  String getEntityId(MyEntity entity) => entity.id;

  @override
  int getSnapshotItemCount(List<MyEntity> snapshot) => snapshot.length;

  @override
  Iterable<MyEntity> getSnapshotEntities(List<MyEntity> snapshot) => snapshot;
}
```

---

## Boas Práticas (Checklist)

- [ ] **Store Cache-First**: Tente carregar do cache antes do repositório.
- [ ] **Estimate Bytes**: Se a sua `Entity` for muito grande, sobrescreva `averageEntitySizeBytes`.
- [ ] **Patch Local**: Após criar ou deletar, atualize o cache manualmente via `putSnapshot` ou `removeById`.
- [ ] **Não dependa de I/O**: `CacheService` é apenas memória purista.
