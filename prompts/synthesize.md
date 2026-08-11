# Synthesize

## Objetivo

Montar a estrutura final usando os templates canônicos do kit.

O `AGENTS.md` final deve ser o dono do workflow e do roteamento.
As regras do projeto devem ficar em `project-rules/rules/*`.
Exemplos e contratos longos devem ficar em `project-rules/reference/*`.
Contratos externos (ex.: OpenAPI) devem ficar em `project-rules/contracts/`, quando o material exigir.
Referências externas reais podem continuar existindo quando o projeto depender delas, mas devem ser detectadas, registradas e reportadas.

## Agnosticismo de framework

- Detecte o framework e a linguagem do repositório (ex.: Flutter, React, Go, Python).
- Preencha gates, checklists e comandos com as ferramentas reais do projeto (analyzer, linter, validador, teste).
- Não copie comandos nem exemplos de outro stack; a estrutura é fixa, o conteúdo é do projeto.

## Regras

- começar por `AGENTS.md`;
- usar `templates/AGENTS.md.template` como base operacional do `AGENTS.md`;
- preencher o cabeçalho com o nome real do projeto e o contrato do agente no stack real (ex.: "Atue como engenheiro Flutter sênior. Preserve arquitetura feature-first, contratos explícitos..."); nunca deixar o cabeçalho genérico do template no arquivo final;
- manter `## Workflow obrigatório`, `## Precedência interna` e as regras universais base idênticos ao template (protocolo fixo, igual em todos os projetos); preencher somente os pontos marcados como `<preencher na síntese>`: gates da validação, tipos de teste, estrutura do repositório e regras universais específicas do projeto;
- preencher a seção de estrutura do repositório e documentação com a realidade do projeto: apps/packages/pastas e seus papéis (ou a raiz única do app), os componentes de `project-rules/` gerados (índices, regras, referências, contratos) e onde vivem os docs de produto — todo componente existente de `project-rules/` deve ser alcançável pela precedência interna ou referenciado nessa seção;
- não adicionar frontmatter de cliente (ex.: `description`/`alwaysApply`) ao `AGENTS.md` gerado; as ferramentas leem `AGENTS.md` por padrão;
- tratar cada bloco `hephaestus:immutable` capturado no snapshot como região opaca: copiar a
  sequência de bytes integral para o `AGENTS.md` final, sem qualquer alteração de conteúdo,
  espaços, quebras de linha, ID, versão ou marcadores; nunca reconstruir o bloco a partir de
  significado, mesmo se ele parecer redundante com o template;
- inserir cada bloco imutável na mesma posição relativa quando ela puder ser preservada sem
  violar o template; caso contrário, inserir o bloco completo ao fim do `AGENTS.md`, separado por
  uma linha em branco. A posição pode mudar; os bytes do bloco, não;
- gerar `.hephaestus/manifests/immutable-blocks-report.json`, inclusive quando `blocks` for vazio.
  Para cada bloco, registrar `id`, `version`, `sourceFile`, `destinationFile`, `sourceSha256`,
  `destinationSha256` e `status: preserved`; hashes diferentes são falha, nunca adaptação;
- manter `AGENTS.md` focado em workflow, precedência, triagem e validação;
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
- ao iniciar a fase, aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `synthesize` como `in_progress`; ao terminar, registrar artefatos gerados e marcar a fase como `produced`; marcar `synthesize` como `validated` quando a árvore gerada tiver cobertura suficiente e os artefatos mínimos existirem; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme a `## Regra De Retomada` deste prompt).

## Cobertura Obrigatória

Antes de concluir a síntese:

1. conferir se todo fragmento `rules` foi para algum arquivo em `project-rules/rules/*`;
2. conferir se todo fragmento `index` foi refletido em algum `project-rules/index/*`;
3. conferir se todo fragmento `reference` foi para `project-rules/reference/*` ou foi omitido com justificativa;
4. registrar fragmentos `unknown`, conflitantes ou de baixa confiança como pendência;
5. confirmar que `AGENTS.md` não virou depósito de regras;
6. registrar referências externas citadas por arquivos de `project-rules/` em `.hephaestus/manifests/external-references-report.json`;
7. persistir `.hephaestus/manifests/coverage-map.json` com uma entrada por fragmento (`fragmentId` + destino: `artifactType`, `outputPath`, `derivedFrom`, `validationStatus`) e `lastUpdatedAt` com o momento da gravação; o arquivo deve ser compatível com `schemas/coverage-map.schema.json`.
8. registrar `immutable-blocks-report.json` em `artifactsWritten` e no fechamento; bloco marcado
   como imutável não conta como regra duplicada em `AGENTS.md`.

## Relatório De Dependências Externas

Quando qualquer arquivo em `project-rules/` citar arquivo fora dessa pasta, gerar:

- `.hephaestus/manifests/external-references-report.json`

O relatório deve listar, no mínimo:

- `sourceFile`
- `referencedPath`
- `status`: `valid`, `missing`, `fragile`, `should-internalize`
- `reason`
- `recommendation`

O relatório deve ser compatível com `schemas/external-references-report.schema.json`.

## Regra De Retomada

Se a execução anterior for interrompida antes de concluir, ao retomar:

1. detectar a execução anterior lendo `.hephaestus/manifests/run-state.json`;
2. gravar `status: interrupted` em `.hephaestus/manifests/run-state.json` (e atualizar `lastUpdatedAt`) antes de qualquer leitura subsequente ou continuação;
3. reler `.hephaestus/manifests/run-state.json` após essa marcação;
4. retomar da última fase marcada como `validated`;
5. reexecutar integralmente a fase que estiver em `in_progress`, `failed` ou apenas `produced` (a fase `in_progress` nunca é tratada como concluída após interrupção);
6. quando o impedimento exigir intervenção humana (fase ou run sem caminho seguro de retomada automática), marcar o run como `blocked` e parar até decisão explícita; o run `blocked` não é retomado sozinho, e a fase que originou o bloqueio é reexecutada integralmente na próxima retomada autorizada.

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
6. `.hephaestus/manifests/*`
