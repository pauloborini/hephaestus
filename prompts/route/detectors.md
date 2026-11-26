# Route — Non-touch and detectors

> Load **only** when the cascade is at level 1 (non-touch/identity) or level 4 (syntactic detectors).

### Level 1 — non-touch and identity

Compute the fragment destination from **structural classification** (level 4 syntactic detectors) **before** any lookup of answers, catalog, or judgment. If the normalized `destinationPath` equals the current origin path, decide `regime: keep`, `decidedBy: keep`, and mark the fragment **out of synthesis** — byte-for-byte copy, never regeneration.

**Progressive Disclosure load:** at level 1, “structural classification” is the `destinationPath` calculation by position/closed list (vault §2, canonical territories) described in this L1 block — it does **not** require loading or walking the full level 4 detector list. L4 only enters when L1 does not decide keep by position and the cascade reaches the detector step; mentioning L4 here names the *same family* of structural classification, not the file's read order.

The decision is by **position**, never by comparison with a prior-run snapshot: `.hephaestus/` is ephemeral (D6) and a new machine cannot depend on persisted state to preserve a human edit already in the right place.

**Vault non-touch ≠ “it is under the vault root”.** Keep-by-position only when the origin is already on the **closed list** in `references/vault-schema/SCHEMA.md` §2, in canonical form:

- `_app-vault/INDEX.md` (or alias `.app-vault/INDEX.md`);
- `_app-vault/docs/decisions/**` — clauses already in heading `### DEC-NNN — …`;
- `_app-vault/docs/TEMPLATES/**`;
- `_app-vault/specs/**`.

Project alias: `.app-vault/` ≡ `_app-vault/` for classification; the emitted `destinationPath` uses the alias declared in overlay/state when present, otherwise `_app-vault/`.

**Kit-maintained files are not sources.** Three paths are written by the kit in every mode and are never decided by position: `.app-work/INDEX.md` and `.app-work/.gitignore` (`regime: generate`: `create` when absent, `amend` to reconcile when present) and `.app-work/issues/INDEX.md` (issue operations only). Two more leave keep-by-position when their content drifts from the kit's own contract: `AGENTS.md` when a fixed section differs from `templates/AGENTS.md.template` (in `maintain`: `regime: generate` → `overwrite` of those sections only), and a `project-rules/**` file whose decision content depends on a file outside `project-rules/` (a `.app-work/` path used as rule input, or a decision value copied instead of cited: `regime: generate` → `overwrite`, to internalize or to convert into a `DEC-NNN` citation). A `project-rules/**` file that only names a path as the place where an artifact lives is keep-by-position.

A path under the vault root **outside** that list (`docs/features/`, `docs/platform/`, `docs/releases/`, `archive/`, `_private/`, dossiers, `DECISIONS_*`, etc.) is **not** keep-by-position — the cascade continues (catalog → detectors → LLM/question). In `adopt`, that material is reclassified in the same run; in `maintain`, vault integrity (discover item 5) also inventories it as structural drift.

A fragment whose text is already a canonical heading `### DEC-NNN — <rule>` (em-dash) decides territory `vault` with the ID **frozen** (minting and in-place reconciliation in `reconcile`). Legacy headings (`### D1`, `### DEC-01` without em-dash, “Closed decisions”) **do not** freeze an ID — they are minting candidates.

### Level 4 — syntactic detectors

Deterministic structural classification (the same family used at level 1), in this order:

- domain rule buried in the agent contract — origin legacy `AGENTS.md` (with a rule section, e.g. `## Domain rule`) or another tool's agent-rule file (watched globs from `catalog/drift-catalog.json`) + deontic verb ⇒ rule → `project-rules/rules/`;
- dated origin in `.app-work/archive/guides/<YYYY-MM>/semana-<N>/` (canonical mirror) ⇒ destination is the origin itself — keep / non-touch (DEC-002);
- pack in `.app-work/guides/<NAME>_GUIDE/` **without `pack.json`** with Plan F `Status: CONCLUÍDO` or `STALE` ⇒ relocate to `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NAME>_GUIDE/` — never keep;
- pack in `.app-work/guides/<NAME>_GUIDE/` **with `pack.json`** ⇒ engine-managed: the destination is the origin itself, in every state (`intent:*`, `DONE`, `DONE_WITH_PENDING`, `CLOSED_BY_USER`); never relocate; archive is `pack.json.archived`, written by the pack engine; no file inside the pack folder is written, `pack.json`, `journal.jsonl`, and the sealed set included; the same holds for a roadmap folder with `roadmap.json` (engine-managed folder, `references/vault-schema/SCHEMA.md` §2.2);
- pack with `pack.json.state: intent:*` whose `pack.json.roadmap.roadmap` resolves to a `roadmap.json` with `status: archived` **and** no citation in a live slice/pack ⇒ enqueue a question (`reason: route-ambiguity`): rebind to a live roadmap, close by user, or archive in place. A live citation beats the archived status;
- pack already under the dated mirror with its `pack.json` ⇒ keep where it is (legacy placement); the closeout lists it as an observation;
- loose file at the `.app-work/` root (any file other than `INDEX.md`, `.gitignore`, `hephaestus-state.json`) ⇒ relocate to `.app-work/docs/` (basename preserved); detector-decided, never a question;
- loose `.md` in `.app-work/guides/` (except `README.md`) ⇒ relocate to `.app-work/guides/legados/`;
- origin in `.app-work/private/references/` ⇒ relocate to `.app-work/references/` (preserve suffix);
- origin in `.app-work/private/roadmap/` ⇒ relocate to `.app-work/roadmap/` (preserve suffix);
- PRD in `.app-work/prd/` with `Status: done|completed|closed|archived|retired` **and** no citation in a live slice/pack (`roadmap/` or `_GUIDE` not CONCLUÍDO/STALE) ⇒ relocate to `.app-work/archive/prds/` (preserve suffix). A live citation beats status;
- `brainstorming/<topic>/` (or loose `.md` in the notebook) with closed/completed/done `Status` ⇒ relocate to `.app-work/archive/perguntas/<topic>/`;
- flat origin in `.app-work/archive/guides/<PACK>/` (without `<YYYY-MM>/semana-<N>/`) ⇒ relocate to `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<PACK>/` (DEC-002) — migration, never keep;
- legacy origin in `.app-work/done/` (removed from the closed list) ⇒ relocate to `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NAME>_GUIDE|file/` (DEC-002) — migration, never keep; date = Plan F `Status: CONCLUÍDO`, otherwise routing time;
- byte-for-byte duplicate (same hash) **only** live×live and live×archive ⇒ `regime: delete` of the extra copy; canonical = the live one (archive is the copy). Never hash `references/` or `private/` for delete; never delete a member of a live `_GUIDE` pack that is not completed/STALE;
- unique live excerpt (text ≥ 40 normalized chars) **strictly** contained in a single longer live canonical, same theme (file stem) ⇒ `regime: condense` of the origin into the canonical; 0 or 2+ canonicals = does not decide (do not condense in the dark). Do not condense `archive/`, `references/`, `private/`, or a live `_GUIDE` pack member. An identical duplicate remains `delete`, not `condense`;
- path under `.app-work/` outside the closed §4 list (unknown folder) ⇒ **not** keep: enqueue a pack-candidate question (queue §6);
- origin already on the canonical closed list (§2 + level 1 above: `AGENTS.md`, `project-rules/**` already in place, vault only `INDEX`/`docs/decisions`/`docs/TEMPLATES`/`specs`, live `.app-work/` **except** `done/`, flat archive, `private/references/`, `private/roadmap/`, PRD with no consumer, closed brainstorm, legacy F/STALE pack in `guides/`) ⇒ destination is the origin itself — non-touch (INV2/INV11/CN2); **forbidden** to treat all of `_app-vault/**` or `.app-vault/**` as canonical;
- legacy decision candidate — path `DECISIONS_*`, heading `### D\d+`, `### DEC-\d+` without canonical em-dash, or section “Closed decisions” ⇒ `_app-vault/docs/decisions/<domain>.md` (`<domain>` = parent feature/folder slug or normalized stem), `regime: reconcile` — **required in `adopt`**; a legacy ID does not freeze numbering;
- OpenAPI/JSON Schema (text containing `openapi` or `json-schema`) ⇒ contract → `project-rules/contracts/`;
- heading + deontic verb + numeric value (observable product norm) ⇒ decision candidate → `_app-vault/docs/decisions/<domain>.md`, `regime: reconcile`;
- path under vault outside the closed §2 list that is **not** a decision candidate or technical spec ⇒ `.app-work/archive/` (preserve relative suffix) — a shell/dossier is not living truth;
- type→file table ⇒ index → `project-rules/index/`;
- code block with no associated norm ⇒ reference → `project-rules/reference/`.

Decides `decidedBy: detector`.
