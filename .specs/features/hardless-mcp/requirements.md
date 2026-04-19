# Requirements - Hardless MCP Alpha

## Introduction

Esta especificacao define o alpha do `Hardless MCP`, uma superficie de produto complementar ao app desktop do Hardless. O objetivo do alpha nao e substituir o produto principal, e sim validar mais cedo o valor central do harness: workflow canônico, bootstrap repo-native, triagem operacional e contexto curado por workspace.

O Hardless MCP deve funcionar dentro de um projeto real do usuario, criando artefatos proprios e passando a mediar como o agente acessa regras, escolhe fluxo e decide quando deve usar fast mode ou spec flow. O ponto central aqui nao e "dar mais contexto para a LLM", e sim reduzir improviso operacional.

## User Intent Summary

- Pedido original: criar uma iniciativa de MCP mais rapida de entregar do que o app completo.
- Direcao consolidada:
  - o MCP deve ter workflow proprio do Hardless;
  - as regras do usuario devem ser ingeridas e fragmentadas, nao usadas como contrato cru;
  - o bootstrap deve ser hibrido e rastreavel, sem depender de geracao livre da LLM;
  - o runtime deve distinguir `discussion`, `fast mode` e `spec flow`.
- Sinais de sucesso:
  - um projeto real consegue ser inicializado e operar com `.hardless/`;
  - tarefas simples nao sofrem cerimonia excessiva;
  - tarefas complexas recebem gates e artefatos estruturados;
  - as regras derivadas do projeto possuem origem e confianca explicitas.

## Scope

### In Scope

- servidor MCP local em `Node.js/TypeScript`;
- bootstrap inicial de um workspace alvo;
- criacao do diretorio `.hardless/` no projeto do usuario;
- ingestao de fontes como `AGENTS.md`, `CLAUDE.md`, `cloud.md`, `.cursorrules`, `.specs/` e docs do repo;
- fragmentacao e classificacao de regras do projeto;
- runtime de triagem e roteamento `discussion` / `fast mode` / `spec flow`;
- artefatos operacionais do Hardless para regras, indexes, routing e memoria;
- deteccao de drift basica das fontes ingeridas;
- operacao em um workspace ativo por vez.

### Out of Scope

- UI desktop dedicada nesta iniciativa;
- enforcement absoluto sobre qualquer cliente/editor;
- substituicao das tools nativas de codigo do cliente;
- suporte profundo a colaboracao multiusuario;
- sync cloud-first;
- plugin/extensao de editor como superficie principal do alpha;
- indexacao semantica profunda de todo o codigo do projeto no primeiro bootstrap.

## Actors And Context

- `Operator`: dev que instala e usa o Hardless MCP no proprio projeto.
- `Workspace`: raiz valida de um projeto unico ou monorepo suportado.
- `Hardless MCP`: servidor local responsavel por bootstrap, triagem, roteamento e exposicao de tools.
- `Hardless Runtime`: logica que executa a politica operacional do Hardless dentro do MCP.
- `User Source Files`: arquivos do projeto do usuario que contem regras, convencoes, specs ou instrucoes.
- `Hardless Artifacts`: arquivos gerados em `.hardless/` que passam a ser a camada operacional do runtime.

## Glossary

- `Bootstrap`: etapa inicial que le fontes do projeto, cria snapshots, extrai fragmentos e produz artefatos operacionais do Hardless.
- `Source Manifest`: manifesto com as fontes encontradas, prioridade, hash, tipo e estado de ingestao.
- `Fragment`: unidade menor derivada de uma fonte maior, com classificacao, proveniencia e confianca.
- `Routing Manifest`: contrato operacional usado pelo runtime para decidir o que carregar, bloquear ou escalar.
- `Discussion`: pedido sem autorizacao explicita de alteracao, respondido sem tocar no codigo.
- `Fast Mode`: caminho enxuto para mudancas pequenas e de baixo risco.
- `Spec Flow`: caminho estruturado para mudancas mais amplas, ambiguidade alta ou risco maior.
- `Drift`: divergencia entre fontes originais do projeto e os artefatos curados do Hardless.

## Requirements

### Requirement 1: Workspace Bootstrap And Hardless Directory

**User Story:** Como operador, eu quero inicializar o Hardless MCP em um projeto real, para que o workspace passe a ter artefatos operacionais proprios do Hardless.

#### Acceptance Criteria

1. O sistema SHALL oferecer um fluxo explicito de `initialize` ou `bootstrap` para um workspace alvo.
2. O sistema SHALL criar um diretorio `.hardless/` dentro da raiz do workspace alvo quando o bootstrap for aprovado.
3. O sistema SHALL estruturar `.hardless/` com subdiretorios ao menos para `sources`, `fragments`, `rules`, `indexes`, `routing`, `memory` e `reports`.
4. O sistema SHALL falhar de forma explicita quando o caminho informado nao representar um workspace valido ou autorizado.
5. O sistema SHALL operar com um unico workspace ativo por sessao de runtime.

### Requirement 2: Deterministic Source Discovery

**User Story:** Como operador, eu quero que o Hardless descubra fontes reais do meu projeto antes de sintetizar regras, para que o bootstrap nao invente contexto.

#### Acceptance Criteria

1. O sistema SHALL procurar por um conjunto inicial conhecido de fontes, incluindo `AGENTS.md`, `CLAUDE.md`, `cloud.md`, `.cursorrules`, `.specs/` e documentacao relevante do repositório.
2. O sistema SHALL registrar cada fonte encontrada em um `source manifest` com caminho, tipo, hash e status de ingestao.
3. O sistema SHALL distinguir fontes ausentes de fontes encontradas, sem preencher silenciosamente lacunas com conteudo generico.
4. O sistema SHALL permitir extensao futura da lista de fontes suportadas sem quebrar o contrato do alpha.

### Requirement 3: Source Snapshots And Provenance

**User Story:** Como operador, eu quero que o Hardless mantenha rastreabilidade das fontes originais, para que eu consiga confiar nas regras derivadas.

#### Acceptance Criteria

1. O sistema SHALL persistir snapshots locais ou referencias estaveis das fontes ingeridas em `.hardless/sources/`.
2. O sistema SHALL associar cada fragmento derivado a uma fonte de origem identificavel.
3. O sistema SHALL registrar para cada fragmento, no minimo, `sourcePath`, `sourceType`, `extractedAt`, `hash` e `confidence`.
4. O sistema SHALL impedir que regras derivadas percam o vinculo com a origem durante o bootstrap.

### Requirement 4: Semi-Deterministic Fragment Extraction

**User Story:** Como operador, eu quero que o Hardless fragmente arquivos grandes em partes menores e operacionais, para que o runtime nao dependa de um unico documento cru.

#### Acceptance Criteria

1. O sistema SHALL quebrar fontes textuais extensas em fragmentos menores usando heuristicas objetivas antes de recorrer a sintese mais livre.
2. O sistema SHALL considerar ao menos headings, tabelas, listas, blocos de checklist e outros delimitadores estruturais durante a extracao inicial.
3. O sistema SHALL classificar os fragmentos por tema operacional, como `workflow`, `task-type`, `architecture`, `ui`, `testing`, `contracts`, `security` ou equivalente.
4. O sistema SHALL marcar explicitamente quando a classificacao estiver ambigua ou com confianca baixa.
5. O sistema SHALL permitir fragmentacao incremental quando uma fonte mudar, sem exigir rebootstrap total por padrao.

### Requirement 5: Hardless-Curated Operational Artifacts

**User Story:** Como operador, eu quero que o runtime use artefatos do Hardless em vez de arquivos crus do projeto, para que o workflow fique consistente e leve.

#### Acceptance Criteria

1. O sistema SHALL produzir artefatos curados em `.hardless/` para regras, indexes e roteamento.
2. O sistema SHALL usar esses artefatos curados como camada operacional primaria durante a execucao do runtime.
3. O sistema SHALL registrar quando um artefato foi derivado majoritariamente de fonte do usuario e quando foi preenchido por fallback padrao do Hardless.
4. O sistema SHALL evitar gerar textos genericos quando nao houver regra suficiente; nesse caso, o artefato SHALL declarar lacuna ou fallback aplicado.
5. O bootstrap SHALL ativar automaticamente os artefatos derivados apenas quando a confianca agregada do pacote curado atingir o limiar minimo definido pelo runtime do alpha.
6. Quando a confianca agregada ficar abaixo do limiar minimo, o sistema SHALL exigir confirmacao explicita do operador antes de promover os artefatos a camada primaria de runtime.

### Requirement 6: Workflow Triage Before Code Work

**User Story:** Como operador, eu quero que o Hardless classifique o pedido antes de implementar, para que o agente nao entre em modo de edicao sem ritual minimo.

#### Acceptance Criteria

1. O runtime SHALL classificar uma solicitacao recebida em pelo menos um destes estados iniciais: `discussion`, `fast_mode`, `spec_flow` ou `blocked`.
2. O runtime SHALL responder sem alteracao de codigo quando a solicitacao for classificada como `discussion`.
3. O runtime SHALL exigir contexto ou confirmacao adicional quando a classificacao resultar em `blocked`.
4. O runtime SHALL registrar a justificativa resumida da classificacao realizada.

### Requirement 7: Fast Mode For Small Changes

**User Story:** Como operador, eu quero um caminho rapido para mudancas pequenas, para que o harness nao imponha cerimonia excessiva em tarefas simples.

#### Acceptance Criteria

1. O runtime SHALL oferecer um `fast mode` para mudancas pequenas, claras e de baixo risco.
2. O `fast mode` SHALL carregar apenas o pacote minimo de regras e artefatos relevantes para a tarefa.
3. O `fast mode` SHALL produzir ao menos um plano curto, a execucao e uma validacao minima antes de concluir.
4. O runtime SHALL ser capaz de promover uma tarefa inicialmente enquadrada em `fast mode` para `spec flow` quando surgir complexidade adicional durante a execucao.
5. O `fast mode` SHALL recomendar explicitamente o proximo passo operacional com base no contexto minimo carregado.
6. O `fast mode` SHALL entregar um plano curto antes de qualquer escrita, mesmo quando a tarefa parecer trivial.

### Requirement 8: Spec Flow For Larger Or Riskier Changes

**User Story:** Como operador, eu quero que tarefas complexas caiam em um fluxo estruturado, para que a execucao tenha gates mais fortes.

#### Acceptance Criteria

1. O runtime SHALL encaminhar para `spec flow` tarefas com maior risco, ambiguidade, impacto amplo ou necessidade de coordenacao maior.
2. O `spec flow` SHALL ser capaz de criar ou atualizar artefatos como `requirements`, `design` e `tasks` quando aplicavel.
3. O runtime SHALL registrar por que uma solicitacao foi escalada para `spec flow`.
4. O alpha SHALL permitir que o `spec flow` reutilize a estrutura `.specs/` existente do projeto quando ela ja estiver presente.

### Requirement 9: Drift Detection And Reconciliation

**User Story:** Como operador, eu quero saber quando minhas fontes mudaram, para que os artefatos do Hardless nao fiquem obsoletos silenciosamente.

#### Acceptance Criteria

1. O sistema SHALL detectar quando uma fonte ingerida mudou desde o ultimo bootstrap ou refresh.
2. O sistema SHALL marcar os artefatos potencialmente afetados por esse drift.
3. O sistema SHALL oferecer uma forma de reconciliar parcial ou totalmente os artefatos derivados sem exigir bootstrap integral por padrao.
4. O sistema SHALL expor se o runtime esta operando com artefatos potencialmente desatualizados.

### Requirement 10: Runtime Policy And Guardrails

**User Story:** Como operador, eu quero que o Hardless imponha guardrails operacionais, para que o agente nao execute fluxos inconsistentes com o metodo.

#### Acceptance Criteria

1. O runtime SHALL impedir o inicio de escrita quando a tarefa ainda nao tiver classificacao valida.
2. O runtime SHALL impedir conclusao de tarefa sem ao menos uma etapa de validacao declarada.
3. O runtime SHALL distinguir acoes seguras de acoes que exigem aprovacao adicional do operador.
4. O alpha SHALL permitir pausar ou desativar o Hardless MCP para que o usuario possa codar fora do ritual quando desejar.
5. Quando houver incerteza relevante sobre classificacao, contexto, impacto, contradicao ou validacao, o runtime SHALL bloquear ou escalar o fluxo em vez de prosseguir por heuristica permissiva.
6. O runtime SHALL explicitar o motivo do bloqueio ou da escalacao conservadora e o criterio objetivo para destravar o fluxo.

### Requirement 11: Dedicated Repository And Internal Package Strategy

**User Story:** Como mantenedor do produto, eu quero evoluir o Hardless MCP em um repositorio proprio com um pacote principal dedicado, para reduzir confusao de escopo e manter a arquitetura do alpha coesa.

#### Acceptance Criteria

1. A implementacao do alpha SHALL residir em um repositorio proprio do `Hardless MCP`.
2. O repositorio SHALL prever um pacote principal em `packages/hardless-mcp` para o servidor MCP e seu runtime especifico.
3. O desenho interno SHALL permitir extracao futura de pacotes auxiliares sem exigir reestruturacao do workspace desde o alpha.
4. O alpha SHALL evitar depender do repositorio do app desktop como base de implementacao ou runtime.

## Edge Cases

- o workspace nao contem nenhum arquivo de regra explicito;
- o projeto possui um `AGENTS.md` muito grande, mas pouco estruturado;
- fontes diferentes do usuario se contradizem;
- um fragmento relevante nao consegue ser classificado com confianca suficiente;
- o usuario altera manualmente os arquivos em `.hardless/`;
- o projeto ja possui `.specs/`, mas com convencoes diferentes do fluxo padrao do Hardless;
- o operador quer ignorar o Hardless temporariamente para uma alteracao rapida;
- o cliente MCP nao respeita integralmente o workflow sugerido pelo runtime.

## Assumptions

- o alpha sera usado primeiro em projetos reais do proprio fundador ou de devs tecnicos proximos;
- o Hardless MCP funcionara inicialmente como superficie complementar ao app desktop, nao como pivô do produto;
- o workspace alvo podera conter arquivos de regra, specs e docs heterogeneos;
- a LLM sera usada como sintetizadora controlada, nao como fonte primaria de estrutura ou proveniencia;
- um repositorio proprio reduz confusao de escopo, contexto e arquivos-alvo do agente durante a validacao do alpha.
- o alpha usara um SDK MCP pragmatico por baixo de um adapter interno para evitar acoplamento estrutural precoce.
- os contratos operacionais legiveis por maquina ficarao em `JSON`, enquanto relatorios humanos ficarao em `Markdown`.
- o `Cursor` sera o cliente MCP principal de validacao pratica do alpha, por refletir o uso real prioritario do produto neste momento.

## Review Gate

- Status: `APPROVED_FOR_EXECUTION_PLANNING`
- Feedback incorporado: `direcao workflow-first, bootstrap hibrido, separacao para repositorio proprio e contratos de confianca/fast_mode`
- Perguntas pendentes: `0 bloqueantes`
- Pode seguir para `design.md`? `sim`

## Notes

- Este documento deriva da conversa atual, da visao existente do Hardless e das decisoes ja consolidadas sobre workspace unico, bootstrap hibrido e spec-driven workflow.
- `design.md` e `tasks.md` ja foram produzidos a partir deste requisito; novas mudancas de contrato devem sincronizar os tres artefatos.
