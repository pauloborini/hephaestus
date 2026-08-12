# Snapshot

## Objetivo

Congelar um inventário estável das fontes e unidades que seguirão para fragmentação.

## Regras

- não reinterpretar regras ainda;
- não classificar ainda o papel operacional final;
- registrar relação entre fonte bruta e unidades processáveis;
- atualizar `.hephaestus/manifests/run-state.json` para `currentPhase=snapshot`;
- aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `snapshot` como `in_progress`; ao concluir o inventário, marcar `snapshot` como `produced`; marcar `snapshot` como `validated` quando o mapa cobrir todas as fontes relevantes encontradas em `discover`; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` (efêmero, gitignored).

## Saída mínima

- mapa entre cada fonte e suas unidades processáveis;
- indicação de fontes fora de escopo ou vazias;
- inventário de blocos imutáveis ou confirmação explícita de que não há nenhum;
- atualização do checkpoint da fase.
