# Fragment

## Objetivo

Quebrar fontes extensas em unidades menores e utilizáveis.

O objetivo não é resumir o material.
O objetivo é preservar todas as regras relevantes em fragmentos menores, rastreáveis e fáceis de classificar.

## Entradas

- `.hephaestus/manifests/snapshot.json` (e mapa fonte→unidades);
- `schemas/fragment.schema.json` (forma da saída).

## Delimitadores preferenciais

- headings
- listas
- checklists
- tabelas
- seções temáticas
- blocos claramente normativos

## Procedimento

1. Ler a fonte inteira antes de fragmentar.
2. Identificar blocos normativos, exemplos, referências, preferências e metadados.
3. Quebrar primeiro por seções estruturais.
4. Dentro de seções grandes, quebrar por regra, checklist, tabela ou tópico.
5. Manter fragmentos pequenos o suficiente para classificação, mas completos o suficiente para não perder sentido.
6. Registrar origem, seção e pista de localização sempre que possível.
7. Marcar fragmentos duplicados ou conflitantes em vez de apagar conteúdo.

## Regras Obrigatórias

- preservar vínculo com a origem;
- preservar o conteúdo operacional, não apenas a ideia geral;
- não quebrar demais a ponto de perder sentido;
- não manter blocos enormes quando houver divisões estruturais claras;
- registrar localização ou pista de origem sempre que possível;
- não descartar regra porque parece específica demais;
- não mover decisão para inferência quando a fonte original traz uma regra explícita;
- quando houver dúvida, manter o fragmento e marcar baixa confiança na classificação posterior.
- ao iniciar, aplicar a regra única de checkpoint do `SKILL.md`: toda gravação de `.hephaestus/manifests/run-state.json` atualiza o campo `lastUpdatedAt`; ao iniciar, marcar `fragment` como `in_progress`; ao finalizar a fase, marcar `fragment` como `produced`; marcar `fragment` como `validated` quando a saída mínima estiver consistente e cobrindo as fontes previstas em `snapshot`; fase executada e não validável marca `failed` (reexecução integral na retomada, conforme `prompts/preflight.md`).

## Escreve no repositório

Não. A única escrita é o checkpoint `.hephaestus/manifests/run-state.json` (efêmero, gitignored) e o ledger `.hephaestus/manifests/fragments.json` (efêmero, gitignored).

## Saída Mínima Por Fragmento

- identificador estável;
- fonte original;
- localização aproximada;
- texto preservado ou síntese fiel;
- proveniência (`provenance[]` com `sourcePath`/`startOffset`/`endOffset`) — obrigatória;
- tipo estrutural inicial: seção, regra, checklist, exemplo, tabela, preferência, metadado ou desconhecido;
- observações de conflito, duplicidade ou ambiguidade;
- indicação se o fragmento precisa ser quebrado novamente (`needsSplit`), registrada como campo de observação — fragmento misto marcado `needsSplit` não dividido bloqueia a fase `route`;
- atualização do checkpoint da fase.

**Não inventar destino.** Em `fragment`, **não** inventar, estimar nem adivinhar `territory`, `regime` nem path de destino. Esses campos são opcionais no schema nesta fase; a fase `route` (cascata) é quem decide destino/território/regime.

## Saídas

`.hephaestus/manifests/fragments.json` — um objeto por fragmento (`fragmentId`, `rawText`, `confidence`, `ambiguity`, `provenance[]` com `sourcePath`/`startOffset`/`endOffset`; `territory`/`regime` opcionais e tipicamente ausentes até `route`), válido pelo `schemas/fragment.schema.json` — consumido por `route` (cascata decide destino) e pelos gates `checkCoverage`/`checkKeepBytes` do validador.
