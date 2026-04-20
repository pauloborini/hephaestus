# Decisions - Hardless MCP

## Como usar este arquivo

Este arquivo registra decisoes fechadas especificas da iniciativa `Hardless MCP`.

Regras:

- toda decisao estavel desta iniciativa deve entrar aqui antes de orientar implementacao relevante;
- este arquivo complementa, e nao substitui, as decisoes globais do produto;
- quando uma decisao mudar, a anterior deve ser marcada como `superseded` e uma nova deve ser criada;
- requisitos dizem o que o MCP precisa fazer; este arquivo registra como escolhemos fazer.

Status validos:

- `accepted`
- `superseded`
- `proposed`

---

## D-001 - Implementar o Hardless MCP dentro do monorepo atual

- Status: `superseded`
- Data: `2026-04-19`

### Contexto

No inicio da iniciativa, parecia mais rapido validar o Hardless MCP sem abrir outro repositorio, preservando reaproveitamento imediato do nucleo do produto.

### Decisao

O Hardless MCP seria implementado dentro do monorepo do produto principal, como um novo pacote em `packages/`.

### Consequencias

- o MCP pode reutilizar `harness-core`, `repo-sensor`, `agent-runtime` e `shared`;
- o desktop podera consumir o mesmo nucleo depois;
- evitamos dispersao prematura de arquitetura e infraestrutura.

### Superseded By

- `D-006`

---

## D-002 - O Hardless MCP sera workflow-first, nao context-first

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Servidores MCP genericos de contexto tendem a entregar scaffolds, memoria e ferramentas, mas deixam o fluxo de engenharia frouxo. Isso nao expressa o diferencial desejado para o Hardless.

### Decisao

O eixo principal do Hardless MCP sera o ritual operacional:

- triagem inicial;
- classificacao da tarefa;
- decisao entre `discussion`, `fast mode`, `spec flow` ou `blocked`;
- gates de execucao e validacao;
- consumo de artefatos curados pelo Hardless.

### Consequencias

- contexto existe para servir o workflow;
- o valor do produto nao depende de uma UI propria neste alpha;
- as tools do MCP precisam refletir fases e gates, nao apenas leitura de arquivos.

---

## D-003 - Arquivos do usuario sao fontes de ingestao, nao contrato cru de runtime

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Projetos diferentes terao `AGENTS.md`, `CLAUDE.md`, `cloud.md` e docs com niveis muito diferentes de qualidade. Apoiar o runtime diretamente nesses arquivos geraria fragilidade, custo de contexto e inconsistencias.

### Decisao

Arquivos do usuario serao tratados como fontes de entrada para um bootstrap do Hardless. O runtime passara a operar prioritariamente sobre os artefatos derivados em `.hardless/`.

### Consequencias

- o Hardless ganha um contrato operacional estavel;
- regras do usuario continuam preservadas como input;
- o sistema precisa manter proveniencia e drift entre fonte e derivado.

---

## D-004 - O bootstrap sera hibrido e rastreavel

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Deixar a LLM preencher livremente os arquivos do Hardless cria risco de artefatos genericos, omissoes e alucinacao de regras que o projeto nunca teve.

### Decisao

O bootstrap combinara:

- descoberta deterministica de fontes;
- snapshots das fontes;
- fragmentacao semi-deterministica;
- sintese assistida por LLM com schema e limites;
- manifestos de proveniencia, confianca e drift.

### Consequencias

- reduzimos dependencia de geracao livre;
- a qualidade do bootstrap passa a depender tambem de heuristicas e contratos claros;
- fica possivel reconciliar artefatos sem refazer tudo do zero.

---

## D-005 - Fast mode e spec flow serao caminhos explicitamente distintos

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Um dos problemas do uso atual de LLM para codigo e tratar toda solicitacao com a mesma cerimonia ou sem cerimonia nenhuma. Isso produz desperdicio nas tarefas pequenas e improviso perigoso nas grandes.

### Decisao

O Hardless MCP tera dois caminhos operacionais principais apos a triagem:

- `fast mode` para mudancas pequenas, claras e de baixo risco;
- `spec flow` para mudancas maiores, ambiguas ou arriscadas.

Tambem havera os estados `discussion` e `blocked` antes de qualquer escrita.

### Consequencias

- o produto consegue equilibrar velocidade e disciplina;
- a triagem se torna uma parte central do runtime;
- o alpha precisa registrar criterios de promocao de `fast mode` para `spec flow`.

---

## D-006 - O Hardless MCP vivera em um repositorio proprio com pacote principal dedicado

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Separar a iniciativa do repositorio do app desktop reduz confusao de escopo, contexto de leitura e arquivos-alvo do agente. Neste momento, esse ganho de clareza vale mais do que o reaproveitamento estrutural imediato de um monorepo compartilhado.

### Decisao

O Hardless MCP vivera em um repositorio proprio. Dentro dele, o servidor MCP e o runtime do alpha morarao em `packages/hardless-mcp`, preservando espaco para novos pacotes internos sem reacoplar a iniciativa ao app desktop.

### Consequencias

- a arquitetura do alpha passa a otimizar independencia de produto e clareza operacional;
- o runtime nao deve assumir acesso estrutural ao repositorio do desktop;
- reaproveitamento futuro com o produto principal precisa acontecer por extracao deliberada de contratos ou pacotes, e nao por acoplamento acidental;
- os artefatos de spec desta feature precisam refletir explicitamente a separacao para evitar drift conceitual.

---

## D-007 - O bootstrap ativara artefatos automaticamente apenas acima do limiar minimo de confianca

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Ativar sempre de forma automatica acelera o primeiro uso, mas pode promover artefatos fracos demais a contrato primario de runtime. Exigir confirmacao sempre protege mais, porem sacrifica o time-to-value do produto.

### Decisao

O alpha ativara automaticamente os artefatos derivados apenas quando a confianca agregada do pacote curado estiver acima de um limiar minimo definido pelo runtime. Abaixo desse limiar, o bootstrap gera os artefatos e exige confirmacao explicita do operador antes da ativacao.

### Consequencias

- o bootstrap continua rapido quando a curadoria esta forte;
- o sistema evita promover silenciosamente artefatos duvidosos;
- o runtime precisa expor score, limiar e razoes da decisao de ativacao.

---

## D-008 - O alpha adotara postura conservadora diante de incerteza relevante

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Seguir com heuristicas permissivas torna o produto mais rapido no curto prazo, mas dilui o diferencial do Hardless e aumenta o risco de improviso operacional justamente onde o produto quer impor disciplina.

### Decisao

Quando houver incerteza relevante sobre classificacao, contexto, impacto, contradicao ou validacao, o alpha deve bloquear ou escalar o fluxo em vez de prosseguir por otimismo heuristico.

### Consequencias

- o produto fica mais confiavel como camada de metodo;
- parte das interacoes simples pode ficar menos fluida que um MCP permissivo;
- o runtime precisa explicar claramente o motivo do bloqueio e o criterio de desbloqueio.

---

## D-009 - O `fast_mode` sera prescritivo, nao apenas classificatorio

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Se o `fast_mode` apenas classificar e entregar contexto, o Hardless vira um roteador disciplinado, mas passivo demais. Isso reduz parte do ganho de produtividade que o alpha deveria provar.

### Decisao

No alpha, o `fast_mode` deve classificar a tarefa, carregar o contexto minimo, recomendar explicitamente o proximo passo operacional e devolver um plano curto antes de qualquer escrita.

### Consequencias

- o produto acelera execucao sem pular gate;
- o valor do Hardless fica mais visivel em tarefas pequenas e claras;
- `hardless.triage` e `hardless.context` passam a carregar responsabilidade de orientacao prescritiva, nao apenas diagnostica.

---

## D-010 - O alpha usara um SDK MCP pragmatico por tras de um adapter interno

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Precisamos entregar o alpha rapido, entao faz sentido usar um SDK MCP existente. Mas acoplar o runtime diretamente a esse SDK transformaria um detalhe de integracao em restricao arquitetural desnecessaria.

### Decisao

O alpha usara um SDK MCP pragmatico para acelerar implementacao, mas toda a integracao ficara encapsulada em um adapter interno. `application` e `runtime` nao podem depender diretamente do SDK escolhido.

### Consequencias

- o time ganha velocidade sem travar a arquitetura por detalhe de ferramenta;
- trocar de SDK no futuro fica viavel sem reescrever o nucleo do produto;
- o pacote precisa manter fronteiras claras entre adapter MCP e runtime.

---

## D-011 - Contratos operacionais ficam em JSON e relatorios humanos ficam em Markdown

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

Misturar muitos formatos no alpha aumentaria custo operacional, superficie de parser e chance de inconsistencia. O produto precisa privilegiar simplicidade auditavel.

### Decisao

No alpha, todos os manifestos, bundles, indexes e contratos lidos pelo runtime ficarao em `JSON`. Relatorios voltados a leitura humana, como `bootstrap-summary`, ficarao em `Markdown`.

### Consequencias

- o runtime ganha contratos simples e uniformes;
- a leitura humana continua boa onde isso importa;
- evitamos complexidade desnecessaria com `YAML` ou formatos hibridos mais amplos cedo demais.

---

## D-012 - O `Cursor` sera o cliente MCP prioritario do alpha

- Status: `accepted`
- Data: `2026-04-19`

### Contexto

No uso real atual do produto, `Cursor` e `Codex` sao as ferramentas principais. Para o alpha do Hardless MCP, espalhar validacao entre varios clientes agora aumentaria custo operacional sem melhorar proporcionalmente o aprendizado mais importante.

### Decisao

O primeiro ciclo de validacao pratica do Hardless MCP sera otimizado para `Cursor` como cliente MCP prioritario. Outros clientes podem ser suportados depois, mas nao dirigem as decisoes principais do alpha.

### Consequencias

- a validacao manual principal do alpha deve acontecer no `Cursor`;
- o adapter MCP continua desacoplado para preservar opcao de expansao futura;
- compatibilidade ampla entre clientes deixa de ser meta imediata e passa a ser evolucao posterior.

---

## D-013 - O Hardless tera instalacao gerenciada e reversivel nas superficies suportadas

- Status: `accepted`
- Data: `2026-04-20`

### Contexto

Se o Hardless permanecer apenas como conjunto de tools opcionais, o agente continua dependendo demais da boa vontade do usuario ou do cliente MCP para passar pelo workflow correto. Por outro lado, takeover estrito e irreversivel de `AGENTS.md` ou `.cursorrules` destruiria confianca e tornaria rollback fraco demais para um produto instalavel.

### Decisao

O v1 tera instalacao gerenciada e reversivel em `AGENTS.md` e `.cursorrules`.

- o Hardless injeta um bloco gerenciado com precedencia;
- o conteudo original do usuario continua preservado abaixo do bloco;
- backups vao para `.hardless/backups/`;
- `hardless.install`, `hardless.uninstall` e `hardless.repair` controlam o ciclo de vida dessa instalacao;
- takeover estrito fica fora do v1.

### Consequencias

- o agente passa a ser direcionado automaticamente para o Hardless em clientes suportados;
- rollback e auditabilidade continuam fortes;
- o runtime curado em `.hardless/` segue como fonte operacional primaria, sem transformar `AGENTS.md` cru em contrato de runtime;
- o produto ganha onboarding e observabilidade melhores no `Cursor`, mas ainda nao promete enforcement absoluto em clientes nao suportados.
