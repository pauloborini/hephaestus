# Route

## Objetivo

Substituir a classificação de uma dimensão por uma cascata determinística de cinco níveis que atribui `territory` e `regime` por fragmento, com evidência, e **para no primeiro nível que decide**. O que já está no lugar certo é copiado byte a byte (regra do não-toque); o resíduo da LLM nunca decide sozinho destino destrutivo sem degradar o fechamento.

## Entradas

- `.hephaestus/manifests/fragments.json` — fragmentos da fase `fragment`, um objeto por fragmento válido pelo `schemas/fragment.schema.json` (com `provenance[]`);
- `.app-work/hephaestus-state.json`, quando existir: bloco `answers` (respostas vinculantes de escopo do projeto), bloco `shield` (blindagem declarada, consultada **antes** do nível 1) e bloco `routing` (overlay do catálogo);
- catálogo base do pack: `catalog/routing-defaults.json`;
- `.hephaestus/manifests/run-state.json` (checkpoint da fase).

Promoção humana confirmada é uma entrada explícita adicional: consumir apenas o fragmento humano congelado pela entrevista, com confirmação e fingerprint atuais; atribuir `territory: vault`, `regime: reconcile`, `decidedBy: human`, destino por domínio confirmado e evidência da resposta. O fragmento processual original não é promovido.

## Cascata

Para cada fragmento, percorrer os níveis na ordem e **parar no primeiro que decide**. Cada fragmento roteado registra `territory`, `regime`, `destinationPath`, `confidence`, `decidedBy ∈ {keep, state, catalog, detector, llm, human}`, `evidence` (o que decidiu: caminho de origem, `questionKey` + `contextFingerprint`, `pattern` do catálogo ou detector acionado) e `needsSplit`. Toda pergunta enfileirada registra também `reason`, `invalidates`, `blocking` e o fingerprint do contexto.

**Regra de carga (Progressive Disclosure):** carregar **somente** o subdoc do passo da cascata em execução — não pré-carregar os outros.

Ordem dos passos (links relativos a `prompts/route/`):

1. Shield (precede o nível 1) → [route/shield.md](route/shield.md)
2. Nível 1 — não-toque e identidade → [route/detectors.md](route/detectors.md) (seção nível 1)
3. Nível 2 — respostas de escopo → [route/catalog.md](route/catalog.md) (seção nível 2)
4. Nível 3 — catálogo → [route/catalog.md](route/catalog.md) (seção nível 3)
5. Nível 4 — detectores sintáticos → [route/detectors.md](route/detectors.md) (seção nível 4)
6. Nível 5 — resíduo da LLM + fila + gate de resíduo → [route/residual.md](route/residual.md)

## Gate

- todo fragmento sai roteado **ou** enfileirado, com evidência — nunca em silêncio;
- `destinationPath` sempre cai em `AGENTS.md`, em `project-rules/` ou na lista fechada de `references/vault-schema/SCHEMA.md` §2 (`_app-vault/**` e `.app-work/**`) — os quatro territórios;
- fragmento com origem em `.app-work/` nunca recebe `regime: generate` nem `reconcile` (D19/INV9): só `keep`, `relocate`, `delete` ou `condense`;
- nenhum fragmento com `needsSplit: true` segue sem divisão — dividir é trabalho da fase `fragment`, não do usuário;
- resposta reaproveitada sem `contextFingerprint` coincidente não decide rota;
- a saída é validada por `schemas/routing.schema.json`.

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
