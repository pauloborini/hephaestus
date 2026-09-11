# Preflight

## Purpose

Guard the ground before any work: require a git repository and a clean worktree, resolve deterministic mode and catalog, freeze the transaction baseline, and only then release later phases. This is phase 1 of 13 — no phase before `apply` writes canonical repository paths.

## Inputs

- user workspace (repository root);
- kit `catalog/routing-defaults.json` and `catalog/drift-catalog.json` (base catalog);
- `.app-work/hephaestus-state.json`, when present: `meta.adoptionStatus`, `routing` overlay, `shield`, and `answers` are consumed in later phases.

## Mode resolution

- `.app-work/hephaestus-state.json` **absent** ⇒ `mode: adopt`;
- state present with `meta.adoptionStatus: validated` ⇒ `mode: maintain`;
- state present without `meta.adoptionStatus`, or with `pending`/`applied` ⇒ `mode: adopt`: saved answers do not prove completed adoption;
- resolve by state presence **and** its explicit adoption evidence, never by heuristics over present structure: `_app-vault/`, `project-rules/`, or a generated `AGENTS.md` are not proof of a prior run (D3);
- unknown or missing `adoptionStatus` in a legacy state is treated conservatively as `pending`, with no silent migration;
- write the resolved `mode` to the `mode` field of `.hephaestus/manifests/run-state.json`, read by the next phase (`discover`).

## Gate

- valid git repository: `git rev-parse --is-inside-work-tree` exits `0`;
- a new run requires a clean worktree in both modes, with no override. Resuming the same `runId` admits only deltas proven by `stateWrite` and existing transactional receipts; any unproven change blocks, also with no override. Use `git status --porcelain --untracked-files=all` so files under an untracked directory are not hidden. Ignore only this run's own ephemeral artifacts under `.hephaestus/`, never other files;
- on first entry, record `stateWrite: { exists, sha256 }` with the observed answers file (`sha256: null` when absent); on resume, compare with the previous receipt before any merge. Do not update the receipt with concurrent bytes to make them look authorized;
- `mode` resolved;
- catalog resolved: pack base + overlay from the state's `routing` block, when present;
- baseline: freeze the initial HEAD revision in the preflight checkpoint; in `plan`, complete `.hephaestus/manifests/transaction-baseline.json` before composition, with every exact path of create, overwrite, move source/destination, and deletion. Each entry records `path`, `exists`, and `sha256` (`null` when absent), plus `runId` and `head` on the ledger. Revalidate worktree/revision before that capture; existing paths must match the initial HEAD or the frozen source. Never rebuild the baseline to absorb a concurrent delta. The answers state stays outside this baseline;
- resume: an interrupted prior `run-state.json` is marked `status: interrupted` (and `lastUpdatedAt` updated) before any subsequent read or continuation; reread the file after that mark; resume from the last `validated` phase, fully re-running a phase in `in_progress`, `produced`, or `failed` (`in_progress` is never treated as complete after interruption); if `revalidation` requires a return, start at `requiredFrom` and invalidate every downstream phase; when the blocker needs human intervention, mark the run `blocked` and stop until an explicit decision — a `blocked` run is not resumed on its own, and the originating phase is fully re-run on the next authorized resume.

## Blocks if

- outside a git repository — refuse, naming the condition;
- worktree with an unproven delta from the same run — refuse, listing the pending files, mutating nothing; saved answers alone do not authorize ignoring other deltas;
- state with a field the schema does not know: ignore the field and re-ask what is needed, without migration (D4);
- inconsistent baseline or divergent hash on resume: block before writing the target. Absence is normal before `plan`, but blocks `apply`. On resume after a partial write, check receipts and recover this run's own delta before recomposing; never run a full `apply` over a partially applied transaction.

## Writes to the repository

No canonical paths. Only the checkpoint `.hephaestus/manifests/run-state.json` and the ephemeral baseline `.hephaestus/manifests/transaction-baseline.json` are written (both gitignored).

## Outputs

- resolved `mode` (`adopt`/`maintain`) on the run-state;
- resolved catalog (base + overlay);
- `stateWrite`, initial HEAD revision in `phaseStates.preflight.notes`, and a link to the transactional baseline to complete in `plan`, excluding `.app-work/hephaestus-state.json`;
- `.hephaestus/manifests/run-state.json` with `currentPhase=preflight`; on completion, `phaseStates.preflight.status=validated` and the single checkpoint rule from `SKILL.md` applied (every write updates `lastUpdatedAt`).
