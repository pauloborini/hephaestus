# Discover

## Purpose

Discover the user's raw sources before any reorganization.

## Inputs

- `mode` from the run-state (`preflight`);
- `manifests/naming-policy.json`, merged with `manifests/naming-policy.local.json` when that file exists in the install (maintainer-only list of real names; never shipped, never echoed in an artifact);
- `catalog/drift-catalog.json` (and `routing` overlay when `maintain`);
- `.app-work/hephaestus-state.json` when present (`meta.lastRunAt` in `maintain`).

## Scope by mode

Inventory scope is decided by the `mode` resolved in `preflight` (run-state `mode` field), never by heuristics over present structure:

- `mode: adopt` — full repository scan: agent convention documents (`AGENTS.md`, `CLAUDE.md`), specs, architectural docs, workflow guides, project conventions, and the canonical territories as sources (on a rerun, the destination is also input). **Must inventory and mark as incomplete-adoption risk:** (a) paths under `_app-vault/` or `.app-vault/` outside the closed list in `SCHEMA.md` §2; (b) `DECISIONS_*` files, “Closed decisions” sections / headings `### D\d+` / `### DEC-\d+` without the canonical em-dash **outside** `docs/decisions/`; (c) absence of `docs/decisions/` with `### DEC-NNN` when (a)/(b) exist — adoption only closes when that material is promoted or recategorized in the same run. `adopt` also enqueues the **repository-visibility question** (`issues-visibility`, D43, once per project): is the repository private (version `.app-work/issues/` and the other process folders for traceability and collaboration) or public (ignore `issues/`, `guides/`, `brainstorming/`, `prd/`, and `archive/` via `.app-work/.gitignore`, because process files carry internal context and PII and public git history is permanent)? Queue with `reason: issues-visibility`, questionKey `issues-visibility` (a kit-owned named key, `prompts/interview.md`) + `contextFingerprint` over the repository's visibility evidence (the remotes; `.app-work/.gitignore` is an output the kit reconciles, never fingerprint material, so a run that adds lines to it does not invalidate the answer), `invalidates: compose`, and `blocking: false` — the declared conservative default exists; the question presents the trade-off and never decides for the user (expected answer: `answer.issuesVisibility ∈ {versioned, gitignored}`, `scope: this-project`). It is enqueued only when no persisted answer exists for the key with a current fingerprint (later runs included — what makes it once per project is the persisted answer);
- `mode: maintain` — reduced, data-driven scope: inventory only what differs from the last run and what other tools produce, leaving the rest as unchanged sources that fall to `keep` at cascade level 1 (reduced scope cuts cost, not correctness — a maintain that scanned everything would produce the same result, only slower):
  1. `AGENTS.md`: on every run, compare its fixed protocol sections (`## Posture`, `## Mandatory workflow`, `## Internal precedence`, `## Product`, and the base universal rules) with `templates/AGENTS.md.template`; a section that differs is inventoried as a source for an upgrade operation, because the kit's own template changes between versions; the synthesis points (header, gates, structure section, language, project-specific rules) are never sources;
  2. `CLAUDE.md` present and divergent from `AGENTS.md` (a rule the agent contract does not cover);
  3. each glob from `catalog/drift-catalog.json` (other tools' artifacts) present in the repository — agent-rule files and tool artifacts enter as sources with role `source` and a reason naming the originating tool; **the watched glob list lives in the catalog and overlay, never embedded in the prompt** — a new tool enters by editing the catalog or the project's overlay (`routing` block of state), without touching a prompt (D28);
  4. docs, specs, and READMEs new or changed outside the canonical territories;
  5. vault integrity: `INDEX.md` derivable from decision `Affects:` fields, `DEC-NNN` with no collision or reuse (live clauses + `## History`), folder outside the closed list in `references/vault-schema/SCHEMA.md` §2;
  6. pending decision candidates in `Decision candidates` sections of `LEDGER.md` files under `.app-work/guides/`; enqueue in `questions.json` with `reason: decision-promotion`, `candidateId`, origin, text, evidence, `questionKey`, `contextFingerprint`, `invalidates: route`, and `blocking: false`. A refusal leaves the candidate in process and does not block independent operations;
  7. a completed guide outside the mirror (legacy under `.app-work/done/` or flat under `.app-work/archive/guides/`), when it is a legacy pack without `pack.json` — inventory as a source to reorganize into the mirror (DEC-002);
  8. Interior of `.app-work/`: loose files at the root (they relocate to `docs/` by the level 4 detector); loose `.md` in `guides/`; legacy pack without `pack.json` with Plan F `CONCLUÍDO` or STALE still in `guides/`; PRD with no consumer; brainstorm marked closed still live; `done/`; flat `archive/guides/<PACK>/`; `private/references/`; `roadmap` under `private/`.
  9. Byte-for-byte duplicate (`cmp` / hash) between live×live and live×archive.
  10. Condense candidate: a file whose unique content fits a more complete live canonical (same theme; newer canonical or current spec/DEC). Do not condense in the dark — it enters the plan as destructive `condense`.
  11. Path outside §4 → queue §6.
  12. Packs in `guides/` with pending Plan F **must not** be archived (`PRONTO PARA AUDITORIA COM PENDÊNCIAS` ≠ `CONCLUÍDO`).
  13. A pack with `pack.json` is engine-managed and is never inventoried for relocation, in any state: archive is `pack.json.archived`, written by the pack engine. A pack with `pack.json` already under the dated mirror is legacy placement: recorded as an observation for the closeout, never as a finding (the engine does not read the mirror).
  14. Orphan intent pack: `pack.json.state: intent:*` whose `pack.json.roadmap.roadmap` resolves to a `roadmap.json` with `status: archived` and no citation in a live slice/pack: enqueue with `reason: route-ambiguity` (rebind to a live roadmap, close by user, or archive in place) and `blocking: false`.
  15. `project-rules/**` file whose decision content depends on a file outside `project-rules/` (a `.app-work/` path used as rule input, or a decision value copied instead of cited): inventory as a source for internalization; a path cited only as a location pointer is not a dependency.

## Rules

- record found and missing sources;
- record each defect detected by the `maintain` inventory (integrity drift: vault integrity, duplicates, inconsistent counters, paths outside the closed list) as a finding in the ephemeral ledger `.hephaestus/manifests/findings.json`: `type`, normalized `path`, `statement`, `severity`, and `findingSignature = sha256(finding type + normalized path + normalized statement)` — the queue consumed by `plan` as the ISSUE-NNN operation (see `prompts/plan.md` and `prompts/apply.md`); the ledger is valid against `schemas/findings.schema.json`; a run that detects no defect records no finding;
- run the identity hygiene scan (`references/vault-schema/SCHEMA.md` §2.5) over every inventoried source, over every file the run composes, and over every versioned text file under `.app-work/` (`.md`, `.txt`, `.json`, `archive/` included) in both modes: a deterministic sweep that does not depend on the reduced `maintain` inventory; each hit becomes a finding with `type: identity-hygiene`, the normalized path, and a statement that names the pattern class (e-mail, token, home path) and never quotes the matched value; a hit inside an engine-owned file of a pack (`pack.json`, `journal.jsonl`) or inside the sealed set of a pack with `sealed: true` is recorded with `type: identity-hygiene-sealed`: minted once as `WONTFIX` with reason `sealed`, never a recurring pending;
- an organization e-mail address that may be a public contact also enqueues the `reason: identity-hygiene` question (`prompts/interview.md`), once per address without a current saved answer;
- record versioned binary evidence (tracked files under any `evidence/` or `receipts/` folder that are not `.md`, `.txt`, or `.json`) as a finding with `type: identity-hygiene`;
- do not fill gaps silently;
- do not yet interpret the final operational role;
- detect monoliths, contradictions, and redundant material;
- detect references to external files that may become `project-rules/` dependencies;
- detect the installed kit folder in the workspace (a folder is the kit when it contains `manifests/kit-manifest.json` with `name` equal to `hephaestus`, or when it contains `SKILL.md`, `prompts/`, and `schemas/` together) and record it as a kit folder **excluded** from the source inventory (observation field); never fragment the kit folder, never treat it as a source of project rules, and never use any file from it as a reference for the generated package;
- apply the single checkpoint rule from `SKILL.md`: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on start, mark `discover` as `in_progress`; when the initial inventory is done, mark `discover` as `produced`; mark `discover` as `validated` when found sources, missing sources, and initial risks are coherent; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).

## Writes to the repository

No. The only writes are the checkpoint `.hephaestus/manifests/run-state.json` and the defect findings ledger `.hephaestus/manifests/findings.json` (both ephemeral, gitignored).

## Outputs

- source inventory;
- structure notes;
- defect findings ledger (`.hephaestus/manifests/findings.json`), when the inventory detected defects;
- possible fragmentation risks;
- preliminary list of relevant external dependencies, if any;
- initial execution checkpoint.
