# Tasks - Hardless MCP Alpha

## Overview

Este plano implementa o alpha do `Hardless MCP` a partir de `requirements.md` e `design.md`, cobrindo bootstrap repo-native, ingestao de fontes, artefatos curados em `.hardless/`, triagem workflow-first e as tools MCP iniciais. A estrategia geral e construir primeiro o nucleo deterministico e os contratos de manifestos, depois o runtime de triagem e por fim a superficie MCP.

Os principais riscos estao em tres pontos: criar uma estrutura de artefatos grande demais para o alpha, depender cedo demais de sintese LLM e deixar a triagem acoplada a leitura crua do workspace. Por isso o plano foi quebrado em fundacao, bootstrap, runtime, tools e verificacao, com checkpoints claros antes de expandir escopo.

## Task Rules

- cada etapa deve produzir um resultado observavel no repositorio ou via testes direcionados;
- tasks de contrato e schema vem antes das que dependem do runtime;
- o plano considera o repo proprio como base oficial da iniciativa;
- produtividade precisa ser medida em saidas operacionais menores e mais acionaveis, nao apenas em cobertura tecnica;
- sempre que a implementacao alterar fluxo ou contrato de artefato, os documentos da spec devem ser sincronizados no fim.

## Tasks

- [~] 1. Foundation do pacote `@hardless/mcp`
  - Estruturar o pacote para suportar application, domain, infra e adapter MCP sem explodir a arquitetura cedo demais.
  - Sem essa base, bootstrap e runtime tendem a nascer misturados em um unico entrypoint descartavel.
  - Validacao esperada: estrutura de diretorios criada, `typecheck` passando e entrypoint preservado.
  - _Requirements: 1, 10, 11_

  - [ ] 1.1 Definir a arvore inicial de modulos em `packages/hardless-mcp/src/`
    - Criar diretorios e arquivos-base para `application`, `domain`, `infra`, `runtime`, `mcp` e `shared`, preservando fronteira clara para um adapter MCP substituivel.
    - Evidencia de conclusao: imports minimos compilam e o entrypoint deixa de ser apenas scaffold vazio.
    - _Requirements: 1, 11_

  - [ ] 1.2 Modelar tipos centrais do alpha
    - Introduzir tipos para `WorkspaceContext`, `DiscoveredSource`, `SourceFragment`, `TriageResult`, `DriftReport`, `ActivationDecision` e enums de estado.
    - Evidencia de conclusao: contratos exportados de um modulo unico de dominio.
    - _Requirements: 1, 3, 6, 9, 10_

  - [ ] 1.3 Definir constantes de schema e paths de `.hardless/`
    - Centralizar nomes de diretorios, versoes de schema e politicas basicas de filesystem.
    - Evidencia de conclusao: helper unico usado por bootstrap e runtime.
    - _Requirements: 1, 5, 11_

- [~] 2. Checkpoint de contratos
  - Revisar se os tipos e paths definidos realmente sustentam o design sem introduzir acoplamento desnecessario.
  - Validacao esperada: checklist curto de aderencia a `design.md` antes de implementar IO real.
  - _Requirements: 1, 5, 11_

- [ ] 3. Implementar discovery e snapshots de fontes
  - Construir a etapa deterministica do bootstrap antes de qualquer sintese ou roteamento.
  - Dependencia: etapa 1 concluida.
  - Validacao esperada: fixtures de workspace resultam em `sources.json` e snapshots consistentes.
  - _Requirements: 2, 3, 9_

  - [ ] 3.1 Implementar mapa inicial de discovery suportado
    - Cobrir `AGENTS.md`, `CLAUDE.md`, `cloud.md`, `.cursorrules`, `.specs/` e docs relevantes configuraveis.
    - Evidencia de conclusao: service retorna fontes encontradas e ausentes sem inventar entradas falsas.
    - _Requirements: 2_

  - [ ] 3.2 Implementar hashing e snapshot store
    - Persistir snapshots ou referencias estaveis e registrar hash por fonte.
    - Evidencia de conclusao: `sources.json` e conteudo em `.hardless/sources/`.
    - _Requirements: 3_

  - [ ] 3.3 Cobrir falhas de leitura e workspace invalido
    - Retornar erros estruturados para raiz invalida, fonte ilegivel ou permissao insuficiente.
    - Evidencia de conclusao: testes direcionados para cenarios de falha.
    - _Requirements: 1, 2, 3, 10_

- [ ] 4. Implementar fragmentacao e classificacao inicial
  - Transformar fontes extensas em unidades operacionais menores, mantendo proveniencia e confianca.
  - Dependencia: etapa 3 concluida.
  - Validacao esperada: `fragments.json` e colecoes por fonte/topico geradas a partir de fixtures.
  - _Requirements: 4, 5_

  - [ ] 4.1 Implementar heuristicas deterministicas de fragmentacao
    - Usar headings, listas, tabelas, checklists e blocos para delimitar fragmentos.
    - Evidencia de conclusao: arquivos grandes sao quebrados sem depender de LLM.
    - _Requirements: 4_

  - [ ] 4.2 Implementar classificacao por tema operacional e task type
    - Associar fragmentos a `workflow`, `architecture`, `testing`, `contracts` e task types primarios do metodo.
    - Evidencia de conclusao: fragmentos recebem topico, tipos e nivel de ambiguidade.
    - _Requirements: 4, 6, 7, 8_

  - [ ] 4.3 Persistir manifestos de fragmentos e proveniencia
    - Gerar `fragments.json` e relacoes de `artifact <- fragment <- source`.
    - Evidencia de conclusao: metadados completos em disco com `confidence` e `extractedAt`.
    - _Requirements: 3, 4, 5_

- [~] 5. Checkpoint de bootstrap intermediario
  - Confirmar que o pipeline deterministico sozinho ja produz valor antes de adicionar sintese assistida.
  - Validacao esperada: resumo manual de um workspace fixture mostrando fontes, fragmentos e lacunas.
  - _Requirements: 2, 3, 4, 5_

- [ ] 6. Gerar artefatos curados e manifests operacionais
  - Produzir a camada primaria usada pelo runtime em vez de reler arquivos crus.
  - Dependencia: etapa 4 concluida.
  - Validacao esperada: `.hardless/manifests/`, `.hardless/rules/`, `.hardless/indexes/` e `.hardless/routing/` coerentes.
  - _Requirements: 5, 9, 10_

  - [ ] 6.1 Implementar writers de `workspace.json`, `sources.json`, `fragments.json`, `routing.json` e `provenance.json`
    - Serializar schemas do alpha em `JSON` com versionamento basico.
    - Evidencia de conclusao: manifestos lidos novamente pelo runtime sem parsing ad hoc.
    - _Requirements: 1, 3, 5, 9_

  - [ ] 6.2 Implementar avaliacao de confianca e ativacao condicional
    - Calcular score agregado do bootstrap, comparar com limiar e decidir entre `auto_activated` e `pending_activation`.
    - Evidencia de conclusao: `workspace.json` e `bootstrap-summary.md` refletem corretamente a decisao de ativacao.
    - _Requirements: 5, 10_

  - [ ] 6.3 Gerar rule bundles required, triggered e fallback
    - Traduzir fragmentos e metodo do Hardless em bundles menores de contexto operacional.
    - Evidencia de conclusao: arquivos em `.hardless/rules/` com origem dominante e fallback declarado.
    - _Requirements: 5, 10_

  - [ ] 6.4 Gerar indexes por task type e referencias sob gatilho
    - Criar lookup rapido para `feature`, `diagnostic`, `refactoring` e demais tipos suportados.
    - Evidencia de conclusao: runtime consegue localizar bundles sem reler fontes cruas.
    - _Requirements: 5, 6, 7, 8_

  - [ ] 6.5 Gerar `bootstrap-summary.md`
    - Expor resumo humano em `Markdown` com fontes encontradas, ausentes, ambiguidades e fallbacks.
    - Evidencia de conclusao: relatorio legivel criado em `.hardless/reports/`, com score de confianca e status de ativacao.
    - _Requirements: 5, 9, 10_

- [ ] 7. Implementar runtime de triagem e carregamento minimo
  - Materializar o diferencial workflow-first do produto antes da camada MCP externa.
  - Dependencia: etapa 6 concluida.
  - Validacao esperada: requests de exemplo resultam em `discussion`, `fast_mode`, `spec_flow` ou `blocked` com justificativa.
  - _Requirements: 6, 7, 8, 10_

  - [ ] 7.1 Implementar classificador de triagem
    - Aplicar regras do metodo para definir estado inicial e tipo primario, com bloqueio conservador diante de incerteza relevante.
    - Evidencia de conclusao: tabela de cenarios coberta por testes, incluindo casos bloqueados por ambiguidade.
    - _Requirements: 6, 7, 8_

  - [ ] 7.2 Implementar loader de contexto minimo
    - Carregar bundles required e, sob gatilho, no maximo o subindice e referencias necessarias.
    - Evidencia de conclusao: `ContextBundle` pequeno e justificado por caso.
    - _Requirements: 5, 6, 7, 8, 10_

  - [ ] 7.3 Implementar plano curto prescritivo para `fast_mode`
    - Retornar proximo passo operacional e plano curto antes de qualquer escrita.
    - Evidencia de conclusao: resposta de `fast_mode` acelera execucao em vez de apenas documentar classificacao.
    - _Requirements: 7, 10_

  - [ ] 7.4 Implementar promocao de `fast_mode` para `spec_flow`
    - Escalar quando aparecer impacto amplo, mudanca de contrato, contradicao ou falta de validacao.
    - Evidencia de conclusao: cenarios de promocao cobertos por testes.
    - _Requirements: 7, 8, 10_

  - [ ] 7.5 Implementar gates universais de escrita e validacao
    - Impedir escrita sem classificacao valida e conclusao sem validacao declarada.
    - Evidencia de conclusao: runtime bloqueia fluxos mal formados.
    - _Requirements: 6, 7, 8, 10_

- [ ] 8. Implementar drift detection e reconciliacao incremental
  - Evitar que o runtime opere silenciosamente em artefatos obsoletos.
  - Dependencia: etapas 3, 4 e 6 concluidas.
  - Validacao esperada: alteracoes de fonte atualizam `drift.json` e marcam artefatos afetados.
  - _Requirements: 9, 10_

  - [ ] 8.1 Recomputar hashes e detectar fontes alteradas
    - Comparar estado atual do workspace com o source manifest.
    - Evidencia de conclusao: diferencas detectadas por fonte.
    - _Requirements: 9_

  - [ ] 8.2 Mapear impacto em fragmentos e artefatos
    - Relacionar fonte alterada a bundles e indexes afetados.
    - Evidencia de conclusao: `drift.json` com blast radius minimo.
    - _Requirements: 3, 5, 9_

  - [ ] 8.3 Implementar refresh parcial com degradacao explicita
    - Atualizar apenas partes afetadas quando possivel e sinalizar `degraded` se persistir ambiguidade.
    - Evidencia de conclusao: reconciliacao parcial funcionando em fixture controlada.
    - _Requirements: 4, 5, 9, 10_

- [~] 9. Checkpoint de runtime
  - Revisar se bootstrap, triagem e drift ja sustentam um alpha coerente antes de expor tools finais.
  - Validacao esperada: walkthrough manual contra os acceptance criteria principais e verificacao de que `fast_mode` de fato reduz trabalho operacional.
  - _Requirements: 1 a 10_

- [ ] 10. Expor tools MCP do alpha
  - Publicar a superficie minima do produto em torno de workflow e operacao, nao em torno de leitura bruta de arquivos.
  - Dependencia: etapas 6, 7 e 8 concluidas.
  - Validacao esperada: servidor MCP responde com contratos estruturados para bootstrap, triagem, contexto e status.
  - _Requirements: 1, 5, 6, 7, 8, 9, 10, 11_

  - [ ] 10.0 Integrar SDK MCP por tras de adapter interno
    - Escolher um SDK pragmatico para o alpha, mas encapsular completamente a integracao em `McpToolAdapter`.
    - Evidencia de conclusao: `application` e `runtime` nao importam tipos nem detalhes do SDK.
    - _Requirements: 10, 11_

  - [ ] 10.0.1 Validar integracao principal no `Cursor`
    - Exercitar bootstrap, triagem, contexto e status no cliente MCP prioritario do alpha.
    - Evidencia de conclusao: fluxo principal do produto verificado manualmente no `Cursor`.
    - _Requirements: 10, 11_

  - [ ] 10.1 Implementar tool `hardless.bootstrap`
    - Inicializar `.hardless/`, executar pipeline e retornar resumo estruturado.
    - Evidencia de conclusao: workspace fixture bootstrapado via tool.
    - _Requirements: 1, 2, 3, 4, 5_

  - [ ] 10.2 Implementar tool `hardless.refresh`
    - Reconciliar fontes e artefatos com base em drift detectado ou refresh manual.
    - Evidencia de conclusao: `drift.json` reduzido apos refresh bem-sucedido.
    - _Requirements: 9, 10_

  - [ ] 10.3 Implementar tool `hardless.triage`
    - Classificar solicitacao e retornar tipo primario, estado, justificativa e proximos gates.
    - Evidencia de conclusao: payload estruturado consumivel por cliente MCP, incluindo bloqueio conservador quando necessario.
    - _Requirements: 6, 7, 8, 10_

  - [ ] 10.4 Implementar tool `hardless.context`
    - Entregar pacote minimo de contexto carregado para o fluxo atual.
    - Evidencia de conclusao: cliente recebe bundles e referencias sob gatilho sem reler fontes cruas, com plano curto em `fast_mode`.
    - _Requirements: 5, 6, 7, 8_

  - [ ] 10.5 Implementar tool `hardless.status`
    - Expor estado do workspace, drift, bootstrap version e se o Hardless esta `ready`, `pending_activation`, `degraded` ou `disabled`.
    - Evidencia de conclusao: status consultavel sem side effects.
    - _Requirements: 9, 10_

- [ ] 11. Validacao final e sync de artefatos
  - Consolidar confianca no alpha e impedir que a documentacao fique stale depois da implementacao inicial.
  - Dependencia: etapas anteriores concluidas.
  - Validacao esperada: build/typecheck/testes relevantes passando e spec sincronizada.
  - _Requirements: 1 a 11_

  - [ ] 11.1 Adicionar fixtures e testes direcionados do alpha
    - Cobrir bootstrap, ativacao por confianca, triagem, plano curto de `fast_mode`, promocao de fluxo e drift.
    - Evidencia de conclusao: suite de testes direcionada executavel no pacote.
    - _Requirements: 2, 3, 4, 6, 7, 8, 9, 10_

  - [ ] 11.2 Executar validacoes de build e typecheck
    - Rodar os comandos do workspace e corrigir falhas estruturais.
    - Evidencia de conclusao: comandos verdes registrados no fechamento do trabalho.
    - _Requirements: 10, 11_

  - [ ] 11.3 Sincronizar `requirements.md`, `design.md`, `tasks.md` e `decisions.md` se a execucao mudar contratos
    - Atualizar a spec viva conforme desvios reais descobertos.
    - Evidencia de conclusao: artefatos sem drift interno.
    - _Requirements: 5, 8, 9, 11_

## Definition Of Done

O plano sera considerado pronto para execucao quando:

- as tarefas estiverem pequenas, ordenadas e com dependencias claras;
- cada etapa tiver validacao observavel;
- os checkpoints indicarem pontos reais de revisao, nao pausa cosmetica;
- o plano estiver coerente com `requirements.md`, `design.md` e `decisions.md`.

## Notes

- O alpha deve priorizar um slice utilizavel e auditavel, nao cobertura enciclopedica de fontes ou clients MCP.
- Se durante a execucao surgirem pressao por multiplos pacotes internos, isso deve ser justificado por dependencia real, nao por preferencia arquitetural abstrata.
