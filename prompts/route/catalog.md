# Route — Catalog and answers

> Load **only** when the cascade is at level 2 (answers) or level 3 (catalog).

### Level 2 — project-scope answers

Consult `run-answers.json` for the same `runId` first, then `answers[questionKey]` on the state. The key is `sha256(normalized identity)` and the answer only matches when its `contextFingerprint` equals the question's current fingerprint. Rewording the prose does not change the key; changing evidence, candidate, scope, or premise invalidates the affected answer. A valid answer with a destination decides the fragment (`decidedBy: state`); no answer = the cascade continues. An obsolete answer enqueues `reason: context-changed` and is not silently replaced by catalog or detector. Between a temporary and a persistent answer, use the first valid one for the current context; the temporary one requires a matching `runId`. A valid match is binding (D22): diverging is a gate violation, not an opinion.

### Level 3 — catalog

Resolve the catalog in order: overlay from the state's `routing` block first, then the pack base (`catalog/routing-defaults.json`). **Sort entries by decreasing `pattern` specificity before matching** — the more specific match beats the generic one (for example OSS clones in `archive/` → `references/`, not `archive/`). A single generic term in common (for example `docs`, present in almost every fragment path) is not a match.

- an entry with `destination: null` **never decides** — enqueue a question;
- an entry with `confidence: baixa` **never decides** — enqueue a question;
- an entry with `confidence: alta` and a concrete destination decides `decidedBy: catalog`;
- destination `.app-work/archive/guides/` (catalog root) is **not** the final path: expand to
  `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE/` (pack) or
  `.app-work/archive/guides/<YYYY-MM>/semana-<N>/` (loose file) — dated mirror (DEC-002).
  Date = Plan F `Status: CONCLUÍDO`, otherwise routing time. The emitted `destinationPath`
  is the expanded path (ends in `/`).
