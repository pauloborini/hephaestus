# Compose

## Purpose

Materialize the whole package in staging without touching the repository: every planned artifact is built under `.hephaestus/staging/`, and staging is proven by `verify(staging)` before `apply` writes any byte.

The final `AGENTS.md` must own workflow and routing.
Project rules belong in `project-rules/rules/*`.
Examples and long contracts belong in `project-rules/reference/*`.
External contracts (for example OpenAPI) belong in `project-rules/contracts/` when the material requires it.
Real external references may still exist when the project depends on them, but they must be detected, recorded, and reported.

## Inputs

- `.hephaestus/plan.json` / approved plan;
- ledgers (`routing.json`, `identity-map.json`, fragments);
- `templates/`, `references/`;
- state's `shield` block (if any).

## Outputs

- `.hephaestus/staging/**` (materialized package)
- `.hephaestus/staging-manifest.json`
- coverage-map / external-references-report (when applicable; see Mandatory coverage)

## Framework agnosticism

- Detect the repository's framework and language (for example Flutter, React, Go, Python).
- Fill gates, checklists, and commands with the project's real tools (analyzer, linter, validator, test).
- Do not copy commands or examples from another stack; the structure is fixed, the content is the project's.

## Staging

- every destination is `.hephaestus/staging/<relative path>`, never the real repository path — staging mirrors the entire final package, including package manifests under `.hephaestus/staging/.hephaestus/manifests/`;
- output includes `.hephaestus/staging-manifest.json` with sha256 per artifact (one artifact per entry: `outputPath` + `sha256`), which `apply` writes as the final list and `verify(applied)` checks hash by hash;
- `staging-manifest.json` itself is not on the list it describes;
- `.app-work/hephaestus-state.json` is not in staging, staging-manifest, or deletions: its persistence uses its own merge and receipt;
- materialize condensed canonicals in staging; emit `.hephaestus/staging-deletions.json` `{ version: 1, paths: string[] }` with relative paths to remove. A file marked `delete` does **not** enter `staging-manifest.json`;
- unchanged `keep` entries (keep-bytes); `delete` does not enter the staging-manifest hash check;
- no silent decisions here: impossible adaptation of shielded content enqueues `reason: compose-shield-adaptation`, with `invalidates: plan`, and returns to the interview revalidation batch; other doubts are bugs from a previous phase.

## Product territories (`_app-vault/`)

Materialize reconciled decisions (`identity-map.json` from `reconcile`) from the absorbed templates:

- `_app-vault/docs/decisions/<dominio>.md` — one file per product domain, instantiated from `templates/vault/DECISION_TEMPLATE.md` with comments removed: heading `### DEC-NNN — <rule>` with the ID minted/amended by `reconcile`, living statement, and preserved inline notes; `Afeta:` immediately after the title, above the first clause, with kebab-case features from the project vocabulary;
- `_app-vault/INDEX.md` — instantiated from `templates/vault/INDEX_TEMPLATE.md`: `## Domínios` with one pointer per `docs/decisions/` file; valid feature list declared **above** `## Por feature`; `## Por feature` **derived** from `Afeta:` fields of every file — never written by hand; if they diverge, `Afeta:` is truth and the index is corrected (`SCHEMA.md` §7);
- `_app-vault/docs/TEMPLATES/README.md` — materialized (folder role), because `docs/TEMPLATES/` is required by the closed list (§2) and anchored by `AGENTS.md`; existing project content in the folder is preserved as `keep` (`route` level 1);
- removals decided by `reconcile` gain the line in `## Histórico` at the end of the domain file — the ID stays immortal to the numbering inventory;
- nothing from `.app-work/` is indexed in `INDEX.md` — indexing it would make it discoverable and undo the split (`SCHEMA.md` §3).

## `.app-work/` scaffold

Materialize the process scaffold per the closed list in `references/vault-schema/SCHEMA.md` §2:

- `.app-work/.gitignore` — **even on a greenfield project**, versioned, with lines `references/` and `private/` (and `issues/` when the repository is public);
- `.app-work/INDEX.md` — process map, instantiated from `templates/appwork/INDEX_TEMPLATE.md` (same pattern as the vault: pointer, not content): closed-list folders with each role + process golden rules; created **always**, even on greenfield — it is the anchor `AGENTS.md` points to and must never be missing;
- only closed-list folders are created: `.app-work/guides/`, `guides/legados/`, `roadmap/`, `brainstorming/`, `prd/`, `docs/`, `references/`, `private/`, `issues/`, `archive/` (when there is content for them — a folder outside the list does not exist for the framework; an empty folder is not created);
- under `archive/`, materialize the mirror of the `destinationPath` already expanded by the cascade: `archive/guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE/` (DEC-002) — do not flatten at the `archive/` root or as `archive/guides/<PACK>/`;
- `relocate` fragments destined for `.app-work/` enter the corresponding folder (basename preserved, bytes preserved);
- `condense` fragments materialize the canonical in staging (unique excerpt + trail note); the origin goes to `staging-deletions.json`;
- if the plan touched `guides|prd|docs|issues|archive|roadmap|references|private`, generate/update that folder's `README.md` (role/type, not eternal names). Do not restore a pruned file.

## Shielding

Content declared in the state's `shield` block (`{ path, selector }`) **beats the canonical structure**: the shielded artifact is composed byte for byte from what is in the repository and the template adapts around it. Adaptation impossible without changing the block's bytes ⇒ record a pending item and enqueue `reason: compose-shield-adaptation`, with `invalidates: plan`, in the revalidation batch — never "improve" the block. Third-party content **not** covered by the `shield` list is a source like any other: reabsorbed and rewritten to the pattern (D9), and the removal appears in `plan.md` before apply.

After any revalidation answer, discard staging, coverage-map, and plan derived from the previous context; recompose the entire tree from the first invalidated stage. There is no partially approved composition.

## Rules

- start with `AGENTS.md`;
- use `templates/AGENTS.md.template` as the operational base of `AGENTS.md`;
- materialize `_app-vault/docs/TEMPLATES/DECISION_PROTOCOL.md` from the kit template; the consuming agent must be able to operate decisions without resolving `references/vault-schema/SCHEMA.md` inside the install;
- fill the header with the real project name and the agent contract on the real stack (for example "Act as a senior Flutter engineer. Preserve feature-first architecture, explicit contracts..."); never leave the template's generic header in the final file;
- keep `## Postura`, `## Workflow obrigatório` (including mandatory stop, premises, criterion, simplicity, surgical change, and invariants inside steps 2 and 3), `## Precedência interna`, `## Produto`, and the base universal rules identical to the template (fixed protocol, the same in every project); fill only points marked `<preencher na síntese>`: validation gates, language, repository structure, and project-specific universal rules;
- do not promote to its own H2 what the template keeps inside workflow steps: conversation posture stays at the top, the rest fires in the step where it is read or applied;
- do not repeat in `AGENTS.md` what `project-rules/rules/operational_rules.md` already norms (gates, tests, baseline, closeout, commits): `### 4. Validação` points to the rule and adds only the stack's real gates;
- fill the repository-structure and documentation section with the project's reality: apps/packages/folders and their roles (or the app's single root) and the generated `project-rules/` components (indexes, rules, references, contracts) — every existing `project-rules/` component must be reachable from internal precedence or referenced in that section; product and process anchors are **fixed** in the template (`_app-vault/INDEX.md` and `.app-work/INDEX.md`, with responsibilities and the ban on `.app-work/` as an input): fill only what is the project's, never list internal vault/process folders in `AGENTS.md` — each folder has its own index/README;
- do not add client frontmatter (for example `description`/`alwaysApply`) to the generated `AGENTS.md`; tools read `AGENTS.md` by default;
- materialize a root `CLAUDE.md` bridge with exactly one line, `@AGENTS.md`, and nothing else — a client that only reads `CLAUDE.md` lands on the same contract without a duplicate file; a preexisting `CLAUDE.md` with its own content is a source like any other (reabsorb into `AGENTS.md`/`project-rules/` and reduce to the bridge, recording the replacement in `plan.md` before apply), unless it is in the `shield` block;
- keep `AGENTS.md` focused on posture, stop, workflow, precedence, triage, and validation;
- ensure triage tries to read `project-rules/index/<tipo>.md` before pre-confirmation;
- ensure pre-confirmation uses the already-loaded index to list triggered rules/references and does not pause waiting for approval;
- do not put domain, UI, architecture, security, or contract rules directly in `AGENTS.md`;
- generate only categories supported by available material;
- prefer predictable, neutral names;
- keep the tree small and oriented by operational role;
- do not dump everything into `AGENTS.md`;
- do not create empty files;
- do not turn specific rules into a generic summary;
- do not lose checklists, prohibitions, precedences, or exceptions present in the sources;
- when there is enough material, create a specific rule in `project-rules/rules/*` instead of hiding it in the index;
- do not promise that `project-rules/` is fully self-contained while real external dependencies remain;
- on starting the phase, apply the single checkpoint rule from `SKILL.md`: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on start, mark `compose` as `in_progress`; when finished, record artifacts in staging and mark the phase `produced`; mark `compose` as `validated` when the staging tree has sufficient coverage and the minimum artifacts exist; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).

## Mandatory coverage

Before concluding composition:

1. confirm every `rules` fragment went to some file in `project-rules/rules/*`;
2. confirm every `index` fragment is reflected in some `project-rules/index/*`;
3. confirm every `reference` fragment went to `project-rules/reference/*` or was omitted with justification;
4. record `unknown`, conflicting, or low-confidence fragments as pending;
5. confirm `AGENTS.md` did not become a rules dump;
6. record external references cited by `project-rules/` files in `.hephaestus/staging/.hephaestus/manifests/external-references-report.json`;
7. persist `.hephaestus/staging/.hephaestus/manifests/coverage-map.json` with one entry per fragment (`fragmentId` + destination: `artifactType`, `outputPath`, `derivedFrom`, `validationStatus`) and `lastUpdatedAt` at write time; `vault` territory entries already decided by `reconcile` are preserved (never rewritten by hand); the file must match `schemas/coverage-map.schema.json`.

## External dependencies report

When any file in `project-rules/` cites a file outside that folder, generate:

- `.hephaestus/staging/.hephaestus/manifests/external-references-report.json`

The report must list at least:

- `sourceFile`
- `referencedPath`
- `status`: `valid`, `missing`, `fragile`, `should-internalize`
- `reason`
- `recommendation`

The report must match `schemas/external-references-report.schema.json`.

## Writes to the repository

No. Every artifact is materialized under `.hephaestus/staging/` and package manifests under `.hephaestus/staging/.hephaestus/manifests/` (ephemeral, gitignored).

## Recommended indexes

Generate only indexes supported by available material, using these names when applicable:

- `project-rules/index/feature.md`
- `project-rules/index/ui.md`
- `project-rules/index/contract.md`
- `project-rules/index/navigation.md`
- `project-rules/index/shared.md`
- `project-rules/index/security.md`
- `project-rules/index/diagnostic.md`
- `project-rules/index/refactoring.md`
- `project-rules/index/testing.md`

## Recommended rules

Generate only files supported by available material, using predictable names:

- `project-rules/rules/architecture_rules.md`
- `project-rules/rules/operational_rules.md`
- `project-rules/rules/domain_rules.md`
- `project-rules/rules/error_handling_rules.md`
- `project-rules/rules/auth_rules.md`
- `project-rules/rules/security_rules.md`
- `project-rules/rules/ui_rules.md`

## Recommended references

- `project-rules/reference/domain_examples.md`
- `project-rules/reference/api_contract_reference.md`
- `project-rules/contracts/*.openapi.json`: when the material includes an external contract.

## Recommended order

1. `AGENTS.md`
2. `project-rules/index/*`
3. `project-rules/rules/*`
4. `project-rules/reference/*`
5. `project-rules/contracts/*` (when present)
6. `_app-vault/` (decisions from `identity-map.json` + `INDEX.md` derived from `Afeta:`)
7. `.app-work/` (closed-list scaffold + relocation of `relocate` fragments)
8. `.hephaestus/manifests/*`
