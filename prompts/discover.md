# Discover

## Purpose

Discover the user's raw sources before any reorganization.

## Inputs

- `mode` from the run-state (`preflight`);
- `manifests/naming-policy.json`;
- `catalog/drift-catalog.json` (and `routing` overlay when `maintain`);
- `.app-work/hephaestus-state.json` when present (`meta.lastRunAt` in `maintain`).

## Scope by mode

Inventory scope is decided by the `mode` resolved in `preflight` (run-state `mode` field), never by heuristics over present structure:

- `mode: adopt` — full repository scan: agent convention documents (`AGENTS.md`, `CLAUDE.md`), specs, architectural docs, workflow guides, project conventions, and the canonical territories as sources (on a rerun, the destination is also input). **Must inventory and mark as incomplete-adoption risk:** (a) paths under `_app-vault/` or `.app-vault/` outside the closed list in `SCHEMA.md` §2; (b) `DECISOES_*` files, “Closed decisions” / “Decisões fechadas” sections / headings `### D\d+` / `### DEC-\d+` without the canonical em-dash **outside** `docs/decisions/`; (c) absence of `docs/decisions/` with `### DEC-NNN` when (a)/(b) exist — adoption only closes when that material is promoted or recategorized in the same run;
- `mode: maintain` — reduced, data-driven scope: inventory only what differs from the last run and what other tools produce, leaving the rest as unchanged sources that fall to `keep` at cascade level 1 (reduced scope cuts cost, not correctness — a maintain that scanned everything would produce the same result, only slower):
  1. `AGENTS.md` changed since the last run — compare file `mtime`/hash against `meta.lastRunAt` in `.app-work/hephaestus-state.json`;
  2. `CLAUDE.md` present and divergent from `AGENTS.md` (a rule the agent contract does not cover);
  3. each glob from `catalog/drift-catalog.json` (other tools' artifacts) present in the repository — agent-rule files and tool artifacts enter as sources with role `source` and a reason naming the originating tool; **the watched glob list lives in the catalog and overlay, never embedded in the prompt** — a new tool enters by editing the catalog or the project's overlay (`routing` block of state), without touching a prompt (D28);
  4. docs, specs, and READMEs new or changed outside the canonical territories;
  5. vault integrity: `INDEX.md` derivable from decision `Afeta:` fields, `DEC-NNN` with no collision or reuse (live clauses + `## Histórico`), folder outside the closed list in `references/vault-schema/SCHEMA.md` §2;
  6. pending decision candidates in `Candidatos a decisão` sections of `LEDGER.md` files under `.app-work/guides/`; enqueue in `questions.json` with `reason: decision-promotion`, `candidateId`, origin, text, evidence, `questionKey`, `contextFingerprint`, `invalidates: route`, and `blocking: false`. A refusal leaves the candidate in process and does not block independent operations;
  7. a completed guide outside the mirror (legacy under `.app-work/done/` or flat under `.app-work/archive/guides/`) — inventory as a source to reorganize into the mirror (DEC-002);
  8. Interior of `.app-work/`: loose files at the root; loose `.md` in `guides/`; pack with Plan F `CONCLUÍDO` or STALE still in `guides/`; PRD with no consumer; brainstorm marked closed still live; `done/`; flat `archive/guides/<PACK>/`; `private/references/`; `roadmap` under `private/`.
  9. Byte-for-byte duplicate (`cmp` / hash) between live×live and live×archive.
  10. Condense candidate: a file whose unique content fits a more complete live canonical (same theme; newer canonical or current spec/DEC). Do not condense in the dark — it enters the plan as destructive `condense`.
  11. Path outside §4 → queue §6.
  12. Packs in `guides/` with pending Plan F **must not** be archived (`PRONTO PARA AUDITORIA COM PENDÊNCIAS` ≠ `CONCLUÍDO`).

## Rules

- record found and missing sources;
- do not fill gaps silently;
- do not yet interpret the final operational role;
- detect monoliths, contradictions, and redundant material;
- detect references to external files that may become `project-rules/` dependencies;
- detect the installed kit folder in the workspace (a folder is the kit when it contains `manifests/kit-manifest.json` with `name` equal to `hephaestus`, or when it contains `SKILL.md`, `prompts/`, and `schemas/` together) and record it as a kit folder **excluded** from the source inventory (observation field); never fragment the kit folder, never treat it as a source of project rules, and never use any file from it as a reference for the generated package;
- apply the single checkpoint rule from `SKILL.md`: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on start, mark `discover` as `in_progress`; when the initial inventory is done, mark `discover` as `produced`; mark `discover` as `validated` when found sources, missing sources, and initial risks are coherent; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).

## Writes to the repository

No. The only write is the checkpoint `.hephaestus/manifests/run-state.json` (ephemeral, gitignored).

## Outputs

- source inventory;
- structure notes;
- possible fragmentation risks;
- preliminary list of relevant external dependencies, if any;
- initial execution checkpoint.
