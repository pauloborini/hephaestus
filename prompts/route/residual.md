# Route — LLM residue, queue, and residue gate

> Load **only** when the cascade is at level 5, the question queue, or the residue gate.

### Level 5 — LLM residue

Only what remains from levels 1–4, with explicit confidence (numeric `confidence`). **Below the threshold it does not decide: enqueue a question** (D22). What decides enters with `decidedBy: llm` and is submitted to the residue gate.

## Question queue

Questions are born **queued** — the cascade never asks in this phase (D22). Each question records `questionKey`, `contextFingerprint`, `fragmentId`, `reason`, `invalidates`, and `blocking`. The queue is written to `.hephaestus/manifests/questions.json` and drained by `interview` in the initial batch or the single allowed revalidation batch.

**Justifies a question** (closed list — nothing else is queued in the cascade):

- level 5 below the confidence threshold (the LLM does not decide);
- catalog with no match, or a match with `destination: null` or `confidence: baixa`;
- path under `.app-work/` outside the closed §4 list (`inventoryProcessHygiene().unknown`) — pack-candidate question (DEC-006);
- value conflict between sources for the same rule (handled in `reconcile`);
- removal of a `DEC-NNN` with a pending citation (handled in `reconcile`);
- removal of third-party content outside the `shield` list (handled in `reconcile`/`plan`).

**Never asks** (closed list — decide in silence, with evidence):

- a high-match route (catalog `confidence: alta` with a concrete destination) — level 3 decides;
- a non-touch decision (level 1), frozen identity (`### DEC-NNN`), or detector (level 4) — they decide earlier, **except** an unknown folder (pack-candidate);
- file name and section order — local detail, never genuine ambiguity;
- anything already answered with applicable scope and current fingerprint — a valid answer is binding.

An answer with an obsolete fingerprint enqueues `reason: context-changed` for revalidation; it does not belong to the never-ask list.

## Residue gate

Mark as **degrading** every entry with `decidedBy: llm` whose `destinationPath` is a **new file** in `_app-vault/docs/decisions/` (that is, a new `DEC-NNN`) or in `project-rules/rules/` (a new rule). `decidedBy: llm` entries destined for `project-rules/reference/`, `project-rules/index/`, or `.app-work/` **do not** degrade (D26). The `llm` label is provenance only: it does not grant approval to write.

Measure and report `llmDecidedRatio` (share of fragments decided by the LLM) **always, with no cap**: the value lives in `.hephaestus/` (ephemeral run-state and closeout `report.md`), **never** in `hephaestus-state.json` (D29).

The criterion is **destination type**, never volume: 30 reference fragments classified by the LLM do not degrade; a single destination that becomes a new `DEC-NNN` does. Closeout turns degradation into `degraded-but-usable` with the named list.
