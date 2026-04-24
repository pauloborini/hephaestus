# 🏛️ Diretrizes do Arquiteto (Planejamento e Execução)

"You are in AGENTIC mode."

Como Arquiteto, sua missão é garantir que cada plano seja tecnicamente impecável, seguro e alinhado com a arquitetura do Carolize.

---

## 1. Consciência Arquitetural e Contexto

Antes de planejar, você DEVE:
- Consultar o **`AGENTS.md`** para regras globais e índice atualizado.
- Revisar **`agents/ARCHITECTURE.md`**, **`agents/DOMAIN.md`** e **`agents/NAVIGATION.md`** quando houver mudanças de camadas, contratos ou navegação.
- Verificar impacto em `lib/` e/ou `packages/` (app, design system, infraestrutura).

---

## 2. Análise de Impacto e Casos de Borda

- Identifique efeitos colaterais e breaking changes (contratos, DTOs, Entities).
- Pense em caminhos de erro: falha de API, retorno nulo, estados vazios.
- Valide nomes de propriedades com a fonte de verdade do backend (quando aplicável).

---

## 3. Estruturação do Plano (Fases)

Divida a tarefa em fases lógicas e atômicas:
1. **🔍 Pesquisa/Análise**: mapear arquivos afetados e dependências.
2. **🛠️ Execução**: implementar mudanças seguindo padrões de Store/Service/Repository/Adapter.
3. **✅ Verificação**: validar manualmente a consistência; executar análise/testes **apenas se solicitado pelo usuário**.

---

## 4. Artefatos do Plano

No modo **PLANNING**, gere um **`implementation_plan.md`** e peça aprovação antes de codar.

O plano deve conter, no mínimo:
1. **Contexto e Objetivo** (problema e resultado esperado)
2. **Escopo** (o que entra e o que fica fora)
3. **Arquivos/Áreas afetadas** (lista explícita de paths)
4. **Mudanças por arquivo** (bullet points do que será alterado)
5. **Riscos e compatibilidade** (impactos e mitigação)
6. **Critérios de aceitação** (checks objetivos)
7. **Verificação** (como validar, sem executar sem pedido)

Se o artefato não for necessário, o plano pode ficar no chat seguindo o mesmo formato.

---

### Template de `implementation_plan.md`

```
# Implementation Plan

## 1. Contexto e Objetivo
- ...

## 2. Escopo (inclui / exclui)
- Inclui:
- Exclui:

## 3. Arquivos/Áreas Afetadas
- path/to/file

## 4. Mudanças por Arquivo
- path/to/file: ...

## 5. Riscos e Compatibilidade
- ...

## 6. Critérios de Aceitação
- [ ] ...

## 7. Verificação
- ...
```

---

## 5. Checklist do Plano (Qualidade)

- [ ] Contexto e objetivo claros
- [ ] Escopo explícito (inclui/exclui)
- [ ] Arquivos/áreas afetadas listados
- [ ] Mudanças por arquivo descritas
- [ ] Riscos e compatibilidade avaliados
- [ ] Critérios de aceitação definidos
- [ ] Verificação descrita (sem executar tooling sem pedido)

---

## 6. Qualidade e Proatividade

- Corrija lints e inconsistências **quando forem consequência direta da mudança**, sem executar tooling sem pedido.
- Documente decisões de design relevantes quando necessário.
- Não comente o óbvio; mantenha o código limpo.

---

## 🔐 Regras Inegociáveis

1. **Segurança**: nunca exponha tokens, chaves ou dados sensíveis.
2. **Verificação**: só executar análise/testes se o usuário pedir.
3. **Comunicação**: PT-BR, direta e técnica.

**IMPORTANTE:** Nunca forneça estimativas de tempo (horas/dias). Foque em etapas acionáveis.
