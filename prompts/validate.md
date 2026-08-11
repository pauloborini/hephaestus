# Validate

## Objetivo

Verificar se o pacote final atende o contrato mínimo do kit.

## Checklist

- existe `AGENTS.md`;
- `AGENTS.md` começa com o nome do projeto e o contrato do agente explícitos (formato `<Nome do projeto> — contrato do agente`), sem cabeçalho genérico;
- `AGENTS.md` é centralizador e enxuto;
- `AGENTS.md` contém workflow, precedência e roteamento, não regras de domínio;
- `AGENTS.md` possui triagem, seleção de tipo, pré-confirmação e validação final;
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
- cada marcador `hephaestus:immutable` em `AGENTS.md` tem par, ID igual, versão no início, sem
  aninhamento e corresponde a uma entrada `preserved` em
  `.hephaestus/manifests/immutable-blocks-report.json` com hashes idênticos;
- pendências, conflitos e ambiguidades restantes estão explicitados.

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
- usar `blocked` quando algum bloco imutável estiver malformado, ausente do destino, alterado ou
  sem prova de preservação no relatório de blocos;
- nunca tratar fase `produced` como equivalente a `validated`;
- aplicar a regra única de checkpoint do `SKILL.md` em todas as três fases: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar `validate`, marcar a fase como `in_progress`; ao concluir, marcar `validate` como `produced` e depois `validated` quando todos os checks mínimos estiverem consistentes; em `export_apply`, marcar `export_apply` como `in_progress`, depois `produced` e `validated` quando os artefatos finais forem realmente gravados; em `closeout_review`, marcar `closeout_review` como `in_progress`, depois `produced` e `validated` quando o relatório final ao usuário estiver consistente com os manifests; em qualquer das três, fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/synthesize.md`);
- distinguir `failed` de `blocked` no run-state: `failed` é estado de fase que terminou a execução mas não pôde ser validada e é reexecutada integralmente na retomada; `blocked` é estado do run (não de fase) que indica impedimento exigindo decisão humana e não é retomado sozinho, conforme a `## Regra De Retomada` de `prompts/synthesize.md`;
- em `export_apply`, antes de gravar `AGENTS.md` ou qualquer arquivo em `project-rules/` que já exista no projeto alvo, copiar o estado anterior para `.hephaestus/backup/<YYYYMMDDTHHMMSS>/` preservando a estrutura relativa (ex.: `project-rules/rules/x.md` vira `.hephaestus/backup/<ts>/project-rules/rules/x.md`); registrar cada backup como entrada em `artifactsWritten` do run-state com `outputPath` igual ao caminho do backup, `phase: export_apply` e `validationStatus: valid`; usar um diretório por execução, com timestamp no formato `YYYYMMDDTHHMMSS`, sem rotação nem reuso entre execuções;
- quando o ambiente do projeto alvo tiver `node` disponível, rodar `node scripts/validate-package.mjs <pasta-do-pacote>` como gate recomendado antes de marcar a fase como `validated`; em ambientes sem node, registrar a não execução do gate como observação no relatório — o gate não bloqueia ambientes sem node e a ausência de execução não muda o status de `validated` automaticamente;
- ao final, produzir uma revisão objetiva de fechamento com:
  - pendências em aberto;
  - decisão recomendada para cada pendência relevante;
  - confirmação do estado de `AGENTS.md`;
  - blocos imutáveis identificados, destino, status de preservação e confirmação de igualdade
    entre os hashes de origem e destino;
  - confirmação do estado da pasta `project-rules/`;
  - resumo explícito das referências externas encontradas e do que deveria ser internalizado;
  - confirmação de que a retomada futura pode começar após a última fase `validated`;
  - conclusão final: `ready`, `degraded-but-usable` ou `needs-followup`.
