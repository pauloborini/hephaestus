<!-- Language: **English** · [Português](README.pt-BR.md) -->

# Hephaestus

The **Hephaestus** kit is a repository-native kit for turning scattered project rules into a small, canonical, operational package for LLMs. Its scope is documentation structure, not application code or an editor plugin.

This README is for people. [SKILL.md](SKILL.md) is the procedural entrypoint for the LLM.

## Why it exists

Large `AGENTS.md` files, disconnected specs, and implicit conventions force agents to improvise. Hephaestus guides a repeatable flow that discovers sources, fragments and classifies them, synthesizes a canonical package, validates it, and leaves a resumable checkpoint.

The generated structure is framework-agnostic:

```text
AGENTS.md
project-rules/
  index/
  rules/
  reference/
  contracts/        # optional
.hephaestus/
  manifests/
```

`AGENTS.md` owns workflow, precedence, and routing. `project-rules/` owns operational rules. `.hephaestus/manifests/` is process state, not a source of project rules.

## Install

Clone or download the repository, rename the extracted folder if needed, and place it inside the target workspace:

```text
my-project/
  hephaestus/
```

Then point the LLM to `./hephaestus/SKILL.md`. Keep the kit in the target workspace rather than installing it globally; it needs to inspect the project’s actual files and tooling.

## What to provide

Tell the LLM:

- which sources it must reorganize (`AGENTS.md`, docs, specs, rules files, etc.);
- whether the request is analysis-only or may apply changes;
- the desired outcome and any scope boundaries.

Without an explicit source set, discovery can still find material but will report uncertainty instead of inventing missing rules.

## LLM workflow

The required sequence is:

```text
discover → snapshot → fragment → classify → synthesize → validate → export/apply → closeout-review
```

Before synthesis, the LLM creates a coverage map from source fragment to destination and flags ambiguity, conflict, or low confidence. A phase is resumable only after it is marked `validated` in `.hephaestus/manifests/run-state.json`.

Expected closeout states:

- `ready`;
- `degraded-but-usable`;
- `needs-followup`.

## Prompt to start

```text
Use ./hephaestus/SKILL.md as the primary procedure.

Read README.md and SKILL.md first. Reorganize the project rules through:
discover -> snapshot -> fragment -> classify -> synthesize -> validate -> export/apply -> closeout-review.

Keep AGENTS.md limited to workflow, precedence, and routing. Put domain,
architecture, security, UI, operational, and contract rules in the appropriate
project-rules/ files. Do not invent the target tree.

Before synthesis, create a coverage map linking each source fragment to its
operational classification and destination. Surface ambiguity, conflicts, and
low-confidence items. Keep .hephaestus/manifests/run-state.json updated; only a
validated phase is resumable.

At closeout, list pending decisions, recommended resolutions, final status,
external references, and whether AGENTS.md and project-rules/ are usable.
```

For the complete Portuguese prompt and closeout/resume variants, see [README.pt-BR.md](README.pt-BR.md).

## Commands and validation

See [COMMANDS.md](COMMANDS.md) for kit validation, generated-package validation, and the maintainers-only publishing command.

## Guardrails

- Do not invent rules or a final tree without source evidence.
- Do not use real projects as distributable examples or references.
- Do not hide external dependencies referenced by generated `project-rules/` files.
- Do not treat `produced` as equivalent to `validated`.

## Repository map

- [SKILL.md](SKILL.md) — LLM procedure;
- `prompts/` — phase instructions;
- `templates/` — canonical output structure;
- `references/` — neutral format references;
- `schemas/` — fragment and artifact contracts;
- `manifests/` — naming and package policy;
- `scripts/` — validators and maintainer publishing.
