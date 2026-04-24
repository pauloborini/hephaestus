Este é o **ponto de entrada único** para agentes de IA no projeto **Paytrainer**.

## ⚙️ Configuração do Agente

Este arquivo continua sendo o ponto de entrada principal e a fonte de maior precedência. A configuração abaixo deve ser aplicada **antes** do workflow, pois afeta toda resposta textual da sessão (incluindo a própria triagem da Fase 1).

### Agent Config

```yaml
agent_config:
  use_extended_memory: true
  compact_response_mode: ultra
```

Regras:
- `use_extended_memory`: aceita apenas `true` ou `false`
- `compact_response_mode`: aceita apenas `off`, `lite`, `full` ou `ultra`
- Qualquer valor inválido em `compact_response_mode` deve ser tratado como `off` e informado ao usuário de forma objetiva
- Não usar múltiplas flags booleanas para Compact Response; o modo deve ser controlado por um único campo enumerado para evitar estado inválido
- A escala de compressão deve ser monotônica: `off` = baseline normal, `lite` = mais enxuto que `off`, `full` = mais enxuto que `lite`, `ultra` = mais enxuto que `full`

### Fase 0 — Bootstrap de Configuração (antes de qualquer output)

Obrigatório e incondicional. Executar antes da Fase 1 e antes de emitir qualquer texto ao usuário:

1. Ler `agent_config` deste arquivo.
2. Validar os valores conforme as regras acima; se `compact_response_mode` for inválido, tratar como `off` e informar o usuário de forma objetiva.
3. Se `compact_response_mode` for diferente de `off`, ativar a skill Compact Response no modo correspondente para toda resposta textual da sessão — inclusive a saída da triagem e o bloco de Pré-confirmação da Fase 4.

Observação: a leitura de `agents/memory/extended-memory.md` **não** ocorre nesta fase, pois depende do resultado da triagem (ver Fase 1.5).

## 🚀 Primeiro Passo (Obrigatório)

Após a Fase 0, siga o workflow deste arquivo antes de executar qualquer tarefa.

Objetivos do workflow:
1. Classificar o tipo da tarefa.
2. Carregar apenas regras essenciais.
3. Aplicar checklist por contexto.
4. Reduzir contexto e evitar decisões ad-hoc.

### Regras de Aplicação da Memória Estendida

- `agents/memory/extended-memory.md` só é carregado após a triagem (Fase 1.5) e apenas quando `use_extended_memory: true` e o fluxo não for Modo Discussão.
- Quando carregado, aplicá-lo como instrução complementar e persistente, nunca como substituto deste arquivo.

### Regras de Precedência e Conflito

- `AGENTS.md` sempre tem precedência sobre `agents/memory/extended-memory.md`
- `agents/memory/extended-memory.md` não substitui workflow, arquitetura, checklist nem regras obrigatórias do projeto
- `agents/memory/extended-memory.md` serve apenas para preferências persistentes, correções reincidentes e guardrails operacionais duráveis
- Se houver conflito entre `AGENTS.md` e `agents/memory/extended-memory.md`, seguir `AGENTS.md`
- Se houver conflito entre `agents/index/*.md` ou `agents/rules/*.md` e `agents/memory/extended-memory.md`, seguir os índices e regras obrigatórias carregados para a tarefa
- A Compact Response altera somente o estilo de comunicação textual; ela não reduz rigor técnico, não enfraquece warnings de segurança e não substitui clareza máxima em avisos críticos, ações irreversíveis ou sequências sensíveis
- A Compact Response nunca altera raciocínio, decisão, escopo, validação, política de segurança ou necessidade de clarificação; ela atua apenas na formulação do output textual

### Escopo da Compact Response

Quando `compact_response_mode` estiver ativo:

- aplicar o modo apenas na prosa da resposta
- manter **Português Brasileiro (PT-BR)** nas respostas textuais; compactar tom e estrutura sem transformar a resposta em persona, gimmick ou roleplay
- manter código, comandos, commits, mensagens de erro, nomes de arquivos, APIs e identificadores sem simplificação indevida
- suspender temporariamente o modo se a clareza operacional exigir linguagem normal
- `lite` deve remover prefácio, redundância, floreio e contexto repetido, mantendo frases curtas e gramática normal
- `full` deve ser agressivamente compacto, priorizando diagnóstico, decisão e ação; pode usar fragmentos curtos quando não houver perda de clareza
- `ultra` deve maximizar compressão com precisão, usando abreviações óbvias e fragmentos curtos apenas quando continuarem inequívocos

## 📋 Fluxo de Trabalho (Não Negociável)

### Fase 1. Triagem Inicial (primeira fase operacional após a Fase 0)

1. Se houver pergunta/opinião sem pedido explícito de alteração: **Modo Discussão**.
   - Responder antes de qualquer ação.
   - Não ler regras a menos que o usuário peça.
   - Não é obrigatório ler `agents/memory/extended-memory.md` neste modo, exceto se o usuário pedir.
   - Não alterar código.
2. Se houver pedido explícito de alteração: seguir para Fases 1.5, 2 e 3.
3. Se houver pedido explícito de alteração com "pode fazer e depois me responde": executar primeiro, responder depois.

### Fase 1.5. Bootstrap de Memória Estendida (pós-triagem)

Executar silenciosamente logo após a triagem, antes de qualquer trabalho significativo no repositório:

1. Se `use_extended_memory: true` **e** o fluxo **não** for Modo Discussão, ler `agents/memory/extended-memory.md`.
2. Se o fluxo for Modo Discussão, pular esta fase (exceto se o usuário pedir explicitamente para considerar a memória estendida).
3. Quando lida, aplicá-la como instrução complementar e persistente, respeitando a precedência definida na seção "Regra de Precedência".

### Fase 2. Identificar Tipo de Tarefa

Classifique apenas pelo texto do pedido do usuário.

Regra de tipagem:
- Selecionar apenas 1 tipo primário por execução.
- Se a tarefa for mista, escolher o tipo dominante e carregar os demais conteúdos por gatilho na Fase 3.

| Tipo | Exemplos |
|------|----------|
| feature | Nova feature, service/store/DI, domínio |
| ui | Widget, página, layout, componente |
| contract | DTO, Entity, Mapper, contrato API/OpenAPI |
| navigation | Rotas, navegação, guards |
| shared | VOs e Enums compartilhados |
| security | Segredos, PII, logs, ambientes |
| diagnostic | Diagnóstico de erro/bug |
| refactoring | Refatoração e otimização |
| testing | Criar/executar testes (quando pedido) |

### Fase 3. Selecionar Regras Obrigatórias

A leitura obrigatória sempre começa por `agents/index/<tipo>.md`.

Se o índice possuir subíndices por cenário, carregar apenas 1 subíndice alinhado ao escopo antes de expandir o contexto.

Mapeamento:
- feature: `agents/index/feature.md`
- ui: `agents/index/ui.md`
- contract: `agents/index/contract.md`
- navigation: `agents/index/navigation.md`
- shared: `agents/index/shared.md`
- security: `agents/index/security.md`
- diagnostic: `agents/index/diagnostic.md`
- refactoring: `agents/index/refactoring.md`
- testing: `agents/index/testing.md`

Cada index define:
1. Regras obrigatórias (`agents/rules/*.md`).
2. Referências sob gatilho (`agents/reference/*.md`).

### Fase 4. ✅ Confirmação de Contexto

Antes de ler os arquivos de contexto da tarefa (`agents/index/*.md`, `agents/rules/*.md`, `agents/reference/*.md`), emitir:

```text
✅ Pré-confirmação: Tipo: <tipo> | Contexto: <index + regras/referências acionadas>
MDs a consultar: <lista de arquivos>
Escopo: <1 linha>
```

Se não conseguir acessar arquivos obrigatórios:

```text
⛔ Contexto incompleto
```

e solicitar assistência do usuário.

### Regras Anti-Loop (Crítico)

- Confirmação inválida quando faltar: tipo, contexto, MDs ou escopo.
- Corrigir até 3 tentativas, informando: `Tentativa X/3 - Risco de loop`.
- Após 3 falhas: parar e pedir ao usuário:
  1. confirmação do tipo; ou
  2. conteúdo dos arquivos obrigatórios; ou
  3. abordagem MCP.

Regra de progressão:
- A cada 2-3 pesquisas, produzir artefato concreto (plano, decisão, código).
- Sem progresso após 3 ciclos: parar e pedir clarificação.

Orçamento de contexto inicial:
- Máximo de 1 index primário + 1 subíndice (quando existir) + até 2 regras/referências por gatilho antes do primeiro artefato concreto.

## 📁 Estrutura do Monorepo

- `apps/paytrainer_pro/` — App profissional (mobile)
- `apps/paytrainer_student/` — App aluno (web + mobile)
- `packages/paytrainer_design/` — Design system
- `packages/paytrainer_infrastructure/` — Rede/infra
- `packages/paytrainer_utils/` — Utilitários e abstrações
- `packages/paytrainer_shared/` — Domínio compartilhado

## 📚 Nova Estrutura de Documentação

### Regras (obrigatórias)

- `agents/rules/architecture_rules.md`
- `agents/rules/patterns_rules.md`
- `agents/rules/domain_rules.md`
- `agents/rules/feature_rules.md`
- `agents/rules/ui_rules.md`
- `agents/rules/ux_rules.md`
- `agents/rules/widgets_rules.md`
- `agents/rules/components_rules.md`
- `agents/rules/color_rules.md`
- `agents/rules/navigation_rules.md`
- `agents/rules/shared_rules.md`
- `agents/rules/security_rules.md`
- `agents/rules/openapi_rules.md`
- `agents/rules/contract_rules.md`
- `agents/rules/vo_enum_rules.md`

### Referência (sob gatilho)

- `agents/reference/domain_examples.md`
- `agents/reference/vo_enum_reference.md`
- `agents/reference/color_reference.md`
- `agents/reference/components_examples.md`
- `agents/reference/api_contract_reference.md`

### Índices por tipo

- `agents/index/feature.md`
- `agents/index/ui.md`
- `agents/index/contract.md`
- `agents/index/navigation.md`
- `agents/index/shared.md`
- `agents/index/security.md`
- `agents/index/diagnostic.md`
- `agents/index/diagnostic_i18n.md`
- `agents/index/diagnostic_backend_codes.md`
- `agents/index/refactoring.md`
- `agents/index/testing.md`

## 🔒 Regras Universais

### Idioma e formato

- Idioma: Português Brasileiro (PT-BR)
- Formato: Markdown
- Estilo: direto, técnico, conciso

### Segurança

- Nunca expor segredos (tokens, chaves, credenciais, URLs privadas)
- `.env` sempre fora do Git (`.gitignore`)
- Evitar PII em logs, prints e exemplos

### Workflow

- Commits: só quando o usuário pedir explicitamente
- Testes: só criar/executar quando o usuário pedir explicitamente

### Remoções e impacto colateral

- Nunca inferir remoções de código, arquivo, dependência, configuração, fluxo ou comportamento sem pedido explícito do usuário.
- Se uma implementação sugerir remoção implícita, parar e pedir confirmação antes de remover qualquer coisa.
- Quando o usuário pedir remoção explícita, listar antes tudo o que será removido direta e indiretamente, incluindo efeitos colaterais, dependências afetadas e comportamento que deixará de existir.
- Se houver remoções derivadas necessárias para concluir o pedido, expor cada uma delas e pedir aprovação antes de executar.
- Pedido para "entender", "analisar", "explicar", "investigar", "avaliar" ou "diagnosticar" nunca autoriza remover nada.
- Pedido para alterar um ponto específico não autoriza remover outros pontos relacionados por inferência; qualquer remoção adicional exige confirmação separada.
- Quando houver ferramenta de confirmação/pergunta disponível no modo atual, usá-la; quando não houver, perguntar diretamente ao usuário antes de remover.

### Nomenclatura e IDs

- DTO/Entity com nomes exatamente iguais ao backend JSON
- Nunca usar campo genérico `id`
- Sempre usar IDs semânticos (`userId`, `planId`, `trainerId`, etc.)

### Escopo

Implementar exatamente o que foi pedido.

Permitido ser proativo em:
- bugs
- typos
- imports faltantes
- refactors mínimos

Nunca ampliar escopo sem aprovação.

## ✅ Checklist de Validação

### Feature / Arquitetura
- [ ] Store sem `BuildContext` e sem overlays
- [ ] Store usa Service quando há estado compartilhado ou reuso/cross-feature; caso contrário pode depender diretamente do Repository da própria feature (nunca do datasource)
- [ ] Service sem navegação/UI e retorna `AppAsyncResult<T>`
- [ ] Service estende `Service` (de `paytrainer_utils`), sem interface/`Impl` dedicada
- [ ] DTO ↔ Entity via Mapper
- [ ] DI registrada corretamente

### UI / Widgets
- [ ] Sem `.sp/.h/.w/.r`
- [ ] Sem `Colors.*` ou `Color(0x...)`
- [ ] Sem strings user-facing hardcoded
- [ ] Tipografia via `context.textStyles.*`
- [ ] Spacing via `context.spacing.*`
- [ ] Diálogos e confirmações via `AppDialog` (ou outro overlay padrão do app), não `AlertDialog`/`showDialog` cru
- [ ] Botões e ícones de ação via componentes do design system (`StandardButton`, `StandardIconButton`, etc.); ver `agents/rules/ui_rules.md`

### Contrato / DTO / Entity
- [ ] Campos iguais ao backend
- [ ] Mapper para DTO ↔ Entity
- [ ] Validações centralizadas
- [ ] Contrato alinhado ao OpenAPI quando aplicável

### Navegação
- [ ] Navegação via `AppNavigator`
- [ ] Lógica de navegação em controller quando necessário
- [ ] Dialog/bottom sheet somente na View

### Imports
- [ ] Imports por pacote (`package:...`)
- [ ] Sem imports relativos
- [ ] Sem duplicação de imports

### Segurança
- [ ] Sem segredos no código/prints
- [ ] Sem logs com payload sensível/PII

## 🔧 Verificação de Código

Após alterações de código:
1. Rodar análise estática (`flutter analyze` ou analyzer equivalente).
2. Se houver erro/warning de lint, não finalizar.
3. Corrigir até retornar limpo.

## 📋 Regra de Precedência

1. `AGENTS.md`
2. `agents/index/<tipo>.md`
3. `agents/rules/*.md`
4. `agents/reference/*.md`
5. `agents/memory/extended-memory.md` — complementar; só entra quando o bootstrap carregar o arquivo; **nunca** prevalece sobre os itens 1–4 em conflito
6. Código do projeto

Se houver ambiguidade, escolher interpretação simples e pedir confirmação.
