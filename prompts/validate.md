# Validate

## Objetivo

Verificar se o pacote atende o contrato mínimo do kit. Fase parametrizada com **um corpo, dois alvos**: `verify(staging)` prova a intenção (fase 10) e `verify(applied)` prova o resultado (fase 12).

## Alvo

- `Alvo: staging` — os checks rodam contra `.hephaestus/staging/` (o pacote materializado por `compose`, ainda não gravado);
- `Alvo: applied` — os checks rodam contra o repositório, acrescidos do check de hash: cada artefato do `.hephaestus/staging-manifest.json` tem o sha256 recomputado no disco; divergência dispara rollback imediato por `git` e por `.hephaestus/backup/<ts>/`, nesta ordem, e `.app-work/hephaestus-state.json` nunca é revertido.

## Checklist

- existe `AGENTS.md`;
- existe `CLAUDE.md` na raiz contendo exatamente a linha `@AGENTS.md`, sem conteúdo próprio (ponte, nunca contrato paralelo);
- `AGENTS.md` começa com o nome do projeto e o contrato do agente explícitos (formato `<Nome do projeto> — contrato do agente`), sem cabeçalho genérico;
- `AGENTS.md` é centralizador e enxuto;
- `AGENTS.md` contém postura, parada, workflow, precedência e roteamento, não regras de domínio;
- `AGENTS.md` possui triagem, seleção de tipo, parada obrigatória, pré-confirmação e validação final;
- a parada obrigatória, as premissas, o critério, a simplicidade, a mudança cirúrgica e os invariantes estão dentro das etapas 2 e 3 do workflow, não promovidos a seção própria;
- `AGENTS.md` não repete o que `project-rules/rules/operational_rules.md` norma (gates, testes, baseline, fechamento, commits);
- o workflow, a precedência interna e as regras universais base seguem o protocolo fixo do template, sem deriva;
- os gates da validação em `AGENTS.md` estão preenchidos com ferramentas reais do stack (sem placeholder `<preencher na síntese>`);
- a seção de estrutura do repositório e documentação referencia os componentes reais de `project-rules/` (índices, regras, referências, contratos) e os docs do projeto;
- a triagem tenta ler `project-rules/index/<tipo>.md` e bloqueia quando o índice obrigatório não existe, sem forçar contexto por inferência;
- a pré-confirmação é informativa e usa o índice já carregado, sem aguardar aprovação;
- as categorias geradas têm papel operacional claro;
- as regras necessárias estão distribuídas de forma coerente em `project-rules/`;
- regras obrigatórias foram preservadas em `project-rules/rules/*`;
- índices em `project-rules/index/*` apontam apenas para regras e referências existentes;
- regras e referências em `project-rules/` citam apenas arquivos existentes dentro de `project-rules/` ou dependências externas registradas no relatório;
- contratos em `project-rules/contracts/`, quando existirem, estão referenciados como somente consulta;
- fragmentos de referência foram preservados ou omitidos com justificativa;
- a nomenclatura é neutra;
- não há vazamento de identidade real;
- os arquivos seguem os schemas mínimos;
- a árvore final não depende de arquivo vazio para parecer completa;
- dependências externas citadas por `project-rules/` foram registradas em `.hephaestus/manifests/external-references-report.json`, quando existirem;
- `.hephaestus/manifests/external-references-report.json`, quando existir, satisfaz `schemas/external-references-report.schema.json`;
- `.hephaestus/manifests/run-state.json` existe e distingue corretamente `in_progress`, `produced`, `validated` e `failed`;
- pendências, conflitos e ambiguidades restantes estão explicitados.

## Escreve no repositório

Não. A verificação lê o pacote (staging ou disco) e os manifests; nenhum byte do repositório é alterado nesta fase.

## Status possíveis

- `valid`
- `degraded`
- `blocked`

## Regras

- usar `degraded` quando o pacote é útil, mas há lacunas ou conflito controlado;
- usar `blocked` quando faltar estrutura essencial ou houver risco relevante;
- nunca mascarar conflito sério como apenas observação cosmética;
- usar `blocked` quando `AGENTS.md` receber regras que deveriam estar em `project-rules/rules/*`;
- usar `blocked` quando o workflow de triagem e pré-confirmação estiver ausente;
- usar `degraded` quando `AGENTS.md` ainda contiver placeholder de síntese `<...>` no cabeçalho, nos gates ou na seção de estrutura, mesmo com o restante consistente;
- usar `blocked` quando qualquer índice listar regra ou referência obrigatória inexistente;
- usar `degraded` quando houver fragmentos relevantes sem destino claro, mas o pacote ainda for operável;
- usar `degraded` quando houver dependências externas legítimas ainda não internalizadas, mesmo com relatório completo;
- usar `blocked` quando houver dependências externas quebradas ou não reportadas;
- usar `blocked` quando o `run-state.json` impedir determinar com segurança quais fases estão realmente validadas;
- nunca tratar fase `produced` como equivalente a `validated`;
- distinguir `failed` de `blocked` no run-state: `failed` é estado de fase que terminou a execução mas não pôde ser validada e é reexecutada integralmente na retomada; `blocked` é estado do run (não de fase) que indica impedimento exigindo decisão humana e não é retomado sozinho, conforme a regra de retomada de `prompts/preflight.md`;
- aplicar a regra única de checkpoint do `SKILL.md` em ambas as passagens: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar `verify_staging` ou `verify_applied`, marcar a fase como `in_progress`; ao concluir, `produced` e depois `validated` quando todos os checks mínimos estiverem consistentes; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`);
- em `applied`, conferir o `staging-manifest.json` contra o disco hash a hash (gate `checkAppliedHashes`); qualquer divergência dispara rollback imediato por `git` e por `.hephaestus/backup/<ts>/`, nesta ordem, e `.app-work/hephaestus-state.json` nunca é revertido;
- quando o ambiente do projeto alvo tiver `node` disponível, rodar `node scripts/validate-package.mjs <pasta>` como gate recomendado antes de marcar a fase como `validated` — em `staging`, `<pasta>` é o diretório `.hephaestus/staging`; em `applied`, é o repositório; em ambientes sem node, registrar a não execução do gate como observação no relatório — o gate não bloqueia ambientes sem node e a ausência de execução não muda o status de `validated` automaticamente;
- ao final, produzir uma revisão objetiva de fechamento com:
  - pendências em aberto;
  - decisão recomendada para cada pendência relevante;
  - confirmação do estado de `AGENTS.md`;
  - confirmação do estado da pasta `project-rules/`;
  - resumo explícito das referências externas encontradas e do que deveria ser internalizado;
  - confirmação de que a retomada futura pode começar após a última fase `validated`;
  - conclusão final: `ready`, `degraded-but-usable` ou `needs-followup`.
