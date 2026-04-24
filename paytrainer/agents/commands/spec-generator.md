# Backend Spec Generator — Comando do Agente

## Propósito

Transformar **achados BACKEND-\*** da auditoria em especificação de contrato backend para o desenvolvedor.

**Entrada:** `docs/AUDITORIA/DOC__AUDITORIA_<FEATURE>.md` (seção "Gaps de Backend / Contrato")  
**Saída:** `docs/BACKEND_SPECS/PARA_ENVIAR/<FEATURE>_BACKEND_SPEC.md`

**Você NÃO valida ou audita.** Apenas transforma os gaps identificados em documentação de contrato usando o template.

> **⚠️ CRÍTICO:** Use **código real** do app (enums, valores, tipos). Não use exemplos fictícios.  
> Consulte os arquivos `.dart` do app para obter valores exatos de enums e estruturas.

---

## Como Usar Este Comando

### Para o Usuário:

```
#File docs/AUDITORIA/DOC__AUDITORIA_<FEATURE>.md

Gerar spec de backend para <FEATURE>
```

**Exemplos:**
- `#File docs/AUDITORIA/DOC__AUDITORIA_AUTH.md` → "Gerar spec de backend"
- `#File docs/AUDITORIA/DOC__AUDITORIA_PROFILE.md` → "Pode gerar o backend spec?"

### Para o Agente:

1. **Identificar a feature** do arquivo de auditoria
2. **Confirmar:** "Gerando backend spec para **<Feature>** a partir da auditoria."
3. **Executar o fluxo** (3 fases simples)
4. **Salvar em:** `docs/BACKEND_SPECS/PARA_ENVIAR/<FEATURE>_BACKEND_SPEC.md`

---

## Documentos Necessários

1. **Auditoria (entrada):** `docs/AUDITORIA/DOC__AUDITORIA_<FEATURE>.md`
2. **Template (estrutura):** `docs/TEMPLATES/TEMPLATE_BACKEND_SPEC.md`
3. **Padrões (referência rápida):** `agents/rules/patterns_rules.md` — apenas para consulta se necessário

---

## Fluxo de Geração (3 Fases)

### Fase 1: Extrair Gaps da Auditoria

1. **Abrir documento de auditoria**
2. **Localizar seção:** "Gaps de Backend / Contrato"
3. **Extrair todos os achados** `BACKEND-<FEATURE>-NNN`:
   - Tipo
   - Contexto
   - Situação atual
   - Proposta de contrato (método, path, request, response)

**Agrupar por endpoint:**
- Se múltiplos achados se referem ao mesmo endpoint → consolidar em um bloco
- Exemplo: `BACKEND-AUTH-001` + `BACKEND-AUTH-005` → `POST /api/auth/register`

---

### Fase 2: Montar Blocos de Endpoints

Para cada endpoint, criar um bloco usando o formato do template:

```markdown
## [METHOD] /api/path/{resourceId}

**Autenticado:** [Sim/Não]  
**Escopo/Role:** [admin/trainer/student/public]

### Request

**Headers:**
\```json
{
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Accept-Language": "pt-BR",
  "Authorization": "Bearer {accessToken}"
}
\```

**Path params:**
- `resourceId` (tipo, obrigatório/opcional) — Descrição

**Query params:**
- `page` (integer, opcional, default: 1) — Número da página
- `limit` (integer, opcional, default: 20) — Itens por página

**Body:**
\```json
{
  "fieldName": "valor",
  "amountCents": 1000
}
\```

**Regras de validação:**
- `fieldName`: required, string, max 255 chars
- `amountCents`: required, int, >= 0

### Response

**Sucesso (200/201):**
\```json
{
  "resourceId": "uuid",
  "fieldName": "valor",
  "createdAt": "2026-01-23T14:30:00Z"
}
\```

**OU para listas paginadas:**
\```json
{
  "data": [ /* itens */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
\```

### Erros

| Status | code                  | Quando?                    |
|--------|-----------------------|----------------------------|
| 400    | VALIDATION_ERROR      | Payload inválido           |
| 401    | UNAUTHORIZED          | Token inválido             |
| 404    | NOT_FOUND             | Recurso não encontrado     |
| 500    | INTERNAL_SERVER_ERROR | Erro inesperado            |

### Notas
- [Comportamentos especiais, se houver]
```

**Dicas:**
- Use os exemplos da proposta de contrato do achado
- Seja específico nas validações
- Documente todos os erros possíveis

---

### Fase 3: Preencher Template

1. **Abrir:** `docs/TEMPLATES/TEMPLATE_BACKEND_SPEC.md`
2. **Preencher seções:**
   - **Metadados:** feature, data, status
   - **Objetivo:** 2-3 frases sobre a feature (pode extrair do resumo da auditoria)
   - **📋 Enums Utilizados:** **CRÍTICO** — Extrair todos os enums mencionados nos achados da auditoria
     - Para cada enum, consultar o arquivo `.dart` real do app
     - Listar valores exatos conforme método `value` do enum
     - Incluir caminho completo do arquivo fonte
     - Formato: `CAMPO: VALOR1 | VALOR2 | VALOR3` (fonte: `caminho/completo/do/enum.dart`)
     - **NUNCA usar exemplos fictícios** — sempre código real
   - **Inconsistências:** copiar achados que indicam problemas no backend/OpenAPI atual
   - **Endpoints:** inserir blocos da Fase 2
     - Nos endpoints, referenciar enums da seção "📋 Enums Utilizados" (não repetir valores)
     - Valores de enum nos JSONs devem ser os valores reais do app
   - **Matriz de erros:** tabela resumindo erros por endpoint
   - **Perguntas em aberto:** ambiguidades encontradas nos achados
   - **Histórico:** versão 1.0, data de criação

3. **Salvar em:** `docs/BACKEND_SPECS/PARA_ENVIAR/<FEATURE>_BACKEND_SPEC.md`

---

## Exemplo de Interação

### Usuário:
```
#File docs/AUDITORIA/DOC__AUDITORIA_PROFILE.md

Gerar spec de backend
```

### Agente:
```
Gerando backend spec para **Profile** a partir da auditoria.

**Fase 1: Extrair Gaps**
- Encontrados 4 achados BACKEND-PROFILE-*
- Agrupados em 3 endpoints

**Fase 2: Montar Blocos**
- GET /api/profile
- PUT /api/profile
- POST /api/profile/photo

**Fase 3: Preencher Template**
- Template preenchido com todas as seções

✅ Spec gerada: `docs/BACKEND_SPECS/PARA_ENVIAR/PROFILE_BACKEND_SPEC.md`

**Resumo:**
- 3 endpoints documentados
- 2 inconsistências listadas
- 1 pergunta em aberto

Pronto para enviar ao dev backend!
```

---

## Regras Simples

1. **Confie na auditoria** — Os gaps já foram validados contra os padrões
2. **Use os exemplos dos achados** — A proposta de contrato já está lá
3. **Consolide endpoints** — Múltiplos achados no mesmo endpoint = um bloco
4. **Seja direto** — Transforme gap em documentação, sem re-validar
5. **Mantenha conciso** — Documento final < 10k caracteres

---

## Troubleshooting

**"Não encontrei gaps BACKEND-* na auditoria"**
→ Informe ao usuário que não há spec a gerar (auditoria não identificou gaps de backend)

**"Múltiplos achados para o mesmo endpoint"**
→ Consolide em um único bloco, combine as propostas

**"Achado não tem proposta de contrato clara"**
→ Adicione em "Perguntas em Aberto" e documente o que está faltando

**"Não sei qual erro documentar"**
→ Use os erros padrão do template (400, 401, 404, 500) e ajuste conforme contexto do endpoint

**"Não sei quais valores de enum usar"**
→ Consulte o arquivo `.dart` real do enum no app (caminho geralmente em `apps/paytrainer_pro/lib/shared/domain/enums/` ou na feature específica)
→ Use o método `value` do enum para obter os valores UPPERCASE corretos
→ **NUNCA invente valores** — sempre use código real

**"Achado menciona enum mas não tem caminho do arquivo"**
→ Busque o enum no código do app usando grep ou codebase_search
→ Se não encontrar, adicione em "Perguntas em Aberto" para esclarecimento
