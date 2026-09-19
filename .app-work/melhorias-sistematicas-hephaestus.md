# Relatório de Melhorias Sistemáticas: Hephaestus

## 1. Veredito de Gating

- **Status:** Aprovado — sem corte de conteúdo.
- **Objetivo Estratégico:** tornar coerente e retomável o fluxo de decisões do Hephaestus, da entrevista à persistência e ao contrato entregue ao agente.
- **Classificação de Sizing:** Modular.
- **Aprovação:** resumo de oito melhorias e três fases aprovado pelo usuário nesta conversa em 2026-09-11. A aprovação autoriza este relatório; não autoriza implementar o catálogo.
- **Fronteiras de Escopo:**
  - **In-Scope:** workflow da skill, decisão humana, identidade de DEC, persistência de respostas, retomada, transação documental, promoção de regras e `AGENTS.md` gerado.
  - **Out-of-Scope:** implementação nesta invocação, operações Git mutativas, plataforma nova de memória e reestruturação completa do kit — não solicitadas.
- **Cortes aplicados:** o pedido trata mecanismos que geram inconsistência, não apenas sintomas; ajustes nos contratos existentes têm ganho proporcional ao custo. Preservar identidade de DEC, separação dos territórios, evidência de origem e trabalho concorrente limita o risco de degradação.
- **Base da análise:** leitura de `SKILL.md`, prompts e contratos por ele citados, schemas e templates relacionados. Os achados abaixo são inconsistências ou lacunas documentais; não representam falhas reproduzidas em execução do pipeline nem auditoria dos scripts validadores.

## 2. Raio de Impacto & Decomposição Analítica

| Componente / Fluxo | Vetor Crítico | Causa-Raiz | Raio de Impacto (Blast Radius) | Risco |
|---|---|---|---|---|
| Entrevista e fases dependentes | Lógica | Resolução é exigida antes da entrevista e novas perguntas podem surgir depois dela, sem retorno definido | Roteamento, identidade, plano e staging | Alto |
| Persistência e aplicação | Resiliência | Escrita antecipada do state conflita com worktree limpa; rollback não delimita comandos e paths | Respostas humanas e arquivos do alvo | Alto |
| Seleção de modo | Dados | Existência do state é usada como prova de adoção anterior | Descoberta e retomada | Alto |
| Respostas humanas | Dados | Reuso obrigatório sem validade explícita e sem destino definido para respostas temporárias | Runs seguintes e escolhas vinculantes | Alto |
| Identidade de decisão | Dados | Casamento por similaridade exige valor igual, embora alteração de valor deva preservar identidade | Cláusulas, referências e índices | Alto |
| Promoção de candidatos | Lógica | Backstop identifica candidatos de processo sem explicitar sua conversão em decisão humana autorizada | Guides e vault vigente | Médio |
| Pacote gerado | Arquitetura | Protocolo necessário permanece em referência do kit ou em comentários removidos | Agentes que só recebem o pacote | Alto |
| Triagem e autorização | Lógica | Regras de leitura, registro automático e aprovação não distinguem consistentemente análise e mutação | Diagnóstico e operações documentais | Alto |

## 3. Catálogo de Melhorias Propostas

### Eixo: Fluxo & Lógica

- **`FLOW-01` Fechar o ciclo da entrevista**
  - **Contexto Atual:** `prompts/reconcile.md` exige `action` e `decId` resolvidos para validar a fase, mas enfileira conflitos para a entrevista seguinte. `prompts/interview.md` exige drenagem em ponto único. `prompts/compose.md` permite enfileirar pergunta quando a adaptação de conteúdo blindado é impossível. Não há transição explícita que reconcilie essas exigências.
  - **Ação Técnica:** distinguir descoberta de pendências e resolução final; definir retorno finito à entrevista quando necessário, seus motivos admitidos e quais saídas perdem validade. Respostas devem atualizar roteamento e identidade antes de um plano utilizável; mudança no plano deve invalidar aprovação afetada. Preservar agrupamento e deduplicação das perguntas.
  - **Impacto Direto:** impedir bloqueio circular ou avanço com artefatos anteriores à resposta humana.
  - **Critério de Sucesso (DoD):** regras nos prompts de entrevista, reconciliação, plano e composição descrevem a transição e a revalidação. Cenário de pressão: duas fontes divergem sobre um limite; após a resposta, o mapa de identidade, o plano e o staging usam o mesmo valor escolhido. Conflito de blindagem descoberto na composição retorna pelo caminho declarado, sem improvisar uma decisão nem manter aprovação obsoleta.

- **`FLOW-02` Completar a promoção de decisões**
  - **Contexto Atual:** `references/vault-schema/SCHEMA.md` §6 prevê candidatos nos `LEDGER.md`; `prompts/discover.md` os inventaria em manutenção. `prompts/reconcile.md` e a matriz anti-invenção proíbem cunhar DEC a partir de `.app-work/`. A passagem entre candidato de processo e decisão humana autorizada não está explicitada.
  - **Ação Técnica:** formalizar candidato como proposta sem autoridade normativa; apresentar regra e evidência ao usuário; após confirmação, registrar a resposta humana como origem da promoção e encaminhá-la ao fluxo de identidade. Manter o material de processo apenas como contexto e impedir promoção silenciosa.
  - **Impacto Direto:** tornar operável o backstop sem converter guides em fonte de verdade.
  - **Critério de Sucesso (DoD):** descoberta, entrevista e reconciliação descrevem o mesmo handoff. Cenário de pressão: uma regra só existe no LEDGER; se confirmada, materializa DEC e índice coerentes com origem humana registrada; sem confirmação, permanece candidata e não governa o produto.

- **`FLOW-03` Unificar leitura, escrita e aprovação**
  - **Contexto Atual:** `templates/AGENTS.md.template` proíbe ler regras em discussão salvo pedido, mas manda registrar defeito em qualquer tarefa. `prompts/plan.md` declara aprovação antes da escrita, dispensa aprovação em manutenção não destrutiva e restringe seu gate explícito de aprovação a operações destrutivas decididas pela LLM.
  - **Ação Técnica:** separar consulta necessária, discussão, registro de processo e alteração autorizada. Consolidar as condições de aprovação e reconhecer autorização já concedida para a mesma operação e escopo. Origem da classificação não deve, sozinha, determinar permissão para executar a operação. Preservar restrições explícitas do usuário e regras superiores.
  - **Impacto Direto:** evitar diagnóstico sem contexto, escrita não solicitada e solicitações redundantes de consentimento.
  - **Critério de Sucesso (DoD):** triagem e plano possuem condições compatíveis e verificáveis. Cenário de pressão: pedido apenas de explicação consulta o contrato necessário e relata o defeito sem criar issue automaticamente; operação destrutiva tem autorização exigível definida tanto para classificação por catálogo quanto por LLM; autorização válida já presente é considerada dentro de seu escopo.

### Eixo: Dados & Estado

- **`DATA-01` Separar entrevista salva de adoção concluída**
  - **Contexto Atual:** `prompts/preflight.md` escolhe `maintain` pela presença de `.app-work/hephaestus-state.json`. `prompts/interview.md` cria ou atualiza esse arquivo antes da aplicação e preserva-o após rollback. Assim, o arquivo pode existir sem adoção concluída.
  - **Ação Técnica:** definir evidência explícita de adoção aplicada e validada, distinta da existência de respostas. Fixar dono e momento de escrita dessa evidência e tratamento conservador para states anteriores ou incompletos, sem inferir sucesso pela árvore existente.
  - **Impacto Direto:** impedir que uma adoção interrompida seja reduzida ao escopo de manutenção.
  - **Critério de Sucesso (DoD):** seleção de modo e contrato de state distinguem resposta persistida de pacote concluído. Cenário de pressão: entrevista cria state e a execução aborta antes do `apply`; o próximo run conserva as respostas e continua a adoção pendente, mesmo sem checkpoint efêmero disponível.

- **`DATA-02` Definir validade e armazenamento das respostas**
  - **Contexto Atual:** `prompts/interview.md` e `prompts/route/catalog.md` tornam o reuso vinculante por `questionKey`, mas não definem invalidação por mudança material do contexto. Respostas `this-run` não são gravadas no state pelo prompt, porém `schemas/hephaestus-state.schema.json` aceita esse escopo no arquivo persistente. O prompt não define destino efêmero consumível para elas.
  - **Ação Técnica:** especificar os componentes normalizados da chave e as condições de validade da resposta; definir armazenamento efêmero das respostas de run, inclusive durante retomada; alinhar schema e consumidores aos escopos persistentes. Contexto materialmente alterado deve invalidar somente a resposta afetada e preservar sua evidência quando necessária à compreensão da mudança.
  - **Impacto Direto:** evitar tanto reaplicação de resposta obsoleta quanto perguntas repetidas por mera reformulação textual.
  - **Critério de Sucesso (DoD):** contrato de chave, validade e escopo está explícito nos prompts e schema. Cenários de pressão: reformular uma pergunta preserva o reuso; mudar a condição que fundamentava a escolha exige reavaliação localizada; resposta `this-run` sobrevive à retomada do mesmo run, mas não decide o próximo.

- **`DATA-03` Identificar a regra independentemente do valor**
  - **Contexto Atual:** `prompts/reconcile.md` casa por similaridade quando há mesmo domínio e mesmo valor, mas determina que alteração de valor mantenha a DEC. Uma fonte sem ID canônico que muda o valor não tem caminho inequívoco entre `amend` e `create`.
  - **Ação Técnica:** separar identidade semântica da regra — objeto, condição e escopo — do valor vigente. Casar a identidade antes de comparar valores; divergência de valor segue o protocolo de conflito e confirmação. Identidade ambígua não deve ser resolvida silenciosamente.
  - **Impacto Direto:** preservar referências e evitar duas DECs para a mesma regra em versões diferentes.
  - **Critério de Sucesso (DoD):** a ordem de casamento distingue regra e valor. Cenário de pressão: fonte sem ID altera a cota do mesmo plano de 10 para 20; após confirmação, a DEC existente é alterada com nota, sem criar outra. Cota de outro plano não é absorvida apenas por ter número ou texto semelhantes.

### Eixo: Estrutura & Acoplamento

- **`ARCH-01` Entregar protocolo autossuficiente no pacote**
  - **Contexto Atual:** `templates/AGENTS.md.template` remete a `SCHEMA.md` §4.4, mas o schema vive no kit. `templates/vault/DECISION_TEMPLATE.md` contém instruções de numeração, remoção e índice em comentários que `prompts/compose.md` manda remover. A regra gerada de adição menciona `max+1` sem explicitar ali o inventário de IDs removidos.
  - **Ação Técnica:** materializar o protocolo operacional necessário em documento alcançável do pacote gerado e deixar no `AGENTS.md` o gatilho e o ponteiro. Definir explicitamente a consulta de DECs de produto sem confundi-la com dependência externa de regra de engenharia. Evitar cópias paralelas do protocolo e dos valores de produto.
  - **Impacto Direto:** permitir manutenção correta das decisões sem carregar a instalação do Hephaestus.
  - **Critério de Sucesso (DoD):** regras de composição e template apontam para protocolo efetivamente entregue. Cenário de pressão: um agente com acesso apenas ao pacote consegue alterar uma DEC, registrar a nota, inventariar IDs vivos e removidos e atualizar o índice de features; nenhum passo exige resolver `SCHEMA.md` dentro da skill instalada.

### Eixo: Risco & Operação

- **`OPEX-01` Compatibilizar persistência e transação**
  - **Contexto Atual:** `prompts/interview.md` grava state versionado antes do `apply`; `prompts/apply.md` exige `git status --porcelain` vazio. O `apply` e `prompts/validate.md` prescrevem rollback primeiro por Git e depois por backup, sem enumerar comandos e paths nem como distinguir alteração concorrente após a checagem.
  - **Ação Técnica:** definir baseline e evidência das escritas do próprio run; reconhecer a exceção exata do state sem liberar alterações alheias. Delimitar recuperação aos paths e versões comprovadamente pertencentes à transação, incluindo arquivos criados e removidos, preservando respostas. Subordinar qualquer comando Git mutativo à autorização aplicável e bloquear recuperação que sobrescreveria alteração concorrente.
  - **Impacto Direto:** permitir a aplicação após entrevista sem enfraquecer a proteção ao trabalho compartilhado.
  - **Critério de Sucesso (DoD):** prompts de aplicação, validação e retomada descrevem baseline, exceção e recuperação delimitada. Cenários de pressão: apenas o state foi alterado pela entrevista e o run pode avançar; outro agente altera arquivo antes ou durante a aplicação e esse trabalho não é sobrescrito nem revertido; falha de hash recupera somente o delta comprovado e mantém respostas humanas.

## 4. Plano de Entrega Faseado

### Fase 1: Segurança e continuidade

- **Metas da Fase:** tornar entrevista, retomada e transação compatíveis, preservando decisões humanas e trabalho concorrente.
- **Melhorias Incluídas:** `FLOW-01`, `OPEX-01`, `DATA-01`.
- **Dependências / Pré-condições:** pedido explícito de implementação; leitura do boundary real de prompts, schemas e validadores antes da edição. Fixar transições e responsáveis pela escrita antes de alterar consumidores.
- **Estratégia de Rollback:** restaurar apenas as alterações documentais e contratuais desta fase a partir da versão anterior, mediante autorização aplicável; não usar reversão global nem tocar alterações de terceiros. Se houver state novo em uso, preservar sua informação até definir compatibilidade com a versão anterior.

### Fase 2: Decisão e armazenamento

- **Metas da Fase:** definir validade das respostas, preservar identidade das regras e fechar a promoção humana de candidatos.
- **Melhorias Incluídas:** `DATA-02`, `DATA-03`, `FLOW-02`.
- **Dependências / Pré-condições:** conclusão da Fase 1; handoff de entrevista e evidência de retomada definidos. Não promover candidatos de processo automaticamente.
- **Estratégia de Rollback:** restaurar somente os arquivos alterados nesta fase, com autorização aplicável e preservação de trabalho alheio. Não apagar respostas coletadas nem renumerar DECs existentes para acomodar a reversão documental.

### Fase 3: Contrato entregue ao agente

- **Metas da Fase:** entregar protocolo local completo e comportamento consistente de consulta, diagnóstico e aprovação.
- **Melhorias Incluídas:** `ARCH-01`, `FLOW-03`.
- **Dependências / Pré-condições:** conclusão da Fase 2; semântica de persistência e promoção estabilizada. Conferir coerência entre entrada da skill, prompts, templates, schemas e pares de idioma existentes no boundary.
- **Estratégia de Rollback:** restaurar os arquivos documentais e templates desta fase à versão anterior, mediante autorização aplicável. Pacotes já gerados precisam de avaliação própria; reverter o template não reverte automaticamente documentação de projetos consumidores.

## 5. Matriz de Trade-offs & Decisões Técnicas

- **Ganhos Garantidos:** este relatório fornece oito propostas rastreáveis e critérios objetivos de aceite. Ganhos de execução só poderão ser afirmados após implementação e verificação dos cenários; a leitura documental não os demonstra.
- **Trade-offs Aceitos:** acrescentar condições explícitas de validade, transição e ownership aumenta o detalhe dos contratos, mas evita deixar decisões essenciais à interpretação do agente. Retorno controlado à entrevista pode acrescentar uma interação quando surgir conflito tardio; deve preservar o agrupamento e evitar repetição de respostas válidas.
- **Preservações:** DEC permanece identidade estável da regra; produto, engenharia e processo mantêm seus territórios; respostas humanas não são descartadas por rollback; conteúdo de processo não adquire autoridade normativa por estar inventariado; `AGENTS.md` continua centralizador.
- **Decisões ainda necessárias na implementação:** shape mínimo da evidência de adoção; armazenamento efêmero de respostas; componentes de validade do contexto; localização canônica do protocolo entregue; transições exatas de retorno e recuperação. Este relatório fixa resultados e cenários, não inventa campos ou comandos como se já estivessem aprovados.
- **Recomendações Operacionais:** implementar por fase, conferir os contratos consumidores e aplicar os cenários de pressão indicados. Não criar testes nem executar operações Git mutativas sem a autorização exigida pelas regras vigentes. Qualquer alteração de scripts deverá respeitar o boundary autorizado e não será justificada apenas por este relatório.
- **Próximo passo:** implementação só com pedido nesta conversa.
