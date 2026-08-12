# Issues — protocolo documental

Registro de issues/defeitos de UI/UX e comportamento encontrados no app. **Somente documentação** — correção acontece em PRs/commits separados referenciando o ID.

## Estrutura

```
.app-work/issues/
  README.md       ← este arquivo (protocolo)
  INDEX.md        ← tabela viva por estado + contador de ID
  ISSUE-NNN.md    ← detalhe opcional (evidência, notas técnicas)
```

## Campos da linha (INDEX.md)

| Campo | Descrição |
|---|---|
| **ID** | `ISSUE-NNN` (3 dígitos, sequencial — nunca reusado) |
| **Sev** | S0 blocker · S1 crítico · S2 major · S3 minor |
| **Feature** | Slug da feature (`<lista de features do projeto>`) |
| **Tela** | Nome da tela ou componente visível ao usuário |
| **Problema → Esperado** | O que está errado → comportamento/visual desejado |
| **Origem** | Sessão, revisão ou auditoria onde foi encontrado |
| **Estado** | OPEN · FIXED · VERIFIED · CLOSED · WONTFIX · DUPLICATE |

## Estados

```text
OPEN -> FIXED -> VERIFIED -> CLOSED
             \-> WONTFIX
             \-> DUPLICATE (aponta o ID original)
```

- `OPEN`: registrada, sem trabalho iniciado.
- `FIXED`: código alterado + teste de regressão.
- `VERIFIED`: re-testada manualmente pelo passo de repro original, no app rodando.
- `CLOSED`: `VERIFIED` + entrou em release/nota.
- **FIXED não é conclusão — só `VERIFIED`/`CLOSED` fecha o ciclo.**

## Severidade

`S0` blocker · `S1` crítico (bloqueia release) · `S2` major (workaround existe) · `S3` minor/cosmético

Severidade é **impacto no usuário**, não esforço de correção.

## Fluxo

1. **Registrar** — linha em `INDEX.md` na seção Abertos, com o próximo ID livre; incrementar o contador.
2. **Triagem** — se o contexto não couber na linha (evidência, notas técnicas), criar `ISSUE-NNN.md` ao lado com o template abaixo e linkar na linha.
3. **Corrigir** — commit com trailer `Fixes: ISSUE-NNN`; mover para Em verificação (`FIXED`) anotando correção e teste.
4. **Fechar** — validar o repro no app (`VERIFIED`); em release/nota, mover para Fechados (`CLOSED`).

## Convenções

- ID **nunca** é reusado nem renumerado. Linha **nunca** é deletada.
- Screenshots ficam fora do Git (anexos locais / prints na conversa).
- Issues grandes podem ser quebradas em sub-itens com checklist no corpo, mas mantêm um único ID até split explícito.
- Prioridade **não** é campo obrigatório; usar label livre no corpo se necessário.
- Defeito/issue → este registro; feature/trilha nova → backlog mestre — nunca duplicar em outro lugar.
- Repo privado versiona este registro (rastreabilidade); em repo público a pasta inteira é gitignored (D43).

## Template de detalhe (opcional)

```markdown
# ISSUE-NNN — Título curto

| Campo | Valor |
|---|---|
| **ID** | ISSUE-NNN |
| **Status** | OPEN |
| **Severidade** | S2 |
| **Feature** | <slug> |
| **Tela** | Nome da tela |

## Problema

O que está errado hoje.

## Esperado

Comportamento/visual desejado.

## Evidência

Screenshots (fora do Git), prints ou paths de código.

## Notas técnicas

Paths, componentes, APIs — preenchido na triagem.

## Relacionadas

Outros IDs, se houver.
```
