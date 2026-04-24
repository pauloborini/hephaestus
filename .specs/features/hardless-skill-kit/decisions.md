# Decisions - Hardless Skill Kit

## Como usar este arquivo

Este arquivo registra decisoes estaveis da trilha `Hardless Skill Kit`.

Status validos:

- `accepted`
- `superseded`
- `proposed`

---

## D-001 - O kit sera a nova trilha principal e o MCP segue como trilha secundaria

- Status: `accepted`
- Data: `2026-04-21`

### Contexto

O repositorio ja possui um alpha MCP funcional, mas o produto pivotou para uma abordagem repo-native orientada por skill.

### Decisao

`Hardless Skill Kit` passa a ser a trilha principal. `packages/hardless-mcp` permanece no repositorio, mas sem ser o nucleo do produto nesta etapa.

### Consequencias

- a nova spec e separada da spec do MCP;
- o repo precisa manter ownership claro entre as duas trilhas;
- o kit nao deve nascer dentro do pacote MCP.

---

## D-002 - O `SKILL.md` distribuivel vivera dentro do proprio kit

- Status: `accepted`
- Data: `2026-04-21`

### Contexto

O objetivo de distribuicao e reduzir ao maximo o atrito de instalacao, inclusive permitindo uso por clone direto ou download de `.zip`.

### Decisao

O `SKILL.md` da distribuicao ficara dentro da raiz do `Hardless Skill Kit`, junto com os templates, references, prompts, schemas e manifests necessarios.

### Consequencias

- o kit pode ser consumido como pacote autocontido;
- o usuario nao depende de instalar a skill separadamente em outra arvore para o V1;
- a raiz distribuivel precisa continuar pequena e organizada.

---

## D-003 - O kit tera repositório público de distribuição separado do repositório de desenvolvimento

- Status: `accepted`
- Data: `2026-04-21`

### Contexto

O repositório atual e adequado para desenvolvimento e evolucao da ideia, mas nao e o melhor canal de distribuicao para usuarios que so querem baixar o kit e usar.

### Decisao

Havera um repositório público separado para distribuição do `Hardless Skill Kit`. O repositório atual continua como base de desenvolvimento, testes e melhoria do conceito.

### Consequencias

- a estrutura do kit precisa ser facilmente extraivel para outro repositorio;
- a distribuicao publica deve funcionar por clone ou `.zip`;
- o repositório público de distribuição adotado é `pauloborini/hardless-skill-kit`;
- a automacao de distribuicao precisa preparar uma arvore autocontida, pronta para clone ou `.zip`.
