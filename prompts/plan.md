# Plan

## Purpose

Make writing reviewable before it exists: emit a readable, editable plan of every operation, with mandatory tracing to a fragment or answer and destructiveness derived by mechanical definition. The user reads and approves the plan before any byte is written. If a human answer changes route, identity, destination, or scope, the affected plan is invalidated and must be emitted again.

## Inputs

- execution ledgers from prior phases: routed fragments (`fragments.json` + `routing.json`), answers from the state's `answers` block, and defect findings from `.hephaestus/manifests/findings.json` (produced by `discover` and `validate`);
- `mode` resolved by `preflight`;
- `.hephaestus/` of the current run.

## Outputs

- `.hephaestus/plan.json` — structured, consumed by `compose` and by `scripts/validate-package.mjs` (`checkPlanContract`) when the script is shipped in the install (see Gate);
- `.hephaestus/plan.md` — readable and editable by the user, the same information per artifact.

## Plan structure

Each plan entry has:

- `artifactPath` — artifact path in the repository;
- `territory` and `regime` inherited from routing;
- `operation ∈ {create, amend, overwrite, move, keep, skip, delete, condense}`;
- `rationale` — justification;
- `origin` — `fragmentId`, `questionKey`, or finding `findingSignature` that originated the operation (mandatory tracing);
- `decidedBy` inherited from routing (`keep`/`state`/`catalog`/`detector`/`llm`/`human`);
- `destructive` — boolean **derived** from the mechanical conditions below, never filled by hand;
- `approved` — boolean record of human approval when required;
- `approvalEvidence` — origin and scope of the authorization, for example `user message: operation X on paths Y`;
- `contextFingerprint` — sha256 of the operation's current material context, including sources and answers used;
- `planFingerprint` — hash of the set of operations and context that was approved, computed with the format below.

## Operation × regime

The plan inherits `territory` and `regime` from routing and emits its own `operation`; the correspondence between the two vocabularies is **normative** — this table is the single mapping, and `compose` and `apply` reference it instead of redefining their own. `skip` is transversal: every regime may be planned and then waived — a fragment omitted with justification, an answer or decision that invalidated the operation — always with `origin` and the waiver justification in `rationale`, never silence.

| `regime` (`schemas/routing.schema.json`) | `operation` | Decision rule |
|---|---|---|
| `keep` | `keep` | content already canonical at the destination — byte-for-byte non-touch |
| `generate` | `create` | new file composed from routed material or instantiated from a kit template/scaffold |
| `generate` | `overwrite` | generation over an existing versioned file — the canonical case is a `CLAUDE.md` with its own content reduced to the `@AGENTS.md` bridge; `destructive: true` by the mechanical definition above, never executed without recorded approval |
| `reconcile` | `create` | new `DEC-NNN` minted (identity-map `action: create`); identity-map `action: remove` is the `delete` row below |
| `reconcile` | `amend` | value changed under the same ID (identity-map `action: amend`) |
| `reconcile` | `keep` | statement identical to the live clause (identity-map `action: keep`) |
| `reconcile` | `delete` | decision removal with the line in `## History` (identity-map `action: remove`) |
| `relocate` | `move` | territory or folder change; when the computed destination equals the current origin, the emitted operation is `keep` (non-touch), never `move` |
| `delete` | `delete` | versioned path removed (staging-deletions) |
| `condense` | `condense` | unique excerpt merged into the canonical + trail note; the origin is removed |

Composite cases, with no hidden exception:

- issue operations (next section): `territory: process`, `regime: generate`, `operation` `create` (index absent) or `amend` (line upsert) — the only `generate` in process territory and the only `amend` under `generate`, a ledger minted from findings, never a fragment relocation; process-territory **fragments** remain in `{relocate, keep, delete, condense}` (INV9);
- closing rule: every `regime` of `schemas/routing.schema.json` and every `operation` of the plan has a row in this table (directly or through the transversal `skip`); a pair outside it is a gate violation in `checkPlanRegimePairs`, never an interpretation;
- the `apply` transactional order (`relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`) executes by `regime` — the order and this table share one vocabulary.

## Issue operations

Each finding in `.hephaestus/manifests/findings.json` (valid against `schemas/findings.schema.json`) enters the plan as one operation over `.app-work/issues/INDEX.md` — the same transaction path as any other write, never an ad-hoc minting in `apply`:

- `artifactPath` = `.app-work/issues/INDEX.md`, `territory: process`, `regime: generate` (minted ledger; not a fragment relocation);
- `operation` = `create` (index absent in the repository) or `amend` (line upsert over the existing index) — never `overwrite` and never line removal: a line is permanent by protocol (`.app-work/issues/README.md`);
- `origin` = the finding's `findingSignature`, or the `fragmentId` when the finding traces to an inventoried fragment — mandatory tracing like any other operation;
- `destructive` derived by the same mechanical definition below (the upsert is additive: in `maintain` it derives `false`);
- a run with no recorded finding carries no issue operation, and nothing is planned for `issues/`.

## Approval fingerprint

Compute SHA-256 UTF-8 of `JSON.stringify` of the operations array, in `entries` order; each operation is an array in this fixed order: `[artifactPath, territory, regime, operation, rationale, origin, decidedBy, destructive, contextFingerprint]`, using `null` for a missing field. Each destructive entry receives the same hash in `planFingerprint` at approval time. A change in any field invalidates the approval; do not recompute the receipt as if the user had approved again. `contextFingerprint` must reflect current sources and answers, not reuse obsolete context. The hash proves integrity of the recorded scope; it does not authenticate human consent.

## Destructive

`destructive: true` when any condition holds (mechanical definition that triggers approval):

- `mode = adopt` (full adoption run);
- remove a versioned file;
- move a file cited by code;
- remove a `DEC-NNN`;
- change the value of a living decision;
- remove third-party content from `AGENTS.md`;
- overwrite or reabsorption of an existing versioned contract or document — the canonical case is reducing a `CLAUDE.md` with its own content to the `@AGENTS.md` bridge; the condition fires in every mode (`maintain` included) and such an operation is never executed without recorded approval;
- `operation` is `delete` or `condense`.

In `maintain` with no destructive item, apply without approval. Every operation marked destructive requires `approved: true`, with no exception by `decidedBy`: catalog, detector, `keep`, LLM, and human are provenances, not authorization. Explicit authorization in the request may satisfy the gate when it covers exactly the operation, paths, and scope; it must still be recorded in `approvalEvidence` and `planFingerprint`. Partial authorization or authorization for another scope is not reused.

## Separation of responsibilities

- **Consult**: read only the index, rules, and references triggered by the boundary;
- **Record**: report a defect or candidate in the ledger/process only when the contract requires it, without turning a record into authorization;
- **Change**: materialize only operations present on the approved plan;
- **Approval**: explicit human consent for each destructive set. Provenance of the routing decision never grants permission by itself.

## Gate

- no pending blocking questions; `route` and `reconcile` must be `validated` after consuming answers;
- every operation is traceable to a fragment, an answer, or a finding (`origin` present);
- complete and validate the transactional baseline described in `preflight`, including new missing paths and both ends of moves, before releasing `compose`;
- approval recorded when required: every destructive operation requires `approved: true` and `approvalEvidence` in the same scope — a decision of any origin is never destructive without human approval;
- a prior approval is valid only if `planFingerprint`, paths, and scope are equal; a material answer change invalidates approval and returns to interview/plan per `revalidation`;
- `checkPlanContract` (in `scripts/validate-package.mjs`) runs on `.hephaestus/plan.json` only when the script is present in the install: a development checkout runs the gate; a zip-release install does not ship `scripts/`, so the skip is recorded with reason "script not shipped in this install" (no `node`: skip recorded as an observation) — never a failure, a guessed alternate path, or a validation that ran (shared gate rule in `prompts/validate.md`).

## Writes to the repository

No. Outputs under `.hephaestus/` (ephemeral, gitignored).

## Checkpoint outputs

Apply the single checkpoint rule from `SKILL.md`: on start, mark `plan` as `in_progress`; when done, `produced`; mark `validated` when the plan is approved and the `checkPlanContract` gate is green (a skip recorded per the Gate rule does not block `validated`); a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).
