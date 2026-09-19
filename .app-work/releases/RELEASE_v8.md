# Release v8 — 2026-09-18

## Metadados
- Versão: `8`
- Tag: `v8`
- Data: 2026-09-18
- Padrão de branches: gitflow
- Branch de release: `release/v8`
- SHA-base: `87be4012458c6cf124ec92d50c5f221c81e2eff2` (`develop` no corte)
- SHA final na `main`: <a confirmar pós-integração>
- Alvo da integração: `main`
- Artefato: `hephaestus-8.zip`
- GitHub Release: <a confirmar>
- Status: Em preparação

## O que há de novo

- **Ledger de findings entre fases (ARCH-01):** `schemas/findings.schema.json` chega ao kit; findings cunhados em `discover`/`validate` atravessam para o `plan` e são materializados pelo `compose` no state (`ISSUE-NNN` dentro da transação).
- **Tabela `Operation × regime` (DATA-01):** o `plan.md` ganha tabela normativa de operações por regime, verificada pelo gate estrito `checkPlanRegimePairs` em `validate-package.mjs`.
- **Overwrite destrutivo explícito (FLOW-01):** sobrescrever contrato versionado (ex.: ponte `CLAUDE.md`) é `destructive` em todo modo, sem exceção silenciosa.
- **Visibilidade do `issues/` (FLOW-02):** reason `issues-visibility` no enum; captura no `discover`, consumo no `compose`, default conservador = ignorar `issues/`.
- **Handoff de state entre runs (OPEX-01):** retomada com bloqueio orientado a commit/descarte.
- **Closeout sem "re-run" (FLOW-03).**
- **Templates ISSUES em `templates/appwork/`:** movidos de `templates/vault/` para o lugar certo do ciclo de adoção.
- **English-first completo:** comentários restantes em `scripts/` e templates de vault (`INDEX_TEMPLATE.md`, `DECISION_TEMPLATE.md`) traduzidos, com tokens canônicos (`## Domains`, `## Valid features`, `## By feature`, `Affects:`, `_Changed`, `## History`).

## Mensagens de loja

Não aplicável (kit zip / GitHub Release; sem lojas).

### en-US
- Title: Hephaestus v8
- What's new: Systematic improvements round 2 — a findings ledger now crosses phases into the generated state, plans carry a normative `Operation × regime` table with a strict gate, destructive overwrites are explicit in every mode, and runs hand off state safely.
- Description: Unpack `hephaestus-8.zip` into your skills folder. Resulting folder: `hephaestus/`.

### pt-BR
- Título: Hephaestus v8
- Novidades: 2ª rodada de melhorias sistemáticas — ledger de findings atravessa fases até o state gerado, o plano carrega tabela normativa `Operation × regime` com gate estrito, overwrite destrutivo passa a ser explícito em todo modo e o state tem handoff seguro entre runs.
- Descrição: Descompacte `hephaestus-8.zip` na pasta de skills. Pasta resultante: `hephaestus/`.

## Prova de validação
- `node scripts/validate-skill-kit.mjs`: <a executar>
- `node scripts/check-public-docs.mjs`: <a executar>
- `node --test "scripts/__tests__/**/*.test.mjs"`: <a executar>
- `node scripts/pack-release.mjs --dry-run`: <a executar>
- `node scripts/pack-release.mjs`: <a executar>
