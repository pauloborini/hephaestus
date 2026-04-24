# Tasks - Hardless Skill Kit

## Overview

Este plano executa o primeiro slice real do `Hardless Skill Kit` com foco em distribuicao simples e repo-native. A estrategia e sair desta etapa com um kit minimo, autocontido e coerente com a spec: `SKILL.md`, prompts por fase, templates, references, schemas, manifests e uma automacao de distribuicao que monte exatamente o pacote necessario para consumo por clone ou `.zip`.

Os principais riscos neste slice sao tres: distribuir um kit sem ativos minimos reais, misturar material de desenvolvimento com material publico e criar uma automacao fraca que empacote lixo ou deixe faltar arquivos essenciais. Por isso o plano foi quebrado em sincronizacao da spec, ativos minimos do kit, automacao de distribuicao e validacao local do pacote gerado.

## Task Rules

- cada etapa deve deixar um resultado observavel no repositorio;
- tasks de contrato e estrutura vem antes da automacao;
- a automacao deve empacotar apenas o necessario para o kit funcionar;
- validacao precisa conferir arvore montada e `.zip` gerado;
- qualquer ajuste de contrato durante a execucao deve sincronizar a spec.

## Tasks

- [x] 1. Sincronizar a spec com a distribuicao publica e destravar a execucao
  - Consolidar `requirements.md`, `design.md`, `decisions.md` e `tasks.md` para refletir o repositório público já existente e a estrategia de distribuicao simples.
  - Dependencia: requisitos e design já aprovados para seguir.
  - Validacao esperada: pacote da spec coerente e pronto para orientar implementacao.
  - _Requirements: 1, 8, 9, 10_

  - [x] 1.1 Atualizar `decisions.md` com o repositório público adotado
    - Registrar `pauloborini/hardless-skill-kit` como canal público de distribuição.
    - Evidencia de conclusao: decisão D-003 atualizada.
    - _Requirements: 8, 9_

  - [x] 1.2 Criar `tasks.md` da trilha `hardless-skill-kit`
    - Formalizar a execução em etapas pequenas, verificáveis e alinhadas com a spec.
    - Evidencia de conclusao: arquivo `tasks.md` criado.
    - _Requirements: 9, 10_

- [x] 2. Criar o núcleo distribuível mínimo do kit
  - Montar os artefatos mínimos para que o kit seja consumível como pacote autocontido.
  - Dependencia: etapa 1 concluida.
  - Validacao esperada: raiz `products/hardless-skill-kit/` deixa de ser apenas scaffold vazio.
  - _Requirements: 2, 3, 4, 5, 6, 7_

  - [x] 2.1 Criar `SKILL.md` do kit
    - Implementar o entrypoint procedural apontando para prompts, templates, references, schemas e manifests.
    - Evidencia de conclusao: `products/hardless-skill-kit/SKILL.md` criado e coerente com a spec.
    - _Requirements: 2, 3, 6_

  - [x] 2.2 Criar prompts por fase
    - Adicionar `discover.md`, `fragment.md`, `classify.md`, `synthesize.md` e `validate.md`.
    - Evidencia de conclusao: diretório `prompts/` preenchido com fases mínimas do pipeline.
    - _Requirements: 2, 3, 6_

  - [x] 2.3 Criar templates canônicos mínimos
    - Adicionar templates para `AGENTS.md` e para a estrutura base de `agents/index`, `agents/rules`, `agents/reference` e `agents/memory`.
    - Evidencia de conclusao: diretório `templates/` deixa de ser placeholder.
    - _Requirements: 4, 5, 7_

  - [x] 2.4 Criar references, schemas e manifests mínimos
    - Adicionar baseline neutro, schemas mínimos e manifestos do kit para versionamento e política de nomenclatura.
    - Evidencia de conclusao: `references/`, `schemas/` e `manifests/` preenchidos com conteúdo útil.
    - _Requirements: 3, 5, 6, 7_

- [x] 3. Adicionar automação de distribuição
  - Criar um `Makefile` que monte a distribuição pública autocontida e gere `.zip`.
  - Dependencia: etapa 2 concluida.
  - Validacao esperada: comando único gera uma árvore pronta para distribuição.
  - _Requirements: 2, 3, 4, 8, 9_

  - [x] 3.1 Criar `Makefile` com targets de distribuição
    - Adicionar targets para montar staging, limpar artefatos e gerar zip do kit.
    - Evidencia de conclusao: `Makefile` criado com fluxo reexecutável.
    - _Requirements: 8, 9_

  - [x] 3.2 Definir o conteúdo exato da distribuição
    - Garantir que o processo copie apenas a skill e os ativos necessários para funcionamento.
    - Evidencia de conclusao: staging contém somente arquivos previstos no contrato do kit.
    - _Requirements: 3, 4, 8, 9_

  - [x] 3.3 Preparar saída pronta para o repositório público
    - Gerar uma árvore autocontida adequada para clone ou `.zip`.
    - Evidencia de conclusao: pasta de distribuição final e arquivo `.zip` criados localmente.
    - _Requirements: 8, 9_

- [x] 4. Validar o pacote distribuível e sincronizar artefatos
  - Conferir se a distribuição gerada atende o contrato mínimo da spec.
  - Dependencia: etapas 2 e 3 concluídas.
  - Validacao esperada: árvore, zip e spec coerentes entre si.
  - _Requirements: 4, 5, 6, 7, 8, 9, 10_

  - [x] 4.1 Validar localmente a árvore gerada
    - Conferir presença de `SKILL.md`, prompts, templates, references, schemas e manifests no staging final.
    - Evidencia de conclusao: checagem manual ou por comando listando a árvore final.
    - _Requirements: 3, 4, 8, 9_

  - [x] 4.2 Validar o `.zip` gerado
    - Confirmar que o pacote compactado contém exatamente o que o kit precisa para funcionar.
    - Evidencia de conclusao: inspeção do arquivo `.zip`.
    - _Requirements: 8, 9_

  - [x] 4.3 Sincronizar a spec se a execução alterar contrato ou distribuição
    - Atualizar `design.md`, `decisions.md` ou `tasks.md` se o slice real revelar ajustes relevantes.
    - Evidencia de conclusao: spec permanece fiel ao que foi implementado.
    - _Requirements: 9, 10_

## Notes

- Este plano cobre apenas o slice inicial de distribuição do kit, não a implementação completa de todas as capacidades futuras.
- O objetivo desta rodada e provar que a distribuicao repo-native do kit pode ser montada de forma simples e auditavel.

## Follow-Up Slice

- [x] 5. Fortalecer o kit para uso real por humano e agente
  - Melhorar `README.md`, enriquecer templates e references e introduzir validação automatizada leve do kit.
  - Dependencia: slice inicial de distribuição concluído.
  - Validacao esperada: kit mais utilizável, mais consistente e com checagem mínima dedicada.
  - _Requirements: 2, 3, 4, 5, 6, 7, 9, 10_

  - [x] 5.1 Reescrever `README.md` para uso humano
    - Incluir objetivo, instalação, verificação e papel separado de humano e LLM.
    - Evidencia de conclusao: `README.md` cobre uso por clone ou zip e remete a `SKILL.md`.
    - _Requirements: 2, 3, 8, 9_

  - [x] 5.2 Fortalecer templates e references
    - Ampliar templates mínimos e adicionar referências neutras mais úteis para a estrutura canônica.
    - Evidencia de conclusao: `templates/` e `references/` ficam menos rasos e mais consistentes.
    - _Requirements: 4, 5, 7_

  - [x] 5.3 Adicionar validador mínimo dedicado
    - Criar script leve para validar presença, neutralização e consistência estrutural do kit.
    - Evidencia de conclusao: validador executa localmente e falha de forma objetiva quando o kit estiver quebrado.
    - _Requirements: 6, 7, 9, 10_

  - [x] 5.4 Integrar o validador ao fluxo de distribuição
    - Atualizar a automação para usar o script dedicado em vez de checks inline frágeis.
    - Evidencia de conclusao: `make skill-kit-dist-validate` usa o validador dedicado.
    - _Requirements: 6, 8, 9, 10_

- [x] 6. Separar payload público e automatizar publish completo
  - Isolar em pasta dedicada o conteúdo que realmente vai para o repositório público e expor um fluxo de publish de um comando só.
  - Dependencia: slices anteriores de distribuição e validação concluídos.
  - Validacao esperada: `make publish-hardless-skill-kit` valida, sincroniza e publica apenas o payload público.
  - _Requirements: 1, 3, 8, 9, 10_

  - [x] 6.1 Separar payload distribuível em `products/hardless-skill-kit/public/`
    - Mover skill e ativos públicos para uma pasta dedicada de payload.
    - Evidencia de conclusao: distribuição passa a usar `public/` como source.
    - _Requirements: 1, 3, 8_

  - [x] 6.2 Criar script dedicado de publish
    - Adicionar script que clone/reaproveite o repositório público, sincronize o payload, valide, faça commit e push.
    - Evidencia de conclusao: script `scripts/publish-hardless-skill-kit.sh` criado.
    - _Requirements: 8, 9, 10_

  - [x] 6.3 Expor `make publish-hardless-skill-kit`
    - Encapsular o fluxo oficial de publicação num único target do `Makefile`.
    - Evidencia de conclusao: target executa de ponta a ponta e publica no repositório de distribuição.
    - _Requirements: 8, 9, 10_
