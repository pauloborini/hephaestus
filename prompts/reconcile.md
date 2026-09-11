# Reconcile

## Objetivo

Dar ao pipeline o motor de identidade de decisão: **reconciliar e, quando preciso, cunhar**. “Nunca gerar” significa **nunca inventar regra que a fonte não enuncia** — não significa deixar `docs/decisions/` vazio. `DEC-NNN` é cunhado por `max+1`, alterado in-place e nunca reusado (D17). Decisão existente com valor novo mantém o ID e ganha nota inline; decisão sem a quem casar **nasce com ID novo (`create`)** — inclusive quando `inventoriedMax = 0` (projeto verde ou vault legado sem cláusulas canônicas). Remoção é rara e só após checagem de citações pendentes. Prosa reescrita é recuperável; `DEC-NNN` reusado não é.

Em `mode: adopt`, candidato a decisão já roteado para `_app-vault/docs/decisions/**` (ou alias) sai da reconciliação final com `action ∈ {create, amend, keep, remove}` e `decId` preenchido. Antes da entrevista, conflitos ficam exclusivamente na fila, sem inventar `keep` ou ID resolvido. A fase permanece `produced` e transfere o controle à `interview`; somente a passagem final sem pendências pode ser `validated` e liberar `plan`.

## Entradas

- `.hephaestus/manifests/routing.json` — fragmentos roteados (território `vault` com regime `reconcile` ou `keep` são o foco desta fase);
- `.hephaestus/manifests/fragments.json` — texto e proveniência por fragmento;
- respostas válidas no bloco `answers` do state e em `run-answers.json` do mesmo `runId`, com `questionKey` e `contextFingerprint` coincidentes com o contexto atual; promoção exige também `answer.confirmed: true`, `answer.statement`, `answer.domain` e `sourceEvidence`;
- estado atual de `_app-vault/docs/decisions/**` — cláusulas vivas e `## Histórico` (fonte de verdade, `references/vault-schema/SCHEMA.md` §4);
- `.hephaestus/manifests/run-state.json` (checkpoint da fase).

## Inventário de identidade

Antes de cunhar qualquer ID novo, inventariar o maior `DEC-NNN` do repositório:

- varrer **todos** os arquivos de `_app-vault/docs/decisions/` (um arquivo por domínio, `kebab-case`); a varredura é por diretório, nunca por lista fixa;
- coletar os IDs de **duas fontes**: headings `### DEC-NNN` (cláusulas vivas) **e** IDs citados nas linhas da seção `## Histórico` (decisões removidas permanecem imortais);
- tomar `max` sobre a **união** das duas listas e registrá-lo como `inventoriedMax` no `identity-map.json`;
- **proibido** restringir a varredura às cláusulas vivas (`rg "^### DEC-"` isolado): remoção é permitida e o ID continua imortal (`SCHEMA.md` §4.7) — um vault com `DEC-002` só no `## Histórico` e nenhuma cláusula viva tem `max = 2`, e a cunhagem seguinte é `DEC-003`, nunca `DEC-001` nem `DEC-002`;
- projeto verde (sem `_app-vault/docs/decisions/`): `max = 0`, primeira cunhagem `DEC-001`.

## Identidade

Processar **somente** fragmentos cujo `destinationPath` cai em `docs/decisions/` (após normalizar alias `.app-vault/` → `_app-vault/`). Destinos vault que não são decisão (`INDEX.md`, `docs/TEMPLATES/**`, `specs/**`) registram `action: keep` com `decId: null` e **não** entram na cunhagem.

Promoção confirmada entra como novo fragmento de origem humana: `fragmentId` derivado de `questionKey` + `contextFingerprint`, `rawText` igual ao `statement` confirmado e proveniência da resposta. Registrar `candidateId` e o path processual apenas como contexto em `conflicts.json`; o fragmento original de `.app-work/` continua processo. A `interview` congela o `statement` exato em `.hephaestus/manifests/human-decisions/<fragmentId>.md`, acrescenta sua entrada `path`/`sha256`/`size` ao snapshot sem alterar fontes anteriores e gera proveniência com offsets de bytes cobrindo esse arquivo. Assim o novo fragmento respeita `fragment.schema.json` e a cobertura INV5. A `route` atribui ao fragmento humano destino canônico e `decidedBy: human` antes da reconciliação. Não aceitar confirmação legada ou obsoleta por mero `confirmed: true`.

Para cada fragmento roteado para `docs/decisions/`, casar nesta ordem e decidir `action ∈ {keep, amend, create, remove}`:

1. **Por `DEC-NNN` explícito canônico** — fragmento cujo texto já é heading `### DEC-NNN — <regra>` (em-dash; ID congelado pela cascata, nível 1): o ID é o do heading, nunca outro.
2. **Por identidade semântica** — fragmento candidato (inclui legado `### D\d+`, `DEC-01` sem em-dash, corpo de `DECISOES_*` ou promoção humana) casa primeiro por domínio, sujeito/objeto, condição/escopo e tipo de regra, com os valores variáveis removidos da comparação. Similaridade textual só desempata dentro dessa mesma identidade. **ID legado não congela numeração** — se não houver cláusula viva casada, cai no passo 3.
3. Sem a quem casar → `create` com `max+1` sobre o inventário (nunca reusar número, inclusive de decisão removida). Inventário vazio ⇒ primeira cunhagem `DEC-001`, depois sequencial.

Decisão por caso:

- `keep` — enunciado idêntico ao da cláusula viva; nada é escrito; **`decId` permanece preenchido**;
- `amend` — o **valor** mudou: o ID permanece (`SCHEMA.md` §4.1: "o valor muda, a DEC-NNN permanece"), o enunciado sob o heading é substituído e a nota inline é acrescentada logo abaixo, no formato fixo:
  `_Alterado <data> — era: <valor antigo>. Motivo: <motivo>._`
  - notas novas empilham **acima** da anterior (mais recente primeiro);
  - passando de ~3 notas na cláusula, as antigas são **apagadas** (não arquivadas);
- `create` — cláusula nova com `DEC-NNN` novo; domínio novo ou tag `Afeta:` nova exigem atualizar o `INDEX.md` no mesmo fluxo (`## Domínios`, lista de features válidas, `## Por feature`);
- identidade semântica ambígua — duas ou mais cláusulas vivas com a mesma chave semântica não são escolhidas por similaridade; registrar conflito e enfileirar `reason: reconcile-conflict` para confirmação humana;
- `remove` — rara; **antes** de remover, checar citações pendentes do ID no repositório inteiro, **inclusive dentro de `.app-work/`** — a busca sem `--hidden` (ou sem o path citado) devolve zero e a remoção parece segura (`SCHEMA.md` §4.7); sem citação pendente, a remoção é decidida com a linha em `## Histórico` no fim do arquivo do domínio (a única seção de histórico que existe) — a materialização da linha acontece em `compose`/`apply`, nunca nesta fase;
- alcance cross-domínio: atualizar todos os domínios afetados e citar a `DEC-NNN` irmã na nota de cada arquivo tocado (`_Alterado <data> — era: <antigo>. Motivo: <motivo>; ver DEC-024 em pagamentos.md._`).

## Verificações

- **Conflito de valor** entre fontes para a mesma regra: **enfileira pergunta** (a cascata e o reconcile nunca escolhem em conflito — `questionKey` + `contextFingerprint` na fila, drenada por `interview`), registrando a divergência em `conflicts.json` com as fontes e os valores;
- **Duplicação de valor entre territórios** (D18/INV4): valor de decisão que reaparece como valor literal em `project-rules/` é violação — `project-rules/` **referencia** a `DEC-NNN`, nunca copia o valor; o gate `checkDuplicatedValue` do validador reprova a duplicação sem citação;
- **Split obrigatório do caso híbrido** (`SCHEMA.md` §8): uma frase só com norma de produto e norma de implementação exige divisão — o **efeito observável pelo usuário final** (número, limite, item de enumeração, opção de plano) vai para `docs/decisions/` como `DEC-NNN`; a **norma de como implementar** vai para `project-rules/` referenciando o ID, nunca copiando o número;
- **Cobertura e citações pendentes** antes de qualquer remoção de ID: nenhum `remove` sem a checagem completa do repositório, incluindo caminhos ocultos.

## Fila de perguntas

Perguntas nascem **enfileiradas** — esta fase nunca pergunta (D22). Tudo que precisa de decisão humana sai em `questions.json` com `questionKey`, `contextFingerprint`, `reason`, `invalidates` e `blocking`, drenado por `interview` no lote inicial ou no lote único de revalidação.

**Justifica pergunta** (lista fechada — nada além disto enfileira no reconcile):

- conflito de valor entre fontes para a mesma regra — registrado em `conflicts.json`, nunca escolhido aqui;
- identidade semântica ambígua entre cláusulas vivas;
- mudança de decisão vigente com valor divergente entre fontes;
- remoção de `DEC-NNN` com citação pendente não resolvida;
- remoção de conteúdo de terceiros fora da lista `shield` do state.

**Nunca pergunta** (lista fechada — decidir em silêncio, com evidência):

- rota com match alto já decidida pela cascata (território e regime fixos);
- decisão por não-toque, identidade congelada (`### DEC-NNN`) ou detector;
- nome de arquivo, ordem de seções e forma da nota inline;
- nada já respondido com escopo aplicável e `contextFingerprint` atual — vinculante; resposta obsoleta exige revalidação;
- candidato de processo sem confirmação humana — permanece candidato e não entra no inventário de decisões;

## Gate

- na passagem final, todo fragmento com destino em `docs/decisions/` sai com `action` decidida e `decId` **não nulo**; na passagem pré-entrevista, cada pendência tem pergunta bloqueante e não entra como decisão resolvida no mapa;
- fragmento vault fora de `docs/decisions/` (INDEX / TEMPLATES / specs) sai com `action: keep` e `decId: null`;
- `identity-map.json` registra `inventoriedMax` e uma entrada por fragmento processado (`fragmentId`, `decId`, `action`, `domain`, `matchedId` — o ID pré-existente casado, `null` para `create` — e `evidence`);
- nenhum ID é renumerado, reusado ou presente ao mesmo tempo como cláusula viva e em `## Histórico` (INV3);
- `scripts/validate-package.mjs` roda `checkDecIdentity` sobre o pacote (`identity-map.json` + `_app-vault/docs/decisions/**`);
- fragmento com origem em `.app-work/` nunca vira `DEC-NNN` (D19/INV9): regra que só existe lá é lacuna a promover, nunca insumo — se um fragmento de `.app-work/` chegou aqui como candidato a decisão, é bug de roteamento, não decisão;
- em `adopt`, após a entrevista, se a cascata roteou ≥1 candidato a `docs/decisions/` e o mapa final fecha com zero `create`/`amend`/`keep` com `decId`, a fase marca `failed`.
- promoção humana sempre registra origem processual, `questionKey`, `contextFingerprint` e evidência da confirmação; sem esses quatro elementos, a entrada é rejeitada.

## Bloqueia se

- remoção de `DEC-NNN` com citação pendente não resolvida após a entrevista — bloqueia **com a lista das citações** (arquivo + linha), incluindo as de `.app-work/`;
- inventário que registra `create` com ID menor ou igual ao `max` inventariado — cunhagem reusaria ID existente;
- fragmento com destino em `docs/decisions/` sem `action`/`decId` na passagem final, ou pendência pré-entrevista sem pergunta registrada;
- evidência “keep pending” / “no canonical decisions” em entrada de `docs/decisions/`.

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` e os ledgers `.hephaestus/manifests/identity-map.json`, `.hephaestus/manifests/conflicts.json` e `.hephaestus/manifests/coverage-map.json` (efêmeros, gitignored).

## Saídas

- `.hephaestus/manifests/identity-map.json` — `inventoriedMax` + uma entrada por fragmento (`fragmentId`, `decId`, `action`, `domain`, `matchedId`, `evidence`), consumido por `plan` (Plano 02) e por `compose`;
- `.hephaestus/manifests/conflicts.json` — divergências de valor entre fontes registradas para a entrevista (`questionKey`, fontes, valores), nunca resolvidas aqui;
- `.hephaestus/manifests/coverage-map.json` — entradas de decisão (território `vault`) com destino em `_app-vault/docs/decisions/**`; as demais entradas entram na composição (`compose`);
- checkpoint da fase: ao iniciar, marcar `reconcile` como `in_progress`; ao concluir, `produced`. Se houver perguntas, seguir para `interview`, sem marcar `failed` nem liberar `plan`. Após respostas e retorno, marcar `validated` somente com mapa completo, nenhum conflito bloqueante e `checkDecIdentity` verde; falha que não seja pendência de entrevista marca `failed`.
