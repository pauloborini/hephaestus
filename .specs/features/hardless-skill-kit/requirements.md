# Requirements - Hardless Skill Kit

## Introduction

Esta especificacao define a nova trilha principal do Hardless como um kit repo-native orientado por skill, separado do alpha MCP existente. O objetivo nao e mais depender de um servidor MCP como mecanismo central de enforcement, e sim distribuir um conjunto de instrucoes, templates, referencias e contratos que permitam a uma LLM executar um pipeline controlado de fragmentacao, sintese e validacao dentro do proprio ambiente do usuario.

O problema que esta iniciativa resolve e a fragilidade do MCP como superficie obrigatoria de ativacao. Se o cliente nao chamar a tool certa, o ritual do Hardless nao roda. O `Hardless Skill Kit` muda essa base: a porta de entrada passa a ser uma skill com procedimento claro, apoiada por um kit estruturado e canônico de artefatos que o modelo pode seguir para transformar fontes cruas do usuario em um pacote fragmentado, previsivel e rastreavel.

Esta mudanca importa agora porque permite validar o core do produto com menor superficie tecnica: sem frontend proprio, sem auth, sem billing, sem depender de enforcement por MCP e sem misturar a nova direcao com o alpha atual. O foco passa a ser metodo, distribuicao e confiabilidade do pipeline.

## User Intent Summary

- Pedido original: pivotar a prioridade do repositorio para uma abordagem repo-native centrada em skill, mantendo o MCP atual apenas como trilha secundaria.
- Objetivo principal: criar um novo conceito distribuivel que use uma skill para conduzir a fragmentacao e a organizacao de regras do usuario em uma estrutura canônica.
- Restricoes explicitas:
  - nao depender de frontend nesta fase;
  - nao usar MCP como nucleo do produto;
  - nao citar projetos reais usados como inspiracao estrutural;
  - manter a nova trilha separada da iniciativa MCP atual.
- Sinais de sucesso percebidos:
  - existe uma pasta dedicada para o novo conceito;
  - existe uma nova epic separada do MCP;
  - o produto passa a ter skill, templates, references e schemas organizados;
  - a estrutura final gerada segue um modelo fragmentado canônico.

## Scope

### In Scope

- definir o `Hardless Skill Kit` como nova trilha principal dentro deste repositorio;
- criar uma raiz dedicada para os artefatos do kit;
- manter o `SKILL.md` dentro do proprio kit distribuivel;
- preparar uma estrategia de distribuicao publica em repositorio separado;
- definir a skill como porta de entrada operacional do fluxo;
- definir o pipeline canônico: `discover -> snapshot -> fragment -> classify -> synthesize -> validate -> export/apply`;
- definir a separacao entre `skill`, `templates`, `references`, `schemas`, `manifests` e `docs`;
- definir o modelo canônico de saida com `AGENTS.md` centralizador e arquivos fragmentados por papel operacional;
- definir regras de neutralizacao para exemplos, templates e referencias distribuidas;
- definir a convivencia com a trilha `packages/hardless-mcp` sem misturar escopo.

### Out of Scope

- implementar frontend proprio;
- implementar backend cloud;
- definir billing, auth ou multiusuario;
- reescrever ou remover imediatamente o alpha MCP existente;
- implementar plugin/extensao de editor nesta fase;
- concluir `design.md`, `tasks.md` ou implementacao final do kit sem review dos requisitos;
- gerar exemplos publicos com nomes, dominios ou contratos de projetos reais.

## Actors And Context

- `Operator`: pessoa que quer usar o Hardless para organizar regras do proprio projeto.
- `LLM Runtime`: ambiente onde a skill sera executada, como Codex, Cloud Code ou outro agente compativel.
- `User Sources`: arquivos crus do usuario, como `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, docs e specs.
- `Hardless Skill`: procedimento que conduz o pipeline operacional.
- `Hardless Skill Kit`: conjunto de templates, referencias, prompts, schemas e manifests que suportam a skill.
- `Generated Workspace Package`: artefatos finais organizados para uso no projeto do usuario.

## Glossary

- `Skill`: entrypoint procedural que instrui a LLM sobre quais fases seguir, quais artefatos ler e o que produzir.
- `Skill Kit`: pacote repo-native que acompanha a skill com templates, referencias e contratos auxiliares.
- `Canonical Structure`: modelo fragmentado neutro usado como alvo de organizacao.
- `Operational Role`: papel que um artefato cumpre no pacote final, como `index`, `rules`, `reference`, `memory` ou `manifest`.
- `Fragmentation Contract`: conjunto de regras que decide como trechos do material bruto sao quebrados e classificados.
- `Source Provenance`: rastreabilidade entre artefato gerado e origem textual do usuario.

## Requirements

### Requirement 1: Dedicated Product Track Inside The Repository

**User Story:** Como mantenedor do produto, eu quero uma trilha dedicada para o `Hardless Skill Kit`, para que a nova iniciativa nao nasca misturada com o alpha MCP atual.

#### Acceptance Criteria

1. O repositorio SHALL conter uma raiz dedicada para o `Hardless Skill Kit`, separada de `packages/hardless-mcp`.
2. A nova trilha SHALL ser tratada como prioridade principal do produto sem exigir remocao imediata do alpha MCP.
3. A estrutura inicial SHALL deixar claro quais artefatos pertencem ao kit e quais pertencem ao MCP.
4. O repositorio SHALL prever uma nova feature spec separada da spec existente do MCP.

### Requirement 2: Skill As Operational Entry Point

**User Story:** Como operador, eu quero que a entrada do fluxo seja uma skill, para que a LLM tenha um procedimento explicito e repetivel para executar a transformacao do material bruto.

#### Acceptance Criteria

1. O produto SHALL definir a skill como porta de entrada primaria do `Hardless Skill Kit`.
2. A skill SHALL descrever fases operacionais claras em vez de depender de um prompt monolitico.
3. A skill SHALL orientar quando ler templates, references, schemas e manifests do kit.
4. A skill SHALL impor output minimo observavel por fase, incluindo bloqueios e fallbacks.
5. A skill SHALL ser desenhada para operar em ambientes repo-native sem depender de UI propria do Hardless.

### Requirement 3: Separation Between Procedure And Static Assets

**User Story:** Como mantenedor do kit, eu quero separar procedimento de templates e referencias, para que o produto fique modular e mantenivel.

#### Acceptance Criteria

1. O `Hardless Skill Kit` SHALL separar explicitamente:
   - skill procedural;
   - templates canônicos;
   - references neutras;
   - prompts por fase;
   - schemas/manifests;
   - docs.
2. O produto SHALL evitar concentrar toda a logica e todo o conteudo dentro de um unico `SKILL.md`.
3. Templates e references SHALL poder evoluir sem exigir reescrita integral da skill.
4. A skill SHALL apontar para os artefatos auxiliares em vez de duplicar seu conteudo estrutural.

### Requirement 4: Canonical Fragmented Output Structure

**User Story:** Como operador, eu quero que o resultado final siga uma estrutura canônica e previsivel, para que o pacote gerado seja facil de entender e usar.

#### Acceptance Criteria

1. O kit SHALL definir um modelo canônico de saida com `AGENTS.md` centralizador na raiz.
2. O modelo canônico SHALL prever, no minimo, categorias como `index`, `rules`, `reference`, `memory` e `manifests`.
3. O `AGENTS.md` gerado SHALL carregar bootstrap, precedencia, triagem e apontadores, sem virar deposito de regras especificas do usuario.
4. O kit SHALL permitir omitir categorias opcionais quando nao houver material suficiente, sem quebrar o modelo de organizacao.
5. A nomenclatura de arquivos SHALL ser previsivel e orientada por papel operacional, nao por criatividade livre da LLM.

### Requirement 5: Fragmentation Contract By Operational Role

**User Story:** Como operador, eu quero que a fragmentacao siga regras objetivas, para que a LLM nao invente uma arvore arbitraria de arquivos.

#### Acceptance Criteria

1. O produto SHALL definir criterios explicitos para decidir quando um trecho vai para `index`, `rules`, `reference`, `memory` ou `manifest`.
2. O produto SHALL preferir categorias fixas e nomes previsiveis a geracao livre de arquivos por conceito.
3. O contrato de fragmentacao SHALL distinguir regras obrigatorias de material apenas ilustrativo.
4. O contrato de fragmentacao SHALL permitir marcar lacunas, baixa confianca e conflitos em vez de forcar classificacao artificial.
5. O produto SHALL descrever quando uma categoria nao deve ser criada por falta de material suficiente.

### Requirement 6: Hybrid Pipeline With Controlled LLM Participation

**User Story:** Como mantenedor do produto, eu quero combinar heuristica e LLM de forma controlada, para que o resultado seja auditavel e nao apenas bonito.

#### Acceptance Criteria

1. O pipeline SHALL combinar etapas deterministicas e assistidas por LLM.
2. Etapas como discovery, splitting estrutural, naming base, schemas e validacao minima SHALL ter componente deterministico explicito.
3. A LLM SHALL ser usada para normalizacao, consolidacao, sintese e organizacao semantica sob limites definidos.
4. O produto SHALL impedir que a LLM escreva a estrutura final sem contrato e sem validacao posterior.
5. O pipeline SHALL expor quando uma saida depender majoritariamente de heuristica fraca ou inferencia assistida.

### Requirement 7: Neutral Public References And Templates

**User Story:** Como mantenedor do produto, eu quero templates e referencias neutros, para que o produto nao exponha identidade de projetos reais usados como inspiracao estrutural.

#### Acceptance Criteria

1. O kit SHALL usar apenas nomenclatura neutra em templates, examples e references distribuidos.
2. O kit SHALL proibir nomes de projetos reais, dominios de negocio reais, URLs reais e contratos reais em material distribuivel.
3. O produto SHALL permitir reaproveitar padroes estruturais observados em projetos reais sem carregar sua identidade textual.
4. O kit SHALL registrar essa politica de neutralizacao em sua documentacao central.

### Requirement 8: Coexistence With The MCP Track

**User Story:** Como mantenedor do repositorio, eu quero manter o alpha MCP existente sem bloquear a nova trilha, para que possamos retomar aquela linha no futuro se fizer sentido.

#### Acceptance Criteria

1. A nova trilha SHALL coexistir com `packages/hardless-mcp` sem misturar ownership de artefatos.
2. A documentacao do novo kit SHALL deixar claro que o MCP nao e o nucleo do produto nesta etapa.
3. O repositorio SHALL permitir continuar evoluindo o MCP futuramente sem reverter a organizacao da nova trilha.
4. A nova epic SHALL ser independente da spec existente do MCP.

### Requirement 9: Dedicated Public Distribution Repository

**User Story:** Como operador, eu quero baixar o kit de um repositório público simples, para que eu consiga instalar a skill com o menor atrito possível, inclusive só com zip.

#### Acceptance Criteria

1. O produto SHALL prever um repositório público separado para distribuição do `Hardless Skill Kit`.
2. O repositório de distribuição SHALL ser pensado para clone direto ou download de `.zip`.
3. O conteúdo distribuído SHALL conter a skill e toda a infraestrutura estática necessária para ela funcionar.
4. O repositório atual SHALL poder continuar como base de desenvolvimento e evolução interna do kit sem ser o canal público obrigatório.

### Requirement 10: Requirements-First Spec Workflow For The New Track

**User Story:** Como mantenedor do produto, eu quero que a nova trilha siga workflow spec-driven desde o inicio, para que o kit nao nasca como um conjunto solto de markdowns.

#### Acceptance Criteria

1. A nova trilha SHALL possuir uma `spec-driven epic` propria.
2. A nova epic SHALL comecar por `requirements.md` antes de `design.md` e `tasks.md`.
3. A continuidade para design SHALL depender de review explicito dos requisitos.
4. Mudancas que alterarem o contrato da skill kit SHALL exigir sincronizacao dos artefatos da spec.

## Edge Cases

- o usuario fornece apenas um `AGENTS.md` monolitico e pouco estruturado;
- o usuario fornece varias fontes contraditorias;
- nao ha material suficiente para criar uma categoria como `memory` ou `reference`;
- a LLM tenta criar mais arquivos do que o contrato permite;
- o ambiente que executa a skill nao suporta alguns mecanismos auxiliares esperados;
- a estrutura canônica precisa ser aplicada sem vazar qualquer nomenclatura de projetos reais;
- a trilha MCP volta a evoluir e comeca a disputar ownership de conceitos com o kit.

## Open Questions

- Nenhuma pendencia bloqueante para `design.md` nesta etapa.

## Assumptions

- a nova prioridade do produto e o kit repo-native orientado por skill;
- o alpha MCP atual continuara no repositorio como trilha secundaria, sem ser removido agora;
- a skill sera a interface principal de uso antes de qualquer frontend proprio;
- o `SKILL.md` distribuivel vivera dentro do proprio `Hardless Skill Kit`;
- o modelo canônico de estrutura fragmentada deve continuar neutro e sem citar projetos reais;
- a separacao fisica em pasta dedicada reduz confusao de escopo e acelera a evolucao desta nova fase.
- `Hardless Skill Kit` fica aprovado como nome de trabalho nesta fase da spec;
- a raiz dedicada permanece em `products/` nesta fase exploratoria;
- o V1 do kit comeca com `skill + kit estatico`, sem scripts auxiliares obrigatorios.
- a distribuicao publica futura ocorrera em repositório proprio, separado deste repo de desenvolvimento.

## Review Gate

- Status: `APPROVED`
- Feedback incorporado: `sim`
- Perguntas pendentes: `0`
- Pode seguir para `design.md`? `sim`

## Notes

- Esta especificacao nasce em branch requirements-first.
- O scaffold fisico do produto pode existir antes do design final, desde que nao force decisoes arquiteturais irreversiveis.
- `design.md` e `tasks.md` devem esperar validacao desta base de requisitos.
