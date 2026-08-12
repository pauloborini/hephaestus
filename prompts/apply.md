# Apply

## Objetivo

Única fase que escreve no repositório. Materializa o staging aprovado em transação única, com backup completo antes do primeiro byte, ordem `relocate` → `reconcile` → `generate` → `keep` e lista final exatamente igual ao `staging-manifest.json`.

## Entradas

- `.hephaestus/plan.json` e `.hephaestus/plan.md` aprovados pelo usuário (quando a aprovação for exigida);
- `.hephaestus/staging/**` e `.hephaestus/staging-manifest.json` produzidos por `compose` e validados por `verify(staging)`.

## Escreve no repositório

Sim — única fase que escreve no repositório. Exceção declarada de INV1: `interview` grava `.app-work/hephaestus-state.json` fora da transação, porque o custo humano das respostas já foi pago e não deve ser desfeito por rollback; o rollback nunca reverte esse arquivo.

## Gate

- backup completo em `.hephaestus/backup/<YYYYMMDDTHHMMSS>/` **antes do primeiro byte**: todo arquivo do repositório que será sobrescrito ou removido é copiado preservando a estrutura relativa (ex.: `project-rules/rules/x.md` vira `.hephaestus/backup/<ts>/project-rules/rules/x.md`); um diretório por execução, com timestamp no formato `YYYYMMDDTHHMMSS`, sem rotação nem reuso entre execuções (semântica append);
- worktree revalidada desde o `preflight`: `git status --porcelain` vazio — suja desde o `preflight` bloqueia, porque o rollback por git arrastaria trabalho alheio;
- plano com aprovação registrada quando exigida (ver `plan`).

## Ordem transacional de escrita

1. `relocate` — mover artefatos que trocam de território ou pasta (destinos em `.app-work/` e `_app-vault/` fora de `issues/` são sempre `relocate`);
2. `reconcile` — alterar decisões existentes in-place (identidade `DEC-NNN` preservada);
3. `generate` — criar arquivos novos, incluindo o scaffold do `.gitignore` do alvo (regime `generate`): a linha `.hephaestus/` é criada quando ausente;
4. `keep` — cópia byte a byte quando o destino calculado == origem atual (regra do não-toque).

## Lista final

Os artefatos gravados são **exatamente** os do `staging-manifest.json` — a lista inteira, nunca um subconjunto. Cada artefato gravado e cada backup são registrados em `artifactsWritten` do run-state (`outputPath`, `phase: apply`, `validationStatus: valid`).

## Bloqueia se

- backup incompleto — bloqueia antes do primeiro byte;
- worktree suja desde o `preflight`;
- plano sem aprovação registrada quando exigida.

## Rollback

`verify(applied)` com divergência de hash dispara rollback imediato: primeiro `git`, depois `.hephaestus/backup/<ts>/`, nesta ordem. `.app-work/hephaestus-state.json` nunca é revertido. O staging órfão é descartado na retomada.

## Saídas de checkpoint

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `apply` como `in_progress`; ao concluir a transação, `produced`; marcar `validated` quando `verify(applied)` confirmar os hashes do staging-manifest no disco; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
