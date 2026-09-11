# Validate

## Purpose

Check whether the package meets the kit's minimum contract. A parameterized phase with **one body, two targets**: `verify(staging)` proves intent (phase 10) and `verify(applied)` proves the result (phase 12).

## Inputs

- parameter `Target: staging` | `Target: applied` (one body, two targets — do not split the file);
- in `staging`: `.hephaestus/staging/` + schemas/manifests;
- in `applied`: worktree + `.hephaestus/staging-manifest.json` (+ `staging-deletions.json`).

## Outputs

- verdict `staging` | `applied` (parameterized by `Target`)

## Target

- `Target: staging` — checks run against `.hephaestus/staging/` (the package materialized by `compose`, not yet written);
- `Target: applied` — checks run against the repository, plus the hash check: each artifact in `.hephaestus/staging-manifest.json` has sha256 recomputed on disk; divergence triggers rollback limited to the transaction paths, per the baseline and the recovery rule in `prompts/apply.md`. On success of every required gate and with no blocking adoption pending, compare `stateWrite` and record `meta.adoptionStatus: validated` on the state without replacing `answers`, updating the receipt; on failure, keep the state and treat `applied` as incomplete adoption on the next resume.

## Checklist

- `AGENTS.md` exists;
- `CLAUDE.md` exists at the root containing exactly the line `@AGENTS.md`, with no own content (bridge, never a parallel contract);
- `AGENTS.md` starts with the project name and an explicit agent contract (format `<Project name> — contrato do agente`), with no generic header;
- `AGENTS.md` is centralizing and concise;
- `AGENTS.md` contains posture, stop, workflow, precedence, and routing, not domain rules;
- `AGENTS.md` has triage, type selection, mandatory stop, pre-confirmation, and final validation;
- the mandatory stop, premises, criterion, simplicity, surgical change, and invariants are inside workflow steps 2 and 3, not promoted to their own section;
- `AGENTS.md` does not repeat what `project-rules/rules/operational_rules.md` norms (gates, tests, baseline, closeout, commits);
- workflow, internal precedence, and base universal rules follow the template's fixed protocol, without drift;
- validation gates in `AGENTS.md` are filled with real stack tools (no `<preencher na síntese>` placeholder);
- the repository-structure and documentation section references real `project-rules/` components (indexes, rules, references, contracts) and project docs;
- triage tries to read `project-rules/index/<tipo>.md` and blocks when the required index does not exist, without forcing context by inference;
- pre-confirmation is informative and uses the already-loaded index, without waiting for approval;
- generated categories have a clear operational role;
- needed rules are coherently distributed in `project-rules/`;
- mandatory rules were preserved in `project-rules/rules/*`;
- indexes in `project-rules/index/*` point only to existing rules and references;
- rules and references in `project-rules/` cite only existing files inside `project-rules/` or external dependencies recorded in the report;
- contracts in `project-rules/contracts/`, when present, are referenced as consult-only;
- reference fragments were preserved or omitted with justification;
- naming is neutral;
- there is no real-identity leak;
- files follow the minimum schemas;
- the final tree does not depend on an empty file to look complete;
- external dependencies cited by `project-rules/` were recorded in `.hephaestus/manifests/external-references-report.json`, when they exist;
- `.hephaestus/manifests/external-references-report.json`, when present, satisfies `schemas/external-references-report.schema.json`;
- `.hephaestus/manifests/run-state.json` exists and correctly distinguishes `in_progress`, `produced`, `validated`, and `failed`;
- remaining pendings, conflicts, and ambiguities are explicit.

## Writes to the repository

Yes — only on `Target: applied`, the only allowed write is merging the `meta.adoptionStatus: validated` marker into `.app-work/hephaestus-state.json`, preserving `answers` and the other blocks, and updating `stateWrite` on the run-state; on `Target: staging`, there is no versioned write. The package and its canonical artifacts are not altered.

## Possible statuses

- `valid`
- `degraded`
- `blocked`

## Rules

- use `degraded` when the package is useful but there are gaps or a controlled conflict;
- use `blocked` when essential structure is missing or there is a relevant risk;
- never mask a serious conflict as a cosmetic observation;
- use `blocked` when `AGENTS.md` received rules that should live in `project-rules/rules/*`;
- use `blocked` when the triage and pre-confirmation workflow is missing;
- use `degraded` when `AGENTS.md` still contains a synthesis placeholder `<...>` in the header, gates, or structure section, even if the rest is consistent;
- use `blocked` when any index lists a required rule or reference that does not exist;
- use `degraded` when relevant fragments lack a clear destination but the package is still operable;
- use `degraded` when there are legitimate external dependencies not yet internalized, even with a complete report;
- use `blocked` when there are broken or unreported external dependencies;
- use `blocked` when `run-state.json` prevents determining which phases are actually validated;
- never treat a `produced` phase as equivalent to `validated`;
- distinguish `failed` from `blocked` on the run-state: `failed` is a phase state that finished execution but could not be validated and is fully re-run on resume; `blocked` is a run state (not a phase) that indicates an impediment requiring a human decision and is not resumed on its own, per the resume rule in `prompts/preflight.md`;
- apply the single checkpoint rule from `SKILL.md` on both passes: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on starting `verify_staging` or `verify_applied`, mark the phase `in_progress`; when done, `produced` and then `validated` when every minimum check is consistent; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`);
- in `applied`, check `staging-manifest.json` against disk hash by hash (`checkAppliedHashes` gate); any divergence triggers rollback limited by the baseline and post-write hashes, without overwriting a concurrent change, and `.app-work/hephaestus-state.json` is never reverted;
- in `applied`, paths from `.hephaestus/staging-deletions.json` must not exist on disk after the transaction;
- when the target project environment has `node` available, run `node scripts/validate-package.mjs <folder>` as a recommended gate before marking the phase `validated` — in `staging`, `<folder>` is `.hephaestus/staging`; in `applied`, it is the repository; in environments without node, record the skipped gate as an observation in the report — the gate does not block environments without node, and skipping it does not automatically change `validated` status;
- at the end, produce an objective closeout review with:
  - open pendings;
  - recommended decision for each relevant pending;
  - confirmation of `AGENTS.md` state;
  - confirmation of `project-rules/` state;
  - explicit summary of external references found and what should be internalized;
  - confirmation that a future resume can start after the last `validated` phase;
  - final conclusion: `ready`, `degraded-but-usable`, or `needs-followup`.
