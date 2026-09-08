# Route — Não-toque e detectores

> Carregar **somente** quando a cascata estiver no nível 1 (não-toque/identidade) ou nível 4 (detectores sintáticos).

### Nível 1 — não-toque e identidade

Calcular o destino do fragmento a partir da **classificação estrutural** (detectores sintáticos do nível 4) **antes** de qualquer consulta a respostas, catálogo ou julgamento. Se `destinationPath` normalizado for igual ao caminho de origem atual, decidir `regime: keep`, `decidedBy: keep` e marcar o fragmento como **fora da síntese** — cópia byte a byte, nunca regeneração.

**Carga no Progressive Disclosure:** no nível 1, a “classificação estrutural” é o cálculo de `destinationPath` por posição/lista fechada (vault §2, territórios canônicos) descrito neste bloco L1 — **não** exige carregar nem percorrer a lista completa de detectores do nível 4. O L4 só entra quando o L1 não decide keep por posição e a cascata chega ao passo dos detectores; a menção ao L4 aqui nomeia a *mesma família* de classificação estrutural, não a ordem de leitura do arquivo.

A decisão é por **posição**, nunca por comparação com um snapshot de execução anterior: `.hephaestus/` é efêmero (D6) e uma máquina nova não pode depender de estado persistido para preservar a edição humana feita no lugar certo.

**Não-toque no vault ≠ “está sob o root do vault”.** Só é keep por posição quando a origem já está na **lista fechada** de `references/vault-schema/SCHEMA.md` §2, no formato canônico:

- `_app-vault/INDEX.md` (ou alias `.app-vault/INDEX.md`);
- `_app-vault/docs/decisions/**` — cláusulas já no heading `### DEC-NNN — …`;
- `_app-vault/docs/TEMPLATES/**`;
- `_app-vault/specs/**`.

Alias do projeto: `.app-vault/` ≡ `_app-vault/` para classificação; o `destinationPath` emitido usa o alias declarado no overlay/state quando houver, senão `_app-vault/`.

Path sob o root do vault **fora** dessa lista (`docs/features/`, `docs/platform/`, `docs/releases/`, `archive/`, `_private/`, dossiês, `DECISOES_*`, etc.) **não** é keep por posição — a cascata continua (catálogo → detectores → LLM/pergunta). Em `adopt`, esse material é reclassificado na mesma execução; em `maintain`, a integridade do vault (discover item 5) também o inventaria como drift estrutural.

Fragmento cujo texto já é um heading canônico `### DEC-NNN — <regra>` (em-dash) decide território `vault` com o ID **congelado** (cunhagem e reconciliação in-place na fase `reconcile`). Headings legados (`### D1`, `### DEC-01` sem em-dash, “Decisões fechadas”) **não** congelam ID — são candidatos a cunhagem.

### Nível 4 — detectores sintáticos

Classificação estrutural determinística (a mesma usada no nível 1), nesta ordem:

- regra de domínio enterrada no contrato do agente — origem `AGENTS.md` legado (com seção de regra, ex. `## Regra de domínio`) ou arquivo de regras de agente de outra ferramenta (os globs vigiados de `catalog/drift-catalog.json`) + verbo deôntico ⇒ regra → `project-rules/rules/`;
- origem datada em `.app-work/archive/guides/<YYYY-MM>/semana-<N>/` (espelho canônico) ⇒ destino é a própria origem — keep / não-toque (DEC-002);
- pack em `.app-work/guides/<NOME>_GUIDE/` com Plano F `Status: CONCLUÍDO` ou `STALE` ⇒ relocate para `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE/` — nunca keep;
- `.md` solto em `.app-work/guides/` (exceto `README.md`) ⇒ relocate para `.app-work/guides/legados/`;
- origem em `.app-work/private/references/` ⇒ relocate para `.app-work/references/` (preservar sufixo);
- origem em `.app-work/private/roadmap/` ⇒ relocate para `.app-work/roadmap/` (preservar sufixo);
- PRD em `.app-work/prd/` com `Status: done|concluído|fechado|arquivado|aposentado` **e** sem citação em fatia/pack vivo (`roadmap/` ou `_GUIDE` não CONCLUÍDO/STALE) ⇒ relocate para `.app-work/archive/prds/` (preservar sufixo). Citação viva vence o status;
- `brainstorming/<tema>/` (ou `.md` solto no caderno) com `Status` fechado/concluído/done ⇒ relocate para `.app-work/archive/perguntas/<tema>/`;
- origem flat em `.app-work/archive/guides/<PACK>/` (sem `<YYYY-MM>/semana-<N>/`) ⇒ relocate para `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<PACK>/` (DEC-002) — migração, nunca keep;
- origem legada em `.app-work/done/` (removido da lista fechada) ⇒ relocate para `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE|arquivo/` (DEC-002) — migração, nunca keep; data = Plano F `Status: CONCLUÍDO` senão momento do roteamento;
- duplicata byte a byte (mesmo hash) **só** vivo×vivo e vivo×archive ⇒ `regime: delete` da cópia extra; canônico = o vivo (archive é a cópia). Nunca hashear `references/` nem `private/` para delete; nunca apagar membro de pack `_GUIDE` vivo não-concluído/não-STALE;
- trecho único vivo (texto ≥ 40 chars normalizados) **estritamente** contido num único canônico vivo mais longo, mesmo tema (stem do arquivo) ⇒ `regime: condense` da origem no canônico; 0 ou 2+ canônicos = não decide (não condensar no escuro). Não condensar `archive/`, `references/`, `private/` nem membro de pack `_GUIDE` vivo. Duplicata idêntica continua `delete`, não `condense`;
- path sob `.app-work/` fora da lista fechada §4 (pasta unknown) ⇒ **não** keep: enfileira pergunta pack-candidate (fila §6);
- origem já na lista fechada canônica (§2 + nível 1 acima: `AGENTS.md`, `project-rules/**` já no lugar, vault só `INDEX`/`docs/decisions`/`docs/TEMPLATES`/`specs`, `.app-work/` vivo **exceto** `done/`, archive flat, `private/references/`, `private/roadmap/`, PRD sem consumidor, brainstorm fechado, pack F/STALE em `guides/`) ⇒ destino é a própria origem — não-toque (INV2/INV11/CN2); **proibido** tratar `_app-vault/**` ou `.app-vault/**` inteiro como canônico;
- candidato a decisão legado — path `DECISOES_*`, heading `### D\d+`, `### DEC-\d+` sem em-dash canônico, ou seção “Decisões fechadas” / “Closed decisions” ⇒ `_app-vault/docs/decisions/<dominio>.md` (`<dominio>` = slug da feature/pasta pai ou stem normalizado), `regime: reconcile` — **obrigatório em `adopt`**; ID legado não congela numeração;
- OpenAPI/JSON-Schema (texto com `openapi` ou `json-schema`) ⇒ contrato → `project-rules/contracts/`;
- heading + verbo deôntico + valor numérico (norma de produto observável) ⇒ candidato a decisão → `_app-vault/docs/decisions/<dominio>.md`, `regime: reconcile`;
- path sob vault fora da lista fechada §2 que **não** é candidato a decisão nem spec técnica ⇒ `.app-work/archive/` (preservar sufixo relativo) — casca/dossiê não é verdade vigente;
- tabela tipo→arquivo ⇒ índice → `project-rules/index/`;
- bloco de código sem norma associada ⇒ referência → `project-rules/reference/`.

Decide `decidedBy: detector`.
