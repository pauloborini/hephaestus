# Reconcile

## Objetivo

Dar ao pipeline o motor de identidade de decisão: **reconciliar**, nunca gerar. `DEC-NNN` é cunhado por `max+1`, alterado in-place e nunca reusado (D17). Decisão existente com valor novo mantém o ID e ganha nota inline; decisão sem a quem casar nasce com ID novo; remoção é rara e só após checagem de citações pendentes. Prosa reescrita é recuperável; `DEC-NNN` reusado não é — a citação em comentário de código passa a apontar para outra regra e nada acusa.

## Entradas

- `.hephaestus/manifests/routing.json` — fragmentos roteados (território `vault` com regime `reconcile` ou `keep` são o foco desta fase);
- `.hephaestus/manifests/fragments.json` — texto e proveniência por fragmento;
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

Para cada fragmento roteado com território `vault`, casar nesta ordem e decidir `action ∈ {keep, amend, create, remove}`:

1. **Por `DEC-NNN` explícito** — fragmento cujo texto já é heading `### DEC-NNN — <regra>` (ID congelado pela cascata, nível 1): o ID é o do heading, nunca outro.
2. **Por similaridade de enunciado** — fragmento candidato que enuncia a mesma regra de uma cláusula viva (mesmo domínio e mesmo valor): casa com a cláusula existente.
3. Sem a quem casar → `create` com `max+1` sobre o inventário (nunca reusar número, inclusive de decisão removida).

Decisão por caso:

- `keep` — enunciado idêntico ao da cláusula viva; nada é escrito;
- `amend` — o **valor** mudou: o ID permanece (`SCHEMA.md` §4.1: "o valor muda, a DEC-NNN permanece"), o enunciado sob o heading é substituído e a nota inline é acrescentada logo abaixo, no formato fixo:
  `_Alterado <data> — era: <valor antigo>. Motivo: <motivo>._`
  - notas novas empilham **acima** da anterior (mais recente primeiro);
  - passando de ~3 notas na cláusula, as antigas são **apagadas** (não arquivadas);
- `create` — cláusula nova com `DEC-NNN` novo; domínio novo ou tag `Afeta:` nova exigem atualizar o `INDEX.md` no mesmo fluxo (`## Domínios`, lista de features válidas, `## Por feature`);
- `remove` — rara; **antes** de remover, checar citações pendentes do ID no repositório inteiro, **inclusive dentro de `.app-work/`** — a busca sem `--hidden` (ou sem o path citado) devolve zero e a remoção parece segura (`SCHEMA.md` §4.7); sem citação pendente, a remoção é decidida com a linha em `## Histórico` no fim do arquivo do domínio (a única seção de histórico que existe) — a materialização da linha acontece em `compose`/`apply`, nunca nesta fase;
- alcance cross-domínio: atualizar todos os domínios afetados e citar a `DEC-NNN` irmã na nota de cada arquivo tocado (`_Alterado <data> — era: <antigo>. Motivo: <motivo>; ver DEC-024 em pagamentos.md._`).

## Verificações

- **Conflito de valor** entre fontes para a mesma regra: **enfileira pergunta** (a cascata e o reconcile nunca escolhem em conflito — `questionKey` na fila, drenada por `interview`), registrando a divergência em `conflicts.json` com as fontes e os valores;
- **Duplicação de valor entre territórios** (D18/INV4): valor de decisão que reaparece como valor literal em `project-rules/` é violação — `project-rules/` **referencia** a `DEC-NNN`, nunca copia o valor; o gate `checkDuplicatedValue` do validador reprova a duplicação sem citação;
- **Split obrigatório do caso híbrido** (`SCHEMA.md` §8): uma frase só com norma de produto e norma de implementação exige divisão — o **efeito observável pelo usuário final** (número, limite, item de enumeração, opção de plano) vai para `docs/decisions/` como `DEC-NNN`; a **norma de como implementar** vai para `project-rules/` referenciando o ID, nunca copiando o número;
- **Cobertura e citações pendentes** antes de qualquer remoção de ID: nenhum `remove` sem a checagem completa do repositório, incluindo caminhos ocultos.

## Gate

- todo fragmento de território `vault` sai com `action` decidida e `decId` — nunca em silêncio;
- `identity-map.json` registra `inventoriedMax` e uma entrada por fragmento (`fragmentId`, `decId`, `action`, `domain`, `matchedId` — o ID pré-existente casado, `null` para `create` — e `evidence`);
- nenhum ID é renumerado, reusado ou presente ao mesmo tempo como cláusula viva e em `## Histórico` (INV3);
- `scripts/validate-package.mjs` roda `checkDecIdentity` sobre o pacote (`identity-map.json` + `_app-vault/docs/decisions/**`);
- fragmento com origem em `.app-work/` nunca vira `DEC-NNN` (D19/INV9): regra que só existe lá é lacuna a promover, nunca insumo — se um fragmento de `.app-work/` chegou aqui como candidato a decisão, é bug de roteamento, não decisão.

## Bloqueia se

- remoção de `DEC-NNN` com citação pendente não resolvida — bloqueia **com a lista das citações** (arquivo + linha), incluindo as de `.app-work/`;
- inventário que registra `create` com ID menor ou igual ao `max` inventariado — cunhagem reusaria ID existente;
- fragmento de território `vault` sem ação decidida ao fim da fase.

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` e os ledgers `.hephaestus/manifests/identity-map.json`, `.hephaestus/manifests/conflicts.json` e `.hephaestus/manifests/coverage-map.json` (efêmeros, gitignored).

## Saídas

- `.hephaestus/manifests/identity-map.json` — `inventoriedMax` + uma entrada por fragmento (`fragmentId`, `decId`, `action`, `domain`, `matchedId`, `evidence`), consumido por `plan` (Plano 02) e por `compose`;
- `.hephaestus/manifests/conflicts.json` — divergências de valor entre fontes registradas para a entrevista (`questionKey`, fontes, valores), nunca resolvidas aqui;
- `.hephaestus/manifests/coverage-map.json` — entradas de decisão (território `vault`) com destino em `_app-vault/docs/decisions/**`; as demais entradas entram na composição (`compose`);
- checkpoint da fase: ao iniciar, marcar `reconcile` como `in_progress`; ao concluir, `produced`; marcar `validated` quando todo fragmento de território `vault` estiver decidido com `decId` e o gate `checkDecIdentity` verde; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
