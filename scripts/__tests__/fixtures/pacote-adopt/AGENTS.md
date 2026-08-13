# Meu Projeto — contrato do agente

## Workflow obrigatório

Antes de iniciar qualquer tarefa, leia `project-rules/index/README.md`, aplique as regras acionadas e confira a precedência abaixo.

## Precedência interna

1. `AGENTS.md` — contrato do agente e workflow
2. `project-rules/rules/*` — regras obrigatórias de domínio e arquitetura
3. `project-rules/reference/*` — exemplos e material de apoio
4. `_app-vault/docs/decisions/` — decisões de produto (referenciadas por DEC-NNN, nunca copiadas)

## Estrutura do repositório

- `project-rules/index/` — índices por tipo de tarefa
- `project-rules/rules/` — regras obrigatórias
- `project-rules/reference/` — exemplos e notas
- `project-rules/contracts/` — contratos externos (somente consulta)
- Produto vigente: `_app-vault/docs/decisions/` (`### DEC-NNN`); mapa: `_app-vault/INDEX.md`. Processo: `.app-work/`; mapa e regra de organização: `.app-work/INDEX.md`. Cada pasta do vault/processo tem seu próprio índice/README — não duplicar estrutura de pastas aqui.

## Produto

- Verdade vigente só em `_app-vault/docs/decisions/` (cláusulas `### DEC-NNN`). `INDEX.md` é mapa — ponteiro, não conteúdo.
- `.app-work/` é processo: nunca insumo de regra. Responsabilidades: `_app-vault/` guarda produto/decisão (via `INDEX.md`); `.app-work/` guarda execução/processo (via `INDEX.md`).
- Pedido que muda produto ou contrato: alterar a cláusula existente (o ID permanece) ou cunhar `max+1`. Não relitigar decisão fechada.
