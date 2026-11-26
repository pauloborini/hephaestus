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
- `planFingerprint` — hash of the set of operations and context that was approved, computed with the format below;
- `derivedFrom`: for a derived write (composite cases below), the `artifactPath` of the causing `move`, `delete`, or `condense` entry; absent in every other entry.

## Operation × regime

The plan inherits `territory` and `regime` from routing and emits its own `operation`; the correspondence between the two vocabularies is **normative** — this table is the single mapping, and `compose` and `apply` reference it instead of redefining their own. `skip` is transversal: every regime may be planned and then waived — a fragment omitted with justification, an answer or decision that invalidated the operation — always with `origin` and the waiver justification in `rationale`, never silence.

| `regime` (`schemas/routing.schema.json`) | `operation` | Decision rule |
|---|---|---|
| `keep` | `keep` | content already canonical at the destination — byte-for-byte non-touch |
| `generate` | `create` | new file composed from routed material or instantiated from a kit template/scaffold |
| `generate` | `overwrite` | generation over an existing versioned file — the canonical case is a `CLAUDE.md` with its own content reduced to the `@AGENTS.md` bridge; the second canonical case, in `maintain`, is the upgrade of the fixed sections of `AGENTS.md` that drifted from `templates/AGENTS.md.template`; `destructive: true` by the mechanical definition above, never executed without recorded approval |
| `reconcile` | `create` | new `DEC-NNN` minted (identity-map `action: create`); identity-map `action: remove` is the `delete` row below |
| `reconcile` | `amend` | value changed under the same ID (identity-map `action: amend`) |
| `reconcile` | `keep` | statement identical to the live clause (identity-map `action: keep`) |
| `reconcile` | `delete` | decision removal with the line in `## History` (identity-map `action: remove`) |
| `relocate` | `move` | territory or folder change; when the computed destination equals the current origin, the emitted operation is `keep` (non-touch), never `move` |
| `delete` | `delete` | versioned path removed (staging-deletions) |
| `condense` | `condense` | unique excerpt merged into the canonical + trail note; the origin is removed |

Composite cases, with no hidden exception:

- **the only two legal writes inside `.app-work/` outside `issues/`**, both `territory: process`, `regime: generate`, `operation` `create` (file absent) or `amend` (never `overwrite`, never `delete`):
  1. **kit-maintained files** — the fixed list `.app-work/INDEX.md`, `.app-work/.gitignore`, `.app-work/issues/INDEX.md`. The kit owns them and reconciles them over the repository's current bytes: add what the run requires, preserve every other line, never remove a line. `origin` = the `questionKey` of the answer consumed or the kit rule that requires the content; `destructive: false`. The issue upsert (next section) is the `amend` of the third file.
  2. **derived writes** — each planned `move`, `delete`, or `condense` may produce `amend` entries over a `.app-work/` file that references the affected path (an index, a folder `README.md`, a relative link, a path field of a JSON or config file). A derived entry sets `derivedFrom` to the cause's `artifactPath`, inherits the cause's `origin`, `contextFingerprint`, `decidedBy`, and `destructive`, and edits only the reference (repath a row or a link target, recompute a counter). It never creates a file, never uses `overwrite`, never lands inside an engine-managed folder (a folder with `pack.json` or `roadmap.json`, everything below it included: `references/vault-schema/SCHEMA.md` §2.2), and never lands on a file of `.app-work/issues/` other than `INDEX.md`.
  A reference outside `.app-work/` (code, scripts, `project-rules/`, `_app-vault/`) or inside an engine-managed folder is **not edited**: it is listed in `plan.md` under external citations, and `project-rules/` and `_app-vault/` must not cite a process path at all (`references/vault-schema/SCHEMA.md` §2.1).
- **kit-maintained script** — the governance validator copy (target path and kit template in `prompts/compose.md` §Governance validator), `territory: project-rules`, `regime: generate`, `operation` `create` (file absent), `overwrite` (bytes differ from the kit template), or `keep` (identical). The kit is its only source: that operation restores the kit bytes, so it is `destructive: false` and needs no approval; `origin` = the kit rule. A local edit to the copy is drift, listed in `plan.md` before the kit bytes replace it;
- every other write inside `.app-work/` outside `issues/` stays illegal (INV9/INV10): process content is never generated nor overwritten; process-territory **fragments** remain in `{relocate, keep, delete, condense}`;
- closing rule: every `regime` of `schemas/routing.schema.json` and every `operation` of the plan has a row in this table (directly or through the transversal `skip`); a pair outside it is a gate violation in `checkPlanRegimePairs`, never an interpretation;
- the `apply` transactional order (`relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`) executes by `regime` — the order and this table share one vocabulary.

## Issue operations

Each finding in `.hephaestus/manifests/findings.json` (valid against `schemas/findings.schema.json`) enters the plan as one operation over `.app-work/issues/INDEX.md` — the same transaction path as any other write, never an ad-hoc minting in `apply`:

- `artifactPath` = `.app-work/issues/INDEX.md`, `territory: process`, `regime: generate` (minted ledger; not a fragment relocation);
- `operation` = `create` (index absent in the repository) or `amend` (line upsert over the existing index) — never `overwrite` and never line removal: a line is permanent by protocol (`.app-work/issues/README.md`);
- `origin` = the finding's `findingSignature`, or the `fragmentId` when the finding traces to an inventoried fragment — mandatory tracing like any other operation;
- `destructive` derived by the same mechanical definition below (the upsert is additive: in `maintain` it derives `false`);
- state at minting: a finding that the same run's operations resolve is planned as `FIXED`; a finding of `type: identity-hygiene-sealed` (`references/vault-schema/SCHEMA.md` §2.5) is planned as `WONTFIX` with reason `sealed`; every other finding is planned as `OPEN`. A line never leaves the Open section because its defect was not re-detected;
- a run with no recorded finding carries no issue operation, and nothing is planned for `issues/`.

## Reference sweep

Before releasing `compose`, for every planned `move`, `delete`, and `condense`, sweep the versioned tree for references to the affected path: the literal path, relative links that resolve to it from the referring file, and rows of indexes that list it. Each reference becomes a derived write only when the referring file is inside `.app-work/`, outside every engine-managed folder, and is not a file of `.app-work/issues/` other than `INDEX.md` (the composite case above); otherwise it is listed in `plan.md` under external citations (code, scripts, `project-rules/`, `_app-vault/`, engine-managed folders, files outside the territories), which the kit never edits. A sweep with no dependents is recorded as such. The count of broken relative links in each file the run will touch is captured here as the baseline of the link gate in `prompts/validate.md`.

## Approval fingerprint

Compute SHA-256 UTF-8 of `JSON.stringify` of the operations array, in `entries` order; each operation is an array in this fixed order: `[artifactPath, territory, regime, operation, rationale, origin, decidedBy, destructive, contextFingerprint]`, using `null` for a missing field. Each destructive entry receives the same hash in `planFingerprint` at approval time. A change in any field invalidates the approval; do not recompute the receipt as if the user had approved again. `contextFingerprint` must reflect current sources and answers, not reuse obsolete context. The hash proves integrity of the recorded scope; it does not authenticate human consent.

## Destructive

`destructive: true` when any condition holds (mechanical definition that triggers approval):

- `mode = adopt` (full adoption run);
- remove a versioned file;
- move a file cited by a file the kit does not edit: every external citation the reference sweep lists (code, files outside the four territories, `project-rules/`, `_app-vault/`, engine-managed folders);
- remove a `DEC-NNN`;
- change the value of a living decision;
- remove third-party content from `AGENTS.md`;
- overwrite or reabsorption of an existing versioned contract or document — the canonical case is reducing a `CLAUDE.md` with its own content to the `@AGENTS.md` bridge; the condition fires in every mode (`maintain` included) and such an operation is never executed without recorded approval;
- `operation` is `delete` or `condense`.

A derived write carries the `destructive` value of its cause: approval of the cause covers its derived
writes in the same scope.

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
- every `move`, `delete`, and `condense` has its reference sweep recorded, with its derived writes or an explicit "no dependents"; a derived entry without `derivedFrom`, or whose `derivedFrom` does not match a planned cause, is a gate violation;
- every derived entry uses `operation: amend`, lands inside `.app-work/` outside every engine-managed folder and outside the project files of `issues/`, names a cause present in the same plan (`derivedFrom` = that entry's `artifactPath`, whose operation is `move`, `delete`, or `condense`), repeats the cause's `origin` and `contextFingerprint`, and carries the cause's `destructive` value; a derived entry repeats the cause's `approvalEvidence` when the cause is destructive, so one approval covers the cause and its derived entries in the same scope;
- `checkPlanContract` (in `scripts/validate-package.mjs`) runs on `.hephaestus/plan.json` only when the script is present in the install: a development checkout runs the gate; a zip-release install does not ship `scripts/`, so the skip is recorded with reason "script not shipped in this install" (no `node`: skip recorded as an observation) — never a failure, a guessed alternate path, or a validation that ran (shared gate rule in `prompts/validate.md`).

## Writes to the repository

No. Outputs under `.hephaestus/` (ephemeral, gitignored).

## Checkpoint outputs

Apply the single checkpoint rule from `SKILL.md`: on start, mark `plan` as `in_progress`; when done, `produced`; mark `validated` when the plan is approved and the `checkPlanContract` gate is green (a skip recorded per the Gate rule does not block `validated`); a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).
