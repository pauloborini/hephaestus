# Anti-invention gates

Matriz compacta por fase do pipeline. **Inventar** = emitir `DEC` / `path` / `pasta` / `texto` sem a evidência obrigatória da coluna do meio. Bans puxados da linguagem já existente nos prompts (nunca inventar `DEC` sem fonte; path só em lista fechada; overlay não inventa pasta; não reescrever INVs sólidas).

| Fase | Pode produzir | Evidência obrigatória | Inventar = |
|------|---------------|----------------------|------------|
| `preflight` | `mode` (`adopt`/`maintain`) + catálogo resolvido + checkpoint | `meta.adoptionStatus` e recibos do mesmo run; git + baseline comprovado; base `catalog/*` ± overlay `routing` | **path/pasta/texto**: inventar modo por heurística de árvore; inventar pasta via overlay; migrar campo desconhecido do state (D4) |
| `discover` | inventário de fontes / riscos / ausentes | varredura guiada pelo `mode`; `naming-policy` + `drift-catalog`; lista fechada SCHEMA §2/§4 | **path/pasta**: inventariar path fora do escopo do modo como canônico; tratar root do vault inteiro como lista fechada |
| `snapshot` | `snapshot.json` (bytes congelados) | inventário da `discover`; cópia byte a byte das fontes listadas | **texto/path**: “corrigir” ou reescrever fonte no snapshot; incluir path não inventariado |
| `fragment` | `fragments.json` + `provenance[]` | unidades cortadas do snapshot; schema `fragment.schema.json` | **texto/path**: fragmentar sem proveniência; inventar enunciado que a fonte não traz; **inventar `territory`/`regime`/destino em fragment** (isso é da `route`) = fail |
| `route` | `routing.json` + fila `questions.json` | cascata (shield→1…5); match com evidência (`path`/`questionKey`/`pattern`); destino ∈ quatro territórios / lista fechada | **path/pasta**: destino fora da lista fechada; overlay inventando pasta; `.app-work/` com `generate`/`reconcile`; keep de vault fora de §2 |
| `reconcile` | `identity-map.json` (`action`/`decId`) | heading/fonte que enuncia a regra; inventário `max` (vivas + `## Histórico`); casamento por ID canônico ou enunciado | **DEC/texto**: inventar regra que a fonte não enuncia; reusar/renumerar `DEC-NNN`; cunhar diretamente de origem `.app-work/`, sem fragmento humano confirmado e congelado (INV9); ID sem inventário |
| `interview` | respostas persistentes no state ou temporárias em `run-answers.json`; snapshot aditivo de promoção humana | pergunta com `questionKey` + `contextFingerprint`; resposta humana; temporária vinculada ao `runId`; territórios fechados | **pasta/path**: gravar pasta nova em `routing.overlay`; destino fora da lista fechada; promover pasta unknown a default de catálogo |
| `plan` | `plan.json` / `plan.md` | ledgers (`routing`, identity-map, questions); destrutividade explícita | **texto**: operação destrutiva de qualquer proveniência sem aprovação, evidência e `planFingerprint` atual (INV7); omitir remoção/relocate real |
| `compose` | `staging/**` + `staging-manifest.json` | plano + identity-map + templates; só pastas da lista fechada §2; `keep` = bytes | **pasta/texto**: criar pasta fora da lista; arquivo vazio; reescrever bloco `shield`; inventar `DEC` além do mapa; copiar valor de decisão em `project-rules/` (INV4) |
| `verify_staging` | veredito staging | schemas/manifests sobre o staging; contrato do pacote | **texto**: “passar” com violação; inventar artefato ausente no manifest |
| `apply` | pacote no worktree (única tx) + backup | staging-manifest aprovado; backup completo; ordem relocate→…→keep | **path/DEC**: escrever fora da lista do manifest; reusar `ISSUE-NNN`; mutar skill instalada |
| `verify_applied` | veredito applied / rollback | hash disco ≡ staging-manifest; recuperação delimitada a recibos próprios | **texto**: declarar válido com hash divergente; reverter `hephaestus-state.json` (exceção INV1) |
| `closeout` | `report.md` + veredito | routing/coverage/identity-map pós-apply; lista nominal de resíduo LLM | **DEC/path/texto**: alterar territórios no closeout; inventar `DEC`/pendência sem ledger; `ready` com adoção incompleta |

## Lembretes transversais (já nos prompts)

- **DEC sem fonte** — `reconcile`: “nunca inventar regra que a fonte não enuncia”; cunhagem só com evidência + `max+1`.
- **Path fora de lista fechada** — territórios = `AGENTS.md` | `project-rules/` | SCHEMA §2 (`_app-vault/**`, `.app-work/**`); vault keep só `INDEX` / `docs/decisions` / `docs/TEMPLATES` / `specs`.
- **Pasta por overlay** — bloco `routing`: overlay não inventa pasta; `includeInPack` não grava pasta nova no overlay.
- **INVs sólidas** — não reescrever prosa normativa de INV1–INV11 / CN* além de mover/extrair; keep-bytes quando destino == origem.
