# Closeout

## Objetivo

Fazer a revisão final do que foi gerado após `apply` e entregar ao usuário um fechamento consistente do pacote.

## Regras

- aplicar a regra única de checkpoint do `SKILL.md` em toda a fase: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `closeout` como `in_progress`; ao concluir o relatório, marcar `closeout` como `produced`; marcar `closeout` como `validated` quando a saída mínima estiver consistente com os manifests e os artefatos do `apply`; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`);
- conferir o estado de `.hephaestus/manifests/run-state.json` antes de iniciar: se a fase anterior `apply` não estiver `validated`, registrar pendência e reexecutar o que faltar;
- conferir o estado de `.hephaestus/manifests/coverage-map.json`: cada fragmento relevante precisa ter destino (`artifactType` + `outputPath`); pendência por fragmento sem destino;
- conferir o estado de `.hephaestus/manifests/external-references-report.json` quando existir; pendência por referência externa sem internalização registrada;
- revisar `AGENTS.md` e `project-rules/` para detectar regras que deveriam ter ido para `project-rules/rules/*` mas ficaram no `AGENTS.md`, ou árvore final inflada com arquivos vazios;
- nunca alterar `AGENTS.md` nem `project-rules/` durante o closeout — o closeout revisa e aponta; correções voltam para `apply` na próxima execução;
- não fixar ferramenta de stack: a revisão registra o que foi usado, sem recomendar substituição de analyzer/linter/validador fora de placeholder `<preencher na síntese>`;
- não citar projeto real em nenhum item do fechamento.

## Saída mínima

A revisão final deve conter, sem omitir seção mesmo quando vazia (com `nenhuma` explícito):

- lista de pendências restantes;
- decisões em aberto com recomendação objetiva para cada uma;
- confirmação do estado final de `AGENTS.md`;
- confirmação do estado final da pasta `project-rules/`;
- confirmação de que os fragmentos relevantes têm destino no mapa de cobertura (`.hephaestus/manifests/coverage-map.json`);
- resumo explícito das referências externas encontradas em `project-rules/` e recomendação do que deveria ser internalizado;
- confirmação do estado final de `.hephaestus/manifests/run-state.json`;
- conclusão final: `ready`, `degraded-but-usable` ou `needs-followup`.

## Escreve no repositório

Não. A revisão lê e aponta; correções voltam para `apply` na próxima execução.
