# Route — Catálogo e respostas

> Carregar **somente** quando a cascata estiver no nível 2 (respostas) ou nível 3 (catálogo).

### Nível 2 — respostas de escopo do projeto

Consultar primeiro `run-answers.json` do mesmo `runId` e depois `answers[questionKey]` do state. A chave é `sha256(identidade normalizada)` e a resposta só casa quando seu `contextFingerprint` é igual ao fingerprint atual da pergunta. Reformular a prosa não muda a chave; mudar evidência, candidato, escopo ou premissa invalida a resposta afetada. Resposta válida com destino decide o fragmento (`decidedBy: state`); ausência de resposta = a cascata continua. Resposta obsoleta enfileira `reason: context-changed` e não é substituída silenciosamente por catálogo ou detector. Entre respostas temporária e persistente, usar a primeira válida para o contexto atual; a temporária exige `runId` coincidente. Match válido é vinculante (D22): divergir é violação de gate, não opinião.

### Nível 3 — catálogo

Resolver o catálogo na ordem: overlay do bloco `routing` do state primeiro, base do pack depois (`catalog/routing-defaults.json`). **Ordenar as entradas por especificidade decrescente do `pattern` antes de procurar match** — match mais específico vence o genérico (ex.: clones OSS em `archive/` → `references/`, não `archive/`). Um único termo genérico em comum (ex.: `docs`, presente no path de quase todo fragmento) não é match.

- entrada com `destination: null` **nunca decide** — enfileira pergunta;
- entrada com `confidence: baixa` **nunca decide** — enfileira pergunta;
- entrada com `confidence: alta` e destino concreto decide `decidedBy: catalog`;
- destino `.app-work/archive/guides/` (raiz do catálogo) **não** é o path final: expandir para
  `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE/` (pack) ou
  `.app-work/archive/guides/<YYYY-MM>/semana-<N>/` (arquivo solto) — espelho datado (DEC-002).
  Data = Plano F `Status: CONCLUÍDO` senão momento do roteamento. O `destinationPath` emitido
  é o path expandido (termina em `/`).
