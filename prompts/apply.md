# Apply

## Objetivo

Única fase que materializa o pacote no repositório. Executa o staging aprovado em transação única, com backup completo antes do primeiro byte, baseline revalidado e ordem `relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`. Lista final = `staging-manifest.json` inteiro mais deletions aplicadas.

## Entradas

- `.hephaestus/plan.json` e `.hephaestus/plan.md` aprovados pelo usuário (quando a aprovação for exigida);
- `.hephaestus/staging/**` e `.hephaestus/staging-manifest.json` produzidos por `compose` e validados por `verify(staging)`.

## Escreve no repositório

Sim — única fase que escreve no repositório. Exceção declarada de INV1: `interview` grava `.app-work/hephaestus-state.json` fora da transação, porque o custo humano das respostas já foi pago e não deve ser desfeito por rollback; o rollback nunca reverte esse arquivo.

## Gate

- backup completo em `.hephaestus/backup/<YYYYMMDDTHHMMSS>/` **antes do primeiro byte**: todo arquivo do repositório que será sobrescrito ou removido (incluindo paths de `.hephaestus/staging-deletions.json`) é copiado preservando a estrutura relativa (ex.: `project-rules/rules/x.md` vira `.hephaestus/backup/<ts>/project-rules/rules/x.md`); um diretório por execução, com timestamp no formato `YYYYMMDDTHHMMSS`, sem rotação nem reuso entre execuções (semântica append);
- baseline revalidado imediatamente antes da transação: para cada path do `transaction-baseline.json`, existência e sha256 atuais devem coincidir com o baseline. O state não pertence ao baseline; conferir seu hash separadamente contra `run-state.stateWrite`. Qualquer delta não comprovado bloqueia;
- worktree revalidada desde o `preflight`: `git status --porcelain --untracked-files=all` deve conter somente o delta autorizado do state e os artefatos efêmeros próprios em `.hephaestus/`; qualquer outro path sujo bloqueia. Retomada de aplicação parcial exige recuperação pelos recibos antes de reaplicar;
- `revalidation` deve estar resolvida e ausente; nenhuma pergunta bloqueante nem fase anterior pendente libera escrita;
- plano com aprovação registrada quando exigida (ver `plan`).

## Ordem transacional de escrita

1. `relocate` — mover artefatos que trocam de território ou pasta (destinos em `.app-work/` e `_app-vault/` fora de `issues/` são sempre `relocate`);
2. `condense` — fundir trecho único no canônico + uma linha de nota de rastro `_Absorvido <data> — de: <path>.` + remover origem;
3. `delete` — unlink dos paths de `.hephaestus/staging-deletions.json` (já copiados no backup);
4. `reconcile` — alterar decisões existentes in-place (identidade `DEC-NNN` preservada);
5. `generate` — criar arquivos novos, incluindo o scaffold do `.gitignore` do alvo (regime `generate`): a linha `.hephaestus/` é criada quando ausente;
6. `keep` — cópia byte a byte quando o destino calculado == origem atual (regra do não-toque).

## Lista final

Os artefatos gravados são **exatamente** os do `staging-manifest.json` — a lista inteira, nunca um subconjunto — **mais** as deletions aplicadas a partir de `.hephaestus/staging-deletions.json`. Cada artefato gravado, cada backup e cada path deletado são registrados em `artifactsWritten` do run-state (`outputPath`, `phase: apply`, `validationStatus: valid`; operação `delete` nos removidos). Antes da primeira alteração do pacote, `apply` faz merge em `meta`: `adoptionStatus: applied`, `adoptionRunId` e `adoptionUpdatedAt`; isso indica transação iniciada, ainda não validada, inclusive em manutenção. Preservar os outros campos e blocos, comparar e atualizar `stateWrite` a cada merge. Falha parcial nunca conserva marcador `validated` do pacote anterior. O state não entra no staging-manifest.

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

Falha durante `apply` ou divergência em `verify(applied)` inicia recuperação limitada aos paths efetivamente tocados, com autorização aplicável. Antes de cada escrita, revalidar existência/hash contra o baseline e registrar a operação pretendida em `.hephaestus/manifests/transaction-writes.json`; após a escrita, registrar resultado real `{ path, before: { exists, sha256 }, after: { exists, sha256 } }`. Ausência usa `exists: false, sha256: null`. O ledger é vinculado ao `runId`; escrita interrompida sem resultado comprovado bloqueia recuperação automática daquele path.

- Se o estado atual já coincide com `before`, o path está recuperado; não tocar.
- Se não coincide com `after`, há alteração concorrente ou escrita não comprovada: bloquear aquele path sem sobrescrever.
- Baseline existente: restaurar os bytes do backup correspondente, verificando seu hash antes e depois. Isso inclui arquivos removidos pelo run, cujo `after` é ausência.
- Baseline ausente: remover somente o arquivo criado pelo run cujo hash ainda coincide com `after`; não existe backup a restaurar nesse caso. Nunca apagar recursivamente a pasta nem arquivos vizinhos.
- Recuperar em ordem inversa das escritas. Revalidar imediatamente antes de cada mutação; se não houver exclusividade de escrita no boundary, bloquear recuperação automática e relatar os paths para coordenação.
- Não executar `git restore`, `reset`, `checkout` ou comandos mutativos sem autorização explícita aplicável. Backup delimitado é o mecanismo padrão; não há reversão global de Git.
- `.app-work/hephaestus-state.json` e respostas humanas nunca são revertidos. O marcador permanece incompleto até nova validação. Staging/recibos necessários à recuperação são preservados até encerrá-la; só depois descartar derivados obsoletos.


## Saídas

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `apply` como `in_progress`; ao concluir a transação, `produced`; marcar `validated` quando `verify(applied)` confirmar os hashes do staging-manifest no disco; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
