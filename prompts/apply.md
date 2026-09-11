# Apply

## Purpose

The only phase that materializes the package in the repository. It executes the approved staging in a single transaction, with a complete backup before the first byte, a revalidated baseline, and order `relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`. Final list = the entire `staging-manifest.json` plus applied deletions.

## Inputs

- `.hephaestus/plan.json` and `.hephaestus/plan.md` approved by the user (when approval is required);
- `.hephaestus/staging/**` and `.hephaestus/staging-manifest.json` produced by `compose` and validated by `verify(staging)`.

## Writes to the repository

Yes — the only phase that writes to the repository. Declared INV1 exception: `interview` writes `.app-work/hephaestus-state.json` outside the transaction, because the human cost of the answers has already been paid and must not be undone by rollback; rollback never reverts that file.

## Gate

- complete backup in `.hephaestus/backup/<YYYYMMDDTHHMMSS>/` **before the first byte**: every repository file that will be overwritten or removed (including paths from `.hephaestus/staging-deletions.json`) is copied preserving relative structure (for example `project-rules/rules/x.md` becomes `.hephaestus/backup/<ts>/project-rules/rules/x.md`); one directory per run, timestamp format `YYYYMMDDTHHMMSS`, no rotation and no reuse between runs (append semantics);
- baseline revalidated immediately before the transaction: for each path in `transaction-baseline.json`, current existence and sha256 must match the baseline. State does not belong to the baseline; check its hash separately against `run-state.stateWrite`. Any unproven delta blocks;
- worktree revalidated since `preflight`: `git status --porcelain --untracked-files=all` must contain only the authorized state delta and this run's own ephemeral artifacts in `.hephaestus/`; any other dirty path blocks. Resuming a partial apply requires recovery from receipts before reapplying;
- `revalidation` must be resolved and absent; no blocking question or pending prior phase releases a write;
- plan with recorded approval when required (see `plan`).

## Transactional write order

1. `relocate` — move artifacts that change territory or folder (destinations in `.app-work/` and `_app-vault/` outside `issues/` are always `relocate`);
2. `condense` — merge the unique excerpt into the canonical + one trail-note line `_Absorvido <data> — de: <path>.` + remove the origin;
3. `delete` — unlink paths from `.hephaestus/staging-deletions.json` (already copied in the backup);
4. `reconcile` — amend existing decisions in place (`DEC-NNN` identity preserved);
5. `generate` — create new files, including the target `.gitignore` scaffold (`generate` regime): the `.hephaestus/` line is created when absent;
6. `keep` — byte-for-byte copy when computed destination == current origin (non-touch rule).

## Final list

Written artifacts are **exactly** those in `staging-manifest.json` — the entire list, never a subset — **plus** deletions applied from `.hephaestus/staging-deletions.json`. Each written artifact, each backup, and each deleted path is recorded in `artifactsWritten` on the run-state (`outputPath`, `phase: apply`, `validationStatus: valid`; `delete` operation on removed paths). Before the first package change, `apply` merges into `meta`: `adoptionStatus: applied`, `adoptionRunId`, and `adoptionUpdatedAt`; that means a started, not yet validated transaction, including in maintain. Preserve other fields and blocks; compare and update `stateWrite` on each merge. A partial failure never keeps a `validated` marker from the previous package. State is not in the staging-manifest.

## ISSUE-NNN minting

A defect detected in prior phases arrives here **queued** with `findingSignature`; minting happens in `apply` because it is a write (INV1). Semantics are a **line upsert** in `.app-work/issues/INDEX.md` — create a new line (`create`) or update an existing line's state (`amend`), preserving every other line and section; never `overwrite` the file and never remove (protocol in `.app-work/issues/README.md`: a line is never deleted).

- inventory the largest `ISSUE-NNN` by walking the **three** sections of `.app-work/issues/INDEX.md` — Open (Abertos), In verification (Em verificação), and Closed (Fechados) — and the `Próximo ID livre` field; mint `max+1`; **an ID is never reused** — scanning only Open would reuse a closed issue's ID (the ID is immortal by protocol);
- `findingSignature = sha256(finding type + normalized path + normalized statement)` — stable signature: rewording the finding prose does not change the signature, and the next round does not reopen the same issue;
- before minting, look up the signature among already recorded issues (`<!-- findingSignature: <hex> -->` marker on the line) — present ⇒ **does not mint** and does not alter the existing line (dedupe);
- a new line enters the Open section with the protocol fields (`.app-work/issues/README.md:14-24`: ID, Sev, Feature, Screen, Problem → Expected, Origin, State) + the signature marker; the `Próximo ID livre` counter is incremented;
- missing `INDEX.md` or inconsistent counter: use `max` of the three tables and report the inconsistency as pending, without blocking.

## Blocks if

- incomplete backup — blocks before the first byte;
- dirty worktree since `preflight`;
- plan without recorded approval when required.

## Rollback

Failure during `apply` or divergence in `verify(applied)` starts recovery limited to paths actually touched, with applicable authorization. Before each write, revalidate existence/hash against the baseline and record the intended operation in `.hephaestus/manifests/transaction-writes.json`; after the write, record the actual result `{ path, before: { exists, sha256 }, after: { exists, sha256 } }`. Absence uses `exists: false, sha256: null`. The ledger is bound to `runId`; an interrupted write without a proven result blocks automatic recovery of that path.

- If the current state already matches `before`, the path is recovered; do not touch it.
- If it does not match `after`, there is a concurrent change or an unproven write: block that path without overwriting.
- Existing baseline: restore bytes from the corresponding backup, verifying its hash before and after. That includes files removed by the run, whose `after` is absence.
- Absent baseline: remove only the file created by the run whose hash still matches `after`; there is no backup to restore in that case. Never recursively delete the folder or neighboring files.
- Recover in reverse write order. Revalidate immediately before each mutation; if there is no write exclusivity in the boundary, block automatic recovery and report the paths for coordination.
- Do not run `git restore`, `reset`, `checkout`, or other mutating commands without applicable explicit authorization. Delimited backup is the default mechanism; there is no global Git revert.
- `.app-work/hephaestus-state.json` and human answers are never reverted. The marker stays incomplete until a new validation. Staging/receipts needed for recovery are preserved until it ends; only then discard obsolete derivatives.

## Outputs

Apply the single checkpoint rule from `SKILL.md`: on start, mark `apply` as `in_progress`; when the transaction finishes, `produced`; mark `validated` when `verify(applied)` confirms the staging-manifest hashes on disk; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).
