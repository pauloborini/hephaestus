# Discover

## Objetivo

Descobrir as fontes cruas do usuário antes de qualquer reorganização.

## Escopo por modo

O escopo do inventário é decidido pelo `mode` resolvido em `preflight` (campo `mode` do run-state), nunca por heurística sobre estrutura presente:

- `mode: adopt` — varredura integral do repositório: documentos de convenção do agente (`AGENTS.md`, `CLAUDE.md`), specs, docs arquiteturais, guias de workflow, convenções de projeto e os territórios canônicos como fonte (na reexecução, o destino também é input);
- `mode: maintain` — escopo reduzido, guiado por dado: inventariar só o que difere da última execução e o que as outras ferramentas produzem, deixando o resto como fonte inalterada que cai em `keep` pelo nível 1 da cascata (o escopo reduzido diminui o custo, não a corretude — um maintain que varresse tudo produziria o mesmo resultado, só mais devagar):
  1. `AGENTS.md` alterado desde o último run — comparar `mtime`/hash do arquivo contra `meta.lastRunAt` do `.app-work/hephaestus-state.json`;
  2. `CLAUDE.md` presente e divergente do `AGENTS.md` (regra que o contrato do agente não cobre);
  3. cada glob de `catalog/drift-catalog.json` (artefatos de outras ferramentas) presente no repositório — arquivos de regra de agente e artefatos de ferramenta entram como fonte com papel `source` e motivo nomeando a ferramenta de origem; **a lista de globs vigiados vive no catálogo e no overlay, nunca embutida no prompt** — ferramenta nova entra editando o catálogo ou o overlay do projeto (bloco `routing` do estado), sem tocar em prompt (D28);
  4. docs, specs e READMEs novos ou alterados fora dos territórios canônicos;
  5. integridade do vault: `INDEX.md` derivável dos campos `Afeta:` das decisões, `DEC-NNN` sem colisão nem reuso (cláusulas vivas + `## Histórico`), pasta fora da lista fechada de `references/vault-schema/SCHEMA.md` §2;
  6. candidatos a decisão pendentes nas seções `Candidatos a decisão` dos `LEDGER.md` dos guides em `.app-work/guides/`;
  7. guides flat sob `.app-work/done/` (fora do nesting `YYYY-MM/semana-WW_MM-DD_a_MM-DD/`) — inventariar como fonte a reorganizar para a semana do run (DEC-002).

## Regras

- registrar fontes encontradas e ausentes;
- não preencher lacunas silenciosamente;
- não interpretar ainda o papel operacional final;
- detectar monólitos, contradições e material redundante;
- detectar referências a arquivos externos que possam virar dependências de `project-rules/`;
- detectar a pasta do kit instalada no workspace (uma pasta é a do kit quando contém `manifests/kit-manifest.json` com `name` igual a `hephaestus`, ou quando contém `SKILL.md`, `prompts/` e `schemas/` juntos) e registrá-la como pasta do kit **excluída** do inventário de fontes (campo de observação); nunca fragmentar a pasta do kit, nunca tratá-la como fonte de regras do projeto e nunca usar qualquer arquivo dela como referência para o pacote gerado;
- aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `discover` como `in_progress`; ao concluir o inventário inicial, marcar `discover` como `produced`; marcar `discover` como `validated` quando fontes encontradas, ausentes e riscos iniciais estiverem coerentes; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` (efêmero, gitignored).

## Saída mínima

- inventário de fontes;
- notas de estrutura;
- possíveis riscos para fragmentação;
- lista preliminar de dependências externas relevantes, se existirem;
- checkpoint inicial de execução.
