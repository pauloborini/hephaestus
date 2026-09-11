# Interview

## Objetivo

Dreno único da fila de perguntas: interromper o usuário em lote sobre ambiguidade genuína, e transformar cada resposta em **dado versionado consultado antes do julgamento** (D22). Perguntas nascem enfileiradas em `route`, `reconcile` ou `compose`; esta é a única fase que pergunta. A execução admite no máximo dois lotes efetivamente apresentados: o inicial e um lote de revalidação. Passagem com fila vazia ou já respondida não conta como lote. Registrar a contagem em `run-state.interviewBatches`; uma terceira solicitação humana bloqueia o run como ciclo não resolvido.

## Entradas

- `.hephaestus/manifests/questions.json` — fila de perguntas das fases de origem (`route`/`reconcile`/`compose`), com `questionKey`, `contextFingerprint`, `fragmentId`, `reason`, `invalidates` e `blocking` por pergunta;
- `.app-work/hephaestus-state.json`, quando existir — bloco `answers` com respostas anteriores (reuso por `questionKey`, sem reperguntar);
- `.hephaestus/manifests/run-answers.json` — respostas `this-run`, efêmeras e retomáveis no mesmo `runId`, mas nunca reutilizadas no próximo run;
- `.hephaestus/manifests/run-state.json` (checkpoint da fase).

## Economia de perguntas

- **Dedupe por `questionKey`**: fragmentos idênticos por hash já foram unificados em `fragment`, e perguntas com o mesmo `questionKey` são uma só — a fila entra aqui já deduplicada, e a fase confere antes de perguntar;
- **Agrupar por eixo de decisão, não por arquivo**: todas as perguntas do mesmo eixo (ex.: destino de ADR aceito) são apresentadas juntas, num lote;
- **Reuso**: resposta persistente só é reutilizada quando `questionKey` e `contextFingerprint` da fila coincidem; chave igual com fingerprint diferente é resposta obsoleta, preservada como evidência e reperguntada somente para aquele contexto;
- **Teto por execução**: se a fila estourar o teto, o problema é a qualidade da cascata, não a ambiguidade — emitir `degraded` com diagnóstico em vez de metralhar o usuário;
- **Alias de vault ≠ isentar promoção**: pergunta sobre root `.app-vault/` vs `_app-vault/` só decide o **nome do root**. Opções **não** podem oferecer “manter `docs/features|platform|…` como estão” como adoção completa — pastas fora da lista fechada §2 continuam a ser reclassificadas/promovidas na mesma execução (DEC-004).
  Resposta de alias com `operationHint: keep-alias` grava `routing.overlay` no `.app-work/hephaestus-state.json` (overlay de path); **não** congela conteúdo ilegítimo.

## Saídas

Por pergunta respondida, registrar:

- `questionKey = sha256(identidade normalizada)` — tipo da pergunta + identidade da origem + eixo da decisão, nunca o texto literal da pergunta: reformular a prosa não muda a chave;
- `contextFingerprint = sha256(contexto material atual)` — evidência/hash dos bytes da origem, candidatos, escopo e premissas que fundamentam a escolha, preservando caixa e acentos dos valores; mudança material invalida somente essa resposta;
- `answer` — resposta estruturada (para pergunta de destino, carrega `destinationPath`; para padrão novo de processo, carrega `includeInPack` boolean);
- `scope ∈ {this-run, this-project, promote-to-catalog}`:
  - `this-run` — vale só para o `runId` atual: gravado em `.hephaestus/manifests/run-answers.json`, nunca no state versionado;
  - `this-project` — gravado em `answers`, vinculante nas próximas execuções (nível 2 da cascata);
  - `promote-to-catalog` — gravado em `answers` **e** vira candidato apresentado no fechamento (promoção opt-in de default de roteamento). **Só** para linha de catálogo de tipo já previsto (ex. glob de ferramenta em `drift-catalog`); **não** para pasta fora da lista fechada;
- `sourceEvidence` — evidência de origem da resposta;
- `answeredAt` — momento da resposta.

## Escrita fora da transação

Gravar a resposta `this-run` imediatamente no manifest efêmero e respostas persistentes imediatamente em `.app-work/hephaestus-state.json`, sempre fora da transação de `apply`: o custo humano já foi pago e não deve ser desfeito por rollback. Antes de substituir resposta obsoleta, preservar sua evidência no ledger efêmero de conflitos. A escrita é **merge** por `questionKey`, preserva as demais chaves e os demais blocos, e inclui `contextFingerprint`. Em `mode: adopt`, o mesmo merge marca `meta.adoptionStatus: pending`; nunca marca adoção como aplicada ou validada. Antes de cada merge, comparar o state com `run-state.stateWrite`; divergência bloqueia sem sobrescrever. Após a escrita, atualizar esse recibo com existência e sha256 dos bytes gravados. O rollback de `verify(applied)` **nunca** reverte respostas humanas.

## Ciclo de revalidação

- cada pergunta declara `reason` em `{route-ambiguity, reconcile-conflict, decision-promotion, pack-candidate, compose-shield-adaptation, approval-scope, context-changed}` e `invalidates` com a fase mais antiga afetada;
- após as respostas, comparar o fingerprint e a resposta anterior. Mudança de rota ou promoção retorna a `route`; conflito de identidade retorna a `reconcile`; adaptação de shield retorna a `plan` (ou `route` se mudar destino); mudança de autorização retorna a `plan`. Para um lote, escolher a fase mais antiga afetada;
- registrar `revalidation` com `requiredFrom`, motivo, `answerKeys`, lista `invalidates` e `attempt` igual a `interviewBatches`. Marcar fases afetadas e posteriores como `not_started`, exceto a entrevista respondida, que permanece `validated`; descartar plano/aprovação e staging derivados e reexecutar a partir de `requiredFrom`. Nenhum artefato anterior à resposta pode ser consumido como aprovado;
- limpar `revalidation` somente após validar novamente as fases afetadas anteriores à escrita, antes de `apply`. Preservar `interviewBatches` para não zerar o limite. Na passagem natural por `interview`, reutilizar respostas válidas sem novo lote;
- uma nova pergunta criada pelo retorno entra no segundo lote. Se ainda houver pergunta bloqueante após esse lote, o run fica `blocked` e não escolhe um valor por inferência.

## Eixo: padrão novo de processo

Path ou pasta sob `.app-work/` fora da lista fechada (SCHEMA §4 / `inventoryProcessHygiene().unknown`) enfileira pergunta com `reason: pack-candidate` e o texto:

> Você criou um padrão novo (`<path ou tipo>`). Gostaria de incluir isso dentro do pack da skill para ficar padronizado em todos os projetos?

`answer.includeInPack` boolean.

- Sim (`includeInPack: true`): aplicar o destino proposto neste run; gravar entrada em `.hephaestus/pack-candidates.json` (efêmero, shape `schemas/pack-candidates.schema.json`). **Não** gravar pasta nova em `routing.overlay`. A fase **não edita** a skill instalada. `scope` da resposta de destino pontual pode ser `this-run` ou `this-project` só para **este path**, nunca como default de pasta.
- Não (`includeInPack: false`): mapear para pasta já listada em SCHEMA §2 / §4; último recurso `.app-work/archive/docs/`.
- Sem resposta: run `blocked` / closeout `needs-followup`.

## Promoção humana de candidato de decisão

Um candidato encontrado em `LEDGER.md` ou em outro artefato de `.app-work/` não é regra e nunca entra diretamente no `reconcile`. A `discover` enfileira a pergunta com `reason: decision-promotion`, `candidateId`, texto observado, origem e evidência. Só uma resposta com `answer.confirmed: true`, `answer.statement`, `answer.domain` e `sourceEvidence` gera o fragmento humano descrito em `reconcile`, desde que chave e fingerprint sejam atuais; a origem processual fica apenas como contexto. Retornar a `route` para materializar o destino da resposta humana. Sem confirmação, o candidato permanece candidato e não governa o produto.

## Gate

- a fila inteira é drenada num único ponto — nenhuma pergunta sobra para outra fase;
- pergunta bloqueante sem resposta ⇒ run `blocked`, não retomado sozinho;
- respostas persistentes válidas por `schemas/hephaestus-state.schema.json`; respostas `this-run` válidas por `schemas/run-answers.schema.json`;
- cada resposta reutilizada tem `contextFingerprint` coincidente; resposta sem fingerprint é legado não reutilizável, não prova de validade;
- estado com campo que o schema não conhece: ignorar e reperguntar o necessário, sem migração (D4).

## Bloqueia se

- pergunta bloqueante sem resposta — marca o run como `blocked` e para até decisão explícita do usuário;
- resposta com destino fora da lista fechada de territórios (`AGENTS.md`, `project-rules/`, `_app-vault/**`, `.app-work/**`) — falha nomeando a pergunta e o destino;
- terceiro lote efetivamente solicitado no mesmo run ou revalidação sem `requiredFrom`/`invalidates` — bloqueia por ciclo não determinístico.

## Escreve no repositório

Sim — exceção declarada de INV1: grava `.app-work/hephaestus-state.json` (estado versionado do projeto) fora da transação e manifests sob `.hephaestus/`; o rollback nunca reverte respostas humanas. Nenhum outro caminho canônico é escrito nesta fase.

## Saídas

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `interview` como `in_progress`; ao concluir a drenagem, `produced`; marcar `validated` quando a fila estiver drenada e o estado gravado for válido; fila bloqueada mantém a fase `produced` e o run `blocked`; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
