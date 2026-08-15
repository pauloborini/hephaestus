<!-- Idioma: [English](README.md) · **Português** -->

# Hephaestus

> Nome grego deste projeto no umbrella `greek-stack`.

Kit de comando único, `/hephaestus`, que governa os quatro territórios documentais de um repositório — `AGENTS.md`, `project-rules/`, `_app-vault/` e `.app-work/` — numa execução e numa única transação de escrita.

Este `README.md` é para pessoas.
O [SKILL.md](SKILL.md) é para a LLM. Referência operacional: [COMMANDS.pt-BR.md](COMMANDS.pt-BR.md).

## Objetivo

O kit Hephaestus existe para reduzir improviso quando um agente precisa trabalhar em cima de:

- `AGENTS.md` muito grande;
- regras espalhadas em vários arquivos;
- docs e specs heterogêneas;
- convenções pouco operacionais para contexto mínimo.

Em vez de tratar essas fontes como contrato cru de runtime, o kit roda um fluxo de **13 fases** que:

1. descobre as fontes (varredura integral em `adopt`, só drift em `maintain`);
2. fragmenta o material com identidade estável;
3. roteia cada fragmento para um dos quatro territórios, com evidência;
4. reconcilia decisões sem renumerar IDs;
5. pergunta uma única vez por execução, em lote, só sobre ambiguidade genuína;
6. monta um plano aprovável antes de qualquer escrita;
7. grava tudo numa transação única, com verificação de hash depois da escrita.

Ele também permite retomada confiável quando a execução for interrompida no meio do processo.

## Agnóstico de framework

O kit é agnóstico de framework e linguagem.

A estrutura gerada é sempre a mesma; o que muda é o conteúdo, preenchido pela LLM conforme o stack real do repositório alvo:

- `AGENTS.md` → dono da postura, da parada, do workflow, da precedência e do roteamento (mesmo formato para qualquer projeto);
- `CLAUDE.md` → ponte de uma linha (`@AGENTS.md`), sem conteúdo próprio;
- `project-rules/index/*` → roteamento por tipo de tarefa;
- `project-rules/rules/*` → regras obrigatórias (architecture, operational, domain, error handling, auth, security, ui);
- `project-rules/reference/*` → apoio, exemplos e contratos longos;
- `project-rules/contracts/*` → contratos externos (ex.: OpenAPI), quando existirem;
- `_app-vault/` → decisões de produto (`DEC-NNN`) e specs;
- `.app-work/` → processo (estado, issues, guias) — nunca insumo de regra;
- `.hephaestus/manifests/` → checkpoint do processo de geração (retomada), efêmero e gitignored.

Exemplo: num projeto Flutter, a LLM preenche os gates de `operational_rules.md` com `flutter analyze`/`melos run ...`; num projeto TypeScript, com `tsc`/`eslint`. A estrutura das pastas não muda.

O kit não existe para inventar documentação nova.
Ele existe para reorganizar, consolidar e validar o que já veio das fontes do projeto.

## O Que Tem Aqui

- [SKILL.md](SKILL.md)
  - entrypoint procedural para a LLM
- `prompts/`
  - instruções curtas por fase
- `templates/`
  - estrutura canônica de saída (`AGENTS.md.template` + `project-rules/` + `vault/`)
- `references/`
  - referências neutras e exemplos de forma
- `catalog/`
  - catálogo base de roteamento e catálogo de drift
- `schemas/`
  - contratos mínimos para fragmentos, estado e artefatos
- `manifests/`
  - política de nomenclatura e metadados do kit (`packExcludes` é a lista final de exclusão do pacote)
- `scripts/validate-skill-kit.mjs`
  - validador estrutural do kit (roda também no publish)
- `scripts/pack-release.mjs`
  - gera o zip de release com raiz `hephaestus/`

## Para Quem É

Use este kit quando você quer:

- organizar melhor as instruções de um projeto;
- distribuir uma skill com estrutura previsível;
- instalar por `.zip` na pasta de skills;
- deixar claro o que o humano faz e o que a LLM faz.

Não use este kit esperando:

- frontend próprio;
- plugin de editor pronto;
- backend cloud;
- automação completa de todas as fases sem revisão humana.

## Resultado Esperado

Quando o fluxo é bem executado, o resultado esperado é:

- um `AGENTS.md` enxuto e centralizador;
- uma pasta `project-rules/` que concentra as regras do projeto;
- decisões de produto em `_app-vault/` com identidade estável (`DEC-NNN`);
- regras distribuídas por papel operacional, em vez de ficarem misturadas;
- relatório explícito quando `project-rules/` ainda depender de arquivos externos;
- checkpoint suficiente para retomada após interrupção.

Os status finais esperados do fechamento são:

- `ready`
- `degraded-but-usable`
- `needs-followup`

Na validação intermediária, a LLM também pode classificar o pacote como:

- `valid`
- `degraded`
- `blocked`

## Instalação

O produto é distribuído como zip de release com raiz fixa `hephaestus/`.

### Gerar o zip

Na raiz do repositório do kit:

```bash
node scripts/pack-release.mjs
```

Gera `hephaestus-<version>.zip`. Para ver o que vai no arquivo sem escrever nada:

```bash
node scripts/pack-release.mjs --dry-run
```

### Instalar na pasta de skills

Descompacte o zip na pasta de skills do seu ambiente:

```text
skills/
  hephaestus/
```

Toda entrada do zip é prefixada com a pasta fixa `hephaestus/` — sem versão no nome da pasta — então descompactar uma versão nova por cima de uma instalação existente **sobrescreve** em vez de acumular. O zip nunca contém `_app-vault/`, `.app-work/`, a suíte de testes nem artefatos de desenvolvimento; a lista final de exclusão vive em `manifests/kit-manifest.json:packExcludes`.

### Usar

No repositório alvo, rode `/hephaestus`. Dois modos internos são decididos pela presença de `.app-work/hephaestus-state.json`:

- `adopt` — state ausente: varredura integral e adoção dos quatro territórios;
- `maintain` — state presente: escopo reduzido, só drift e artefatos de outras ferramentas (`catalog/drift-catalog.json`).

## O Que Você Precisa Entregar Para A LLM

O kit funciona melhor quando o usuário entrega ou aponta claramente:

- o objetivo do trabalho;
- se a LLM deve apenas analisar ou já aplicar a reorganização;
- se existem restrições de escopo para o pacote final.

Se você não apontar fontes, a LLM ainda pode descobrir parte do material, mas o processo fica mais sujeito a lacunas.

## O Que O Humano Deve Fazer

1. Garantir que a pasta `hephaestus/` esteja disponível na pasta de skills do ambiente.
2. Ler este `README.md` para entender o fluxo.
3. Rodar `/hephaestus` no repositório alvo e responder o lote único de perguntas, se houver.
4. Ler e aprovar o plano (`.hephaestus/plan.md`) antes de qualquer escrita.
5. Revisar o resultado quando a validação terminar em `degraded` ou quando o fechamento indicar `needs-followup`.
6. Se a execução for interrompida, pedir retomada a partir do último checkpoint validado.

## O Que A LLM Deve Fazer

1. Ler [SKILL.md](SKILL.md).
2. Seguir as 13 fases na ordem definida.
3. Ler apenas os prompts, templates, references e schemas necessários para a fase atual.
4. Gerar uma saída canônica, pequena e neutra, adaptada ao framework real do repositório.
5. Bloquear a conclusão quando o contrato mínimo falhar.
6. Manter `.hephaestus/manifests/run-state.json` atualizado a cada fase.

## Prompt Pronto Para Colar

Depois de instalar a skill, cole isto no chat da LLM:

```text
Rode /hephaestus neste repositório.

Objetivo deste trabalho:
- consolidar as regras do projeto em um pacote mais operacional;
- manter `project-rules/` como fonte canônica das regras;
- deixar `AGENTS.md` apenas como dono da postura, da parada, do workflow, da precedência e do roteamento;
- manter decisões de produto em `_app-vault/` com identidade estável.

Não improvise a árvore final.
Use os prompts, templates, references, schemas e manifests do kit apenas quando necessários para a fase atual.

O kit é agnóstico de framework: detecte o stack deste repositório e preencha gates, checklists e comandos com as ferramentas reais do projeto.

O `AGENTS.md` final deve ser apenas o centralizador da postura, da parada, do workflow, da precedência e do roteamento.
Não coloque regras de domínio, arquitetura, UI, contrato, segurança ou operação diretamente no `AGENTS.md`; coloque essas regras nos arquivos adequados em `project-rules/rules/*`.

Se algum arquivo dentro de `project-rules/` precisar citar material fora dessa pasta, isso pode permanecer quando for parte real do contrato operacional do projeto. Nesse caso, registre essas dependências em `.hephaestus/manifests/external-references-report.json` e me avise explicitamente no fechamento.

Mantenha `.hephaestus/manifests/run-state.json` atualizado durante o processo para marcar:
- fases `not_started`;
- fases `in_progress`;
- fases `produced`;
- fases `validated`;
- fases `failed`.

Antes de aplicar, produza um mapa de cobertura simples relacionando:
- fragmento ou regra de origem;
- roteamento (território e regime);
- arquivo de destino;
- pendência, conflito ou baixa confiança, se houver.

Se houver ambiguidade relevante, conflito entre fontes ou falta de material suficiente, explicite isso em vez de forçar uma estrutura artificial.

Me mostre o plano (`.hephaestus/plan.md`) antes de qualquer escrita e aguarde minha aprovação.

Se a execução cair no meio, quero poder retomar a partir da última fase `validated`, sem confiar em fase apenas `in_progress` ou só `produced`.

No fechamento, eu quero:
- pendências restantes;
- decisão recomendada para cada pendência relevante;
- classificação final do resultado como `ready`, `degraded-but-usable` ou `needs-followup`;
- confirmação de que `AGENTS.md`, `project-rules/`, `_app-vault/` e `.app-work/` ficaram realmente utilizáveis;
- aviso explícito sobre referências externas encontradas em `project-rules/`.
```

## Prompt De Fechamento Após O Processo

Depois que a LLM terminar o fluxo principal, é recomendável rodar uma checagem final para não deixar pendências soltas ou artefatos incompletos.

Cole algo como:

```text
Agora faça o fechamento do kit Hephaestus sobre o que você acabou de gerar.

1. Verifique se ainda existe alguma pendência, ambiguidade, conflito ou decisão em aberto.
2. Me avise explicitamente cada pendência restante.
3. Para cada uma, me diga qual decisão você recomenda e por quê.
4. Revise os artefatos gerados e confirme se:
   - `AGENTS.md` está completo, centralizador e apontando para o novo método;
   - `AGENTS.md` não contém regras que deveriam estar em `project-rules/rules/*`;
   - as regras necessárias já estão distribuídas na pasta `project-rules/`;
   - os índices em `project-rules/index/*` apontam apenas para regras e referências existentes;
   - decisões de produto estão em `_app-vault/` com identidade estável;
   - dependências externas citadas por arquivos em `project-rules/` foram registradas em `.hephaestus/manifests/external-references-report.json`;
   - o mapa de cobertura mostra destino para as regras relevantes das fontes originais;
   - não ficaram categorias vazias, artificiais ou redundantes;
   - há algum ponto em que a estrutura ainda esteja fraca, degradada ou dependente de inferência.
5. Classifique o resultado final como `ready`, `degraded-but-usable` ou `needs-followup`.
6. Se estiver tudo suficientemente consistente, me diga isso de forma objetiva.
7. Se não estiver, me diga exatamente o que ainda precisa ser ajustado antes de considerar o processo concluído.
```

Esse fechamento é importante porque o kit pode terminar com status útil, mas ainda deixar decisões abertas para revisão humana.

## Prompt Curto De Retomada

Se a execução cair ou parar no meio, use algo assim:

```text
Retome o processo do kit Hephaestus a partir do estado atual.

Leia `./hephaestus/SKILL.md`, releia `.hephaestus/manifests/run-state.json` e continue a partir da última fase `validated`.

Não trate fase apenas `produced` como concluída.
Se houver dependências externas já detectadas, preserve e atualize `.hephaestus/manifests/external-references-report.json`.

No fim, me diga:
- de qual fase você retomou;
- o que precisou ser reexecutado;
- se o resultado final ficou `ready`, `degraded-but-usable` ou `needs-followup`.
```

## Estrutura Canônica Esperada

O kit orienta a geração de algo próximo disso:

```text
AGENTS.md
CLAUDE.md    (ponte de uma linha: `@AGENTS.md`)
project-rules/
  index/
  rules/
  reference/
  contracts/   (opcional)
_app-vault/       (decisões de produto e specs)
.app-work/        (processo: estado, issues, guias)
.hephaestus/      (checkpoint do processo; efêmero, gitignored)
  manifests/
```

Nem toda categoria precisa existir sempre.
`AGENTS.md` é obrigatório.
`CLAUDE.md` é só a ponte `@AGENTS.md`, nunca contrato paralelo.

## Verificação

Gates mecânicos, a partir da raiz do kit:

```bash
node scripts/validate-skill-kit.mjs .   # estrutura, nomenclatura e catálogo
node scripts/check-public-docs.mjs      # pares de documentação bilíngue
node --test                             # suíte (scripts/__tests__/)
```

`node --test` sem argumento: passar o diretório (`node --test scripts/__tests__/`) faz o runner
tratá-lo como módulo e falhar antes de coletar qualquer teste.

A validação principal, para quem usa o kit, é comportamental:

- a LLM entende o papel de `README.md` e `SKILL.md`;
- a LLM consegue seguir as fases sem se perder;
- a saída final fica pequena, canônica e neutra;
- o resultado não vaza nomes ou referências indevidas.

Também é esperado que, no fim, a LLM:

- explicite pendências restantes, se houver;
- recomende uma decisão para cada pendência relevante;
- faça uma revisão final do `AGENTS.md` e da pasta `project-rules/`;
- confirme se o método novo ficou realmente operacional.

## Fluxo Recomendado de Uso

1. humano instala o zip na pasta de skills (`skills/hephaestus/`);
2. humano roda `/hephaestus` no repositório alvo;
3. LLM executa as 13 fases na ordem do `SKILL.md`;
4. humano responde o lote único de perguntas, se houver;
5. humano aprova o plano antes de qualquer escrita;
6. humano revisa o pacote final quando necessário.

## Como Saber Se Está Funcionando

Você está usando o kit corretamente quando:

- o agente usa `SKILL.md` como procedimento;
- o agente consulta prompts, templates e references conforme a fase;
- o agente não tenta improvisar a árvore final;
- o pacote gerado tem `AGENTS.md`, `project-rules/`, `_app-vault/` e `.app-work/` coerentes;
- o agente informa pendências abertas em vez de escondê-las;
- o agente recomenda a melhor decisão quando sobra ambiguidade real;
- o resultado fica mais utilizável do que as fontes cruas originais.

## Guardrails Importantes

- nada distribuível pode citar projetos reais usados como inspiração;
- a árvore final não deve ser inventada livremente;
- `AGENTS.md` não deve virar depósito de regra de domínio;
- `project-rules/` deve concentrar as regras do projeto;
- categorias sem material suficiente devem ser omitidas;
- referências externas dentro de `project-rules/` não devem ser escondidas; devem ser reportadas;
- templates e references existem para reduzir deriva, não para serem copiados cegamente;
- a lista final de exclusão do pacote distribuível vive em `manifests/kit-manifest.json:packExcludes`; nenhuma exclusão de conteúdo hard-coded em script;
- `README.md` é para o humano, `SKILL.md` é para a LLM.

## Licença

Distribuído sob a [licença MIT](LICENSE).
