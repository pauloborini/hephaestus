# Discover

## Objetivo

Descobrir as fontes cruas do usuário antes de qualquer reorganização.

## O que procurar

- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- specs
- docs arquiteturais
- guias de workflow
- convenções de projeto

## Regras

- registrar fontes encontradas e ausentes;
- não preencher lacunas silenciosamente;
- não interpretar ainda o papel operacional final;
- detectar monólitos, contradições e material redundante;
- detectar referências a arquivos externos que possam virar dependências de `project-rules/`;
- detectar a pasta do kit instalada no workspace (uma pasta é a do kit quando contém `manifests/kit-manifest.json` com `name` igual a `hephaestus`, ou quando contém `SKILL.md`, `prompts/` e `schemas/` juntos) e registrá-la como pasta do kit **excluída** do inventário de fontes (campo de observação); nunca fragmentar a pasta do kit, nunca tratá-la como fonte de regras do projeto e nunca usar qualquer arquivo dela como referência para o pacote gerado;
- inicializar `.hardless/manifests/run-state.json` com objeto completo e válido pelo schema;
- aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hardless/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `discover` como `in_progress`; ao concluir o inventário inicial, marcar `discover` como `produced`; marcar `discover` como `validated` quando fontes encontradas, ausentes e riscos iniciais estiverem coerentes; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/synthesize.md`).

## Saída mínima

- inventário de fontes;
- notas de estrutura;
- possíveis riscos para fragmentação;
- lista preliminar de dependências externas relevantes, se existirem;
- checkpoint inicial de execução.
