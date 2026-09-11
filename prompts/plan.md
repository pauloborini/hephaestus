# Plan

## Objetivo

Tornar a escrita revisável antes de existir: emitir o plano legível e editável de todas as operações, com rastreio obrigatório a fragmento ou resposta e destrutividade derivada por definição mecânica. O usuário lê e aprova o plano antes de qualquer byte ser escrito. Se uma resposta humana mudar rota, identidade, destino ou escopo, o plano afetado é invalidado e precisa ser emitido novamente.

## Entradas

- ledgers de execução das fases anteriores: fragmentos roteados (`fragments.json` + `routing.json`) e respostas do bloco `answers` do state;
- `mode` resolvido por `preflight`;
- `.hephaestus/` da execução em curso.

## Saídas

- `.hephaestus/plan.json` — estruturado, consumido por `compose` e pelo gate `scripts/validate-package.mjs` (`checkPlanContract`);
- `.hephaestus/plan.md` — legível e editável pelo usuário, mesma informação por artefato.

## Estrutura do plano

Cada entrada do plano tem:

- `artifactPath` — caminho do artefato no repositório;
- `territory` e `regime` herdados do roteamento;
- `operation ∈ {create, amend, overwrite, move, keep, skip, delete, condense}`;
- `rationale` — justificativa;
- `origin` — `fragmentId` ou `questionKey` que originou a operação (rastreio obrigatório);
- `decidedBy` herdado do roteamento (`keep`/`state`/`catalog`/`detector`/`llm`/`human`);
- `destructive` — booleano **derivado** das condições mecânicas abaixo, nunca preenchido à mão;
- `approved` — registro booleano de aprovação humana quando exigida;
- `approvalEvidence` — origem e escopo da autorização, por exemplo `mensagem do usuário: operação X nos paths Y`;
- `contextFingerprint` — sha256 do contexto material atual da operação, incluindo fontes e respostas usadas;
- `planFingerprint` — hash do conjunto de operações e contexto que foi aprovado, calculado pelo formato abaixo.

## Fingerprint da aprovação

Calcular SHA-256 UTF-8 de `JSON.stringify` do array de operações, na ordem de `entries`; cada operação é um array nesta ordem fixa: `[artifactPath, territory, regime, operation, rationale, origin, decidedBy, destructive, contextFingerprint]`, usando `null` para campo ausente. Cada entrada destrutiva recebe o mesmo hash em `planFingerprint` no momento da aprovação. Mudança em qualquer campo invalida a aprovação; não recalcular o recibo como se o usuário tivesse aprovado novamente. `contextFingerprint` deve refletir as fontes e respostas atuais, não reutilizar contexto obsoleto. O hash prova integridade do escopo registrado, não autentica consentimento humano.

## Destrutivo

`destructive: true` quando qualquer condição valer (definição mecânica que dispara aprovação):

- `mode = adopt` (execução integral de adoção);
- remover arquivo versionado;
- mover arquivo citado por código;
- remover `DEC-NNN`;
- mudar valor de decisão vigente;
- remover conteúdo de terceiros do `AGENTS.md`;
- `operation` é `delete` ou `condense`.

Em `maintain` sem nenhum item destrutivo, aplica sem aprovação. Toda operação marcada como destrutiva exige `approved: true`, sem exceção por `decidedBy`: catálogo, detector, `keep`, LLM e humano são proveniências, não autorização. Uma autorização explícita do pedido pode satisfazer o gate quando cobrir exatamente a operação, os paths e o escopo; ainda assim deve ser registrada em `approvalEvidence` e no `planFingerprint`. Autorização parcial ou de outro escopo não é reutilizada.

## Separação de responsabilidades

- **Consulta**: ler somente o índice, regras e referências acionadas pelo boundary;
- **Registro**: relatar defeito ou candidato no ledger/processo apenas quando o contrato mandar e sem transformar registro em autorização;
- **Alteração**: materializar somente operações presentes no plano aprovado;
- **Aprovação**: consentimento humano explícito para cada conjunto destrutivo. A origem da classificação nunca concede permissão por si só.

## Gate

- nenhuma pergunta bloqueante pendente; `route` e `reconcile` devem estar `validated` após consumo das respostas;
- toda operação é rastreável a fragmento ou resposta (`origin` presente);
- completar e validar o baseline transacional descrito em `preflight`, incluindo paths novos ausentes e as duas pontas de movimentos, antes de liberar `compose`;
- aprovação registrada quando exigida: toda operação destrutiva exige `approved: true` e `approvalEvidence` no mesmo escopo — decisão de qualquer origem nunca é destrutiva sem aprovação humana;
- aprovação anterior só vale se `planFingerprint`, paths e escopo forem iguais; mudança material de resposta invalida a aprovação e retorna à entrevista/plano conforme `revalidation`;
- `scripts/validate-package.mjs` roda `checkPlanContract` sobre `.hephaestus/plan.json`.

## Escreve no repositório

Não. Saídas em `.hephaestus/` (efêmero, gitignored).

## Saídas de checkpoint

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `plan` como `in_progress`; ao concluir, `produced`; marcar `validated` quando o plano estiver aprovado e o gate `checkPlanContract` verde; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
