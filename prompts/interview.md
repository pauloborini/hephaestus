# Interview

## Objetivo

Dreno único da fila de perguntas: interromper o usuário **uma vez por execução, em lote**, sobre ambiguidade genuína, e transformar cada resposta em **dado versionado consultado antes do julgamento** (D22). Perguntas nascem enfileiradas em `route` e `reconcile`; esta é a única fase que pergunta — o ponto único de interrupção que D22 fechou.

## Entradas

- `.hephaestus/manifests/questions.json` — fila de perguntas das fases de origem (`route`/`reconcile`), com `questionKey` e `fragmentId` por pergunta;
- `.app-work/hephaestus-state.json`, quando existir — bloco `answers` com respostas anteriores (reuso por `questionKey`, sem reperguntar);
- `.hephaestus/manifests/run-state.json` (checkpoint da fase).

## Economia de perguntas

- **Dedupe por `questionKey`**: fragmentos idênticos por hash já foram unificados em `fragment`, e perguntas com o mesmo `questionKey` são uma só — a fila entra aqui já deduplicada, e a fase confere antes de perguntar;
- **Agrupar por eixo de decisão, não por arquivo**: todas as perguntas do mesmo eixo (ex.: destino de ADR aceito) são apresentadas juntas, num lote;
- **Reuso**: resposta anterior com o mesmo `questionKey` (gravada em `answers`) é consultada e **nunca** reperguntada;
- **Teto por execução**: se a fila estourar o teto, o problema é a qualidade da cascata, não a ambiguidade — emitir `degraded` com diagnóstico em vez de metralhar o usuário;
- **Alias de vault ≠ isentar promoção**: pergunta sobre root `.app-vault/` vs `_app-vault/` só decide o **nome do root**. Opções **não** podem oferecer “manter `docs/features|platform|…` como estão” como adoção completa — pastas fora da lista fechada §2 continuam a ser reclassificadas/promovidas na mesma execução (DEC-004).
  Resposta de alias com `operationHint: keep-alias` grava `routing.overlay` no `.app-work/hephaestus-state.json` (overlay de path); **não** congela conteúdo ilegítimo.

## Saídas

Por pergunta respondida, gravar no bloco `answers` do estado:

- `questionKey = sha256(contexto normalizado)` — **contexto** (origem do fragmento + o que falta decidir), nunca o texto literal da pergunta: reformular a prosa da pergunta não muda a chave e o reuso continua funcionando;
- `answer` — resposta estruturada (para pergunta de destino, carrega `destinationPath`; para padrão novo de processo, carrega `includeInPack` boolean);
- `scope ∈ {this-run, this-project, promote-to-catalog}`:
  - `this-run` — vale só para a execução atual: **não** é gravado no estado;
  - `this-project` — gravado em `answers`, vinculante nas próximas execuções (nível 2 da cascata);
  - `promote-to-catalog` — gravado em `answers` **e** vira candidato apresentado no fechamento (promoção opt-in de default de roteamento). **Só** para linha de catálogo de tipo já previsto (ex. glob de ferramenta em `drift-catalog`); **não** para pasta fora da lista fechada;
- `sourceEvidence` — evidência de origem da resposta;
- `answeredAt` — momento da resposta.

## Escrita fora da transação

Gravar `.app-work/hephaestus-state.json` **imediatamente** após cada resposta, fora da transação de `apply`: o custo humano já foi pago e não deve ser desfeito por rollback. Escrita **merge** por `questionKey` — preserva as demais chaves de `answers` e os outros três blocos (`meta`, `routing`, `shield`) intactos. O rollback de `verify(applied)` **nunca** reverte este arquivo (exceção declarada de INV1, registrada em `prompts/apply.md`).

## Eixo: padrão novo de processo

Path ou pasta sob `.app-work/` fora da lista fechada (SCHEMA §4 / `inventoryProcessHygiene().unknown`) enfileira pergunta com o texto:

> Você criou um padrão novo (`<path ou tipo>`). Gostaria de incluir isso dentro do pack da skill para ficar padronizado em todos os projetos?

`answer.includeInPack` boolean.

- Sim (`includeInPack: true`): aplicar o destino proposto neste run; gravar entrada em `.hephaestus/pack-candidates.json` (efêmero, shape `schemas/pack-candidates.schema.json`). **Não** gravar pasta nova em `routing.overlay`. A fase **não edita** a skill instalada. `scope` da resposta de destino pontual pode ser `this-run` ou `this-project` só para **este path**, nunca como default de pasta.
- Não (`includeInPack: false`): mapear para pasta já listada em SCHEMA §2 / §4; último recurso `.app-work/archive/docs/`.
- Sem resposta: run `blocked` / closeout `needs-followup`.

## Gate

- a fila inteira é drenada num único ponto — nenhuma pergunta sobra para outra fase;
- pergunta bloqueante sem resposta ⇒ run `blocked`, não retomado sozinho;
- respostas gravadas válidas por `schemas/hephaestus-state.schema.json` (bloco `answers`);
- estado com campo que o schema não conhece: ignorar e reperguntar o necessário, sem migração (D4).

## Bloqueia se

- pergunta bloqueante sem resposta — marca o run como `blocked` e para até decisão explícita do usuário;
- resposta com destino fora da lista fechada de territórios (`AGENTS.md`, `project-rules/`, `_app-vault/**`, `.app-work/**`) — falha nomeando a pergunta e o destino.

## Escreve no repositório

Sim — **única exceção declarada de INV1**: grava `.app-work/hephaestus-state.json` (estado versionado do projeto) fora da transação; o rollback de `verify(applied)` nunca reverte este arquivo. Nenhum outro caminho versionado é escrito.

## Saídas de checkpoint

Aplicar a regra única de checkpoint do `SKILL.md`: ao iniciar, marcar `interview` como `in_progress`; ao concluir a drenagem, `produced`; marcar `validated` quando a fila estiver drenada (ou bloqueada com run `blocked`) e o estado gravado for válido; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).
