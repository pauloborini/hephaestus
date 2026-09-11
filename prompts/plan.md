# Plan

## Purpose

Make writing reviewable before it exists: emit a readable, editable plan of every operation, with mandatory tracing to a fragment or answer and destructiveness derived by mechanical definition. The user reads and approves the plan before any byte is written. If a human answer changes route, identity, destination, or scope, the affected plan is invalidated and must be emitted again.

## Inputs

- execution ledgers from prior phases: routed fragments (`fragments.json` + `routing.json`) and answers from the state's `answers` block;
- `mode` resolved by `preflight`;
- `.hephaestus/` of the current run.

## Outputs

- `.hephaestus/plan.json` — structured, consumed by `compose` and by `scripts/validate-package.mjs` (`checkPlanContract`);
- `.hephaestus/plan.md` — readable and editable by the user, the same information per artifact.

## Plan structure

Each plan entry has:

- `artifactPath` — artifact path in the repository;
- `territory` and `regime` inherited from routing;
- `operation ∈ {create, amend, overwrite, move, keep, skip, delete, condense}`;
- `rationale` — justification;
- `origin` — `fragmentId` or `questionKey` that originated the operation (mandatory tracing);
- `decidedBy` inherited from routing (`keep`/`state`/`catalog`/`detector`/`llm`/`human`);
- `destructive` — boolean **derived** from the mechanical conditions below, never filled by hand;
- `approved` — boolean record of human approval when required;
- `approvalEvidence` — origin and scope of the authorization, for example `user message: operation X on paths Y`;
- `contextFingerprint` — sha256 of the operation's current material context, including sources and answers used;
- `planFingerprint` — hash of the set of operations and context that was approved, computed with the format below.

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
- `operation` is `delete` or `condense`.

In `maintain` with no destructive item, apply without approval. Every operation marked destructive requires `approved: true`, with no exception by `decidedBy`: catalog, detector, `keep`, LLM, and human are provenances, not authorization. Explicit authorization in the request may satisfy the gate when it covers exactly the operation, paths, and scope; it must still be recorded in `approvalEvidence` and `planFingerprint`. Partial authorization or authorization for another scope is not reused.

## Separation of responsibilities

- **Consult**: read only the index, rules, and references triggered by the boundary;
- **Record**: report a defect or candidate in the ledger/process only when the contract requires it, without turning a record into authorization;
- **Change**: materialize only operations present on the approved plan;
- **Approval**: explicit human consent for each destructive set. Provenance of the routing decision never grants permission by itself.

## Gate

- no pending blocking questions; `route` and `reconcile` must be `validated` after consuming answers;
- every operation is traceable to a fragment or answer (`origin` present);
- complete and validate the transactional baseline described in `preflight`, including new missing paths and both ends of moves, before releasing `compose`;
- approval recorded when required: every destructive operation requires `approved: true` and `approvalEvidence` in the same scope — a decision of any origin is never destructive without human approval;
- a prior approval is valid only if `planFingerprint`, paths, and scope are equal; a material answer change invalidates approval and returns to interview/plan per `revalidation`;
- `scripts/validate-package.mjs` runs `checkPlanContract` on `.hephaestus/plan.json`.

## Writes to the repository

No. Outputs under `.hephaestus/` (ephemeral, gitignored).

## Checkpoint outputs

Apply the single checkpoint rule from `SKILL.md`: on start, mark `plan` as `in_progress`; when done, `produced`; mark `validated` when the plan is approved and the `checkPlanContract` gate is green; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).
