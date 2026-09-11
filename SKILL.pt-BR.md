---
name: hephaestus
description: Use when o usuario pedir /hephaestus ou transformar fontes cruas em regras de projeto (AGENTS.md, project-rules, _app-vault, .app-work) numa transacao de escrita.
---

<!-- Idioma: [English](SKILL.md) · **Português** -->

# Hephaestus

> Nome grego no umbrella `greek-stack`.

## Objetivo

Este kit transforma fontes cruas do usuário em um pacote fragmentado, canônico e repo-native de regras de projeto, gravado numa única transação de escrita.

Você deve operar com o seguinte pipeline:

1. `preflight`
2. `discover`
3. `snapshot`
4. `fragment`
5. `route`
6. `reconcile`
7. `interview`
8. `plan`
9. `compose`
10. `verify_staging`
11. `apply`
12. `verify_applied`
13. `closeout`

## Superfície

Comando único: `/hephaestus`. Sem subcomando obrigatório.

Uma execução governa os **quatro territórios** documentais do repositório numa única transação de escrita (fase `apply`):

| Território | O que vive lá |
|------------|---------------|
| `AGENTS.md` | postura do agente, parada, workflow, precedência e roteamento |
| `project-rules/` | regras operacionais do projeto |
| `_app-vault/` | decisões de produto (`DEC-NNN`) e specs |
| `.app-work/` | processo: estado, issues e guias - nunca insumo de regra |

Dois modos internos, decididos pelo estado de adoção em `.app-work/hephaestus-state.json`:

- `adopt` - state ausente ou adoção ainda não validada: **adoção completa** dos quatro territórios até o pacote canônico. Não basta scaffoldar pastas nem “keep” de conteúdo já sob um root de vault: regras de produto encontradas (inclusive sob alias `.app-vault/` / `_app-vault/` fora de `docs/decisions/`, headings `### D\d+`, `DECISOES_*`, seções “Decisões fechadas”, ADRs/especificações com norma observável) **viram `### DEC-NNN` em `_app-vault/docs/decisions/`** na mesma execução; pastas do vault fora da lista fechada de `references/vault-schema/SCHEMA.md` §2 são reclassificadas (processo → `.app-work/`, spec → `specs/`, decisão → `docs/decisions/`); `INDEX.md` deriva dos `Afeta:` materializados. Scaffold vazio de `docs/decisions/` com material de decisão ainda vivo fora do canônico = adoção incompleta - closeout `needs-followup`, nunca `ready`;
- `maintain` - somente state presente com `meta.adoptionStatus: validated`: escopo reduzido. State ausente, legado ou com adoção `pending`/`applied` permanece em `adopt` para completar e validar a adoção. Em `maintain`, inventaria drift e artefatos de outras ferramentas (`catalog/drift-catalog.json`) **e** o interior de `.app-work/` (packs F/STALE, `.md` solto, `private/references/`, `done/` legado, archive flat, duplicatas, path fora da lista fechada). Não-toque (INV2) vale só para paths **já** na lista fechada §2 no formato canônico - presença sob o root do vault **não** implica canônico. Território `process` (INV9): só `keep|relocate|delete|condense`. Schema vivo inclui `roadmap/`, `docs/`, `guides/legados/`. Padrão novo → entrevista `includeInPack` → `.hephaestus/pack-candidates.json`; overlay do state não inventa pasta; a skill instalada é imutável. O kit não depende de skill auxiliar de organização.

O fluxo segue as 13 fases acima, com retorno controlado à entrevista e às fases afetadas conforme `prompts/interview.md`. Reconciliação com pergunta pendente permanece `produced` até a resposta; não libera plano nem aplicação. Passagem sem perguntas novas não consome lote.

## Agnosticismo de framework

O kit é agnóstico de framework e linguagem.

- A estrutura gerada (`AGENTS.md` + `project-rules/`) é a mesma para qualquer repositório.
- Os templates não fixam ferramentas, comandos nem gates de framework específico.
- Durante a composição, detecte o framework e a linguagem do repositório do usuário (ex.: Flutter, React, Go, Python) e preencha regras, checklists e gates com as ferramentas reais do projeto (analyzer, linter, validador estrutural, comando de teste).
- Regras específicas de domínio do usuário nunca entram no kit; entram no pacote gerado para o projeto.

## Idioma do kit

O inglês é o idioma canônico deste kit (**DEC-007**): `SKILL.md`, prompts de fase e docs de maintainer sem sufixo de locale. A execução de `/hephaestus` carrega `SKILL.md` (inglês), nunca este arquivo como entrypoint operacional. A documentação em português é o par `*.pt-BR.md` (`SKILL.pt-BR.md`, `README.pt-BR.md`, `COMMANDS.pt-BR.md`, `RELEASE.pt-BR.md`). Em divergência de procedimento, o inglês vence. Não existe `SKILL.en.md`. Tokens de protocolo de vault/AGENTS em `templates/` e SCHEMA (`Afeta:`, `### DEC-NNN`, headings em português) permanecem identificadores — não são um par `*.pt-BR.md`. O preenchimento voltado ao projeto segue a língua do repositório alvo.

## Estado De Execução

Durante o processo, a execução deve manter checkpoint em `.hephaestus/manifests/run-state.json` no workspace do usuário.

Esse arquivo é obrigatório sempre que houver trabalho multi-etapa, para permitir retomada confiável após interrupção. Ele é mecanismo do processo; não faz parte da estrutura canônica do pacote gerado. O diretório `.hephaestus/` é 100% efêmero e gitignored: staging, backup, run-state e ledgers de execução vivem lá, e a linha `.hephaestus/` no `.gitignore` do alvo é garantida pela fase `apply`.

## Estado do projeto

Além do checkpoint efêmero, a execução consulta e grava o estado **versionado** do projeto em `.app-work/hephaestus-state.json` (nome em minúsculo - o gate do validador reprova variante em caixa alta). Ele é editável à mão e dividido em **quatro blocos** (D29), cada um com dono de leitura distinto:

| Bloco | Lido por | Conteúdo |
|-------|----------|----------|
| `meta` | `preflight`, `apply`, `verify(applied)` | `packVersion`, `schemaVersion`, `lastRunAt`, `lastRunId` e `adoptionStatus` (`pending`/`applied`/`validated`) - versões, identidade e ciclo de adoção |
| `routing` | `preflight` e `route` | overlay do catálogo (mesmo shape de `catalog/routing-defaults.json`) + `forbiddenPatterns` opcional - overlay não inventa pasta |
| `answers` | `route` (nível 2 da cascata) e `interview` | mapa `questionKey` → resposta humana persistente com `answer` estruturada, `scope` (`this-project`/`promote-to-catalog`), `contextFingerprint` e `sourceEvidence`; respostas `this-run` vivem em `.hephaestus/manifests/run-answers.json` |
| `shield` | `route` (antes do nível 1) e `compose` | blindagem opt-in de conteúdo de terceiros: lista de `{ path, selector }`, vazia por default |

O arquivo é **sem métricas**: telemetria (ex.: `llmDecidedRatio`) vive em `.hephaestus/`, nunca aqui - um arquivo que acumula telemetria deixa de ser editável à mão. Campo de topo que o schema não conhece é **ignorado** e o necessário é reperguntado, nunca migrado (D4). `interview` grava respostas e pode marcar adoção como `pending` fora da transação; `apply` marca `meta.adoptionStatus: applied` antes de tocar o pacote; `verify(applied)` marca `validated` somente após todos os gates de adoção. Esses merges preservam os outros blocos e atualizam o recibo `stateWrite` para retomada segura. O rollback nunca reverte respostas humanas (INV1, exceção declarada em `prompts/apply.md`).

## Regra central

Você não deve improvisar a árvore final livremente.

Antes de produzir qualquer artefato final:

- leia este arquivo (paridade com `SKILL.md`; a execução canônica é o `SKILL.md` em inglês);
- leia apenas os prompts da fase atual em `prompts/`;
- use `templates/` como alvo estrutural;
- use `schemas/` para restringir a forma da saída;
- use `references/` (plural) como apoio do próprio kit, apenas para leitura; **não confundir** com `reference/` (singular) que é a pasta do pacote gerado dentro de `project-rules/`;
- matriz anti-invenção por fase: [references/anti-invention-gates.md](references/anti-invention-gates.md) (DEC / path / pasta / texto - não despejar a matriz neste SKILL);
- use `manifests/` para nomenclatura, política e metadados.

## Estrutura alvo

O pacote final deve seguir a estrutura canônica do kit:

```text
AGENTS.md
CLAUDE.md            (ponte de uma linha: `@AGENTS.md`)
project-rules/
  index/
  rules/
  reference/
  contracts/       (opcional)
.hephaestus/         (checkpoint do processo; opcional no pacote final)
  manifests/
```

Categorias opcionais podem ser omitidas quando não houver material suficiente, mas `AGENTS.md` deve existir.

`CLAUDE.md` é ponte, nunca conteúdo: uma linha `@AGENTS.md` e nada mais. Existe para que cliente que lê só `CLAUDE.md` caia no mesmo contrato, sem manter dois arquivos. Projeto que já tem `CLAUDE.md` com conteúdo próprio: reabsorver o conteúdo no `AGENTS.md`/`project-rules/` e reduzir o arquivo à ponte - nunca deixar dois contratos vivos.

## Contrato de fragmentação

Classifique cada trecho do material bruto por papel operacional:

- `index`
  - roteamento por tipo de tarefa, ordem de leitura, gatilhos de contexto
- `rules`
  - comportamento obrigatório, recorrente ou normativo
- `reference`
  - exemplos, tabelas, contratos longos, apoio
- `manifest`
  - metadados de proveniência, cobertura, conflito ou validação

Não existe papel `memory` na estrutura canônica. Preferências persistentes de agente pertencem ao sistema de memória do cliente (ex.: memórias da ferramenta), não ao pacote gerado.

Se a classificação for fraca:

- marque como `unknown` ou baixa confiança;
- registre a ambiguidade;
- não force uma categoria arbitrária.

## Fases (Progressive Disclosure)

**Regra de carga:** em cada passo, leia **somente** o prompt da fase atual em `prompts/` (+ schemas/refs listados na linha). Não pré-carregue os outros `prompts/*.md`. I/O, gates e procedimento vivem no prompt - este índice não os duplica.

`prompts/validate.md` é **um corpo, dois alvos** (`Target: staging` = fase 10 `verify_staging`; `Target: applied` = fase 12 `verify_applied`). Manter dual no mesmo arquivo. O parâmetro no prompt em inglês é `Target:`, nunca `Alvo:`.

| # | Fase | Prompt | Job | Lê (mín.) | Produz (mín.) |
|---|------|--------|-----|-----------|---------------|
| 1 | `preflight` | [prompts/preflight.md](prompts/preflight.md) | Gate git/worktree + resolve `mode` | `catalog/*`, state se existir | `run-state.mode` |
| 2 | `discover` | [prompts/discover.md](prompts/discover.md) | Inventário de fontes por modo | naming-policy, drift-catalog | inventário / ausentes |
| 3 | `snapshot` | [prompts/snapshot.md](prompts/snapshot.md) | Congelar fontes byte a byte | inventário discover | `snapshot.json` |
| 4 | `fragment` | [prompts/fragment.md](prompts/fragment.md) | Cortar unidades com proveniência | snapshot | `fragments.json` |
| 5 | `route` | [prompts/route.md](prompts/route.md) | Cascata territory/regime + evidência | fragments, catalog, state | `routing.json`, fila |
| 6 | `reconcile` | [prompts/reconcile.md](prompts/reconcile.md) | Identidade `DEC-NNN` (casar/cunhar) | routing, `docs/decisions/**` | `identity-map.json` |
| 7 | `interview` | [prompts/interview.md](prompts/interview.md) | Drenar fila; grava state fora da tx | fila, bloco `answers` | state `answers` |
| 8 | `plan` | [prompts/plan.md](prompts/plan.md) | Plano legível + destrutividade | ledgers de execução | `plan.json` / `plan.md` |
| 9 | `compose` | [prompts/compose.md](prompts/compose.md) | Materializar staging (sem repo) | templates/, references/ | `staging/**` + manifest |
| 10 | `verify_staging` | [prompts/validate.md](prompts/validate.md) `Target: staging` | Contrato do pacote no staging | schemas/, manifests/ | veredito staging |
| 11 | `apply` | [prompts/apply.md](prompts/apply.md) | Única escrita no repo (tx + backup) | staging-manifest aprovado | pacote no worktree |
| 12 | `verify_applied` | [prompts/validate.md](prompts/validate.md) `Target: applied` | Hash no disco; rollback se diverge | staging-manifest | veredito applied |
| 13 | `closeout` | [prompts/closeout.md](prompts/closeout.md) | Relatório/veredito; não altera pacote | templates/, manifests | `report.md` |

Modos `adopt` / `maintain` **não** são fases - ver Superfície.

## Guardrails

- não citar projetos reais em nenhum artefato distribuível;
- não copiar textos longos de exemplo sem neutralização;
- não criar categorias sem papel operacional claro;
- não inflar a árvore final com arquivos vazios;
- não marcar `valid` quando houver violação dos contratos mínimos;
- `AGENTS.md` deve ser centralizador e enxuto, não um depósito de todas as regras;
- regras de domínio, arquitetura, UI, contrato, segurança e operação devem ficar em `project-rules/rules/*`, não no `AGENTS.md`;
- regras de engenharia devem ser autocontidas: nenhuma decisão de engenharia depende de arquivo externo. Consultar DEC de produto e protocolo local do vault é permitido, sem duplicar valores;
- dependências externas de arquivos dentro de `project-rules/` devem ser mapeadas e reportadas, não escondidas;
- nada é escrito no repositório fora das escritas explicitamente delimitadas: `interview` grava respostas/pending fora da transação, `apply` materializa o pacote e marca `applied`, e `verify(applied)` marca apenas `validated`;
- fase `in_progress` nunca pode ser tratada como concluída após interrupção;
- fase só pode ser considerada retomável como concluída quando estiver marcada como `validated` em `.hephaestus/manifests/run-state.json`;
- não concluir a composição sem mapa de cobertura entre fragmentos e arquivos de destino;
- não encerrar o trabalho sem explicitar pendências ou confirmar que não há pendências relevantes;
- a lista final de exclusão do pacote distribuível vive em `manifests/kit-manifest.json:packExcludes`; nenhuma exclusão de conteúdo hard-coded em script.

## Quando bloquear

Bloqueie a conclusão quando:

- faltar `AGENTS.md`;
- a classificação estiver majoritariamente ambígua;
- o pacote final depender demais de inferência fraca;
- houver vazamento de identidade real;
- o estado de execução estiver corrompido ou inconsistente a ponto de impedir retomada segura;
- os contratos mínimos dos `schemas/` não forem atendidos;
- a worktree contiver delta não comprovado do próprio run ou o backup estiver incompleto na fase `apply`;
- em `adopt`, houver fonte de decisão de produto (legado ou detector) e `docs/decisions/` permanecer só com scaffold / sem `### DEC-NNN` correspondente no `identity-map`.

## Fechamento obrigatório

Ao concluir o fluxo, você deve sempre:

- dizer se ainda existe pendência;
- recomendar uma decisão quando houver ambiguidade ou conflito;
- revisar se `AGENTS.md` já centraliza corretamente o novo método;
- revisar se `AGENTS.md` não recebeu regras que deveriam estar em `project-rules/rules/*`;
- revisar se a pasta `project-rules/` contém as regras necessárias;
- revisar se dependências externas de `project-rules/` foram registradas em `.hephaestus/manifests/external-references-report.json`;
- revisar se `.hephaestus/manifests/run-state.json` marca corretamente fases `validated`, `produced`, `in_progress` ou `failed`;
- revisar se o mapa de cobertura explica o destino das regras relevantes;
- dizer explicitamente se o pacote final já pode ser considerado utilizável.
