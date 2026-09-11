# Route

## Purpose

Replace one-dimensional role assignment with a deterministic five-level cascade that assigns `territory` and `regime` per fragment, with evidence, and **stops at the first level that decides**. What is already in the right place is copied byte for byte (non-touch rule); LLM residue never alone decides a destructive destination without degrading closeout.

## Inputs

- `.hephaestus/manifests/fragments.json` — fragments from `fragment`, one object per fragment valid against `schemas/fragment.schema.json` (with `provenance[]`);
- `.app-work/hephaestus-state.json`, when present: `answers` (binding project-scope answers), `shield` (declared shielding, consulted **before** level 1), and `routing` (catalog overlay);
- pack base catalog: `catalog/routing-defaults.json`;
- `.hephaestus/manifests/run-state.json` (phase checkpoint).

Confirmed human promotion is an additional explicit input: consume only the human fragment frozen by the interview, with current confirmation and fingerprint; assign `territory: vault`, `regime: reconcile`, `decidedBy: human`, destination by confirmed domain, and evidence from the answer. The original process fragment is not promoted.

## Cascade

For each fragment, walk the levels in order and **stop at the first level that decides**. Each routed fragment records `territory`, `regime`, `destinationPath`, `confidence`, `decidedBy ∈ {keep, state, catalog, detector, llm, human}`, `evidence` (what decided: origin path, `questionKey` + `contextFingerprint`, catalog `pattern`, or detector fired) and `needsSplit`. Every queued question also records `reason`, `invalidates`, `blocking`, and the context fingerprint.

**Load rule (Progressive Disclosure):** load **only** the subdoc for the cascade step in progress — do not preload the others.

Step order (links relative to `prompts/route/`):

1. Shield (precedes level 1) → [route/shield.md](route/shield.md)
2. Level 1 — non-touch and identity → [route/detectors.md](route/detectors.md) (level 1 section)
3. Level 2 — scope answers → [route/catalog.md](route/catalog.md) (level 2 section)
4. Level 3 — catalog → [route/catalog.md](route/catalog.md) (level 3 section)
5. Level 4 — syntactic detectors → [route/detectors.md](route/detectors.md) (level 4 section)
6. Level 5 — LLM residue + queue + residue gate → [route/residual.md](route/residual.md)

## Gate

- every fragment leaves routed **or** queued, with evidence — never in silence;
- `destinationPath` always lands in `AGENTS.md`, `project-rules/`, or the closed list in `references/vault-schema/SCHEMA.md` §2 (`_app-vault/**` and `.app-work/**`) — the four territories;
- a fragment originating in `.app-work/` never receives `regime: generate` or `reconcile` (D19/INV9): only `keep`, `relocate`, `delete`, or `condense`;
- no fragment with `needsSplit: true` proceeds without a split — splitting is `fragment` work, not the user's;
- a reused answer whose `contextFingerprint` does not match does not decide a route;
- output is validated by `schemas/routing.schema.json`.

## Blocks if

- computed destination outside the closed territory list — fail, naming the fragment and destination;
- fragment with `needsSplit: true` not split — cancel the phase, naming the fragment;
- project answer (`decidedBy: state`) with an illegal destination — fail, naming the fragment.

## Writes to the repository

No. The only writes are the checkpoint `.hephaestus/manifests/run-state.json` and the ledgers `.hephaestus/manifests/routing.json` and `.hephaestus/manifests/questions.json` (ephemeral, gitignored).

## Outputs

- `.hephaestus/manifests/routing.json` — one entry per routed fragment (`territory`, `regime`, `destinationPath`, `confidence`, `decidedBy`, `evidence`, `needsSplit`), valid against `schemas/routing.schema.json`;
- `.hephaestus/manifests/questions.json` — queued questions (never asked here);
- phase checkpoint: on start, mark `route` as `in_progress`; when routing finishes, `produced`; mark `validated` when every fragment is routed or queued with evidence and the gate is green; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).
