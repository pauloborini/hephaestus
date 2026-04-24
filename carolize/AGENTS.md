Este é o **ponto de entrada único** para agentes de IA no projeto **Carolize**.

## 🚀 PRIMEIRO PASSO (OBRIGATÓRIO)

**Antes de executar qualquer tarefa, siga o Fluxo de Trabalho (WORKFLOW) deste arquivo (seção `Fluxo de Trabalho (Não Negociável)`).**

Esse fluxo existe para:
1. Classificar o tipo da tarefa.
2. Forçar o carregamento dos MDs corretos em `agents/`.
3. Aplicar checklist de validação por contexto.
4. Reduzir decisões ad-hoc e evitar violações de padrão.

## 📋 Fluxo de Trabalho (Não Negociável)


**Regra Absoluta: Triagem Antes de Contexto**  

**Antes de qualquer resposta**, o agente deve executar a triagem abaixo.  
**Somente após a triagem**, e **apenas se houver pedido explícito de alteração**, o agente lê os MDs obrigatórios e emite a confirmação de contexto.

---

### Fase 1. Triagem Inicial (sempre primeiro)

1. Se houver **pergunta explícita** ou **pedido de opinião** **sem pedido explícito de alteração** → **Modo Discussão**.  
   - Responder **antes de qualquer ação**.  
   - **Não** ler MDs a menos que o usuário peça explicitamente para consultar regras.
   - **Não** alterar código.

2. Se houver **pedido explícito de alteração** → seguir para as Fases 2 e 3.

3. Se houver **pedido explícito de alteração** (ex: criar feature, refatorar, commit) →  
   - **Executar primeiro** (incluindo pré-confirmação e leitura de MDs) e **responder/notificar depois**.
   - **Não pausar** para pedir permissão de leitura de MDs ou confirmação de tipo.

---

### Fase 2. Identifique o Tipo de Tarefa

Leia o pedido do usuário e identifique o tipo **apenas pelo texto do pedido** (sem ler MDs).

| Tipo | Exemplos |
|------|----------|
| **feature** | Criar feature, alterar service/store/di, mudanças em domain |
| **ui** | Criar widget, página, tela, layout, componente |
| **contract** | DTO, Entity, Adapter/Mapper, contrato de API |
| **navigation** | Criar/alterar rotas, navegação, guards |
| **shared** | Entidades/VOs compartilhados, ajustes em packages |
| **security** | Segurança, logs, PII, ambientes, .env |
| **diagnostic** | Analisar código, diagnosticar erro, investigar bug |
| **refactoring** | Refatorar código, otimizar, melhorar |
| **testing** | Criar/executar testes (quando solicitado) |

**Tarefas Híbridas**: Se envolver múltiplos tipos, escolha o principal e anote os secundários.

**Somente se houver pedido de alteração**, leia os MDs do tipo principal e dos tipos secundários impactados.

### Fase 3. Selecione os MDs Obrigatórios

Todos os arquivos abaixo ficam sob `agents/` (use sempre o path completo, ex.: `agents/UI-DESIGN.md`).

Baseado no tipo de tarefa identificado, selecione os MDs listados abaixo **na ordem exata**:

#### feature
`agents/ARCHITECTURE.md`, `agents/DOMAIN.md`, `agents/DI.md`, `agents/ERRORS.md`, `agents/NAMING-CONVENTIONS.md`, `agents/NAVIGATION.md`, `agents/UI-DESIGN.md`, `agents/FIREBASE.md`

#### ui
`agents/UI-DESIGN.md`, `agents/COMPONENTIZATION.md`, `agents/NAMING-CONVENTIONS.md`, `agents/NAVIGATION.md`

#### contract
`agents/DOMAIN.md`, `agents/NAMING-CONVENTIONS.md`, `agents/ERRORS.md`, `agents/ARCHITECTURE.md`

#### navigation
`agents/NAVIGATION.md`, `agents/ARCHITECTURE.md`, `agents/UI-DESIGN.md`

#### shared
`agents/ARCHITECTURE.md`, `agents/DOMAIN.md`, `agents/NAMING-CONVENTIONS.md`, `agents/ERRORS.md`

#### security
`agents/SECURITY.md`, `agents/ARCHITECTURE.md`

#### diagnostic
`agents/ARCHITECTURE.md`, `agents/ERRORS.md`

#### refactoring
`agents/ARCHITECTURE.md`, `agents/DOMAIN.md`, `agents/NAMING-CONVENTIONS.md`

#### testing
`agents/TESTING-STRATEGY.md`, `agents/ARCHITECTURE.md`

### Fase 4. ✅ Confirmação de Contexto

Esta confirmação é obrigatória e ocorre **antes de ler MDs**:

**Pré-confirmação (antes de ler MDs)**  
Após escolher o tipo de tarefa, informe:

```
✅ Pré-confirmação: Tipo: <tipo>
MDs a consultar: <lista de MDs separados por vírgula>
Escopo: <1 linha descrevendo o que será feito>
```

> **Importante**: Se não conseguir acessar os arquivos listados, emita `⛔ Contexto incompleto` e solicite assistência ao usuário.
> **REGRA DE EXECUÇÃO**: Esta confirmação é informativa. O agente deve emitir o bloco e **prosseguir imediatamente** com a leitura dos MDs e execução, sem pausar para aguardar aprovação do usuário nesta fase.

---

### Fase 5. Dependências, Pré-requisitos e Bloqueios em Propostas do Agente

Esta fase é **obrigatória** quando o agente estiver:
- propondo uma feature, integração, melhoria, arquitetura ou plano de implementação;
- sugerindo um caminho técnico que ainda depende de validação do usuário;
- apresentando uma solução como recomendação antes da execução.

Antes de recomendar ou defender a solução, o agente deve declarar de forma explícita:

1. **Dependências internas**  
   - serviços, módulos, pacotes, camadas, migrations, rotas, DTOs, adapters, DI, caches, Cloud Functions ou regras afetadas.

2. **Dependências externas**  
   - contas e aprovações externas;
   - acessos a console/provedor;
   - configuração fora do repositório;
   - credenciais, segredos, chaves, certificados, provisioning, stores, APIs de terceiros;
   - deploys, ativação de produto, vínculo com Apple/Google/Stripe/Firebase ou qualquer fornecedor externo.

3. **Impacto operacional por ambiente/plataforma**  
   - web, iOS, Android, backend, CI/CD, produção, homologação, dispositivos físicos, simuladores, stores e consoles.

4. **Bloqueios e pré-requisitos para conclusão**  
   - o que precisa existir antes para a solução funcionar de verdade;
   - o que impede a entrega completa naquele momento;
   - o que ficaria pendente ou parcialmente implementado.

### Regra crítica para propostas

- Se a solução depender de algo **fora do repositório** ou **fora do controle atual do projeto**, o agente deve declarar isso **antes** de implementar.
- Se houver dependência externa bloqueante, o agente **não pode** apresentar a solução como “completa”, “pronta” ou “validada”.
- Se a ausência dessa dependência inviabilizar a solução, o agente deve:
  - sinalizar o bloqueio explicitamente;
  - propor alternativa compatível com o estado atual do projeto; ou
  - pedir decisão do usuário antes de seguir.
- É proibido omitir dependências externas relevantes só porque a implementação local parece viável.

### Remoções e impacto colateral

- Nunca inferir remoções de código, arquivo, dependência, configuração, fluxo ou comportamento sem pedido explícito do usuário.
- Se uma implementação sugerir remoção implícita, parar e pedir confirmação antes de remover qualquer coisa.
- Quando o usuário pedir remoção explícita, listar antes tudo o que será removido direta e indiretamente, incluindo efeitos colaterais, dependências afetadas e comportamento que deixará de existir.
- Se houver remoções derivadas necessárias para concluir o pedido, expor cada uma delas e pedir aprovação antes de executar.
- Pedido para "entender", "analisar", "explicar", "investigar", "avaliar" ou "diagnosticar" nunca autoriza remover nada.
- Pedido para alterar um ponto específico não autoriza remover outros pontos relacionados por inferência; qualquer remoção adicional exige confirmação separada.
- Quando houver ferramenta de confirmação/pergunta disponível no modo atual, usá-la; quando não houver, perguntar diretamente ao usuário antes de remover.

### Formato mínimo obrigatório em propostas do agente

Quando o agente estiver propondo implementação, incluir de forma objetiva:

```markdown
Dependências internas:
- ...

Dependências externas:
- ...

Bloqueios / pré-requisitos:
- ...

Impacto por plataforma/ambiente:
- ...
```

Se não houver itens em alguma categoria, o agente deve dizer explicitamente: `Nenhum`.

---

#### Orçamento de falhas (anti-loop)

Considere a confirmação inválida quando faltar qualquer item obrigatório do bloco (tipo, MDs consultados e escopo) **ou** quando os MDs listados não corresponderem ao tipo classificado.
Se a confirmação de contexto vier inválida, tente corrigir **até 3 vezes** (exibindo aviso: "Tentativa X/3 - Risco de loop"). Persistindo a falha, **PARE** e solicite uma destas ações do usuário:
1) confirmar o tipo de tarefa; **ou**
2) colar o conteúdo dos MDs obrigatórios; **ou**
3) trocar para a abordagem MCP.

---

## 📁 Estrutura do Projeto

- `lib/` — App Flutter principal (feature-first)
- `packages/` — Pacotes locais (`app_utils`, `app_design`, `app_infrastructure`)
- `landing-page/` — Site institucional (Next.js)
- `docs/` — Portal de documentação (Next.js)
- `functions/` — Funções backend (Firebase)

---

## 📖 Índice de Documentos (agents/)

| Documento | Propósito |
|-----------|-----------|
| `AGENTS.md` | ⚠️ **OBRIGATÓRIO** - Enforcer central |
| `ARCHITECTURE.md` | Estrutura, camadas, clean arch |
| `DOMAIN.md` | DTO, Entity, Adapter/Mapper |
| `DI.md` | Injeção de dependências |
| `ERRORS.md` | Tratamento de erros e feedbacks |
| `FIREBASE.md` | Firebase/Firestore |
| `NAVIGATION.md` | AppNavigator, rotas, navegação |
| `COMPONENTIZATION.md` | Estrutura de componentes |
| `UI-DESIGN.md` | Design system, cores, tipografia |
| `NAMING-CONVENTIONS.md` | Convenções de nomenclatura |
| `SECURITY.md` | Segredos, PII, logs |
| `PROJECT-OVERVIEW.md` | Visão geral do projeto |
| `TOOLING.md` | Ferramentas e ambiente |
| `TESTING-STRATEGY.md` | Estratégia de testes |
| `ARQUITETO.md` | Guia de planejamento arquitetural (uso opcional) |
| `GLOSSARY.md` | Termos e entidades |

---

## 🔒 Regras Universais

### Idioma e Formato
- **Idioma**: Português Brasileiro (PT-BR)
- **Formato**: Markdown (listas, headings, code blocks)
- **Estilo**: Direto, técnico, conciso

### Segurança
- **NUNCA** exponha segredos (tokens, chaves, credenciais, URLs privadas)
- **NUNCA** hardcode segredos, client secrets, certificados privados ou credenciais em Dart, Gradle, Xcode, JSON versionado ou qualquer arquivo commitado
- `.env` **sempre** fora do Git (em `.gitignore`)
- Evite PII em logs, prints, exemplos
- Dados sensíveis locais (tokens, session ids, chaves de cache, segredos) **não** podem ir para `SharedPreferences`, storage em texto puro ou logs; usar storage seguro e, quando houver cache persistido sensível, criptografia
- Tráfego inseguro por HTTP/cleartext é proibido por padrão; mudanças de rede ou plataforma devem preservar HTTPS obrigatório, `android:usesCleartextTraffic="false"` e política equivalente no iOS/ATS, salvo exceção documentada
- Logs de debug e telemetria não podem expor payloads sensíveis e devem ser pensados para produção; não introduzir `print`/`debugPrint` ad hoc em fluxos sensíveis
- Hardening client-side reduz risco, mas **não** substitui validação backend, regras de acesso e controles server-side

### Workflow
- **Commits**: Só criar quando usuário pedir explicitamente
- **Testes**: Só criar/executar testes quando usuário pedir explicitamente
- **Escopo**: Implemente exatamente o que foi pedido
- **Sem comentários inúteis** em views (ex.: `// Header`, `// Button`).
  Documente o widget/componente no topo do arquivo com o propósito.
- **Validação Pós-Execução**: Ao alterar qualquer código, execute `flutter analyze` obrigatoriamente e corrija erros/warnings antes de finalizar. Outras validações (ex.: `flutter build`, `flutter test`) continuam sob solicitação explícita.

### Nomenclatura de DTOs/Entities
- Nomes de propriedades devem ser **exatamente iguais** aos campos do backend (JSON)
- Ex: backend usa `documentType` → DTO/Entity usa `documentType`

---

## ✅ Checklist de Validação

### Feature / Arquitetura
- [ ] Store não recebe `BuildContext` e não abre overlays
- [ ] Store não acessa datasource diretamente
- [ ] Repository direto somente para dados exclusivos; compartilhados via Service
- [ ] Service não navega, não mostra UI, retorna `AppAsyncResult<T>`
- [ ] Mapeamento DTO ↔ Entity em Adapter/Mapper
- [ ] DI criada corretamente
- [ ] Proposta do agente declarou dependências externas, pré-requisitos e bloqueios relevantes
- [ ] Solução não foi apresentada como completa se depender de conta, console, aprovação, deploy ou configuração externa ainda indisponível

### UI / Widgets
- [ ] UI segue [agents/UI-DESIGN.md](agents/UI-DESIGN.md)

### Contrato / DTO / Entity
- [ ] Nomes de propriedades iguais ao backend
- [ ] Adapter/Mapper criado para conversão DTO ↔ Entity
- [ ] Validações centralizadas

### Navegação
- [ ] Navegação via `AppNavigator` (sem `Get.to()`/`Navigator.push()`)
- [ ] Dialog/bottom sheet somente na View

### Imports
- [ ] Imports por pacote (`package:...`)
- [ ] Sem imports relativos (`../../`)
- [ ] Imports organizados e sem duplicação

### Segurança
- [ ] Sem tokens/keys/URLs privadas em código/prints
- [ ] Sem logs com payload sensível/PII
- [ ] Sem segredos hardcoded em Dart, configs mobile, JSONs versionados ou arquivos de build
- [ ] Dados sensíveis armazenados apenas com storage seguro; `SharedPreferences` e storage sem criptografia só para dados não sensíveis
- [ ] Mudanças de rede/plataforma não reintroduziram HTTP inseguro, cleartext traffic ou relaxamento indevido de ATS/TLS
- [ ] Propostas com SSL pinning, detecção de root/jailbreak/emulador ou bloqueio de screenshot trataram isso como controle por risco, não como garantia absoluta
- [ ] Builds/release não degradaram minificação/ofuscação já exigidas pela plataforma
- [ ] Seguir detalhes em [agents/SECURITY.md](agents/SECURITY.md)

---

## 🔧 Verificação de Código

- **Após qualquer alteração de código, execute `flutter analyze` obrigatoriamente.**
- **Não executar testes (`flutter test`) sem pedido explícito do usuário.**
- Se o usuário solicitar validações adicionais, executar o que foi pedido e corrigir erros/warnings antes de finalizar.

---

## 📋 Regra de Precedência

1. **AGENTS.md** (este documento)
2. MDs específicos (UI-DESIGN.md, DOMAIN.md, etc)
3. Código do projeto (padrões existentes)

Se ambíguo, escolha a interpretação mais simples e peça confirmação.
