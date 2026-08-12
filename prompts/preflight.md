# Preflight

## Objetivo

Guardar o terreno antes de qualquer trabalho: exigir repositório git e worktree limpa, resolver o modo determinístico e o catálogo, e só então liberar as fases seguintes. É a fase 1 das 13 — nenhuma fase anterior a `apply` escreve no repositório.

## Entradas

- workspace do usuário (raiz do repositório);
- `catalog/routing-defaults.json` e `catalog/drift-catalog.json` do kit (catálogo base);
- `.app-work/hephaestus-state.json`, quando existir: bloco `routing` é o overlay do catálogo; bloco `shield` e bloco `answers` são consumidos nas fases de roteamento.

## Resolução de modo

- `.app-work/hephaestus-state.json` **ausente** ⇒ `mode: adopt`;
- `.app-work/hephaestus-state.json` **presente** ⇒ `mode: maintain`;
- resolver por presença de arquivo (`existsSync`), nunca por heurística sobre estrutura presente: `_app-vault/`, `project-rules/` ou `AGENTS.md` gerado não são prova de execução anterior (D3);
- gravar o `mode` resolvido no campo `mode` do `.hephaestus/manifests/run-state.json`, lido pela fase seguinte (`discover`).

## Gate

- repositório git válido: `git rev-parse --is-inside-work-tree` sai `0`;
- worktree limpa: `git status --porcelain` vazio — **nos dois modos, sem override** (D10);
- `mode` resolvido;
- catálogo resolvido: base do pack + overlay do bloco `routing` do state, quando presente;
- retomada: `run-state.json` de execução anterior interrompida é marcado `status: interrupted` (e `lastUpdatedAt` atualizado) antes de qualquer leitura subsequente ou continuação; reler o arquivo após a marcação; retomar da última fase `validated`, reexecutando integralmente a fase em `in_progress`, `produced` ou `failed` (fase `in_progress` nunca é tratada como concluída após interrupção); quando o impedimento exigir intervenção humana, marcar o run como `blocked` e parar até decisão explícita — o run `blocked` não é retomado sozinho, e a fase que originou o bloqueio é reexecutada integralmente na próxima retomada autorizada.

## Bloqueia se

- fora de repositório git — recusa nomeando a condição;
- worktree suja — recusa listando os arquivos pendentes (`git status --porcelain`), sem mutar nada; sem override nos dois modos;
- state com campo que o schema não conhece: ignorar o campo e reperguntar o necessário, sem migração (D4).

## Escreve no repositório

Não. O único estado gravado é o checkpoint `.hephaestus/manifests/run-state.json` (efêmero, gitignored).

## Saídas

- `mode` resolvido (`adopt`/`maintain`) no run-state;
- catálogo resolvido (base + overlay);
- `.hephaestus/manifests/run-state.json` com `currentPhase=preflight`; ao concluir, `phaseStates.preflight.status=validated` e a regra única de checkpoint do `SKILL.md` aplicada (toda gravação atualiza `lastUpdatedAt`).
