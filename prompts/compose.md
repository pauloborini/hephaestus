# Compose

## Objetivo

Materializar o pacote inteiro em staging, sem tocar no repositório: todo artefato do plano é montado sob `.hephaestus/staging/`, e o staging é provado por `verify(staging)` antes de `apply` gravar qualquer byte.

O `AGENTS.md` final deve ser o dono do workflow e do roteamento.
As regras do projeto devem ficar em `project-rules/rules/*`.
Exemplos e contratos longos devem ficar em `project-rules/reference/*`.
Contratos externos (ex.: OpenAPI) devem ficar em `project-rules/contracts/`, quando o material exigir.
Referências externas reais podem continuar existindo quando o projeto depender delas, mas devem ser detectadas, registradas e reportadas.

## Agnosticismo de framework

- Detecte o framework e a linguagem do repositório (ex.: Flutter, React, Go, Python).
- Preencha gates, checklists e comandos com as ferramentas reais do projeto (analyzer, linter, validador, teste).
- Não copie comandos nem exemplos de outro stack; a estrutura é fixa, o conteúdo é do projeto.

## Staging

- todo destino é `.hephaestus/staging/<caminho relativo>`, nunca o caminho real do repositório — o staging espelha o pacote final inteiro, incluindo os manifests do pacote sob `.hephaestus/staging/.hephaestus/manifests/`;
- a saída inclui `.hephaestus/staging-manifest.json` com sha256 por artefato (um artefato por entrada: `outputPath` + `sha256`), que `apply` grava como lista final e `verify(applied)` confere hash a hash;
- o próprio `staging-manifest.json` não entra na lista que descreve;
- nenhuma pergunta aqui: dúvida nesta fase é bug de fase anterior, nunca pergunta ao usuário.

## Territórios de produto (`_app-vault/`)

Materializar as decisões reconciliadas (`identity-map.json` da fase `reconcile`, Plano 04) a partir dos templates absorvidos:

- `_app-vault/docs/decisions/<dominio>.md` — um arquivo por domínio de produto, instanciado de `templates/vault/DECISION_TEMPLATE.md` com os comentários removidos: heading `### DEC-NNN — <regra>` com o ID cunhado/alterado pelo `reconcile`, enunciado vigente e notas inline preservadas; `Afeta:` logo após o título, acima da primeira cláusula, com features em kebab-case do vocabulário do projeto;
- `_app-vault/INDEX.md` — instanciado de `templates/vault/INDEX_TEMPLATE.md`: `## Domínios` com um ponteiro por arquivo de `docs/decisions/`; lista de features válidas declarada **acima** de `## Por feature`; `## Por feature` **derivado** dos campos `Afeta:` de todos os arquivos — nunca escrito à mão; divergindo, `Afeta:` é a verdade e o índice é corrigido (`SCHEMA.md` §7);
- `_app-vault/docs/TEMPLATES/README.md` — materializado (papel da pasta), porque `docs/TEMPLATES/` é obrigatório pela lista fechada (§2) e ancorado pelo `AGENTS.md`; conteúdo próprio do projeto já existente na pasta é preservado como `keep` (nível 1 do `route`);
- remoções decididas pelo `reconcile` ganham a linha em `## Histórico` no fim do arquivo do domínio — o ID continua imortal ao inventário de numeração;
- nada de `.app-work/` é indexado no `INDEX.md` — indexá-lo o torna descobrível e desfaz a separação (`SCHEMA.md` §3).

## Scaffold de `.app-work/`

Materializar o scaffold de processo conforme a lista fechada de `references/vault-schema/SCHEMA.md` §2:

- `.app-work/.gitignore` — **mesmo em projeto verde**, versionado, com as linhas `references/` e `private/` (e `issues/` quando o repositório for público);
- `.app-work/INDEX.md` — mapa do processo, instanciado de `templates/appwork/INDEX_TEMPLATE.md` (mesmo padrão do vault: ponteiro, não conteúdo): pastas da lista fechada com o papel de cada uma + regras de ouro do processo; criado **sempre**, mesmo em projeto verde — é a âncora que o `AGENTS.md` aponta, nunca pode faltar;
- apenas as pastas da lista fechada são criadas: `.app-work/guides/`, `brainstorming/`, `prd/`, `references/`, `private/`, `issues/`, `archive/` (quando houver conteúdo para elas — pasta fora da lista não existe para o framework);
- sob `archive/`, materializar o espelho do `destinationPath` já expandido pela cascata: `archive/guides/<NOME>_GUIDE|arquivo` (DEC-002) — não achatar na raiz de `archive/`;
- fragmentos `relocate` com destino em `.app-work/` entram na pasta correspondente (basename preservado, bytes preservados).

## Blindagem (shield)

Conteúdo declarado no bloco `shield` do state (`{ path, selector }`) **vence a estrutura canônica**: o artefato blindado é composto byte a byte do que está no repositório e o template se adapta em volta dele. Adaptação impossível sem alterar os bytes do bloco ⇒ registrar pendência e enfileirar pergunta — nunca "melhorar" o bloco. Conteúdo de terceiros **não** coberto pela lista `shield` é fonte como qualquer outra: reabsorvido e reescrito no padrão (D9), e a remoção aparece no `plan.md` antes de aplicar.

## Regras

- começar por `AGENTS.md`;
- usar `templates/AGENTS.md.template` como base operacional do `AGENTS.md`;
- preencher o cabeçalho com o nome real do projeto e o contrato do agente no stack real (ex.: "Atue como engenheiro Flutter sênior. Preserve arquitetura feature-first, contratos explícitos..."); nunca deixar o cabeçalho genérico do template no arquivo final;
- manter `## Postura`, `## Workflow obrigatório` (incluindo parada obrigatória, premissas, critério, simplicidade, mudança cirúrgica e invariantes dentro das etapas 2 e 3), `## Precedência interna`, `## Produto` e as regras universais base idênticos ao template (protocolo fixo, igual em todos os projetos); preencher somente os pontos marcados como `<preencher na síntese>`: gates da validação, idioma, estrutura do repositório e regras universais específicas do projeto;
- não promover a H2 própria o que o template mantém dentro das etapas do workflow: postura de conversa fica no topo, o resto dispara na etapa em que é lido ou aplicado;
- não repetir no `AGENTS.md` o que `project-rules/rules/operational_rules.md` já norma (gates, testes, baseline, fechamento, commits): a `### 4. Validação` aponta para a regra e acrescenta somente os gates reais do stack;
- preencher a seção de estrutura do repositório e documentação com a realidade do projeto: apps/packages/pastas e seus papéis (ou a raiz única do app) e os componentes de `project-rules/` gerados (índices, regras, referências, contratos) — todo componente existente de `project-rules/` deve ser alcançável pela precedência interna ou referenciado nessa seção; as âncoras de produto e processo são **fixas** do template (`_app-vault/INDEX.md` e `.app-work/INDEX.md`, com responsabilidades e a proibição de `.app-work/` como insumo): preencher somente o que é do projeto, nunca listar pastas internas do vault/processo no `AGENTS.md` — cada pasta tem seu próprio índice/README;
- não adicionar frontmatter de cliente (ex.: `description`/`alwaysApply`) ao `AGENTS.md` gerado; as ferramentas leem `AGENTS.md` por padrão;
- materializar na raiz um `CLAUDE.md` de ponte com exatamente uma linha, `@AGENTS.md`, e nada mais — cliente que lê só `CLAUDE.md` cai no mesmo contrato sem duplicar arquivo; `CLAUDE.md` preexistente com conteúdo próprio é fonte como qualquer outra (reabsorver em `AGENTS.md`/`project-rules/` e reduzir à ponte, registrando a substituição no `plan.md` antes de aplicar), salvo quando estiver no bloco `shield`;
- manter `AGENTS.md` focado em postura, parada, workflow, precedência, triagem e validação;
- garantir que a triagem tente ler `project-rules/index/<tipo>.md` antes da pré-confirmação;
- garantir que a pré-confirmação use o índice já carregado para listar regras/referências acionadas e não pause aguardando aprovação;
- não colocar regras de domínio, UI, arquitetura, segurança ou contrato diretamente em `AGENTS.md`;
- gerar apenas categorias sustentadas pelo material disponível;
- preferir nomes previsíveis e neutros;
- manter a árvore pequena e orientada por papel operacional;
- não despejar tudo no `AGENTS.md`;
- não criar arquivos vazios;
- não transformar regras específicas em resumo genérico;
- não perder checklists, proibições, precedências ou exceções presentes nas fontes;
- quando houver material suficiente, criar regra específica em `project-rules/rules/*` em vez de esconder no índice;
- não prometer que `project-rules/` está totalmente autocontido quando ainda houver dependências externas reais;
- ao iniciar a fase, aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `compose` como `in_progress`; ao terminar, registrar artefatos em staging e marcar a fase como `produced`; marcar `compose` como `validated` quando a árvore em staging tiver cobertura suficiente e os artefatos mínimos existirem; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).

## Cobertura Obrigatória

Antes de concluir a composição:

1. conferir se todo fragmento `rules` foi para algum arquivo em `project-rules/rules/*`;
2. conferir se todo fragmento `index` foi refletido em algum `project-rules/index/*`;
3. conferir se todo fragmento `reference` foi para `project-rules/reference/*` ou foi omitido com justificativa;
4. registrar fragmentos `unknown`, conflitantes ou de baixa confiança como pendência;
5. confirmar que `AGENTS.md` não virou depósito de regras;
6. registrar referências externas citadas por arquivos de `project-rules/` em `.hephaestus/staging/.hephaestus/manifests/external-references-report.json`;
7. persistir `.hephaestus/staging/.hephaestus/manifests/coverage-map.json` com uma entrada por fragmento (`fragmentId` + destino: `artifactType`, `outputPath`, `derivedFrom`, `validationStatus`) e `lastUpdatedAt` com o momento da gravação; as entradas de território `vault` já decididas pelo `reconcile` são preservadas (nunca reescritas à mão); o arquivo deve ser compatível com `schemas/coverage-map.schema.json`.

## Relatório De Dependências Externas

Quando qualquer arquivo em `project-rules/` citar arquivo fora dessa pasta, gerar:

- `.hephaestus/staging/.hephaestus/manifests/external-references-report.json`

O relatório deve listar, no mínimo:

- `sourceFile`
- `referencedPath`
- `status`: `valid`, `missing`, `fragile`, `should-internalize`
- `reason`
- `recommendation`

O relatório deve ser compatível com `schemas/external-references-report.schema.json`.

## Escreve no repositório

Não. Todo artefato é materializado sob `.hephaestus/staging/` e os manifests do pacote sob `.hephaestus/staging/.hephaestus/manifests/` (efêmeros, gitignored).

## Índices Recomendados

Gerar apenas índices sustentados pelo material disponível, usando estes nomes quando aplicável:

- `project-rules/index/feature.md`
- `project-rules/index/ui.md`
- `project-rules/index/contract.md`
- `project-rules/index/navigation.md`
- `project-rules/index/shared.md`
- `project-rules/index/security.md`
- `project-rules/index/diagnostic.md`
- `project-rules/index/refactoring.md`
- `project-rules/index/testing.md`

## Regras Recomendadas

Gerar apenas arquivos sustentados pelo material disponível, usando nomes previsíveis:

- `project-rules/rules/architecture_rules.md`
- `project-rules/rules/operational_rules.md`
- `project-rules/rules/domain_rules.md`
- `project-rules/rules/error_handling_rules.md`
- `project-rules/rules/auth_rules.md`
- `project-rules/rules/security_rules.md`
- `project-rules/rules/ui_rules.md`

## Referências Recomendadas

- `project-rules/reference/domain_examples.md`
- `project-rules/reference/api_contract_reference.md`
- `project-rules/contracts/*.openapi.json`: quando o material incluir contrato externo.

## Ordem recomendada

1. `AGENTS.md`
2. `project-rules/index/*`
3. `project-rules/rules/*`
4. `project-rules/reference/*`
5. `project-rules/contracts/*` (quando houver)
6. `_app-vault/` (decisões do `identity-map.json` + `INDEX.md` derivado de `Afeta:`)
7. `.app-work/` (scaffold da lista fechada + realocação dos fragmentos `relocate`)
8. `.hephaestus/manifests/*`
