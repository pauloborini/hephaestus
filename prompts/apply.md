# Apply

## Objetivo

Única fase que escreve no repositório. Materializa o staging aprovado em transação única, com backup completo antes do primeiro byte, ordem `relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`. Lista final = `staging-manifest.json` inteiro mais deletions aplicadas.

## Entradas

- `.hephaestus/plan.json` e `.hephaestus/plan.md` aprovados pelo usuário (quando a aprovação for exigida);
- `.hephaestus/staging/**` e `.hephaestus/staging-manifest.json` produzidos por `compose` e validados por `verify(staging)`.

## Escreve no repositório

Sim — única fase que escreve no repositório. Exceção declarada de INV1: `interview` grava `.app-work/hephaestus-state.json` fora da transação, porque o custo humano das respostas já foi pago e não deve ser desfeito por rollback; o rollback nunca reverte esse arquivo.

## Gate

- backup completo em `.hephaestus/backup/<YYYYMMDDTHHMMSS>/` **antes do primeiro byte**: todo arquivo do repositório que será sobrescrito ou removido (incluindo paths de `.hephaestus/staging-deletions.json`) é copiado preservando a estrutura relativa (ex.: `project-rules/rules/x.md` vira `.hephaestus/backup/<ts>/project-rules/rules/x.md`); um diretório por execução, com timestamp no formato `YYYYMMDDTHHMMSS`, sem rotação nem reuso entre execuções (semântica append);
- worktree revalidada desde o `preflight`: `git status --porcelain` vazio — suja desde o `preflight` bloqueia, porque o rollback por git arrastaria trabalho alheio;
- plano com aprovação registrada quando exigida (ver `plan`).

## Ordem transacional de escrita

1. `relocate` — mover artefatos que trocam de território ou pasta (destinos em `.app-work/` e `_app-vault/` fora de `issues/` são sempre `relocate`);
2. `condense` — fundir trecho único no canônico + uma linha de nota de rastro `_Absorvido <data> — de: <path>.` + remover origem;
3. `delete` — unlink dos paths de `.hephaestus/staging-deletions.json` (já copiados no backup);
4. `reconcile` — alterar decisões existentes in-place (identidade `DEC-NNN` preservada);
5. `generate` — criar arquivos novos, incluindo o scaffold do `.gitignore` do alvo (regime `generate`): a linha `.hephaestus/` é criada quando ausente;
6. `keep` — cópia byte a byte quando o destino calculado == origem atual (regra do não-toque).

## Lista final

Os artefatos gravados são **exatamente** os do `staging-manifest.json` — a lista inteira, nunca um subconjunto — **mais** as deletions aplicadas a partir de `.hephaestus/staging-deletions.json`. Cada artefato gravado, cada backup e cada path deletado são registrados em `artifactsWritten` do run-state (`outputPath`, `phase: apply`, `validationStatus: valid`; operação `delete` nos removidos).

## Cunhagem de ISSUE-NNN

Defeito detectado nas fases anteriores chega aqui **enfileirado** com `findingSignature`; a cunhagem acontece em `apply` porque é escrita (INV1). Semântica **upsert de linha** em `.app-work/issues/INDEX.md` — cria linha nova (`create`) ou atualiza estado de linha existente (`amend`), preservando todas as demais linhas e seções; nunca `overwrite` do arquivo e nunca remoção (protocolo de `.app-work/issues/README.md`: linha nunca é deletada).

- inventariar o maior `ISSUE-NNN` percorrendo as **três** seções de `.app-work/issues/INDEX.md` — Abertos, Em verificação e Fechados — e o campo `Próximo ID livre`; cunhar `max+1`; **ID nunca é reusado** — varredura só da seção Abertos reusaria ID de issue encerrada (ID é imortal pelo protocolo);
- `findingSignature = sha256(tipo do achado + path normalizado + enunciado normalizado)` — assinatura estável: reformular a prosa do achado não muda a assinatura, e a rodada seguinte não reabre a mesma issue;
- antes de cunhar, procurar a assinatura entre as issues já registradas (marcador `<!-- findingSignature: <hex> -->` na linha) — presente ⇒ **não cunha** e não altera a linha existente (dedupe);
- linha nova entra na seção Abertos com os campos do protocolo (`.app-work/issues/README.md:14-24`: ID, Sev, Feature, Tela, Problema → Esperado, Origem, Estado) + o marcador da assinatura; o contador `Próximo ID livre` é incrementado;
- `INDEX.md` ausente ou contador inconsistente: usar o `max` das três tabelas e reportar a inconsistência como pendência, sem bloquear.

## Bloqueia se

- backup incompleto — bloqueia antes do primeiro byte;
- worktree suja desde o `preflight`;
- plano sem aprovação registrada quando exigida.

## Rollback

`verify(applied)` com divergência de hash dispara rollback imediato: primeiro `git`, depois `.hephaestus/backup/<ts>/`, nesta ordem. `.app-work/hephaestus-state.json` nunca é revertido. O staging órfão é descartado na retomada.

## Saídas de checkpoint

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `apply` como `in_progress`; ao concluir a transação, `produced`; marcar `validated` quando `verify(applied)` confirmar os hashes do staging-manifest no disco; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
