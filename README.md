<!-- Language: **English** · [Português](README.pt-BR.md) -->

<p align="center">
  <img src="resources/logo-atlas-agents.png" alt="Hephaestus logo" width="200">
</p>

# Hephaestus

The **Hephaestus** kit is a single command, `/hephaestus`, that governs the four documentary territories of a repository — `AGENTS.md`, `project-rules/`, `_app-vault/` and `.app-work/` — in one run and one write transaction. Its scope is documentation structure, not application code or an editor plugin.

This README is for people. [SKILL.en.md](SKILL.en.md) is the English procedural entrypoint for the LLM.

## Why it exists

Large `AGENTS.md` files, disconnected specs, and implicit conventions force agents to improvise. Hephaestus runs a repeatable 13-phase flow that discovers sources, fragments and routes them, reconciles decision identity, interviews only on genuine ambiguity, stages a plan for approval, and applies everything in a single transactional write with hash verification.

The generated structure is framework-agnostic:

```text
AGENTS.md
CLAUDE.md           # one-line bridge: `@AGENTS.md`
project-rules/
  index/
  rules/
  reference/
  contracts/        # optional
_app-vault/         # product decisions (DEC-NNN) and specs
.app-work/          # process: state, issues, guides
.hephaestus/        # ephemeral process state, gitignored
  manifests/
```

`AGENTS.md` owns posture, hard stop, workflow, precedence, and routing; `CLAUDE.md` is only the `@AGENTS.md` bridge, never a parallel contract. `project-rules/` owns operational rules. `_app-vault/` owns product decisions. `.app-work/` is process, never a rule input. `.hephaestus/manifests/` is execution state, not a source of project rules.

## Install

Build the release zip from the kit repository:

```bash
node scripts/pack-release.mjs
```

This writes `hephaestus-<version>.zip` at the repository root. Unzip it into your skills folder:

```text
skills/
  hephaestus/
```

Every entry in the zip is prefixed with the fixed folder `hephaestus/` — no version in the folder name — so unpacking an updated release over an existing install overwrites it instead of accumulating. The zip never contains `_app-vault/`, `.app-work/`, the test suite or development artifacts; the final exclusion list lives in `manifests/kit-manifest.json:packExcludes`.

Then run `/hephaestus` inside the target repository. Two internal modes are decided by the presence of `.app-work/hephaestus-state.json`: `adopt` (full scan) when the state is absent, `maintain` (drift plus `.app-work/` hygiene, driven by `catalog/drift-catalog.json` and the closed process schema) when it is present. New process patterns become pack candidates; they do not create folders via overlay.

## What to provide

Tell the LLM what the run must cover: the desired outcome and any scope boundaries. Without an explicit source set, discovery can still find material but will report uncertainty instead of inventing missing rules.

## LLM workflow

The required sequence is the 13-phase pipeline:

```text
preflight → discover → snapshot → fragment → route → reconcile → interview → plan → compose → verify(staging) → apply → verify(applied) → closeout
```

Before `apply`, the run creates a coverage map from source fragment to destination and flags ambiguity, conflict, or low confidence. A phase is resumable only after it is marked `validated` in `.hephaestus/manifests/run-state.json`.

Expected closeout states:

- `ready`;
- `degraded-but-usable`;
- `needs-followup`.

## Commands and validation

See [COMMANDS.md](COMMANDS.md) for kit validation, generated-package validation, the documentation-pair check, the test suite, and the release zip builder.

## Guardrails

- Do not invent rules or a final tree without source evidence.
- Do not use real projects as distributable examples or references.
- Do not hide external dependencies referenced by generated `project-rules/` files.
- Do not treat `produced` as equivalent to `validated`.

## Repository map

- [SKILL.en.md](SKILL.en.md) — English LLM procedure;
- [SKILL.md](SKILL.md) — Portuguese LLM procedure;
- `prompts/` — phase instructions;
- `templates/` — canonical output structure;
- `references/` — neutral format references;
- `schemas/` — fragment and artifact contracts;
- `catalog/` — routing and drift catalogs;
- `manifests/` — naming and package policy;
- `scripts/` — validators, the release packer, and maintainer publishing.

## License

Released under the [MIT License](LICENSE).
