# Closeout

## Objetivo

Fazer a revisão final do que foi gerado após `apply` e entregar ao usuário um fechamento consistente do pacote, com veredito explícito e a lista do que a LLM decidiu sozinha. O closeout **não decide nada novo**: o gate de resíduo (fase `route`) marca; esta fase traduz em veredito.

## Regras

- aplicar a regra única de checkpoint do `SKILL.md` em toda a fase: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `closeout` como `in_progress`; ao concluir o relatório, marcar `closeout` como `produced`; marcar `closeout` como `validated` quando a saída mínima estiver consistente com os manifests e os artefatos do `apply`; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`);
- conferir o estado de `.hephaestus/manifests/run-state.json` antes de iniciar: se a fase anterior `apply` não estiver `validated`, registrar pendência e reexecutar o que faltar;
- conferir o estado de `.hephaestus/manifests/coverage-map.json`: cada fragmento relevante precisa ter destino (`artifactType` + `outputPath`); pendência por fragmento sem destino;
- conferir o estado de `.hephaestus/manifests/external-references-report.json` quando existir; pendência por referência externa sem internalização registrada;
- revisar `AGENTS.md` e `project-rules/` para detectar regras que deveriam ter ido para `project-rules/rules/*` mas ficaram no `AGENTS.md`, ou árvore final inflada com arquivos vazios;
- revisar os quatro territórios do pacote — `AGENTS.md`, `project-rules/`, `_app-vault/` e `.app-work/` — conferindo que cada um recebeu só o que o plano determinou, sem vazamento de valor de regra entre territórios;
- em `mode: adopt`, conferir adoção completa do vault: `INDEX.md` presente; `docs/decisions/` com cláusulas `### DEC-NNN` coerentes com o `identity-map.json` quando a discover marcou material de decisão; **nenhuma** pasta sob o vault fora da lista fechada §2 restante no disco; scaffold-only de `docs/decisions/` com fontes de decisão ainda vivas (ou só movidas a `.app-work/` sem promoção) ⇒ pendência **bloqueante** e veredito `needs-followup` (não `ready`, não “degraded aceitável”);
- **nunca alterar `AGENTS.md`, `project-rules/`, `_app-vault/` nem `.app-work/` durante o closeout** — o closeout revisa e aponta; correções voltam para `apply` na próxima execução;
- conferir `.hephaestus/manifests/routing.json`: entradas `decidedBy: llm` cujo destino é arquivo novo em `_app-vault/docs/decisions/` ou em `project-rules/rules/` são **degradantes** (D26) e entram na lista nominal do relatório; entradas de resíduo em `project-rules/reference/`, `project-rules/index/` ou `.app-work/` não degradam;
- reportar `llmDecidedRatio` (proporção de fragmentos decididos pela LLM) **sempre, sem teto** — o critério de degradação é o tipo de destino, nunca o volume;
- não fixar ferramenta de stack: a revisão registra o que foi usado, sem recomendar substituição de analyzer/linter/validador fora de placeholder `<preencher na síntese>`;
- não citar projeto real em nenhum item do fechamento.

## Veredito

- `ready` — sem entrada degradante e sem pendência bloqueante; em `adopt`, vault canônico completo (decisões materializadas quando havia fonte);
- `degraded-but-usable` — há entrada degradante (lista nominal obrigatória) ou pendência controlada; o pacote é utilizável com ressalvas; **não** use este veredito para “decisions/ vazio na primeira adoção” quando havia material de decisão — isso é `needs-followup`;
- `needs-followup` — pendência bloqueante em aberto (ex.: fila de entrevista não drenada; adoção incompleta do vault: decisões legadas não promovidas a `DEC-NNN`); o run não é dado como concluído.

## Saída mínima

`.hephaestus/report.md` — sem omitir seção mesmo quando vazia (com `nenhuma` explícito), contendo:

1. `## Pendências` — lista de pendências restantes;
2. `## Decisão recomendada por pendência` — decisão objetiva para cada pendência;
3. `## Resíduo decidido pela LLM` — lista explícita das entradas degradantes (uma linha por entrada: `fragmentId → destinationPath`, marcando quando o destino vira `DEC-NNN` nova ou regra nova) e das entradas de resíduo não degradantes;
4. `## Métricas` — linha `llmDecidedRatio: <0..1>` com a proporção medida;
5. `## Candidatos a pack` — entradas de `.hephaestus/pack-candidates.json` (padrão novo aceito para o pack); também listar candidatos a promoção de glob já previsto no `drift-catalog` (não pasta fora da lista), quando houver;
6. `## Confirmações` — estado final de `AGENTS.md`; estado final de `project-rules/`; confirmação de que os fragmentos relevantes têm destino no mapa de cobertura (`.hephaestus/manifests/coverage-map.json`); resumo explícito das referências externas encontradas e do que deveria ser internalizado; confirmação do estado final de `.hephaestus/manifests/run-state.json`;
7. `## Veredito` — linha final com `ready`, `degraded-but-usable` ou `needs-followup`.

O relatório é consumido pelo gate `checkResidueGate` do `scripts/validate-package.mjs` (coerência entre entradas degradantes do `routing.json` e o veredito/lista).

## Escreve no repositório

Não. O relatório é gravado em `.hephaestus/report.md` (efêmero, gitignored); a revisão lê e aponta; correções voltam para `apply` na próxima execução.
