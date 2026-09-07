# Route — Catálogo e respostas

> Carregar **somente** quando a cascata estiver no nível 2 (respostas) ou nível 3 (catálogo).

### Nível 2 — respostas de escopo do projeto

Consultar `answers[questionKey]` do state, com `questionKey = sha256(contexto normalizado)` — o **mesmo** contexto usado ao enfileirar (origem do fragmento + o que falta decidir), nunca o texto da pergunta: reformular a prosa não muda a chave (D22). Resposta gravada com destino decide o fragmento: `decidedBy: state`, `destinationPath` o da resposta. Match é **vinculante** (D22): divergir da resposta é violação de gate, não opinião. Ausência de match = sem resposta.

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
