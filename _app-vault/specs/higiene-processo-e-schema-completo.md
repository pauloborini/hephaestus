# Spec — Higiene de processo e schema completo

Afeta: governanca-kit  
Status: rascunho para revisão humana (não implementada)  
Data: 2026-08-17  
Recorte: kit Hephaestus (repo fonte). Fora: skill nativa no Atlas Agents; mutar skill instalada em `shared/` ou `~/.claude/skills/` como origem.

## 1. Problema

O kit declara quatro territórios e modo `maintain`, mas `maintain` não higieniza o interior de `.app-work/`. Keep-by-position (INV2) + INV9 (`keep`|`relocate` só) preservam lixo, duplicata, pack concluído ainda em `guides/` e pastas que o schema não nomeia.

A skill auxiliar `organizar-app-work` cobre esse buraco. Dois schemas vivos = confusão e trabalho duplicado.

O catálogo atual manda `roadmap / research / ops` para `.app-work/private/` (gitignored). Nos projetos de referência o `roadmap/` é **versionado** e é a fila viva. Isso é bug de schema, não preferência de um repo.

## 2. Objetivo

Uma execução de `/hephaestus` (adopt ou maintain) deixa `.app-work/` no schema canônico **sem** skill auxiliar.

Schema único no pack, computado dos projetos com mais documentação (Atlas Agents, Paytrainer; DailyPace como confirmação). Pasta vazia não se cria.

Padrão novo detectado no alvo **não** vira overlay permanente por projeto. Vira candidato a inclusão no pack, com pergunta explícita. Evolução do pack só no repo Hephaestus → versão nova → zip → cópia para o harness (`shared`).

## 3. Fora de escopo

- Skill nativa dentro do aplicativo Atlas Agents.
- Overlay por projeto como mecanismo de evolução do schema (pastas novas, temas de archive novos).
- Editar a cópia instalada da skill durante um run no repositório alvo.
- Restaurar `done/` como pasta canônica (DEC-002 permanece).
- Restaurar arquivo que o usuário podou (archive ou vivo).

## 4. Schema fechado de `.app-work/`

Substitui a lista atual de `references/vault-schema/SCHEMA.md` §2 (bloco `.app-work/`) e o `templates/appwork/INDEX_TEMPLATE.md`. Pasta fora desta lista **não existe** para o framework: não ganha índice, não é scaffold, não é keep-by-position.

### 4.1 Vivo (criar só com conteúdo)

| Pasta | Papel | Git |
|---|---|---|
| `INDEX.md` | mapa do processo (âncora do `AGENTS.md`) | versionado |
| `.gitignore` | `references/` e `private/`; `issues/` se o repo for público | versionado |
| `hephaestus-state.json` | estado do kit | versionado |
| `guides/<NOME>_GUIDE/` | packs em execução (`INTENT`, `GUIDE`, `LEDGER`, `plans/`) | versionado |
| `guides/legados/` | monolítico ainda citado por fatia/pack vivo, sem pack próprio | versionado |
| `guides/README.md` | índice da pasta quando há conteúdo | versionado |
| `roadmap/` | `ROADMAP.md` + `slices/` — **única fila de promoção**, versionada | versionado |
| `brainstorming/<tema>/` | caderno vivo | versionado |
| `prd/` | PRD com consumidor ativo (fatia sem pack ou pack em execução). `Status: done` não dispensa se ainda referenciado | versionado |
| `docs/` | docs de operação/produto **vivos** e versionados (guia de voz, inventário, build, corpus). Projeto sem esse material não cria a pasta | versionado |
| `issues/` | `ISSUE-NNN`, `INDEX.md`, `README.md` (protocolo). Arquivos extras de registro de defeito/QA (ex. matriz) podem ficar aqui; não são obrigatórios no scaffold | privado: versionado; público: gitignored |
| `references/` | clones OSS e refs de terceiros — **único** lugar. Nunca SSOT citado por arquivo versionado | gitignored |
| `private/` | só `auditorias/`, `ops/`, `research/`, `notes/` | gitignored |

Raiz de `.app-work/`: só `INDEX.md`, `.gitignore`, `hephaestus-state.json` e as pastas da tabela. Arquivo solto na raiz = drift (relocate ou delete).

### 4.2 Proibido no vivo

- `done/` — legado: conteúdo migra ao espelho datado de guides na próxima execução.
- `private/references/` — duplicata de `references/`; relocate para `.app-work/references/`.
- `roadmap/` dentro de `private/` — relocate para `.app-work/roadmap/` se for fila viva; se for research morto, `archive/roadmap/` ou `private/research/`.
- `.md` solto em `guides/` (exceto `README.md`) — `guides/legados/` se ainda citado; senão archive ou delete.

### 4.3 Archive — espelho (formato imposto)

Mover, não duplicar. Data de pack = Plano F em `plans/F-fechamento.md` (`Status: CONCLUÍDO`); fallback = momento do roteamento. Semana civil: 1–7, 8–14, 15–21, 22–28, 29–31.

| Origem viva | Destino |
|---|---|
| `guides/<PACK>/` com Plano F `CONCLUÍDO` **ou** STALE (alvo morto) | `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/` |
| `brainstorming/<tema>/` fechado | `archive/perguntas/<tema>/` |
| `prd/` sem consumidor ativo | `archive/prds/` |
| `roadmap/` de marco concluído | `archive/roadmap/<MARCO>_<YYYY-MM>/` |

**Proibido** `archive/guides/<PACK>/` flat (sem `<YYYY-MM>/semana-<N>/`). Path já datado = canônico (não-toque **exceto** higiene de duplicata byte a byte).

Links internos de artefato já arquivado podem ficar stale. Repontar só referências **vivas**: slices (`**Pack:**`), `ROADMAP.md`, READMEs vivos, `brainstorming/*/PERGUNTAS_EM_ABERTO.md` em andamento.

Issues não espelham no ciclo normal. Se a pasta encher: lote `archive/issues/<YYYY>/`.

`references/` e `private/` não espelham (já gitignored).

### 4.4 Archive — depósito (nome fixo, cria se houver conteúdo)

Não é “qualquer pasta”. Nomes permitidos além do espelho:

`docs/`, `backlogs/`, `plans/`, `sprints/`, `features/`, `design-prototipos/`, `produto/`, `qa/`, `releases/`, `evidence/`, `issues/<YYYY>/`.

Material que não casa com nenhum nome → entrevista de padrão novo (§6), não inventar pasta.

### 4.5 Vault (inalterado na essência)

`_app-vault/`: `INDEX.md`, `docs/decisions/`, `docs/TEMPLATES/`, `specs/`. Path sob o vault fora dessa lista continua reclassificação (DEC-004), não keep.

## 5. Catálogo de roteamento

Alterar `catalog/routing-defaults.json`:

- **Remover / corrigir** o pattern que manda `roadmap / research / ops / dossiê` para `private/`. Split:
  - roadmap vivo → `.app-work/roadmap/`
  - research/ops de sessão → `.app-work/private/research/` ou `private/ops/`
  - dossiê de feature (casca) → `.app-work/archive/features/`
- Guides vivos → `.app-work/guides/`; concluídos/STALE → `.app-work/archive/guides/` (expansão datada na cascata, já existente).
- Monolítico citado sem pack → `.app-work/guides/legados/`.
- Docs de operação/produto vivos (não decisão, não spec técnica) → `.app-work/docs/`.
- Clones OSS, inclusive os hoje em `private/references/` → `.app-work/references/`.
- `PERGUNTAS_EM_ABERTO.md` scoped por tema → `.app-work/brainstorming/<tema>/`; global vivo → permanece processo; não vai para `private/` se o tema existir.

`routing.overlay` no state **não** ganha pastas novas. Continua válido só para: alias de root do vault, `forbiddenPatterns`, destino pontual de **um** arquivo já perguntado (`answers` com `this-project`).

`promote-to-catalog` deixa de ser o caminho de evolução de schema. Caminho novo: §6.

## 6. Padrão novo → pack (não overlay)

Detector (discover + route): path ou pasta sob `.app-work/` (ou equivalente de processo) que **não** está em §4.

Entrevista (texto fixo, PT-BR):

> Você criou um padrão novo (`<path ou tipo>`). Gostaria de incluir isso dentro do pack da skill para ficar padronizado em todos os projetos?

| Resposta | Neste run | Depois |
|---|---|---|
| Sim | aplica o destino proposto neste projeto; grava candidato em `.hephaestus/pack-candidates.json` e na seção do closeout | humano inclui no repo Hephaestus na próxima versão do pack (SCHEMA + catálogo + testes + INDEX_TEMPLATE). Skill instalada **não** é editada |
| Não | mapeia para pasta já listada em §4 (vivo ou depósito de archive). Se nenhum nome couber, `archive/docs/` como último recurso de depósito, com evidência no plano | não vira default |

Candidato tem: `pattern`, `destination` proposto, `evidence` (projeto-alvo anonimizado no relatório distribuível; no run local o path pode ser real), `answeredAt`. Relatório de closeout **não** cita nome de produto real em artefato do kit; o `pack-candidates.json` é efêmero (`.hephaestus/`, gitignored) e é o insumo do maintainer do kit.

Sem resposta = não cria pasta nova (fila de entrevista; closeout `needs-followup` se o arquivo ficaria órfão).

## 7. Higiene no `maintain` (e também no `adopt`)

### 7.1 Discover — itens novos (além dos atuais 1–7)

8. Interior de `.app-work/`: arquivos soltos na raiz; `.md` solto em `guides/`; pack com Plano F `CONCLUÍDO` ou STALE ainda em `guides/`; PRD sem consumidor; brainstorm marcado fechado ainda vivo; `done/`; flat `archive/guides/<PACK>/`; `private/references/`; `roadmap` sob `private/`.
9. Duplicata byte a byte (`cmp` / hash) entre vivo×vivo e vivo×archive.
10. Candidato a condensar: arquivo cujo conteúdo único cabe num canônico vivo mais completo (mesmo tema; canônico mais recente ou spec/DEC vigente). Não condensar no escuro — entra no plano como `condense` destrutivo.
11. Path fora de §4 → fila §6.
12. Packs em `guides/` com Plano F pendente **não** arquivar (`PRONTO PARA AUDITORIA COM PENDÊNCIAS` ≠ `CONCLUÍDO`).

Custo: `maintain` deixa de ser “só drift de AGENTS/outras ferramentas”. Continua a não ressintetizar `AGENTS.md`/`project-rules/`/`docs/decisions/` canônicos sem drift. A varredura extra é **só** processo (`.app-work/`).

### 7.2 Regimes e operações

Estender INV9: fragmento com origem em `.app-work/` pode ser `keep` | `relocate` | `delete` | `condense`. Continua **proibido** `generate` e `reconcile` (processo não vira `DEC-NNN` por essa via; promoção a decisão segue SCHEMA §6 / LEDGER).

`schemas/routing.schema.json` e `plan.json`: `regime`/`operation` incluem `delete` e `condense`. `condense` = fundir trecho único no canônico + nota de rastro + remover a origem.

`plan.operation` alinhado: `create` | `amend` | `overwrite` | `move` | `keep` | `skip` | `delete` | `condense`.

Keep-by-posição **não** aplica quando: duplicata byte a byte; pack concluído/STALE em `guides/`; origem `done/` ou flat legado; arquivo classificado `delete`/`condense` no plano.

### 7.3 Destrutividade

`delete` e `condense` são `destructive: true` (exigem aprovação no plano, inclusive em `maintain`). `move` de pack inteiro para archive datado é destrutivo se o pack for citado por código versionado; caso contrário, em `maintain`, o plano ainda lista a operação (usuário aprova o plano quando houver qualquer destrutivo — regra atual de `plan.md`).

### 7.4 READMEs

Após apply que altere o papel de uma pasta (`guides/`, `prd/`, `docs/`, `issues/`, `archive/`, `roadmap/`, `references/`, `private/`): atualizar ou criar o `README.md` da pasta (tipo de conteúdo, não lista eterna de nomes de arquivo). `INDEX.md` da raiz não duplica o README.

Usuário podou arquivos: não restaurar; ajustar README/tabela para o filesystem real.

## 8. Auxiliar

Depois desta versão do kit (DEC-003: próximo inteiro após `3` → `4`):

- O procedimento de `organizar-app-work` está **dentro** do Hephaestus.
- A skill auxiliar no harness fica obsoleta: não é mais o caminho; o kit não a invoca.
- Remoção do arquivo no `shared` é follow-up de harness, não deste recorte de código do kit — mas o kit não pode documentar “rode a auxiliar”.

## 9. Distribuição

Inalterado: `scripts/pack-release.mjs` → `hephaestus-N.zip` com raiz `hephaestus/`. Maintainer copia por cima da pasta de skills do harness.

Run no projeto alvo **nunca** escreve em `prompts/`, `catalog/`, `references/vault-schema/` da instalação.

## 10. Decisões de kit a gravar na implementação

No apply desta fatia no repo Hephaestus (não no alvo):

- Nova cláusula em `estrutura-do-kit.md`: schema de processo §4 desta spec (inclui `roadmap/` versionado, `docs/` vivo, `guides/legados/`, depósito de archive nominado, higiene em maintain).
- Nova cláusula: padrão novo → pack-candidate + pergunta; overlay não evolui schema.
- `INDEX.md` do vault: atualizar `updated` e, se a cláusula nova for domínio próprio, só se o arquivo de decisões crescer a ponto de split — default: **estender** `estrutura-do-kit.md` (SCHEMA §4.8).

Não promover esta spec a `DEC-NNN` no closeout de um projeto alvo. As DECs novas são do **produto kit**.

## 11. Testes mínimos (aceitação)

1. Golden de roteamento: roadmap não cai em `private/`; cai em `.app-work/roadmap/`.
2. Fixture com pack `CONCLUÍDO` em `guides/` → destino `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`.
3. Fixture duplicata byte a byte → `delete` da cópia, canônico intacto.
4. Fixture `private/references/clone` → `relocate` para `.app-work/references/`.
5. Fixture pasta `.app-work/foo-novo/` → pergunta de pack-candidate; sem resposta não cria default.
6. `INDEX_TEMPLATE.md` lista `roadmap/`, `docs/`, `guides/legados/`; **não** lista `done/`; archive de guides é datado.
7. `routing.schema.json` aceita `delete` e `condense`.
8. Discover maintain inventaria interior de `.app-work/` (item 8) mesmo com `AGENTS.md` inalterado.

## 12. Ordem de implementação sugerida (plano depois desta spec)

Não é o plano detalhado. Fatias naturais:

1. SCHEMA + INDEX_TEMPLATE + DEC no vault do kit + catálogo.
2. Discover/route/plan/compose/apply: higiene + regimes novos + testes.
3. Interview/closeout: pack-candidates; cortar evolução via overlay.
4. Docs públicas (`README`, `SKILL`, `COMMANDS`) + bump de versão do pack.

## 13. Explicitação de ambiguidades (fechadas)

- `docs/` é pasta viva canônica. Atlas sem `docs/` não cria a pasta.
- STALE (alvo morto, mesmo sem Plano F impecável) arquiva como pack concluído, com README `STALE` no pack.
- Condensar exige canônico vivo identificável e entra no plano aprovável; dúvida → pergunta, não LLM sozinha em `delete`.
- Último recurso se o usuário recusa pack-candidate e nada em §4 cabe: `archive/docs/`.
- Overlay permanece no schema do state para alias/forbidden/destinos pontuais; **não** para pastas.
