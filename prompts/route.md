# Route

## Objetivo

Substituir a classificação de uma dimensão por uma cascata determinística de cinco níveis que atribui `territory` e `regime` por fragmento, com evidência, e **para no primeiro nível que decide**. O que já está no lugar certo é copiado byte a byte (regra do não-toque); o resíduo da LLM nunca decide sozinho destino destrutivo sem degradar o fechamento.

## Entradas

- `.hephaestus/manifests/fragments.json` — fragmentos da fase `fragment`, um objeto por fragmento válido pelo `schemas/fragment.schema.json` (com `provenance[]`);
- `.app-work/hephaestus-state.json`, quando existir: bloco `answers` (respostas vinculantes de escopo do projeto), bloco `shield` (blindagem declarada, consultada **antes** do nível 1) e bloco `routing` (overlay do catálogo);
- catálogo base do pack: `catalog/routing-defaults.json`;
- `.hephaestus/manifests/run-state.json` (checkpoint da fase).

## Cascata

Para cada fragmento, percorrer os níveis na ordem e **parar no primeiro que decide**. Cada fragmento roteado registra `territory`, `regime`, `destinationPath`, `confidence`, `decidedBy ∈ {keep, state, catalog, detector, llm, human}`, `evidence` (o que decidiu: caminho de origem, `questionKey`, `pattern` do catálogo ou detector acionado) e `needsSplit`.

### Bloco `shield` (precede o nível 1)

Antes do nível 1, consultar o bloco `shield` do state. Fragmento cujo caminho de origem casa `path` (+ `selector` de seção, quando declarado) de uma entrada é marcado `regime: keep` com `decidedBy: state` — a blindagem declarada vence qualquer outro nível, e o conteúdo blindado nunca passa pela síntese. Ausência do bloco = lista vazia: nada é blindado e todo conteúdo é reabsorvido (D9).

### Nível 1 — não-toque e identidade

Calcular o destino do fragmento a partir da **classificação estrutural** (detectores sintáticos do nível 4) **antes** de qualquer consulta a respostas, catálogo ou julgamento. Se `destinationPath` normalizado for igual ao caminho de origem atual, decidir `regime: keep`, `decidedBy: keep` e marcar o fragmento como **fora da síntese** — cópia byte a byte, nunca regeneração.

A decisão é por **posição**, nunca por comparação com um snapshot de execução anterior: `.hephaestus/` é efêmero (D6) e uma máquina nova não pode depender de estado persistido para preservar a edição humana feita no lugar certo.

Fragmento cujo texto já é um heading `### DEC-NNN` decide território `vault` com o ID **congelado** (a mecânica de cunhagem e reconciliação in-place é da fase `reconcile`, Plano 04).

### Nível 2 — respostas de escopo do projeto

Consultar `answers[questionKey]` do state, com `questionKey = sha256(contexto normalizado)` — o **mesmo** contexto usado ao enfileirar (origem do fragmento + o que falta decidir), nunca o texto da pergunta: reformular a prosa não muda a chave (D22). Resposta gravada com destino decide o fragmento: `decidedBy: state`, `destinationPath` o da resposta. Match é **vinculante** (D22): divergir da resposta é violação de gate, não opinião. Ausência de match = sem resposta.

### Nível 3 — catálogo

Resolver o catálogo na ordem: overlay do bloco `routing` do state primeiro, base do pack depois. **Ordenar as entradas por especificidade decrescente do `pattern` antes de procurar match** — match mais específico vence o genérico (regra de `ROUTING_DEFAULTS.md`: clones OSS em `archive/` → `references/`, não `archive/`). Um único termo genérico em comum (ex.: `docs`, presente no path de quase todo fragmento) não é match.

- entrada com `destination: null` **nunca decide** — enfileira pergunta;
- entrada com `confidence: baixa` **nunca decide** — enfileira pergunta;
- entrada com `confidence: alta` e destino concreto decide `decidedBy: catalog`.

### Nível 4 — detectores sintáticos

Classificação estrutural determinística (a mesma usada no nível 1):

- OpenAPI/JSON-Schema (texto com `openapi` ou `json-schema`) ⇒ contrato → `project-rules/contracts/`;
- heading + verbo deôntico + valor numérico ⇒ candidato a decisão → `_app-vault/docs/decisions/`;
- regra de domínio enterrada no `AGENTS.md` legado (origem `AGENTS.md` + verbo deôntico) ⇒ regra → `project-rules/rules/`;
- tabela tipo→arquivo ⇒ índice → `project-rules/index/`;
- bloco de código sem norma associada ⇒ referência → `project-rules/reference/`.

Decide `decidedBy: detector`.

### Nível 5 — resíduo da LLM

Só o que sobrou dos níveis 1-4, com confiança explícita (`confidence` numérica). **Abaixo do limiar não decide: enfileira pergunta** (D22). O que decide entra com `decidedBy: llm` e é submetido ao Gate de resíduo.

## Fila de perguntas

Perguntas nascem **enfileiradas** — a cascata nunca pergunta nesta fase (D22). Cada pergunta registra `questionKey = sha256(contexto normalizado)` (contexto: origem do fragmento + o que falta decidir) e o `fragmentId`. A fila é gravada em `.hephaestus/manifests/questions.json` e drenada por `interview` num único lote.

**Justifica pergunta** (lista fechada — nada além disto enfileira na cascata):

- nível 5 abaixo do limiar de confiança (a LLM não decide);
- catálogo sem match, ou match com `destination: null` ou `confidence: baixa`;
- conflito de valor entre fontes para a mesma regra (tratado em `reconcile`);
- remoção de `DEC-NNN` com citação pendente (tratado em `reconcile`);
- remoção de conteúdo de terceiros fora da lista `shield` (tratado em `reconcile`/`plan`).

**Nunca pergunta** (lista fechada — decidir em silêncio, com evidência):

- rota com match alto (catálogo `confidence: alta` com destino concreto) — o nível 3 decide;
- decisão por não-toque (nível 1), identidade congelada (`### DEC-NNN`) ou detector (nível 4) — decidem antes;
- nome de arquivo e ordem de seções — detalhe local, nunca ambiguidade genuína;
- nada já respondido com `scope: this-project` — a resposta é vinculante e reusada por `questionKey`.

## Gate

- todo fragmento sai roteado **ou** enfileirado, com evidência — nunca em silêncio;
- `destinationPath` sempre cai em `AGENTS.md`, em `project-rules/` ou na lista fechada de `references/vault-schema/SCHEMA.md` §2 (`_app-vault/**` e `.app-work/**`) — os quatro territórios;
- fragmento com origem em `.app-work/` nunca recebe `regime: generate` nem `reconcile` (D19/INV9): só `keep` ou `relocate`;
- nenhum fragmento com `needsSplit: true` segue sem divisão — dividir é trabalho da fase `fragment`, não do usuário;
- a saída é validada por `schemas/routing.schema.json`.

## Gate de resíduo

Marcar como **degradante** toda entrada com `decidedBy: llm` cujo `destinationPath` seja um **arquivo novo** em `_app-vault/docs/decisions/` (isto é, que vira `DEC-NNN` nova) ou em `project-rules/rules/` (regra nova). Entradas `decidedBy: llm` com destino em `project-rules/reference/`, `project-rules/index/` ou `.app-work/` **não** degradam (D26).

Medir e reportar `llmDecidedRatio` (proporção de fragmentos decididos pela LLM) **sempre, sem teto**: o valor vive em `.hephaestus/` (run-state efêmero e `report.md` do closeout), **nunca** no `hephaestus-state.json` (D29).

O critério é o **tipo de destino**, nunca o volume: 30 fragmentos de referência classificados pela LLM não degradam; um único destino que vira `DEC-NNN` nova degrada. O closeout converte degradação em `degraded-but-usable` com a lista nominal.

## Bloqueia se

- destino calculado fora da lista fechada de territórios — falha nomeando o fragmento e o destino;
- fragmento com `needsSplit: true` não dividido — cancela a fase nomeando o fragmento;
- resposta de projeto (`decidedBy: state`) com destino ilegal — falha nomeando o fragmento.

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` e os ledgers `.hephaestus/manifests/routing.json` e `.hephaestus/manifests/questions.json` (efêmeros, gitignored).

## Saídas

- `.hephaestus/manifests/routing.json` — uma entrada por fragmento roteado (`territory`, `regime`, `destinationPath`, `confidence`, `decidedBy`, `evidence`, `needsSplit`), válida pelo `schemas/routing.schema.json`;
- `.hephaestus/manifests/questions.json` — fila de perguntas enfileiradas (nunca feitas aqui);
- checkpoint da fase: ao iniciar, marcar `route` como `in_progress`; ao concluir o roteamento, `produced`; marcar `validated` quando todo fragmento estiver roteado ou enfileirado com evidência e o gate verde; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
