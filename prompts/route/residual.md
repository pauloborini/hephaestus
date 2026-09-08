# Route — Resíduo LLM, fila e gate de resíduo

> Carregar **somente** quando a cascata estiver no nível 5, na fila de perguntas ou no gate de resíduo.

### Nível 5 — resíduo da LLM

Só o que sobrou dos níveis 1-4, com confiança explícita (`confidence` numérica). **Abaixo do limiar não decide: enfileira pergunta** (D22). O que decide entra com `decidedBy: llm` e é submetido ao Gate de resíduo.

## Fila de perguntas

Perguntas nascem **enfileiradas** — a cascata nunca pergunta nesta fase (D22). Cada pergunta registra `questionKey = sha256(contexto normalizado)` (contexto: origem do fragmento + o que falta decidir) e o `fragmentId`. A fila é gravada em `.hephaestus/manifests/questions.json` e drenada por `interview` num único lote.

**Justifica pergunta** (lista fechada — nada além disto enfileira na cascata):

- nível 5 abaixo do limiar de confiança (a LLM não decide);
- catálogo sem match, ou match com `destination: null` ou `confidence: baixa`;
- path sob `.app-work/` fora da lista fechada §4 (`inventoryProcessHygiene().unknown`) — pergunta pack-candidate (DEC-006);
- conflito de valor entre fontes para a mesma regra (tratado em `reconcile`);
- remoção de `DEC-NNN` com citação pendente (tratado em `reconcile`);
- remoção de conteúdo de terceiros fora da lista `shield` (tratado em `reconcile`/`plan`).

**Nunca pergunta** (lista fechada — decidir em silêncio, com evidência):

- rota com match alto (catálogo `confidence: alta` com destino concreto) — o nível 3 decide;
- decisão por não-toque (nível 1), identidade congelada (`### DEC-NNN`) ou detector (nível 4) — decidem antes, **exceto** pasta unknown (pack-candidate);
- nome de arquivo e ordem de seções — detalhe local, nunca ambiguidade genuína;
- nada já respondido com `scope: this-project` — a resposta é vinculante e reusada por `questionKey`.

## Gate de resíduo

Marcar como **degradante** toda entrada com `decidedBy: llm` cujo `destinationPath` seja um **arquivo novo** em `_app-vault/docs/decisions/` (isto é, que vira `DEC-NNN` nova) ou em `project-rules/rules/` (regra nova). Entradas `decidedBy: llm` com destino em `project-rules/reference/`, `project-rules/index/` ou `.app-work/` **não** degradam (D26).

Medir e reportar `llmDecidedRatio` (proporção de fragmentos decididos pela LLM) **sempre, sem teto**: o valor vive em `.hephaestus/` (run-state efêmero e `report.md` do closeout), **nunca** no `hephaestus-state.json` (D29).

O critério é o **tipo de destino**, nunca o volume: 30 fragmentos de referência classificados pela LLM não degradam; um único destino que vira `DEC-NNN` nova degrada. O closeout converte degradação em `degraded-but-usable` com a lista nominal.
