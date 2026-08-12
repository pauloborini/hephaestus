# Plan

## Objetivo

Tornar a escrita revisável antes de existir: emitir o plano legível e editável de todas as operações, com rastreio obrigatório a fragmento ou resposta e destrutividade derivada por definição mecânica. O usuário lê e aprova o plano antes de qualquer byte ser escrito.

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
- `operation ∈ {create, amend, overwrite, move, keep, skip}`;
- `rationale` — justificativa;
- `origin` — `fragmentId` ou `questionKey` que originou a operação (rastreio obrigatório);
- `decidedBy` herdado do roteamento (`keep`/`state`/`catalog`/`detector`/`llm`/`human`);
- `destructive` — booleano **derivado** das condições mecânicas abaixo, nunca preenchido à mão;
- `approved` — registro de aprovação humana quando exigida.

## Destrutivo

`destructive: true` quando qualquer condição valer (definição mecânica que dispara aprovação):

- `mode = adopt` (execução integral de adoção);
- remover arquivo versionado;
- mover arquivo citado por código;
- remover `DEC-NNN`;
- mudar valor de decisão vigente;
- remover conteúdo de terceiros do `AGENTS.md`.

Em `maintain` sem nenhum item destrutivo, aplica sem aprovação.

## Gate

- toda operação é rastreável a fragmento ou resposta (`origin` presente);
- aprovação registrada quando exigida: operação destrutiva com `decidedBy: llm` exige `approved: true` registrado (INV7) — decisão exclusivamente de LLM nunca é destrutiva sem aprovação humana;
- `scripts/validate-package.mjs` roda `checkPlanContract` sobre `.hephaestus/plan.json`.

## Escreve no repositório

Não. Saídas em `.hephaestus/` (efêmero, gitignored).

## Saídas de checkpoint

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `plan` como `in_progress`; ao concluir, `produced`; marcar `validated` quando o plano estiver aprovado e o gate `checkPlanContract` verde; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
