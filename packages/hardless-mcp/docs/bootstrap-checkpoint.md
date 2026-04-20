# Bootstrap Intermediario

## Objetivo

Registrar o valor entregue pelo pipeline deterministico antes de qualquer sintese assistida.

## Evidencia Atual

Fixture automatizada usada no teste de integracao:

- fontes encontradas: `AGENTS.md`, `README.md`, `.specs/`
- fontes ausentes registradas sem inventar conteudo: `CLAUDE.md`, `cloud.md`, `.cursorrules`, `docs/`
- snapshots gerados em `.hardless/sources/snapshots/`
- manifestos gerados em `.hardless/manifests/sources.json`, `.hardless/manifests/fragments.json` e `.hardless/manifests/provenance.json`
- fragmentos persistidos por fonte e por topico

## Valor Ja Entregue

- o bootstrap ja distingue descoberta, snapshot, fragmentacao e proveniencia;
- o runtime futuro podera reler manifestos e fragmentos sem voltar imediatamente para as fontes cruas;
- falhas de workspace invalido ja retornam erro estruturado.

## Lacunas Antes Da Sintese

- nao existe ainda avaliacao agregada de confianca;
- bundles curados de regras e indexes ainda nao sao gerados;
- `routing.json`, `workspace.json` e `bootstrap-summary.md` ainda nao existem;
- a classificacao de fragmentos ainda e heuristica inicial, sem reconciliacao incremental.
