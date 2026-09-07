<!-- Language: **English** · [Português](SKILL.md) -->
---
name: hephaestus
description: Use when the user asks for /hephaestus or to turn raw sources into project rules (AGENTS.md, project-rules, _app-vault, .app-work) in a single write transaction.
---

# Hephaestus

> Greek name in the `greek-stack` umbrella.

## Purpose

This kit turns a user's raw sources into a fragmented, canonical, repository-native package of project rules, written in a single write transaction.

Follow this pipeline:

1. `preflight`
2. `discover`
3. `snapshot`
4. `fragment`
5. `route`
6. `reconcile`
7. `interview`
8. `plan`
9. `compose`
10. `verify_staging`
11. `apply`
12. `verify_applied`
13. `closeout`

## Surface

Single command: `/hephaestus`. No mandatory subcommand.

One run governs the four documentary territories of the repository in a single write transaction (the `apply` phase):

| Territory | What lives there |
|-----------|------------------|
| `AGENTS.md` | agent posture, hard stop, workflow, precedence, and routing |
| `project-rules/` | operational project rules |
| `_app-vault/` | product decisions (`DEC-NNN`) and specs |
| `.app-work/` | process: state, issues, guides — never a rule input |

Two internal modes, decided by the presence of `.app-work/hephaestus-state.json`:

- `adopt` — state absent: **full adoption** of the four territories into the canonical package. Scaffolding folders or “keep”ing content already under a vault root is not enough: product rules found (including under `.app-vault/` / `_app-vault/` outside `docs/decisions/`, `### D\d+` headings, `DECISOES_*`, “Closed decisions” sections, ADRs/specs with observable norms) **become `### DEC-NNN` in `_app-vault/docs/decisions/`** in the same run; vault paths outside the closed list in `references/vault-schema/SCHEMA.md` §2 are reclassified (process → `.app-work/`, spec → `specs/`, decision → `docs/decisions/`); `INDEX.md` is derived from materialized `Afeta:` fields. Empty `docs/decisions/` scaffold while decision material still lives outside the canonical form = incomplete adoption — closeout `needs-followup`, never `ready`;
- `maintain` — state present: reduced scope. Inventories drift and other tools' artifacts (`catalog/drift-catalog.json`) **and** the interior of `.app-work/` (F/STALE packs, loose `.md`, `private/references/`, legacy `done/`, flat archive, duplicates, paths outside the closed list). Non-touch (INV2) applies only to paths **already** on the §2 closed list in canonical form — being under the vault root does **not** imply canonical. Process territory (INV9): only `keep|relocate|delete|condense`. Live schema includes `roadmap/`, `docs/`, `guides/legados/`. A new pattern → `includeInPack` interview → `.hephaestus/pack-candidates.json`; the state overlay does not invent folders; a run never edits the installed skill. The kit does not depend on an auxiliary organization skill.

Every run follows the 13-phase pipeline above.

## Framework agnosticism

The kit is framework- and language-agnostic.

- The generated structure (`AGENTS.md` + `project-rules/`) is the same for every repository.
- Templates do not prescribe framework-specific tools, commands, or gates.
- During composition, detect the target repository's framework and language (for example Flutter, React, Go, or Python) and fill rules, checklists, and gates with its real tooling.
- User-specific domain rules belong in the generated package, never in this kit.

## Execution state

For multi-step work, keep a checkpoint at `.hephaestus/manifests/run-state.json` in the user's workspace. It enables safe resumption after interruption and is process state, not part of the generated canonical structure. The `.hephaestus/` directory is fully ephemeral and gitignored: staging, backup, run-state and execution ledgers live there, and the `.hephaestus/` line in the target `.gitignore` is guaranteed by the `apply` phase.

## Project state

Besides the ephemeral checkpoint, execution reads and writes the project's **versioned** state at `.app-work/hephaestus-state.json` (lowercase name — the validator gate rejects uppercase variants). It is hand-editable and split into **four blocks** (D29), each with a distinct reading owner:

| Block | Read by | Content |
|-------|---------|---------|
| `meta` | `preflight` | `packVersion`, `schemaVersion`, `lastRunAt`, `lastRunId` — versions and last run identity |
| `routing` | `preflight` and `route` | catalog overlay (same shape as `catalog/routing-defaults.json`) plus optional `forbiddenPatterns` — overlay does not invent folders |
| `answers` | `route` (cascade level 2) and `interview` | map `questionKey` → human answer with structured `answer`, `scope` (`this-run`/`this-project`/`promote-to-catalog`) and `sourceEvidence` |
| `shield` | `route` (before level 1) and `compose` | opt-in shielding of third-party content: list of `{ path, selector }`, empty by default |

The file carries **no metrics**: telemetry (for example `llmDecidedRatio`) lives in `.hephaestus/`, never here — a file that accumulates telemetry stops being hand-editable in practice. Unknown top-level fields are **ignored** and the needed information is asked again, never migrated (D4). `interview` is the only phase that writes the state, outside the transaction: the `verify(applied)` rollback never reverts human answers (INV1, exception declared in `prompts/apply.md`).

## Core rule

Do not invent the final tree freely. Before producing final artifacts:

- read this `SKILL.en.md`;
- read only the prompt for the current phase in `prompts/`;
- use `templates/` as the structural target;
- use `schemas/` to constrain output shape;
- use `references/` (plural) only as kit support; do not confuse it with the generated package's `project-rules/reference/` directory;
- per-phase anti-invention matrix: [references/anti-invention-gates.md](references/anti-invention-gates.md) (same path; PT-BR);
- use `manifests/` for names, policy, and metadata.

## Target structure

The final package follows this canonical structure:

```text
AGENTS.md
CLAUDE.md            (one-line bridge: `@AGENTS.md`)
project-rules/
  index/
  rules/
  reference/
  contracts/       (optional)
.hephaestus/         (process checkpoint; optional in the final package)
  manifests/
```

Optional categories may be omitted when source material is insufficient. `AGENTS.md` is mandatory.

`CLAUDE.md` is a bridge, never content: one `@AGENTS.md` line and nothing else. It exists so clients that only read `CLAUDE.md` land on the same contract without maintaining two files. If the project already has a `CLAUDE.md` with its own content, reabsorb that content into `AGENTS.md`/`project-rules/` and reduce the file to the bridge — never leave two live contracts.

## Fragment contract

Classify each raw-source fragment by operational role:

- `index` — task routing, reading order, context triggers;
- `rules` — mandatory, recurring, or normative behavior;
- `reference` — examples, tables, long contracts, supporting material;
- `manifest` — provenance, coverage, conflict, or validation metadata.

There is no canonical `memory` role. Persistent agent preferences belong to the client memory system, not to the generated package.

If classification is weak, mark it `unknown` or low confidence, record the ambiguity, and do not force an arbitrary category.

## Phases (Progressive Disclosure)

**Load rule:** at each step, read **only** the current phase prompt in `prompts/` (+ schemas/refs listed on the row). Do not preload the other `prompts/*.md`. I/O, gates, and procedure live in the prompt — this index does not duplicate them.

`prompts/validate.md` is **one body, two targets** (`Target: staging` = phase 10 `verify_staging`; `Target: applied` = phase 12 `verify_applied`). Keep both targets in the same file.

| # | Phase | Prompt | Job | Reads (min.) | Produces (min.) |
|---|-------|--------|-----|--------------|-----------------|
| 1 | `preflight` | [prompts/preflight.md](prompts/preflight.md) | Gate git/worktree + resolve `mode` | `catalog/*`, state if present | `run-state.mode` |
| 2 | `discover` | [prompts/discover.md](prompts/discover.md) | Source inventory by mode | naming-policy, drift-catalog | inventory / missing |
| 3 | `snapshot` | [prompts/snapshot.md](prompts/snapshot.md) | Freeze sources byte-for-byte | discover inventory | `snapshot.json` |
| 4 | `fragment` | [prompts/fragment.md](prompts/fragment.md) | Cut units with provenance | snapshot | `fragments.json` |
| 5 | `route` | [prompts/route.md](prompts/route.md) | Territory/regime cascade + evidence | fragments, catalog, state | `routing.json`, queue |
| 6 | `reconcile` | [prompts/reconcile.md](prompts/reconcile.md) | `DEC-NNN` identity (match/mint) | routing, `docs/decisions/**` | `identity-map.json` |
| 7 | `interview` | [prompts/interview.md](prompts/interview.md) | Drain queue; writes state outside tx | queue, `answers` block | state `answers` |
| 8 | `plan` | [prompts/plan.md](prompts/plan.md) | Readable plan + destructiveness | execution ledgers | `plan.json` / `plan.md` |
| 9 | `compose` | [prompts/compose.md](prompts/compose.md) | Materialize staging (no repo writes) | templates/, references/ | `staging/**` + manifest |
| 10 | `verify_staging` | [prompts/validate.md](prompts/validate.md) `Target: staging` | Package contract on staging | schemas/, manifests/ | staging verdict |
| 11 | `apply` | [prompts/apply.md](prompts/apply.md) | Sole repo write (tx + backup) | approved staging-manifest | package on worktree |
| 12 | `verify_applied` | [prompts/validate.md](prompts/validate.md) `Target: applied` | On-disk hash; rollback if diverge | staging-manifest | applied verdict |
| 13 | `closeout` | [prompts/closeout.md](prompts/closeout.md) | Report/verdict; does not alter package | templates/, manifests | `report.md` |

Modes `adopt` / `maintain` are **not** phases — see Surface.

## Guardrails

- Do not cite real projects in distributable artifacts.
- Do not copy long examples without neutralization.
- Do not create categories with no operational role or empty files merely to look complete.
- Do not mark output `valid` when minimum contracts fail.
- Keep `AGENTS.md` concise and centralizing. Domain, architecture, UI, contract, security, and operational rules belong in `project-rules/rules/*`.
- Engineering rules must be self-contained: nothing in `AGENTS.md` or `project-rules/` may depend on an external file to complete a decision.
- Map and report, never hide, external dependencies cited from `project-rules/`.
- Nothing is written to the repository outside the `apply` phase; the only exception is `interview` writing `.app-work/hephaestus-state.json` outside the transaction.
- Never treat `in_progress` as complete after interruption, nor `produced` as equivalent to `validated`.
- Do not conclude composition without a fragment-to-destination coverage map.
- Do not close work without listing pending items or confirming that none remain.
- The distributable package's final exclusion list lives in `manifests/kit-manifest.json:packExcludes`; no content exclusion is hard-coded in scripts.

## When to block

Block completion when `AGENTS.md` is missing; classification is mostly ambiguous; the final package depends excessively on weak inference; real identity leaks; execution state is corrupted enough to prevent safe resumption; minimum schema contracts fail; the worktree is dirty; the backup is incomplete in the `apply` phase; or, in `adopt`, decision sources existed and `docs/decisions/` remains scaffold-only / without matching `### DEC-NNN` in the identity map.

## Mandatory closeout

At completion, always state pending work; recommend a resolution for relevant ambiguity or conflict; confirm that `AGENTS.md` is centralized and not a rules dump; confirm `project-rules/` contains the needed rules; report external references in `.hephaestus/manifests/external-references-report.json`; verify the `run-state.json` phase states; verify coverage-map destinations; and state whether the package is usable.
