# Relatório de Melhorias Sistemáticas: Hephaestus v7

## 1. Veredito de Gating

- **Status:** Aprovado Parcialmente — houve corte de candidatos para Out-of-Scope.
- **Objetivo Estratégico:** fechar as inconsistências contratuais que sobraram do ciclo v7, tornando a transação do `apply`, o vocabulário do plano e o handoff entre runs executáveis sem interpretação do agente.
- **Classificação de Sizing:** Modular.
- **Aprovação:** resumo de oito melhorias e três fases aprovado pelo usuário nesta conversa em 2026-09-14. A aprovação autoriza este relatório; não autoriza implementar o catálogo.
- **Fronteiras de Escopo:**
  - **In-Scope:** contrato da transação `apply` (mint de ISSUE-NNN), vocabulário `operation`×`regime` do plano, cobertura da definição mecânica de destrutivo, handoff do state entre runs, decisão de visibilidade do `issues/`, coerência entre gates de script e distribuição em zip, fechamento do closeout e organização dos templates de issues.
  - **Out-of-Scope (Descartado/Postergado):**
    - Revalidação leve após maintain interrompido (rebaixamento conservador para `adopt` é seguro por design; otimizar cenário raro — crash entre `apply` e `verify` seguido de abandono do run — tem ROI negativo agora).
    - Reverter a exclusão de `scripts/` do zip — decisão de empacotamento da v6 (`pure skill packaging`); o achado `ARCH-02` se resolve condicionando os gates, sem reabrir a decisão.
    - Auditoria dos scripts validadores — fora do boundary documental desta passada; os achados abaixo são contratuais, não falhas reproduzidas em execução.
- **Base da análise:** leitura do estado vigente na v7 — `SKILL.md`, os 13 prompts do pipeline (incluindo subdocs de `route/`), schemas de estado (`hephaestus-state`, `run-answers`, `run-state`, `routing`), templates (`AGENTS.md.template`, `DECISION_TEMPLATE`, `DECISION_PROTOCOL`, `ISSUES_*`), `references/vault-schema/SCHEMA.md`, `references/anti-invention-gates.md` e `manifests/kit-manifest.json`. O catálogo de 2026-09-11 (`melhorias-sistematicas-hephaestus.md`) foi implementado no commit `c4eb711` e publicado na v7; este relatório cobre o residual pós-implementação.

---

## 2. Raio de Impacto & Decomposição Analítica

| Componente / Fluxo | Vetor Crítico | Causa-Raiz | Raio de Impacto (Blast Radius) | Risco |
|---|---|---|---|---|
| Mint de ISSUE-NNN no `apply` | Arquitetura | Escrita consumida fora do staging-manifest/baseline/backup; fila sem fase produtora | Transação `apply`, backup, `.app-work/issues/` do projeto | Alto |
| Gates de validação × distribuição | Arquitetura | Prompts citam `scripts/validate-package.mjs`, excluído do zip (`packExcludes`) | `plan`, `reconcile`, `verify(staging/applied)`, `closeout` | Médio |
| Templates de issues | Arquitetura | Templates de processo alojados na pasta de templates do vault | Árvore do kit, `kit-manifest.json`, fixtures de teste | Baixo |
| Aprovação em `maintain` | Lógica | Definição mecânica de `destructive` não cobre `overwrite` de contrato existente | `CLAUDE.md`/documentos versionados do usuário, plano | Alto |
| Visibilidade do `issues/` | Lógica | Decisão D43 ("decidida na adoção") sem ponto de captura declarado | `.gitignore` gerado, `issues/` do projeto | Médio |
| Fechamento (closeout) | Lógica | "Re-run what is missing" contraria a proibição de alterar territórios na fase | Pacote aplicado, veredito final | Médio |
| Vocabulário plano × roteamento | Dados | Três enumerações (`plan.operation`, `routing.regime`, ordem do `apply`) sem correspondência normativa | `plan.json`, `compose`, `apply`, gate `checkPlanContract` | Alto |
| Continuidade entre runs | Resiliência | Worktree limpo exigido para novo run × state escrito fora da transação (INV1) | Retomada, respostas humanas, seleção de modo | Médio |

---

## 3. Catálogo de Melhorias Propostas

### Eixo: Fluxo & Lógica

- **`FLOW-01` Overwrite de contrato existente é destrutivo**
  - **Contexto Atual:** `prompts/plan.md` deriva `destructive` mecanicamente de sete condições (adopt; remoção de arquivo versionado; move de arquivo citado por código; remoção de `DEC-NNN`; mudança de valor de decisão viva; remoção de third-party de `AGENTS.md`; `delete`/`condense`). Nenhuma condição cobre `overwrite` de arquivo versionado em `maintain`: `SKILL.md` e `prompts/compose.md` mandam reabsorver `CLAUDE.md` com conteúdo próprio e reduzi-lo à bridge `@AGENTS.md` — operação `overwrite` que descarta conteúdo versionado do usuário sem exigir `approved`/`approvalEvidence`/`planFingerprint`.
  - **Ação Técnica:** acrescentar à lista mecânica a condição "overwrite/reabsorção de contrato ou documento versionado existente" (o `CLAUDE.md` com conteúdo próprio é o caso canônico), preservando a regra de que autorização explícita prévia no pedido, cobrindo exatamente a operação e o escopo, satisfaz o gate com registro em `approvalEvidence`.
  - **Impacto Direto:** fecha o furo de aprovação em `maintain`; nenhum documento versionado do usuário é sobrescrito sem consentimento registrável.
  - **Critério de Sucesso (DoD):** a lista mecânica em `prompts/plan.md` contém a condição e o `compose` a referencia. Cenário de pressão: `maintain` em repo com `CLAUDE.md` próprio → operação marcada `destructive: true` exigindo `approved` + `approvalEvidence` + `planFingerprint`; sem aprovação, o `apply` não escreve; com autorização explícita prévia cobrindo a operação, aplica sem segunda pergunta.

- **`FLOW-02` Dono para a visibilidade do `issues/`**
  - **Contexto Atual:** `references/vault-schema/SCHEMA.md` §2.2 (D43) decide versionar vs gitignorar `issues/` ("repo público ignora via `.app-work/.gitignore`… Decidida na adoção, regra de um só caminho") e `prompts/compose.md` materializa o `.gitignore` com a linha "`issues/` when the repository is public" — mas nenhum prompt define como a adoção determina público/privado: o enum de `reason` da entrevista (`route-ambiguity…context-changed`, em `prompts/interview.md` e `schemas/run-state.schema.json`) não cobre essa decisão e nenhuma fase recebe resposta com esse eixo. O `compose` decide sozinho por inferência do ambiente.
  - **Ação Técnica:** dar ponto de captura declarado à decisão: pergunta de adoção com `reason` própria (ou reutilização declarada com texto específico), resposta persistida com escopo `this-project`, e `compose` consumindo a resposta — nunca inferindo; sem resposta, aplicar o default conservador declarado (ignorar `issues/`, pois o risco assimétrico é vazar contexto interno/PII em repo público) e registrar pendência.
  - **Impacto Direto:** decisão D43 executável sem adivinhação; comportamento auditável no state.
  - **Critério de Sucesso (DoD):** prompts de `discover`/`interview`/`compose` descrevem captura, persistência e consumo da resposta, coerentes com o enum de `reason` usado. Cenário de pressão: adoção em repo público remoto sem resposta prévia → a pergunta nasce na fila com reason declarada; sem resposta, o `.gitignore` gerado usa o default conservador explícito e a pendência aparece no closeout; com resposta, o arquivo gerado reflete a resposta em `adopt` e `maintain`.

- **`FLOW-03` Closeout sem contradição**
  - **Contexto Atual:** `prompts/closeout.md` manda "record a pending and re-run what is missing" quando o `apply` anterior não está `validated`, e no mesmo arquivo proíbe alterar qualquer território durante a fase ("never alter `AGENTS.md`, `project-rules/`, `_app-vault/`, or `.app-work/` during closeout — corrections return to `apply` on the next run"), com a Purpose declarando que a fase não decide nada novo. "Re-run" não é definido e contraria a proibição.
  - **Ação Técnica:** reescrever a regra para o comportamento coerente com o resto do contrato: `apply` não validado ⇒ registrar pendência, veredito refletindo (`needs-followup` quando bloqueante) e retorno ao `apply` na próxima execução autorizada — sem reexecução de escrita dentro do closeout.
  - **Impacto Direto:** uma só leitura possível para o fechamento; sem risco de o agente "corrigir" o pacote na fase de revisão.
  - **Critério de Sucesso (DoD):** `prompts/closeout.md` sem a ordem de reexecução. Cenário de pressão: closeout encontra `apply` em `produced`/`failed` → emite pendência e veredito sem escrever em território nenhum; o relatório aponta o retorno ao `apply` na próxima execução.

### Eixo: Dados & Estado

- **`DATA-01` Mapeamento normativo `operation` × `regime`**
  - **Contexto Atual:** três enumerações convivem sem correspondência declarada: `plan.operation ∈ {create, amend, overwrite, move, keep, skip, delete, condense}` (`prompts/plan.md`), `routing.regime ∈ {keep, generate, reconcile, relocate, delete, condense}` (`schemas/routing.schema.json`) e a ordem transacional `relocate → condense → delete → reconcile → generate → keep` (`prompts/apply.md`). O plano herda `territory` e `regime` do routing e emite `operation` próprio — a relação entre os vocabulários (qual `operation` materializa qual `regime`, onde entram `skip` e `overwrite`) não está em nenhum prompt, deixando o mapeamento à interpretação do agente a cada run.
  - **Ação Técnica:** declarar tabela normativa de correspondência (ou unificar o vocabulário) em `prompts/plan.md`, cobrindo os casos compostos (ex.: regime `reconcile` com `action: create`/`amend` do reconcile) e definindo dono para `skip` e `overwrite`; `compose` e `apply` referenciam a mesma tabela em vez de redefini-la implicitamente.
  - **Impacto Direto:** plano, staging e transação na mesma língua; validação mecânica possível (o gate `checkPlanContract` pode conferir pares válidos).
  - **Critério de Sucesso (DoD):** tabela presente em `prompts/plan.md`, coerente com `schemas/routing.schema.json` e com a ordem do `apply`. Cenário de pressão: fragmento legado com regime `reconcile` e `action: create` no identity-map → plano carrega `operation: create` com `regime: reconcile` sem ambiguidade; `skip` e `overwrite` só aparecem com a condição que os justifica; dois agentes diferentes lendo o contrato produzem o mesmo par para o mesmo fragmento.

### Eixo: Estrutura & Acoplamento

- **`ARCH-01` ISSUE-NNN dentro da transação declarada**
  - **Contexto Atual:** `prompts/apply.md` define a lista final como "exatamente `staging-manifest.json` + deletions", mas a mesma fase manda cunhar ISSUE-NNN com upsert de linha em `.app-work/issues/INDEX.md` — escrita que não está no staging-manifest, não entra no `transaction-baseline.json` (completado no `plan`, que não conhece a operação), não é coberta pelo backup ("every repository file that will be overwritten or removed", paths do staging e das deletions) e não tem entrada no plano (`prompts/plan.md` não prevê operação de issue). Além disso, a fila que o apply consome ("a defect detected in prior phases arrives here queued with `findingSignature`") não tem fase produtora: `findingSignature` só aparece em `apply.md`; nenhum prompt de `discover`/`route`/`reconcile`/`validate` enfileira defeito. Em projeto verde, o scaffold inicial de `issues/` (INDEX/README) tampouco é materializado pelo `compose` — os templates `ISSUES_INDEX_TEMPLATE.md`/`ISSUES_README_TEMPLATE.md` existem no kit, mas nenhuma fase os instancia no staging.
  - **Ação Técnica:** definir o ciclo completo: (a) fase produtora da fila de defeitos com `findingSignature` em ledger próprio; (b) a escrita de issues entra na transação como qualquer outra — entrada no plano com `origin` e destrutividade derivada, caminho no baseline, cópia no backup quando o arquivo existe, materialização no staging (incluindo o scaffold inicial a partir dos templates); (c) o upsert de linha permanece como semântica de escrita dentro da transação, não como exceção fora dela.
  - **Impacto Direto:** nenhuma escrita no repositório fora das três proteções (baseline, backup, lista final); scaffold de issues verificável no `verify(staging)`.
  - **Critério de Sucesso (DoD):** prompts de `plan`, `compose` e `apply` descrevem o mesmo ciclo (origem → fila → plano → staging → upsert). Cenário de pressão: run de `maintain` em que o `discover` detecta drift de integridade → o defeito aparece como entrada do plano com `origin` no achado que o produziu; o `apply` executa o upsert com baseline e backup cobrindo `.app-work/issues/INDEX.md`; em projeto verde, o INDEX inicial vem do staging e o `verify(staging)` o confere; run sem defeito não escreve nada em `issues/`.

- **`ARCH-02` Gates coerentes com a distribuição**
  - **Contexto Atual:** `prompts/plan.md` (gate `checkPlanContract`), `prompts/reconcile.md` (`checkDecIdentity`), `prompts/validate.md` ("run `node scripts/validate-package.mjs <folder>` as a recommended gate") e `prompts/closeout.md` (`checkResidueGate`) citam gates que vivem em `scripts/validate-package.mjs`; mas `manifests/kit-manifest.json:packExcludes` exclui `scripts/` do zip distribuído (decisão v6). Na instalação consumidora o script não existe, e o prompt só prevê skip por ausência de node ("the gate does not block environments without node") — não por ausência do script na instalação.
  - **Ação Técnica:** condicionar cada gate de script à presença do arquivo na instalação, distinguindo três situações com registro próprio: gate executado; ambiente sem node; script ausente na instalação (skip declarado com motivo, sem tratar como falha e sem adivinhar path alternativo). Não reverter a decisão de empacotamento da v6.
  - **Impacto Direto:** prompts executáveis tal como distribuídos; relatório de closeout honesto sobre o que foi efetivamente verificado.
  - **Critério de Sucesso (DoD):** os quatro prompts citam o gate como condicional à presença do script na instalação. Cenário de pressão: instalação via zip (sem `scripts/`) com node disponível → a fase registra skip com motivo "script ausente na instalação" e segue; checkout de desenvolvimento roda o gate normalmente; nenhum caso tenta executar path inexistente nem mascara o skip como validação.

- **`ARCH-03` Templates de issues na pasta de processo**
  - **Contexto Atual:** `templates/vault/ISSUES_INDEX_TEMPLATE.md` e `templates/vault/ISSUES_README_TEMPLATE.md` são templates de processo (destino `.app-work/issues/`, SCHEMA §2/§8: processo ≠ vault) alojados na pasta de templates do vault, ao lado de `DECISION_TEMPLATE`/`DECISION_PROTOCOL`/`INDEX_TEMPLATE` do `_app-vault/`; `templates/appwork/` (pasta de processo) contém apenas o `INDEX_TEMPLATE.md`.
  - **Ação Técnica:** mover os dois templates para a pasta de templates de processo (`templates/appwork/`), atualizando `manifests/kit-manifest.json:requiredFiles` e os validadores/fixtures de teste no mesmo fluxo.
  - **Impacto Direto:** árvore do kit espelha a separação de territórios que o próprio kit normatiza; mantenedor encontra template de processo na pasta de processo.
  - **Critério de Sucesso (DoD):** templates de issues sob a pasta de processo com `requiredFiles`/validadores/fixtures verdes no mesmo fluxo. Cenário de pressão: mantenedor procurando o scaffold de issues encontra o template junto aos templates de `.app-work/`, não entre os do vault; `node scripts/validate-skill-kit.mjs` passa sem exceção manual de path.

### Eixo: Risco & Operação

- **`OPEX-01` Handoff do state entre runs**
  - **Contexto Atual:** `prompts/interview.md` grava `.app-work/hephaestus-state.json` fora da transação (exceção INV1) e o rollback nunca o reverte; `prompts/preflight.md` exige worktree limpo para novo run "in both modes, with no override" e admite delta apenas no resume do mesmo `runId`, provado por `stateWrite`. O contrato não define o caminho entre runs distintos: um run bloqueado/interrompido após a entrevista deixa o state versionado alterado, e o próximo run novo bloqueia no gate sem procedimento declarado — quem orienta commit/descarte, e quando o delta do state é aceitável para um `runId` novo.
  - **Ação Técnica:** documentar o handoff: (a) o `preflight` distingue o delta do próprio state escrito por run anterior do kit (com recibo `stateWrite` e `adoptionStatus` coerente) dos deltas não provenientes, definindo a ação esperada — o usuário commita ou descarta; o kit nunca limpa por conta própria; (b) o closeout de run bloqueado informa ao usuário o passo de fechamento antes de encerrar.
  - **Impacto Direto:** retomada previsível após bloqueio/interrupção; sem worktree "consertado" silenciosamente e sem respostas humanas descartadas.
  - **Critério de Sucesso (DoD):** `prompts/preflight.md` e `prompts/closeout.md` descrevem o ciclo entre runs. Cenário de pressão: run bloqueado com answers persistidas; usuário inicia novo run; o preflight lista o delta do state e a ação esperada (commit pelo usuário), bloqueando sem mutar nada; após o commit, o novo run resolve o modo por `adoptionStatus` normalmente; em nenhum ponto o kit reverte ou sobrescreve o state por iniciativa própria.

---

## 4. Plano de Entapa Faseada

### Fase 1: Integridade da escrita
- **Metas da Fase:** toda escrita no repositório coberta por baseline, backup e lista final; aprovação obrigatória para overwrite de conteúdo versionado; continuidade declarada entre runs.
- **Melhorias Incluídas:** `ARCH-01`, `FLOW-01`, `OPEX-01`
- **Dependências / Pré-condições:** pedido explícito de implementação; leitura do boundary real de prompts, schemas e validadores antes da edição; definição do shape da fila de defeitos e da entrada de issue no plano antes de tocar consumidores.
- **Estratégia de Rollback:** revert dos arquivos documentais e contratuais desta fase à versão anterior, mediante autorização aplicável; sem reversão global e sem tocar alterações de terceiros.

### Fase 2: Contratos de dados e decisão
- **Metas da Fase:** vocabulário único entre plano, roteamento e transação; decisão de visibilidade do `issues/` com ponto de captura e consumo auditável.
- **Melhorias Incluídas:** `DATA-01`, `FLOW-02`
- **Dependências / Pré-condições:** conclusão da Fase 1 (transação e aprovação estáveis — a tabela `operation`×`regime` referencia a ordem do `apply`); decisão entre reason nova e reutilização declarada no enum de `run-state.schema.json`, com os consumidores do enum atualizados no mesmo fluxo.
- **Estratégia de Rollback:** revert dos arquivos alterados nesta fase, com autorização aplicável e preservação de trabalho alheio; estados já escritos por runs anteriores não são renomeados nem migrados para acomodar a reversão.

### Fase 3: Coerência estrutural e fechamento
- **Metas da Fase:** prompts executáveis na instalação distribuída; closeout com leitura única; árvore de templates coerente com a separação produto×processo.
- **Melhorias Incluídas:** `ARCH-02`, `FLOW-03`, `ARCH-03`
- **Dependências / Pré-condições:** conclusão da Fase 2; verificação de paridade com os pares `*.pt-BR.md` e `COMMANDS`/`README` que citam paths afetados; fixtures e validadores atualizados no mesmo fluxo do `ARCH-03`.
- **Estratégia de Rollback:** revert dos arquivos documentais e templates desta fase à versão anterior, mediante autorização aplicável; pacotes já gerados por instalações anteriores precisam de avaliação própria — reverter o kit não reverte documentação de projetos consumidores.

---

## 5. Matriz de Trade-offs & Decisões Técnicas

- **Ganhos Garantidos:** oito propostas rastreáveis com critérios objetivos de aceite, verificadas por leitura documental (grep confirma `findingSignature` apenas em `apply.md`; `packExcludes` exclui `scripts/`; o enum de `reason` não cobre visibilidade de repo; as três enumerações de operação/regime não têm tabela). Ganhos de execução só poderão ser afirmados após implementação e verificação dos cenários de pressão.
- **Trade-offs Aceitos:** mais condições mecânicas e tabelas normativas aumentam o detalhe dos contratos (custo de leitura) em troca de menos interpretação do agente; trazer o mint de ISSUE para dentro da transação torna o upsert mais cerimonioso (entrada de plano, baseline, backup) em troca de escrita protegida e auditável.
- **Preservações:** transação única no `apply` e ordem transacional; exceção INV1 (respostas humanas nunca revertidas); zip sem `scripts/` (decisão v6); separação produto×processo dos territórios; inglês canônico do kit (DEC-007); rebaixamento conservador `applied`→`adopt` entre runs.
- **Decisões ainda necessárias na implementação:** fase produtora exata da fila de defeitos e formato da entrada de issue no plano; reason nova vs reutilização para a visibilidade do `issues/`; default conservador declarado quando não houver resposta; unificar vocabulário vs tabela de mapeamento `operation`×`regime`; destino exato dos templates movidos em `templates/appwork/`. Este relatório fixa resultados e cenários, não inventa campos ou comandos como se já estivessem aprovados.
- **Recomendações Operacionais:** implementar por fase; conferir os consumidores de cada contrato tocado (schemas, validadores, fixtures, pares `*.pt-BR.md`); usar os cenários de pressão como aceite; não executar testes nem operações Git mutativas sem a autorização exigida pelas regras vigentes.
- **Próximo passo:** implementação só com pedido nesta conversa.
