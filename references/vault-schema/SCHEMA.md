# SCHEMA — Hephaestus

> **Asset canônico do kit.** Vive só dentro do Hephaestus (`references/vault-schema/` +
> `catalog/routing-defaults.json`). Pacote legado externo de assets de vault foi absorvido em
> 2026-08-12 (trilha `HEPHAESTUS_V1`, Plano 01) e **descartado** — não consultar, não espelhar e
> não depender de fonte fora do kit. Regras de §2, §4, §5, §7 e §8 preservadas; vocabulário
> público segue o padrão do Hephaestus.

Referência operacional das skills de vault. Contém o **quê**; o **porquê** fica na SPEC.

O `AGENTS.md` do projeto **não** cita este arquivo: ele contém somente as âncoras imutáveis do
vault e do processo. O protocolo de leitura/escrita chega pela instrução global (no Hephaestus,
as seções de produto e processo do `AGENTS.md` são conteúdo gerado pela execução de `/hephaestus`).

---

## 1. Princípio único

> **O vault só contém o que é verdade hoje.**

Documento de processo — como se chegou à regra, o que se pretendeu, como foi executado — não mora
no vault. Mora em `.app-work/`.

---

## 2. Os dois territórios — lista fechada

Pasta fora desta lista **não existe** para o framework: não ganha índice, não entra na skill, não
é criada pelo agente.

```text
_app-vault/                 # VERDADE VIGENTE — visível, buscável
  INDEX.md                  # mapa vivo (§3)
  docs/
    decisions/              # FONTE DE VERDADE — um arquivo por domínio (§4)
    TEMPLATES/              # maiúsculo, obrigatório
  specs/                    # especificações técnicas (backend, API contract)

.app-work/                  # PROCESSO — descartável, oculto para busca
  INDEX.md                  # mapa do processo (§8) — ponteiro, não conteúdo; âncora do AGENTS.md
  .gitignore                # versionado; contém `references/` e `private/`; `issues/` se o repo é público (D43)
  guides/<NOME>_GUIDE/      # packs de execução
  brainstorming/            # caderno de processo
  prd/                      # proposta datada
  references/               # refs open source de terceiros — SEMPRE gitignored
  private/                  # área privada (sessões, roadmap, research, ops, auditorias) — SEMPRE gitignored
  issues/                   # registro de defeitos — versionado em repo privado; gitignored em repo público (D43)
  archive/                  # espelho de concluídos (DEC-002) + depósito livre do usuário
    guides/<NOME>_GUIDE/    # pack concluído preservado
    perguntas/<tema>/       # brainstorming fechado
    prds/                   # PRD aposentado
```

**Toda pasta de `_app-vault/` é vigente.** Sem exceção: o que envelheceu sai do vault — foi o que
tirou de lá `archive/` e `_private/`. O que resta é vigente por construção, não por vigilância.

**Presença sob o root do vault não é formato canônico.** Path `_app-vault/docs/features/`,
`docs/platform/`, `DECISOES_*` fora de `docs/decisions/`, etc. está **fora** desta lista: na
adoção (`/hephaestus` modo `adopt`) e na checagem de integridade do `maintain`, esse material é
**reclassificado** (decisão → `docs/decisions/` como `### DEC-NNN`; spec técnica → `specs/`;
processo/casca → `.app-work/`). Não-toque (cópia byte a byte) só vale para paths **já** listados
acima no formato certo — ver `prompts/route.md` nível 1 e DEC-004.

O vault não é espelhado fora do projeto.

### 2.1 Fronteira

| Pasta | Papel | Fonte de verdade? |
|---|---|---|
| `_app-vault/docs/decisions/` | Regra vigente por domínio | **Sim — a única** |
| `_app-vault/docs/TEMPLATES/` | Modelos | Não |
| `_app-vault/specs/` | Especificação técnica | Não |
| `.app-work/**` (tudo, inclusive `private/` e `archive/`) | Processo | **Nunca — proibido como insumo** |

**Referência é one-way.** Guide → decisão sempre; decisão → guide nunca. Arquivo de
`docs/decisions/` que precise apontar para um guide indica regra não promovida: promover (§6), não
referenciar.

**`references/` é o pior insumo possível.** Carrega cotas e contratos de *outro* projeto; match
acidental ali é indistinguível de regra própria. O ignore viaja com o schema:
`.app-work/.gitignore` versionado, não linha solta no `.gitignore` da raiz. O mesmo arquivo ignora
`private/`.

### 2.2 Ciclos

- **Guide** — nasce em `.app-work/guides/`, é executado, vai para o **espelho** do archive:
  `.app-work/archive/guides/<NOME>_GUIDE/` (pack) ou arquivo solto sob `archive/guides/` (DEC-002).
  Path já no espelho é canônico (não-toque); legado sob `.app-work/done/` migra na próxima
  execução. Nunca consultado em análise de feature, infraestrutura ou arquitetura.
- **Brainstorm** — ao fechar, roteia e não permanece como referência viva: produto →
  `_app-vault/docs/decisions/`; arquitetura/implementação → `project-rules/`; caderno fechado vai
  para o espelho `archive/perguntas/<tema>/` (DEC-002).
- **PRD** — proposta datada, nem sempre cumprida na totalidade. Não é contrato. Aposentado → o
  espelho `archive/prds/` (DEC-002).
- **Archive** — espelho de concluídos + depósito do usuário: o que o framework move (concluídos)
  tem formato definido (`guides/`, `perguntas/`, `prds/` — DEC-002); o resto é depósito livre,
  sem formato imposto, apagável a qualquer momento. Nenhuma regra do schema depende do que está lá.
- **Private** — área privada: sessões, roadmap, research, ops, backlog e relatórios de auditoria de
  feature. Sempre gitignored — nunca sobe ao remoto, logo só existe na máquina local. Como todo
  `.app-work/`, é proibida como insumo de regra.
- **Issues (D43)** — registro único de defeitos e ajustes de UI/UX/comportamento: linha no
  `INDEX.md` da pasta (tabela viva por estado — Abertos / Em verificação / Fechados) com ID
  `ISSUE-NNN` sequencial (prefixo único em todos os projetos), severidade S0–S3 e ciclo
  `OPEN → FIXED → VERIFIED → CLOSED` (+ WONTFIX/DUPLICATE); contexto rico (evidência, notas
  técnicas) mora em `ISSUE-NNN.md` **opcional** ao lado. **Visibilidade:** repo **privado**
  versiona `issues/` (rastreabilidade + colaboração); repo **público** ignora via
  `.app-work/.gitignore` (linha `issues/`) — issue carrega contexto interno (evidências, PII,
  decisões prematuras) e git público é imutável. Decidida na adoção, regra de um só caminho;
  em repo público o registro é local-only (colaboração externa, se um dia, via GitHub Issues).

### 2.3 Prefixos e naming

O prefixo é **switch de visibilidade de busca**, não cosmético. Verificado em ripgrep 15.1.0:

| Comando | Arquivos de dotfolder vistos |
|---|---|
| `rg --files` (da raiz) | **0** |
| `rg --files --hidden` (da raiz) | **260** |
| `rg "x" .app-work/…` (path citado) | **funciona, sem flag** |

O `.` bloqueia traversal implícito, não acesso — `grep -r` puro entra em dotfolder. Defesa parcial,
não hermética.

- `docs/TEMPLATES/` **maiúsculo** (minúsculo passa em macOS e quebra em Linux/CI).
- Guides: `.app-work/guides/<NOME>_GUIDE/`, `<NOME>` em `MAIUSCULO_COM_UNDERSCORE`.
  Executados: `.app-work/archive/guides/<NOME>_GUIDE/` (DEC-002).
- Decisões: `docs/decisions/<dominio>.md`, kebab-case.
- Gatilho do framework: `_app-vault/INDEX.md` existe. Sem ele, o agente **não cria** o vault.

### 2.4 Defaults de roteamento (D42)

Classificação legado → canônico (adoção **e** manutenção) usa `catalog/routing-defaults.json`
(na raiz do kit Hephaestus). É asset **vivo**: linhas de confiança `alta` evitam reperguntar;
respostas novas a classificação ambígua viram candidatos e só entram na tabela após promoção
explícita no gate D42 — handoff da adoção (`/hephaestus` modo `adopt`) **ou** fim da correção /
modalidade roteamento do modo `maintain` (`/hephaestus`). Destino ilegal (fora da §2) é recusado.
Ver procedimento nas fases do pipeline do Hephaestus.

---

## 3. `INDEX.md`

Ponteiro, não conteúdo. Modelo: `INDEX_TEMPLATE.md`.

- Frontmatter obrigatório: `vault_version`, `updated`, `scope`.
- `## Domínios` — um ponteiro por arquivo de `docs/decisions/`.
- `## Por feature` — índice reverso **derivado** dos campos `Afeta:`, nunca escrito à mão.
  Precedido pela lista de features válidas.
- Teto **~100 linhas**. Ultrapassou → o índice virou conteúdo; refatorar.
- **Nunca entra:** valor vigente de decisão; **qualquer ponteiro para `.app-work/`**; listagem de
  planos/tasks; cópia de PRD ou spec.

O mapa do processo não é este arquivo: é `.app-work/INDEX.md` (§8). A regra "nunca entra" aqui vale
para o índice do vault; o processo tem o próprio índice — ancorado pelo `AGENTS.md`, nunca como
insumo de regra.

---

## 4. `docs/decisions/<dominio>.md`

Modelo: `DECISION_TEMPLATE.md`.

### 4.1 Semântica (não regredir)

- Um arquivo por **domínio de produto** — área que o usuário final reconhece
  (`planos-e-cotas.md`, `autenticacao.md`, `pagamentos.md`).
- **Não** por feature, tela, sprint ou data. **Não** um arquivo por decisão datada.
- **Não existe decisão substituída por outra decisão.** A decisão nasce, vive e é **alterada
  in-place**: o valor muda, a `DEC-NNN` permanece. Remoção é possível, mas rara.

### 4.2 `DEC-NNN` é âncora da regra

Cada regra tem heading próprio, com o ID colado ao enunciado:

```markdown
### DEC-016 — Cota de export do plano gratuito

Plano gratuito: 20 exports/mês.
```

O ID identifica a **regra vigente**: estável, imortal, citável de fora. Ancorar o arquivo inteiro
não é aceitável — um domínio tem 5–10 regras e "conforme DEC-016" não diria qual.

### 4.3 Estrutura do arquivo

```markdown
# <Domínio>

Afeta: [login, billing, dashboard]

### DEC-016 — Cota de export do plano gratuito

Plano gratuito: 20 exports/mês.

_Alterado 2026-08-05 — era: 10/mês. Motivo: feedback do piloto._

### DEC-021 — Cortesia do plano anual

Plano anual inclui 2 meses de cortesia.
```

`Afeta:` vai logo após o título, acima da primeira cláusula. Features em kebab-case. É o insumo de
`## Por feature`.

### 4.4 Rastro de mudança — nota inline

Alteração de cláusula grava **uma linha**, logo abaixo do enunciado:

```markdown
_Alterado <data> — era: <valor antigo>. Motivo: <motivo>._
```

- O ID **não** se repete: já está no heading.
- Notas novas empilham **acima** da anterior (mais recente primeiro).
- Passando de **~3 notas** na mesma cláusula, as antigas são **apagadas**. Enunciado vigente e
  notas recentes permanecem. Não vão para `archive/` — archive não tem tarefa nem formato.

A nota morre junto com a regra: removida a cláusula, some o rastro e não sobra linha órfã.

### 4.5 Remoção — a única exceção

Sem cláusula não há onde pendurar a nota. Só nesse caso o arquivo ganha `## Histórico` no fim, uma
linha por remoção:

```markdown
## Histórico

- 2026-08-05 — DEC-009 removida. Era: teto de 3 projetos no plano gratuito. Motivo: limite abolido.
```

O ID citado aqui **não pode** existir como cláusula acima — se existe, não foi removido.

`## Histórico` fica no arquivo vivo e **nunca** vai para `archive/`: é o que mantém o ID de uma
regra removida visível ao inventário de numeração (§4.7).

Antes de remover, procurar citações pendentes do ID (§4.7).

### 4.6 Fonte de verdade

- **Só** `docs/decisions/` determina regra vigente.
- `specs/` é contexto, nunca insumo de regra.
- `.app-work/` inteiro é **proibido** como insumo.
- Regra citada só em guide/brainstorm/PRD e ausente de `docs/decisions/` **não é regra** — é lacuna
  a promover (§6).

### 4.7 Numeração e integridade

- Sequencial **por projeto**: `max(existing) + 1`, computado **só** sobre `docs/decisions/` —
  cláusulas vivas **e** IDs listados em `## Histórico`. Não depende de `archive/`: nenhum ID vive
  só lá, então apagar o archive não abre reuso de número.
- **Nunca reusar** número, inclusive de decisão removida.
- **Nunca numerar por domínio** (`DEC-PAG-001`).
- Na adoção, inventariar o maior ID existente antes de cunhar o primeiro novo. Projeto verde começa
  em `DEC-001`.
- **Referência pendente:** ID imortal + remoção permitida ⇒ citação externa pode sobreviver à regra.
  Ao remover, procurar citações do ID — inclusive em `.app-work/`, que exige `--hidden` ou path
  citado — e reportá-las.

### 4.8 Split e criação de domínio

Split só quando o arquivo ficou difícil de ler **ou** dois blocos nunca são consultados juntos.

Regra nova sem domínio óbvio: **estender** se trata do mesmo produto reconhecido pelo usuário final
que já tem arquivo; **criar** só se nenhum existente a abriga; **em dúvida, estender**.

---

## 5. Escrita de decisão — os quatro modos

Escrita é **mínima**: só decisão quando a tarefa **mudar** produto ou contrato. Identificar o modo
antes de agir. **Em dúvida entre §5.1 e §5.3, tratar como §5.1.**

### 5.1 Substituição — contraria regra vigente

Emitir, **antes** de aplicar:

```text
⚠️ Decisão de produto anterior: <valor antigo>
   Fonte: <arquivo:linha>
   Pedido atual: <valor novo>
   Também afetado: <o que mais depende desse valor>
   Confirma a nova regra?
```

- **Confirmado** → alterar o enunciado sob a `DEC-NNN` existente (**o ID não muda**), acrescentar a
  nota inline (§4.4), e seguir executando o pedido no mesmo fluxo.
- **Negado** → não aplicar.

`Também afetado` não é enfeite: um limite costuma ter regra vizinha pendurada nele.

### 5.2 Não escala ao protocolo de PARADA

- **Regra de projeto / implementação** → PARADA + CAIXA ALTA do `AGENTS.md` global.
- **Regra de produto / contrato** → alerta do §5.1, mesma conversa.

### 5.3 Adição de cláusula

Pedido que introduz opção, benefício, condição ou exceção **sem** remover nem alterar valor
existente:

1. Não dispara alerta.
2. Não leva nota inline.
3. **É** decisão: criar cláusula nova com `DEC-NNN` novo (§4.7).
4. Introduziu **domínio novo** ou **tag `Afeta:` nova** → atualizar o `INDEX.md` no mesmo fluxo:
   `## Domínios`, lista de features válidas e `## Por feature` (§3, §7).

Sem o passo 3, "sem conflito → nada a escrever" vira drift silencioso. Sem o passo 4, o índice fica
divergente até a próxima execução de manutenção (`/hephaestus` modo `maintain`).

### 5.4 Cross-domínio

Quando o alcance atinge outro domínio, a escrita não é atômica num arquivo só:

1. Atualizar todos os domínios afetados.
2. Citar a **`DEC-NNN` irmã** na nota de cada arquivo tocado. Ex.:
   `_Alterado 2026-08-05 — era: R$ 99/ano. Motivo: reajuste; ver DEC-024 em pagamentos.md._`
3. Atualizar `Afeta:` e `## Por feature` se o alcance mudou.

### 5.5 Remoção

Ver §4.5. Rara. Exige checagem de citações pendentes e linha em `## Histórico`.

---

## 6. Promoção a decisão

Impede "regra viva só em guide". Como `.app-work/` é invisível à busca, **o que não for promovido
está efetivamente perdido**.

**Gatilho forte (determinístico) — deve promover** quando o pedido altera, em regra já existente:
valor/limite/piso/teto; item de enumeração ou opção de plano; campo de contrato de produto.

**Gatilho fraco (heurístico) — considerar** diante de: linguagem de norma ("sempre", "nunca",
"padrão", "a partir de agora"); efeito observável pelo usuário final; alcance além do guide
corrente.

**Não promove:** escolha sem efeito observável — nome de arquivo, ordem de refactor, estratégia de
teste, detalhe interno.

**Backstop:** ao fechar plano ou guide, o executor registra `Candidatos a decisão` no `LEDGER.md`
do pack, com o texto da regra e onde foi citada. O modo `maintain` de `/hephaestus` apresenta em lote.
Backstop é rede de segurança, não caminho principal.

---

## 7. Tags de feature

- **Uma feature = um slug kebab-case estável.** Não versionar no slug (`login-v2` é slug novo e
  quebra o índice reverso).
- **Vocabulário controlado.** Lista de features válidas declarada uma vez no `INDEX.md`, acima de
  `## Por feature`. Tag fora da lista → adicionar à lista ou recusar a tag.
- **Caso transversal** (segurança, logging, i18n, privacidade): a decisão mora em domínio próprio
  e é tagueada em todas as features que toca. Não existe domínio "transversal" só de ponteiros.
- **Derivação, não escrita livre.** Divergindo, `Afeta:` é a verdade e o `INDEX.md` é corrigido.
  A derivação roda **na própria escrita** (§5.3 passo 4), não só na varredura de manutenção
  (`/hephaestus` modo `maintain`).

---

## 8. Os três regimes

| Regime | Casa | Conteúdo |
|---|---|---|
| **Produto** | `_app-vault/` | decisão, regra vigente, contrato de produto |
| **Código** | `project-rules/` | normas de implementação ao codar |
| **Processo** | `.app-work/` | guide, brainstorm, PRD, references, issues — descartável |

A adoção não mescla os três. O `AGENTS.md` do projeto recebe as âncoras de produto e processo
geradas pelo Hephaestus: `_app-vault/INDEX.md` (produto/decisão) e `.app-work/INDEX.md`
(processo). Ancorar é apontar o **mapa** — `.app-work/` continua proibido como insumo de regra:
a âncora existe para a LLM achar o mapa de organização, não para consultar conteúdo de processo.

**Caso híbrido** (~15% das regras): o **efeito observável pelo usuário final** vai para
`docs/decisions/`; a **norma de como implementar** vai para `project-rules/`. Duplicar o valor
literal é proibido — `project-rules/` **referencia** a `DEC-NNN`, não copia o valor.
