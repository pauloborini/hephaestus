# Snapshot

## Objetivo

Congelar um inventário estável das fontes e unidades que seguirão para fragmentação.

## Regras

- não reinterpretar regras ainda;
- não classificar ainda o papel operacional final;
- registrar relação entre fonte bruta e unidades processáveis;
- para cada bloco `hephaestus:immutable` encontrado, congelar a sequência exata de bytes entre os
  dois marcadores, com ID, versão e arquivo de origem; essa sequência não é unidade para
  fragmentação, classificação ou síntese por LLM;
- atualizar `.hephaestus/manifests/run-state.json` para `currentPhase=snapshot`;
- aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `snapshot` como `in_progress`; ao concluir o inventário, marcar `snapshot` como `produced`; marcar `snapshot` como `validated` quando o mapa cobrir todas as fontes relevantes encontradas em `discover`; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/synthesize.md`).

## Saída mínima

- mapa entre cada fonte e suas unidades processáveis;
- indicação de fontes fora de escopo ou vazias;
- inventário de blocos imutáveis ou confirmação explícita de que não há nenhum;
- atualização do checkpoint da fase.
