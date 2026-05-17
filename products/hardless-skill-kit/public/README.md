# Hardless Skill Kit

Kit repo-native para transformar regras cruas do projeto em um pacote fragmentado, canônico e mais operacional para uso com LLM.

Este `README.md` é para pessoas.
O [SKILL.md](SKILL.md) é para a LLM.

## Objetivo

O `Hardless Skill Kit` existe para reduzir improviso quando um agente precisa trabalhar em cima de:

- `AGENTS.md` muito grande;
- regras espalhadas em vários arquivos;
- docs e specs heterogêneas;
- convenções pouco operacionais para contexto mínimo.

Em vez de tratar essas fontes como contrato cru de runtime, o kit orienta a LLM a:

1. descobrir as fontes;
2. fragmentar o material;
3. classificar por papel operacional;
4. sintetizar uma estrutura canônica;
5. validar a saída antes de concluir.

Ele também deve permitir retomada confiável quando a execução for interrompida no meio do processo.

## O Que Tem Aqui

- [SKILL.md](SKILL.md)
  - entrypoint procedural para a LLM
- `prompts/`
  - instruções curtas por fase
- `templates/`
  - estrutura canônica de saída
- `references/`
  - referências neutras e exemplos de forma
- `schemas/`
  - contratos mínimos para fragmentos e artefatos
- `manifests/`
  - política de nomenclatura e metadados do kit
- `.hardless/manifests/run-state.json`
  - checkpoint da execução por fase no projeto gerado
- `.hardless/manifests/external-references-report.json`
  - inventário das dependências externas citadas por `project-context/`

## Para Quem É

Use este kit quando você quer:

- organizar melhor as instruções de um projeto;
- distribuir uma skill com estrutura previsível;
- trabalhar por clone ou `.zip`;
- deixar claro o que o humano faz e o que a LLM faz.

Não use este kit esperando:

- frontend próprio;
- plugin de editor pronto;
- backend cloud;
- automação completa de todas as fases sem revisão humana.

## Instalação

Você pode usar o kit de duas formas:

### Opção 1: Clone

Clone o repositório do kit e mantenha a pasta disponível para consulta.

### Opção 2: Zip

Baixe o `.zip`, extraia a pasta e deixe esse conteúdo acessível no ambiente em que a LLM vai operar.

### Procedimento recomendado de instalação

1. Baixe o repositório por clone ou `.zip`.
2. Se vier do GitHub por `.zip`, a pasta extraída normalmente terá um nome como:

```text
hardless-skill-kit-main/
```

3. Renomeie para algo limpo, por exemplo:

```text
hardless-skill-kit/
```

4. Coloque essa pasta dentro do workspace do projeto onde a LLM vai trabalhar.

Exemplo:

```text
workspace-do-usuario/
  hardless-skill-kit/
```

ou:

```text
meu-projeto/
  hardless-skill-kit/
```

5. No chat da LLM, aponte para `hardless-skill-kit/SKILL.md` usando o prompt pronto abaixo.

Para o uso atual do kit, prefira deixá-lo dentro do projeto alvo em vez de instalar globalmente numa pasta geral de skills do editor.

## O Que O Humano Deve Fazer

1. Garantir que esta pasta esteja disponível no ambiente em que a LLM vai operar.
2. Ler este `README.md` para entender o fluxo.
3. Apontar a LLM para [SKILL.md](SKILL.md).
4. Fornecer as fontes cruas do projeto alvo.
5. Revisar o resultado quando a validação terminar em `degraded` ou quando o fechamento indicar `needs-followup`.
6. Se a execução for interrompida, pedir retomada a partir do último checkpoint validado.

## O Que A LLM Deve Fazer

1. Ler [SKILL.md](SKILL.md).
2. Seguir as fases na ordem definida.
3. Ler apenas os prompts, templates, references e schemas necessários para a fase atual.
4. Gerar uma saída canônica, pequena e neutra.
5. Bloquear a conclusão quando o contrato mínimo falhar.
6. Manter `.hardless/manifests/run-state.json` atualizado a cada fase.

## Prompt Pronto Para Colar

Depois de posicionar a pasta `hardless-skill-kit/` dentro do projeto, cole isto no chat da LLM:

```text
Use a skill em `./hardless-skill-kit/SKILL.md` como procedimento principal para este trabalho.

Leia primeiro o `README.md` e depois o `SKILL.md` dentro de `./hardless-skill-kit/`.

Quero que você use o Hardless Skill Kit para analisar e reorganizar as regras e instruções deste projeto seguindo o fluxo:
discover -> snapshot -> fragment -> classify -> synthesize -> validate -> export/apply -> closeout-review

Não improvise a árvore final.
Use os prompts, templates, references, schemas e manifests do kit apenas quando necessários para a fase atual.

O `AGENTS.md` final deve ser apenas o centralizador do workflow, da precedência e do roteamento.
Não coloque regras de domínio, arquitetura, UI, contrato, segurança ou operação diretamente no `AGENTS.md`; coloque essas regras nos arquivos adequados em `project-context/rules/*`.

Se algum arquivo dentro de `project-context/` precisar citar material fora dessa pasta, isso pode permanecer quando for parte real do contrato operacional do projeto. Nesse caso, a LLM deve registrar essas dependências em `.hardless/manifests/external-references-report.json` e avisar o usuário no fechamento.

Além disso, a LLM deve manter `.hardless/manifests/run-state.json` para marcar:

- fases `not_started`;
- fases `in_progress`;
- fases `produced`;
- fases `validated`;
- fases `failed`.

Antes de sintetizar os arquivos finais, produza um mapa de cobertura simples relacionando:
- fragmento ou regra de origem;
- classificação operacional;
- arquivo de destino;
- pendência, conflito ou baixa confiança, se houver.

Se houver ambiguidade relevante, conflito entre fontes ou falta de material suficiente, explicite isso em vez de forçar uma estrutura artificial.
Ao terminar, faça uma revisão final das pendências, recomende a melhor decisão para cada uma e confirme se `AGENTS.md` e a pasta `project-context/` ficaram realmente utilizáveis.
Se existirem referências externas dentro de `project-context/`, quero um aviso explícito com relatório e recomendação do que deveria ser internalizado no futuro.
Se a execução cair no meio, quero poder retomar a partir da última fase `validated`, sem confiar em fase apenas `in_progress` ou só `produced`.
```

Se a pasta estiver em outro caminho dentro do projeto, ajuste apenas o path no prompt.

## Prompt De Fechamento Após O Processo

Depois que a LLM terminar o fluxo principal, é recomendável rodar uma checagem final para não deixar pendências soltas ou artefatos incompletos.

Cole algo como:

```text
Agora faça o fechamento do Hardless Skill Kit sobre o que você acabou de gerar.

1. Verifique se ainda existe alguma pendência, ambiguidade, conflito ou decisão em aberto.
2. Me avise explicitamente cada pendência restante.
3. Para cada uma, me diga qual decisão você recomenda e por quê.
4. Revise os artefatos gerados e confirme se:
   - `AGENTS.md` está completo, centralizador e apontando para o novo método;
   - `AGENTS.md` não contém regras que deveriam estar em `project-context/rules/*`;
   - as regras necessárias já estão distribuídas na pasta `project-context/`;
   - os índices em `project-context/index/*` apontam apenas para regras e referências existentes;
   - dependências externas citadas por arquivos em `project-context/` foram registradas em `.hardless/manifests/external-references-report.json`;
   - o mapa de cobertura mostra destino para as regras relevantes das fontes originais;
   - não ficaram categorias vazias, artificiais ou redundantes;
   - há algum ponto em que a estrutura ainda esteja fraca, degradada ou dependente de inferência.
5. Classifique o resultado final como `ready`, `degraded-but-usable` ou `needs-followup`.
6. Se estiver tudo suficientemente consistente, me diga isso de forma objetiva.
7. Se não estiver, me diga exatamente o que ainda precisa ser ajustado antes de considerar o processo concluído.
```

Esse fechamento é importante porque o kit pode terminar com status útil, mas ainda deixar decisões abertas para revisão humana.

## Estrutura Canônica Esperada

O kit orienta a geração de algo próximo disso:

```text
AGENTS.md
project-context/
  index/
  rules/
  reference/
  memory/
.hardless/
  manifests/
```

Nem toda categoria precisa existir sempre.
`AGENTS.md` é obrigatório.

## Verificação

A validação principal, para quem usa o kit, é comportamental:

- a LLM entende o papel de `README.md` e `SKILL.md`;
- a LLM consegue seguir as fases sem se perder;
- a saída final fica pequena, canônica e neutra;
- o resultado não vaza nomes ou referências indevidas.

Também é esperado que, no fim, a LLM:

- explicite pendências restantes, se houver;
- recomende uma decisão para cada pendência relevante;
- faça uma revisão final do `AGENTS.md` e da pasta `project-context/`;
- confirme se o método novo ficou realmente operacional.

## Fluxo Recomendado de Uso

1. humano posiciona o kit;
2. agente lê `SKILL.md`;
3. agente lê as fontes do projeto alvo;
4. agente executa `discover -> snapshot -> fragment -> classify -> synthesize -> validate -> export/apply -> closeout-review`;
5. agente faz uma revisão final de pendências e consistência;
6. humano revisa o pacote final quando necessário.

## Como Saber Se Está Funcionando

Você está usando o kit corretamente quando:

- o agente usa `SKILL.md` como procedimento;
- o agente consulta prompts, templates e references conforme a fase;
- o agente não tenta improvisar a árvore final;
- o pacote gerado tem `AGENTS.md` e categorias coerentes;
- o agente informa pendências abertas em vez de escondê-las;
- o agente recomenda a melhor decisão quando sobra ambiguidade real;
- o resultado fica mais utilizável do que as fontes cruas originais.

## Guardrails Importantes

- nada distribuível pode citar projetos reais usados como inspiração;
- a árvore final não deve ser inventada livremente;
- categorias sem material suficiente devem ser omitidas;
- templates e references existem para reduzir deriva, não para serem copiados cegamente;
- `README.md` é para o humano, `SKILL.md` é para a LLM.
