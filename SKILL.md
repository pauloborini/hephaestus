<!-- Idioma: [English](SKILL.en.md) · **Português** -->

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
| `.app-work/` | processo: estado, issues e guias — nunca insumo de regra |

Dois modos internos, decididos pela presença de `.app-work/hephaestus-state.json`:

- `adopt` — state ausente: **adoção completa** dos quatro territórios até o pacote canônico. Não basta scaffoldar pastas nem “keep” de conteúdo já sob um root de vault: regras de produto encontradas (inclusive sob alias `.app-vault/` / `_app-vault/` fora de `docs/decisions/`, headings `### D\d+`, `DECISOES_*`, seções “Decisões fechadas”, ADRs/especificações com norma observável) **viram `### DEC-NNN` em `_app-vault/docs/decisions/`** na mesma execução; pastas do vault fora da lista fechada de `references/vault-schema/SCHEMA.md` §2 são reclassificadas (processo → `.app-work/`, spec → `specs/`, decisão → `docs/decisions/`); `INDEX.md` deriva dos `Afeta:` materializados. Scaffold vazio de `docs/decisions/` com material de decisão ainda vivo fora do canônico = adoção incompleta — closeout `needs-followup`, nunca `ready`;
- `maintain` — state presente: escopo reduzido. Inventaria drift e artefatos de outras ferramentas (`catalog/drift-catalog.json`) **e** o interior de `.app-work/` (packs F/STALE, `.md` solto, `private/references/`, `done/` legado, archive flat, duplicatas, path fora da lista fechada). Não-toque (INV2) vale só para paths **já** na lista fechada §2 no formato canônico — presença sob o root do vault **não** implica canônico. Território `process` (INV9): só `keep|relocate|delete|condense`. Schema vivo inclui `roadmap/`, `docs/`, `guides/legados/`. Padrão novo → entrevista `includeInPack` → `.hephaestus/pack-candidates.json`; overlay do state não inventa pasta; a skill instalada é imutável. O kit não depende de skill auxiliar de organização.

O fluxo de qualquer execução é o pipeline de 13 fases acima.

## Agnosticismo de framework

O kit é agnóstico de framework e linguagem.

- A estrutura gerada (`AGENTS.md` + `project-rules/`) é a mesma para qualquer repositório.
- Os templates não fixam ferramentas, comandos nem gates de framework específico.
- Durante a composição, detecte o framework e a linguagem do repositório do usuário (ex.: Flutter, React, Go, Python) e preencha regras, checklists e gates com as ferramentas reais do projeto (analyzer, linter, validador estrutural, comando de teste).
- Regras específicas de domínio do usuário nunca entram no kit; entram no pacote gerado para o projeto.

## Estado De Execução

Durante o processo, a execução deve manter checkpoint em `.hephaestus/manifests/run-state.json` no workspace do usuário.

Esse arquivo é obrigatório sempre que houver trabalho multi-etapa, para permitir retomada confiável após interrupção. Ele é mecanismo do processo; não faz parte da estrutura canônica do pacote gerado. O diretório `.hephaestus/` é 100% efêmero e gitignored: staging, backup, run-state e ledgers de execução vivem lá, e a linha `.hephaestus/` no `.gitignore` do alvo é garantida pela fase `apply`.

## Estado do projeto

Além do checkpoint efêmero, a execução consulta e grava o estado **versionado** do projeto em `.app-work/hephaestus-state.json` (nome em minúsculo — o gate do validador reprova variante em caixa alta). Ele é editável à mão e dividido em **quatro blocos** (D29), cada um com dono de leitura distinto:

| Bloco | Lido por | Conteúdo |
|-------|----------|----------|
| `meta` | `preflight` | `packVersion`, `schemaVersion`, `lastRunAt`, `lastRunId` — versões e identidade do último run |
| `routing` | `preflight` e `route` | overlay do catálogo (mesmo shape de `catalog/routing-defaults.json`) + `forbiddenPatterns` opcional — overlay não inventa pasta |
| `answers` | `route` (nível 2 da cascata) e `interview` | mapa `questionKey` → resposta humana com `answer` estruturada, `scope` (`this-run`/`this-project`/`promote-to-catalog`) e `sourceEvidence` |
| `shield` | `route` (antes do nível 1) e `compose` | blindagem opt-in de conteúdo de terceiros: lista de `{ path, selector }`, vazia por default |

O arquivo é **sem métricas**: telemetria (ex.: `llmDecidedRatio`) vive em `.hephaestus/`, nunca aqui — um arquivo que acumula telemetria deixa de ser editável à mão. Campo de topo que o schema não conhece é **ignorado** e o necessário é reperguntado, nunca migrado (D4). `interview` é a única fase que grava o state, fora da transação: o rollback de `verify(applied)` nunca reverte as respostas humanas (INV1, exceção declarada em `prompts/apply.md`).

## Regra central

Você não deve improvisar a árvore final livremente.

Antes de produzir qualquer artefato final:

- leia este `SKILL.md`;
- leia apenas os prompts da fase atual em `prompts/`;
- use `templates/` como alvo estrutural;
- use `schemas/` para restringir a forma da saída;
- use `references/` (plural) como apoio do próprio kit, apenas para leitura; **não confundir** com `reference/` (singular) que é a pasta do pacote gerado dentro de `project-rules/`;
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

`CLAUDE.md` é ponte, nunca conteúdo: uma linha `@AGENTS.md` e nada mais. Existe para que cliente que lê só `CLAUDE.md` caia no mesmo contrato, sem manter dois arquivos. Projeto que já tem `CLAUDE.md` com conteúdo próprio: reabsorver o conteúdo no `AGENTS.md`/`project-rules/` e reduzir o arquivo à ponte — nunca deixar dois contratos vivos.

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

## Fases

### 1. Preflight

Leia [prompts/preflight.md](prompts/preflight.md).

Guarda o terreno antes de qualquer trabalho: exige repositório git e worktree limpa nos dois modos, sem override, e resolve o `mode` por presença de `.app-work/hephaestus-state.json` (`adopt` ausente, `maintain` presente) — nunca por heurística sobre estrutura presente. Nenhuma escrita no repositório.

### 2. Discover

Leia [prompts/discover.md](prompts/discover.md).

Saída mínima:

- inventário de fontes por modo (`adopt` integral, `maintain` guiado por `catalog/drift-catalog.json`);
- lista de fontes ausentes;
- observações de ambiguidade estrutural inicial.

### 3. Snapshot

Leia [prompts/snapshot.md](prompts/snapshot.md).

Congele o inventário textual relevante antes de reorganizar.

Saída mínima:

- mapa entre fonte original e unidades processáveis;
- checkpoint da fase em `.hephaestus/manifests/run-state.json`.

### 4. Fragment

Leia [prompts/fragment.md](prompts/fragment.md).

Saída mínima:

- fragmentos menores com localização e texto bruto.

### 5. Route

Leia [prompts/route.md](prompts/route.md).

Atribui `territory` e `regime` por fragmento, com evidência, numa cascata de níveis que para no primeiro que decide; o resíduo da LLM nunca decide sozinho destino destrutivo.

Saída mínima:

- roteamento por fragmento (`territory`, `regime`, `destinationPath`, `decidedBy`, `evidence`).

### 6. Reconcile

Leia [prompts/reconcile.md](prompts/reconcile.md).

Motor de identidade: casa por `DEC-NNN` e por similaridade; **cunha `create` (max+1) quando não há a quem casar** — inclusive na primeira adoção (inventário vazio). Detecta conflito e duplicação de valor entre territórios. Em `adopt`, candidato a decisão roteado para `docs/decisions/` nunca termina em `keep` sem `decId`.

Saída mínima:

- inventário de decisões reconciliadas/cunhadas, com identidade preservada (`identity-map.json` com `decId` em todo destino `docs/decisions/`).

### 7. Interview

Leia [prompts/interview.md](prompts/interview.md).

Dreno único da fila de perguntas; grava as respostas no state **fora** da transação (imune a rollback).

Saída mínima:

- fila drenada e respostas persistidas no bloco `answers`.

### 8. Plan

Leia [prompts/plan.md](prompts/plan.md).

Emite `.hephaestus/plan.json` e `.hephaestus/plan.md` legível e editável, com rastreio obrigatório a fragmento ou resposta e destrutividade derivada por definição mecânica. O usuário lê e aprova antes de qualquer escrita.

Saída mínima:

- plano por artefato (operação, regime, justificativa, origem, destrutividade).

### 9. Compose

Leia [prompts/compose.md](prompts/compose.md).

Materializa o pacote inteiro em `.hephaestus/staging/**` com `.hephaestus/staging-manifest.json` (sha256 por artefato). Não escreve no repositório; dúvida aqui é bug de fase anterior, nunca pergunta.

Saída mínima:

- staging completo + `staging-manifest.json`;
- `external-references-report.json` e `coverage-map.json` preservados.

### 10. Verify (staging)

Leia [prompts/validate.md](prompts/validate.md) com `Alvo: staging`.

Roda os enforcements contra `.hephaestus/staging/`; status `valid`, `degraded` ou `blocked`.

Saída mínima:

- veredito de staging e checkpoint com fases `validated` vs `produced`.

### 11. Apply

Leia [prompts/apply.md](prompts/apply.md).

Única fase que escreve no repositório. Backup completo em `.hephaestus/backup/<ts>/` antes do primeiro byte, worktree revalidada desde o `preflight`, e ordem `relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`. A lista final é o `staging-manifest.json` inteiro mais as deletions de `.hephaestus/staging-deletions.json`.

Saída mínima:

- pacote gravado na ordem transacional;
- `artifactsWritten` completo no run-state.

### 12. Verify (applied)

Leia [prompts/validate.md](prompts/validate.md) com `Alvo: applied`.

Recomputa o hash de cada artefato do `staging-manifest.json` no disco; divergência dispara rollback imediato por git e por `backup/<ts>/`, preservando o state.

Saída mínima:

- veredito de disco hash a hash.

### 13. Closeout

Leia [prompts/closeout.md](prompts/closeout.md).

Emite `.hephaestus/report.md` com pendências, decisões em aberto, referências externas e o veredito final (`ready`, `degraded-but-usable` ou `needs-followup`). Nunca altera o pacote.

Saída mínima:

- relatório de fechamento consistente com os manifests.

## Leituras obrigatórias por fase

- `preflight`: `prompts/preflight.md`, `catalog/routing-defaults.json`, `catalog/drift-catalog.json`
- `discover`: `prompts/discover.md`, `manifests/naming-policy.json`
- `snapshot`: `prompts/snapshot.md`
- `fragment`: `prompts/fragment.md`, `schemas/fragment.schema.json`
- `route`: `prompts/route.md`, `catalog/routing-defaults.json`, bloco `routing` e `answers` do state
- `reconcile`: `prompts/reconcile.md`, `_app-vault/docs/decisions/**`
- `interview`: `prompts/interview.md`, bloco `answers` do state
- `plan`: `prompts/plan.md`, ledgers de execução
- `compose`: `prompts/compose.md`, `templates/`, `references/`
- `verify_staging`: `prompts/validate.md` (Alvo: staging), `schemas/`, `manifests/`
- `apply`: `prompts/apply.md`, `staging-manifest.json`
- `verify_applied`: `prompts/validate.md` (Alvo: applied), `staging-manifest.json`
- `closeout`: `prompts/closeout.md`, `templates/`, artefatos gerados

## Guardrails

- não citar projetos reais em nenhum artefato distribuível;
- não copiar textos longos de exemplo sem neutralização;
- não criar categorias sem papel operacional claro;
- não inflar a árvore final com arquivos vazios;
- não marcar `valid` quando houver violação dos contratos mínimos;
- `AGENTS.md` deve ser centralizador e enxuto, não um depósito de todas as regras;
- regras de domínio, arquitetura, UI, contrato, segurança e operação devem ficar em `project-rules/rules/*`, não no `AGENTS.md`;
- regras de engenharia devem ser autocontidas: nada em `AGENTS.md` ou `project-rules/` pode depender de arquivo externo para completar decisão;
- dependências externas de arquivos dentro de `project-rules/` devem ser mapeadas e reportadas, não escondidas;
- nada é escrito no repositório fora da fase `apply`; a única exceção é `interview` gravando `.app-work/hephaestus-state.json` fora da transação;
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
- a worktree estiver suja ou o backup estiver incompleto na fase `apply`;
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
