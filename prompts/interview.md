# Interview

## Purpose

Single drain of the question queue: interrupt the user in batch on genuine ambiguity, and turn each answer into **versioned data consulted before judgment** (D22). Questions are born queued in `route`, `reconcile`, or `compose`; this is the only phase that asks. A run admits at most two batches actually presented: the initial one and one revalidation batch. A pass with an empty or already-answered queue does not count as a batch. Record the count in `run-state.interviewBatches`; a third human request blocks the run as an unresolved cycle.

## Inputs

- `.hephaestus/manifests/questions.json` — question queue from originating phases (`route`/`reconcile`/`compose`), with `questionKey`, `contextFingerprint`, `fragmentId`, `reason`, `invalidates`, and `blocking` per question;
- `.app-work/hephaestus-state.json`, when present — `answers` block with prior answers (reuse by `questionKey`, without re-asking);
- `.hephaestus/manifests/run-answers.json` — `this-run` answers, ephemeral and resumable on the same `runId`, never reused on the next run;
- `.hephaestus/manifests/run-state.json` (phase checkpoint).

## Question economy

- **Dedupe by `questionKey`**: identical fragments by hash were already unified in `fragment`, and questions with the same `questionKey` are one — the queue arrives here already deduplicated, and the phase checks before asking;
- **Group by decision axis, not by file**: all questions on the same axis (for example destination of an accepted ADR) are presented together, in one batch;
- **Reuse**: a persistent answer is reused only when both `questionKey` and `contextFingerprint` from the queue match; same key with a different fingerprint is an obsolete answer, preserved as evidence and re-asked only for that context;
- **Cap per run**: if the queue exceeds the cap, the problem is cascade quality, not ambiguity — emit `degraded` with a diagnosis instead of machine-gunning the user;
- **Vault alias ≠ skipping promotion**: a question about root `.app-vault/` vs `_app-vault/` only decides the **root name**. Options **must not** offer “keep `docs/features|platform|…` as they are” as complete adoption — folders outside the closed §2 list are still recategorized/promoted in the same run (DEC-004).
  An alias answer with `operationHint: keep-alias` writes `routing.overlay` into `.app-work/hephaestus-state.json` (path overlay); it does **not** freeze illegitimate content.

## Outputs

For each answered question, record:

- `questionKey = sha256(normalized identity)` — question type + origin identity + decision axis, never the literal question text: rewording the prose does not change the key;
- `contextFingerprint = sha256(current material context)` — evidence/hash of origin bytes, candidates, scope, and premises that ground the choice, preserving case and accents of values; a material change invalidates only that answer;
- `answer` — structured answer (for a destination question, carries `destinationPath`; for a new process pattern, carries `includeInPack` boolean);
- `scope ∈ {this-run, this-project, promote-to-catalog}`:
  - `this-run` — valid only for the current `runId`: written to `.hephaestus/manifests/run-answers.json`, never to versioned state;
  - `this-project` — written to `answers`, binding on later runs (cascade level 2);
  - `promote-to-catalog` — written to `answers` **and** becomes a candidate presented at closeout (opt-in promotion of a routing default). **Only** for a catalog line of an already-expected type (for example a tool glob in `drift-catalog`); **not** for a folder outside the closed list;
- `sourceEvidence` — origin evidence of the answer;
- `answeredAt` — answer time.

## Write outside the transaction

Write the `this-run` answer immediately to the ephemeral manifest and persistent answers immediately to `.app-work/hephaestus-state.json`, always outside the `apply` transaction: the human cost has already been paid and must not be undone by rollback. Before replacing an obsolete answer, preserve its evidence on the ephemeral conflicts ledger. The write is a **merge** by `questionKey`, preserves other keys and other blocks, and includes `contextFingerprint`. In `mode: adopt`, the same merge marks `meta.adoptionStatus: pending`; it never marks adoption as applied or validated. Before each merge, compare the state with `run-state.stateWrite`; a divergence blocks without overwriting. After the write, update that receipt with existence and sha256 of the written bytes. `verify(applied)` rollback **never** reverts human answers.

## Revalidation cycle

- each question declares `reason` in `{route-ambiguity, reconcile-conflict, decision-promotion, pack-candidate, compose-shield-adaptation, approval-scope, context-changed}` and `invalidates` with the oldest affected phase;
- after answers, compare fingerprint and previous answer. A route or promotion change returns to `route`; an identity conflict returns to `reconcile`; shield adaptation returns to `plan` (or `route` if destination changes); an authorization change returns to `plan`. For a batch, choose the oldest affected phase;
- record `revalidation` with `requiredFrom`, reason, `answerKeys`, `invalidates` list, and `attempt` equal to `interviewBatches`. Mark affected and later phases as `not_started`, except the answered interview, which stays `validated`; discard derived plan/approval and staging and re-run from `requiredFrom`. No artifact from before the answer may be consumed as approved;
- clear `revalidation` only after re-validating the affected phases prior to writing, before `apply`. Preserve `interviewBatches` so the limit is not reset. On a natural pass through `interview`, reuse valid answers without a new batch;
- a new question created by the return enters the second batch. If a blocking question remains after that batch, the run is `blocked` and does not pick a value by inference.

## Axis: new process pattern

A path or folder under `.app-work/` outside the closed list (SCHEMA §4 / `inventoryProcessHygiene().unknown`) enqueues a question with `reason: pack-candidate` and the text:

> You created a new pattern (`<path or type>`). Do you want to include it in the skill pack so it is standardized across projects?

`answer.includeInPack` boolean.

- Yes (`includeInPack: true`): apply the proposed destination in this run; write an entry to `.hephaestus/pack-candidates.json` (ephemeral, shape `schemas/pack-candidates.schema.json`). **Do not** write a new folder into `routing.overlay`. This phase **does not edit** the installed skill. The `scope` of a point destination answer may be `this-run` or `this-project` only for **this path**, never as a folder default.
- No (`includeInPack: false`): map to a folder already listed in SCHEMA §2 / §4; last resort `.app-work/archive/docs/`.
- No answer: run `blocked` / closeout `needs-followup`.

## Human promotion of a decision candidate

A candidate found in `LEDGER.md` or another `.app-work/` artifact is not a rule and never enters `reconcile` directly. `discover` enqueues the question with `reason: decision-promotion`, `candidateId`, observed text, origin, and evidence. Only an answer with `answer.confirmed: true`, `answer.statement`, `answer.domain`, and `sourceEvidence` produces the human fragment described in `reconcile`, provided key and fingerprint are current; the process origin remains context only. Return to `route` to materialize the human answer's destination. Without confirmation, the candidate stays a candidate and does not govern the product.

## Gate

- the entire queue is drained at a single point — no question is left for another phase;
- a blocking question without an answer ⇒ run `blocked`, not resumed on its own;
- persistent answers valid against `schemas/hephaestus-state.schema.json`; `this-run` answers valid against `schemas/run-answers.schema.json`;
- each reused answer has a matching `contextFingerprint`; an answer without a fingerprint is non-reusable legacy, not proof of validity;
- state with a field the schema does not know: ignore and re-ask what is needed, without migration (D4).

## Blocks if

- a blocking question without an answer — mark the run `blocked` and stop until an explicit user decision;
- an answer with a destination outside the closed territory list (`AGENTS.md`, `project-rules/`, `_app-vault/**`, `.app-work/**`) — fail, naming the question and destination;
- a third batch actually requested in the same run, or revalidation without `requiredFrom`/`invalidates` — block as a non-deterministic cycle.

## Writes to the repository

Yes — declared INV1 exception: writes `.app-work/hephaestus-state.json` (versioned project state) outside the transaction and manifests under `.hephaestus/`; rollback never reverts human answers. No other canonical path is written in this phase.

## Outputs

Apply the single checkpoint rule from `SKILL.md`: on start, mark `interview` as `in_progress`; when drainage finishes, `produced`; mark `validated` when the queue is drained and the written state is valid; a blocked queue keeps the phase `produced` and the run `blocked`; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).
