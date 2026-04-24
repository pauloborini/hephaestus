# Feature Auditor — Comando do Agente

## Propósito

Auditar features Flutter identificando **problemas estruturais** no código e **gaps de contrato** com backend.

**Você NÃO altera código.** Apenas lê, analisa e documenta usando o template `docs/TEMPLATES/DOC__AUDITORIA_<FEATURE>.md`.

---

## Documentos de Referência

- `agents/rules/patterns_rules.md` — Padrões de API/contrato e arquitetura
- `agents/rules/domain_rules.md` — Regras de DTO/Mapper/Entity
- `agents/rules/architecture_rules.md` — Estrutura de camadas
- `agents/contracts/paytrainer.openapi.json` — Contrato OpenAPI (referência)
- `docs/TEMPLATES/DOC__AUDITORIA_<FEATURE>.md` — Template de saída

---

## Entradas Esperadas

Para cada feature auditada:
- Código da feature: `apps/<app>/lib/features/<feature>/`
- Mocks JSON (se existirem): `apps/<app>/assets/mocks/<feature>/*.json`
- Documento de auditoria: `docs/AUDITORIA/DOC__AUDITORIA_<FEATURE>.md` (criar se não existir)

---

## Fluxo de Auditoria

### Fase 1: Preparação

1. **Consultar documentos de referência** (`agents/rules/patterns_rules.md`, `agents/rules/domain_rules.md`, `agents/rules/architecture_rules.md`)
2. **Localizar feature:** `apps/<app>/lib/features/<feature>/`
3. **Criar documento:** copiar template para `docs/AUDITORIA/DOC__AUDITORIA_<FEATURE>.md`

---

### Fase 2: Inventário de Pastas

Mapear estrutura da feature e marcar pastas auditadas na seção "Inventário de pastas auditadas" do template:

- `domain/entities/`, `domain/value_objects/`, `domain/repositories/`, `domain/enums/`
- `data/dtos/`, `data/mappers/`, `data/datasources/`, `data/repositories/`
- `presentation/store/`, `presentation/pages/` (apenas onde impacta payload/fluxos)
- `services/`, `di/`

---

### Fase 3: Auditoria de Código

Validar cada arquivo contra os padrões (`agents/rules/patterns_rules.md`, `agents/rules/domain_rules.md`). Para cada violação, criar achado na seção "Achados" do template.

**Foco por camada:**
- **DTOs:** IDs semânticos, nomenclatura exata do backend, enums UPPERCASE, valores monetários em `*Cents`, parsing robusto, `toCreateJson`/`toUpdateJson` quando necessário
- **Mappers:** Apenas conversão DTO ↔ Entity, sem lógica de negócio
- **Entities:** Dart puro, `copyWith` não permite editar campos imutáveis, validações de domínio
- **Datasources/Repositories:** Usam `toCreateJson`/`toUpdateJson` (nunca `toJson` em escrita), error handling consistente
- **Presentation:** Stores não montam JSON "na mão", não acessam datasources diretamente
- **DI:** Componentes registrados, sem ciclos de dependência

**Formato de achado:**
```markdown
- **[<FEATURE>-NNN]**: (P0/P1/P2) título
  - **Categoria:** Domain / Data / Presentation / DI
  - **Arquivo(s):** `path/to/file.dart`
  - **Regra violada:** `agents/rules/patterns_rules.md` regra X.X ou `agents/rules/domain_rules.md` seção Y
  - **Impacto:** [consequência técnica/negócio]
  - **Correção proposta:** [o que fazer]
  - **Dependências:** [BACKEND-* ou outros achados]
  - **Status:** ⏳ [TODO] / 🔄 [WIP] / ✅ [DONE] / 🚫 [BLOCKED]
  - **Dependência:** BACKEND / APP / NÃO EXCLUSIVO BACKEND
```

---

### Fase 4: Gaps de Backend/Contrato

Comparar código da feature com OpenAPI e mocks. Para cada incompatibilidade, criar achado `BACKEND-<FEATURE>-NNN` na seção "Gaps de Backend / Contrato" do template.

**⚠️ CRÍTICO:** Use **código real** do app (enums, valores, tipos). Para enums, liste valores reais com caminho do arquivo fonte.

**Formato:**
```markdown
- **[BACKEND-<FEATURE>-001]**: título
  - **Tipo:** Novo endpoint / Ajuste de endpoint / Padronização de payload
  - **Contexto (app):** Onde o app precisa, mock JSON usado, DTO/Entity afetado
  - **Situação atual:** O que existe no backend/OpenAPI (ou falta)
  - **Proposta de contrato:** Método + Path, Request, Response, **Enums com valores reais e caminho do arquivo**
  - **Status:** ⏳ [A PROPOR] / 🔄 [EM DISCUSSÃO] / ✅ [APROVADO]
```

**Exemplos de gaps:**
- Endpoint retorna `id` mas app espera `userId`
- Enum não documentado ou valores diferentes
- Paginação não especificada
- Enum em lowercase no backend mas app espera UPPERCASE
- Validações no app não alinhadas ao backend

---

### Fase 5: Priorização e Plano de Correção

Classificar achados por prioridade:

**P0 (Bloqueia funcionalidade):**
- Parsing quebrado
- Campos obrigatórios faltando
- Tipos incompatíveis

**P1 (Degrada qualidade):**
- Nullability inconsistente
- Validações faltantes
- Padrões não seguidos

**P2 (Técnica):**
- Código morto
- Naming inconsistente
- Refactors de melhoria

**Preencher seção "Plano de Correção" no documento.**

---

### Fase 6: Finalização

1. **Preencher todas as seções do template:**
   - Metadados da auditoria
   - Escopo
   - Inventário de pastas auditadas
   - Checklist de regras
   - Achados
   - Gaps de Backend / Contrato
   - Plano de correção (sequência)
   - Limitações de Escopo (se aplicável)
   - Notas / Decisões
   - Checklist de conclusão

2. **Validar completude:**
   - Todos os arquivos foram analisados?
   - Todos os achados têm campos completos?
   - Prioridades estão claras?
   - Dependências mapeadas?

3. **Salvar documento:**
   - `docs/AUDITORIA/DOC__AUDITORIA_<FEATURE>.md`

---

## Dicas de Execução

1. **Comece pela camada Data** — DTOs revelam o contrato real
2. **Use mocks como fonte de verdade** — refletem o que o backend envia hoje
3. **Seja específico nos achados** — "renomear X para Y em Z" (não "melhorar naming")
4. **Documente ambiguidades** — se não conseguir determinar, marque como "a validar"
5. **Reutilize achados** — se o mesmo padrão errado se repete, liste múltiplos arquivos
6. **Cite as regras** — sempre referencie o documento e seção (ex: \"agents/rules/patterns_rules.md regra 1.1\")
7. **Para enums:** Use valores reais do app com caminho do arquivo fonte (nunca exemplos fictícios)
