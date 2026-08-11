<!-- Language: **English** · [Português](SKILL.md) -->

# Hephaestus

> Greek name in the `greek-stack` umbrella.

## Purpose

This kit turns a user's raw sources into a fragmented, canonical, repository-native package of project rules.

Follow this pipeline:

1. `discover`
2. `snapshot`
3. `fragment`
4. `classify`
5. `synthesize`
6. `validate`
7. `export_apply`
8. `closeout_review`

## Framework agnosticism

The kit is framework- and language-agnostic.

- The generated structure (`AGENTS.md` + `project-rules/`) is the same for every repository.
- Templates do not prescribe framework-specific tools, commands, or gates.
- During synthesis, detect the target repository's framework and language (for example Flutter, React, Go, or Python) and fill rules, checklists, and gates with its real tooling.
- User-specific domain rules belong in the generated package, never in this kit.

## Execution state

For multi-step work, keep a checkpoint at `.hephaestus/manifests/run-state.json` in the user's workspace. It enables safe resumption after interruption and is process state, not part of the generated canonical structure.

## Core rule

Do not invent the final tree freely. Before producing final artifacts:

- read this `SKILL.en.md`;
- read only the prompt for the current phase in `prompts/`;
- use `templates/` as the structural target;
- use `schemas/` to constrain output shape;
- use `references/` (plural) only as kit support; do not confuse it with the generated package's `project-rules/reference/` directory;
- use `manifests/` for names, policy, and metadata.

## Target structure

The final package follows this canonical structure:

```text
AGENTS.md
project-rules/
  index/
  rules/
  reference/
  contracts/       (optional)
.hephaestus/         (process checkpoint; optional in the final package)
  manifests/
```

Optional categories may be omitted when source material is insufficient. `AGENTS.md` is mandatory.

## Fragment contract

Classify each raw-source fragment by operational role:

- `index` — task routing, reading order, context triggers;
- `rules` — mandatory, recurring, or normative behavior;
- `reference` — examples, tables, long contracts, supporting material;
- `manifest` — provenance, coverage, conflict, or validation metadata.

There is no canonical `memory` role. Persistent agent preferences belong to the client memory system, not to the generated package.

If classification is weak, mark it `unknown` or low confidence, record the ambiguity, and do not force an arbitrary category.

## Phases

### 1. Discover

Read [prompts/discover.md](prompts/discover.md). Output: found and missing sources plus initial structural ambiguity.

### 2. Snapshot

Read [prompts/snapshot.md](prompts/snapshot.md). Freeze the relevant source inventory before reorganization. Output: source-to-unit map and a checkpoint in `.hephaestus/manifests/run-state.json`.

### 3. Fragment

Read [prompts/fragment.md](prompts/fragment.md). Output: smaller source fragments with location and raw text.

### 4. Classify

Read [prompts/classify.md](prompts/classify.md). Output: candidate operational role, confidence, and ambiguity for each fragment.

### 5. Synthesize

Read [prompts/synthesize.md](prompts/synthesize.md). Output: coverage map, proposed `AGENTS.md`, necessary categories, and categories omitted because evidence is insufficient.

### 6. Validate

Read [prompts/validate.md](prompts/validate.md). Output: `valid`, `degraded`, or `blocked`; conflicts; gaps; identity-leakage risk; schema compliance; and a checkpoint that distinguishes `validated` from `produced`.

### 7. Export/Apply

Only after `valid` or `degraded`, prepare the final package:

- generated `AGENTS.md`;
- generated `project-rules/` tree;
- provenance and validation manifests in `.hephaestus/manifests/` when applicable;
- `.hephaestus/manifests/external-references-report.json` whenever `project-rules/` cites files outside itself;
- final `.hephaestus/manifests/run-state.json`.

`SKILL.en.md` and `SKILL.md` do not belong in the generated user package. Before overwriting an existing target `AGENTS.md` or `project-rules/` file, preserve it at `.hephaestus/backup/<YYYYMMDDTHHMMSS>/` and record every backup in `artifactsWritten`; use one directory per execution and do not rotate it. See [prompts/validate.md](prompts/validate.md) for the full backup contract.

### 8. Closeout review

After `export_apply`, read [prompts/closeout-review.md](prompts/closeout-review.md) and review the generated package without modifying it. Report remaining issues, open decisions, an objective recommendation for each relevant decision, coverage-map completeness, final `AGENTS.md` and `project-rules/` state, external references and their internalization recommendation, run-state status, and one final state: `ready`, `degraded-but-usable`, or `needs-followup`.

## Required reading by phase

- `discover`: `prompts/discover.md`, `manifests/naming-policy.json`
- `snapshot`: `prompts/snapshot.md`
- `fragment`: `prompts/fragment.md`, `schemas/fragment.schema.json`
- `classify`: `prompts/classify.md`, `schemas/fragment.schema.json`
- `synthesize`: `prompts/synthesize.md`, `templates/`, `references/`
- `validate`: `prompts/validate.md`, `schemas/`, `manifests/`
- `closeout_review`: `prompts/closeout-review.md`, `templates/`, generated artifacts

The phase prompts are currently maintained in Portuguese; they are normative detail for the procedure above.

## Guardrails

- Do not cite real projects in distributable artifacts.
- Do not copy long examples without neutralization.
- Do not create categories with no operational role or empty files merely to look complete.
- Do not mark output `valid` when minimum contracts fail.
- Keep `AGENTS.md` concise and centralizing. Domain, architecture, UI, contract, security, and operational rules belong in `project-rules/rules/*`.
- Engineering rules must be self-contained: nothing in `AGENTS.md` or `project-rules/` may depend on an external file to complete a decision.
- Map and report, never hide, external dependencies cited from `project-rules/`.
- Never treat `in_progress` as complete after interruption, nor `produced` as equivalent to `validated`.
- Do not conclude synthesis without a fragment-to-destination coverage map.
- Do not close work without listing pending items or confirming that none remain.

## When to block

Block completion when `AGENTS.md` is missing; classification is mostly ambiguous; the final package depends excessively on weak inference; real identity leaks; execution state is corrupted enough to prevent safe resumption; or minimum schema contracts fail.

## Mandatory closeout

At completion, always state pending work; recommend a resolution for relevant ambiguity or conflict; confirm that `AGENTS.md` is centralized and not a rules dump; confirm `project-rules/` contains the needed rules; report external references in `.hephaestus/manifests/external-references-report.json`; verify the `run-state.json` phase states; verify coverage-map destinations; and state whether the package is usable.
