# Classify

## Objetivo

Classificar cada fragmento por papel operacional.

Classificação fraca gera artefatos fracos.
Classifique pelo papel que o fragmento deve cumprir no runtime do agente, não pelo título original do arquivo.

## Papéis permitidos

- `index`
- `rules`
- `reference`
- `manifest`
- `unknown`

## Regras

- usar `rules` para norma obrigatória ou recorrente;
- usar `index` para roteamento e seleção de contexto;
- usar `reference` para apoio e exemplo;
- usar `manifest` para metadados de rastreabilidade e validação;
- usar `unknown` quando a confiança for insuficiente;
- não classificar regra obrigatória como `reference` só porque ela veio em documentação longa;
- não classificar exemplo como `rules` sem uma norma explícita associada;
- não classificar workflow central como regra de domínio;
- se um fragmento mistura regra e exemplo, separar em fragmentos menores antes de concluir;
- quando um fragmento puder afetar comportamento futuro do agente, preferir `rules` a `reference`, salvo quando for apenas exemplo;
- preferências persistentes do usuário não têm papel na estrutura canônica: pertencem ao sistema de memória do cliente, não ao pacote gerado;
- ao iniciar, aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `classify` como `in_progress`; ao concluir a classificação, marcar `classify` como `produced`; marcar `classify` como `validated` quando todos os fragmentos relevantes tiverem papel, confiança e destino recomendados; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` (efêmero, gitignored).

## Heurística De Decisão

- roteia quais arquivos carregar: `index`;
- manda fazer ou proíbe fazer: `rules`;
- explica, exemplifica ou detalha contrato longo: `reference`;
- descreve origem, cobertura, conflito ou validação: `manifest`;
- não tem papel claro: `unknown`.

## Saída mínima

- papel candidato;
- confiança;
- ambiguidade;
- motivo curto da escolha;
- arquivo de destino recomendado;
- indicação se o fragmento precisa ser quebrado novamente;
- atualização do checkpoint da fase.
