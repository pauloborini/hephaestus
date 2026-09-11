# Reconcile

## Purpose

Give the pipeline the decision-identity engine: **reconcile and, when needed, mint**. “Never generate” means **never invent a rule the source does not state** — it does not mean leave `docs/decisions/` empty. `DEC-NNN` is minted by `max+1`, amended in place, and never reused (D17). An existing decision with a new value keeps the ID and gains an inline note; a decision with no match **is born with a new ID (`create`)** — including when `inventoriedMax = 0` (greenfield project or legacy vault without canonical clauses). Removal is rare and only after a pending-citation check. Rewritten prose is recoverable; a reused `DEC-NNN` is not.

In `mode: adopt`, a decision candidate already routed to `_app-vault/docs/decisions/**` (or alias) leaves final reconciliation with `action ∈ {create, amend, keep, remove}` and `decId` filled. Before the interview, conflicts live only on the queue, without inventing `keep` or a resolved ID. The phase stays `produced` and hands control to `interview`; only the final pass with no pending items may be `validated` and release `plan`.

## Inputs

- `.hephaestus/manifests/routing.json` — routed fragments (`vault` territory with `reconcile` or `keep` is this phase's focus);
- `.hephaestus/manifests/fragments.json` — text and provenance per fragment;
- valid answers in the state's `answers` block and in `run-answers.json` for the same `runId`, with `questionKey` and `contextFingerprint` matching the current context; promotion also requires `answer.confirmed: true`, `answer.statement`, `answer.domain`, and `sourceEvidence`;
- current state of `_app-vault/docs/decisions/**` — live clauses and `## Histórico` (source of truth, `references/vault-schema/SCHEMA.md` §4);
- `.hephaestus/manifests/run-state.json` (phase checkpoint).

## Identity inventory

Before minting any new ID, inventory the largest `DEC-NNN` in the repository:

- scan **all** files under `_app-vault/docs/decisions/` (one file per domain, `kebab-case`); the scan is by directory, never by a fixed list;
- collect IDs from **two sources**: `### DEC-NNN` headings (live clauses) **and** IDs cited on lines in the `## Histórico` section (removed decisions remain immortal);
- take `max` over the **union** of both lists and record it as `inventoriedMax` in `identity-map.json`;
- **forbidden** to restrict the scan to live clauses (`rg "^### DEC-"` alone): removal is allowed and the ID stays immortal (`SCHEMA.md` §4.7) — a vault with `DEC-002` only in `## Histórico` and no live clause has `max = 2`, and the next mint is `DEC-003`, never `DEC-001` or `DEC-002`;
- greenfield (no `_app-vault/docs/decisions/`): `max = 0`, first mint `DEC-001`.

## Identity

Process **only** fragments whose `destinationPath` lands in `docs/decisions/` (after normalizing alias `.app-vault/` → `_app-vault/`). Vault destinations that are not decisions (`INDEX.md`, `docs/TEMPLATES/**`, `specs/**`) record `action: keep` with `decId: null` and **do not** enter minting.

Confirmed promotion enters as a new human-origin fragment: `fragmentId` derived from `questionKey` + `contextFingerprint`, `rawText` equal to the confirmed `statement`, and provenance from the answer. Record `candidateId` and the process path only as context in `conflicts.json`; the original `.app-work/` fragment remains process. `interview` freezes the exact `statement` in `.hephaestus/manifests/human-decisions/<fragmentId>.md`, adds its `path`/`sha256`/`size` entry to the snapshot without altering prior sources, and generates provenance with byte offsets covering that file. The new fragment thus satisfies `fragment.schema.json` and INV5 coverage. `route` assigns the human fragment a canonical destination and `decidedBy: human` before reconciliation. Do not accept a legacy or obsolete confirmation on mere `confirmed: true`.

For each fragment routed to `docs/decisions/`, match in this order and decide `action ∈ {keep, amend, create, remove}`:

1. **By explicit canonical `DEC-NNN`** — a fragment whose text is already heading `### DEC-NNN — <rule>` (em-dash; ID frozen by the cascade, level 1): the ID is the heading's, never another.
2. **By semantic identity** — a candidate fragment (including legacy `### D\d+`, `DEC-01` without em-dash, body of `DECISOES_*`, or human promotion) matches first by domain, subject/object, condition/scope, and rule type, with variable values removed from the comparison. Textual similarity only breaks ties inside that same identity. **A legacy ID does not freeze numbering** — if there is no matched live clause, fall through to step 3.
3. No match → `create` with `max+1` over the inventory (never reuse a number, including a removed decision). Empty inventory ⇒ first mint `DEC-001`, then sequential.

Per-case decision:

- `keep` — statement identical to the live clause; nothing is written; **`decId` stays filled**;
- `amend` — the **value** changed: the ID remains (`SCHEMA.md` §4.1: "the value changes, the DEC-NNN remains"), the statement under the heading is replaced and the inline note is added immediately below, in the fixed format:
  `_Alterado <data> — era: <valor antigo>. Motivo: <motivo>._`
  - new notes stack **above** the previous one (newest first);
  - after about 3 notes on the clause, old ones are **deleted** (not archived);
- `create` — new clause with a new `DEC-NNN`; a new domain or new `Afeta:` tag requires updating `INDEX.md` in the same flow (`## Domínios`, valid feature list, `## Por feature`);
- ambiguous semantic identity — two or more live clauses with the same semantic key are not chosen by similarity; record a conflict and enqueue `reason: reconcile-conflict` for human confirmation;
- `remove` — rare; **before** removing, check pending citations of the ID in the entire repository, **including inside `.app-work/`** — a search without `--hidden` (or without the cited path) returns zero and removal looks safe (`SCHEMA.md` §4.7); with no pending citation, removal is decided with the line in `## Histórico` at the end of the domain file (the only history section that exists) — materializing the line happens in `compose`/`apply`, never in this phase;
- cross-domain reach: update every affected domain and cite the sibling `DEC-NNN` in the note of each touched file (`_Alterado <data> — era: <antigo>. Motivo: <motivo>; ver DEC-024 em pagamentos.md._`).

## Checks

- **Value conflict** between sources for the same rule: **enqueue a question** (cascade and reconcile never choose under conflict — `questionKey` + `contextFingerprint` on the queue, drained by `interview`), recording the divergence in `conflicts.json` with sources and values;
- **Value duplication across territories** (D18/INV4): a decision value that reappears as a literal in `project-rules/` is a violation — `project-rules/` **references** the `DEC-NNN`, never copies the value; the validator `checkDuplicatedValue` gate fails duplication without a citation;
- **Mandatory split of the hybrid case** (`SCHEMA.md` §8): a single sentence with both a product norm and an implementation norm must split — the **effect observable by the end user** (number, limit, enumeration item, plan option) goes to `docs/decisions/` as `DEC-NNN`; the **how-to-implement norm** goes to `project-rules/` referencing the ID, never copying the number;
- **Coverage and pending citations** before any ID removal: no `remove` without a complete repository check, including hidden paths.

## Question queue

Questions are born **queued** — this phase never asks (D22). Everything that needs a human decision leaves in `questions.json` with `questionKey`, `contextFingerprint`, `reason`, `invalidates`, and `blocking`, drained by `interview` in the initial batch or the single revalidation batch.

**Justifies a question** (closed list — nothing else is queued in reconcile):

- value conflict between sources for the same rule — recorded in `conflicts.json`, never chosen here;
- ambiguous semantic identity among live clauses;
- change of a living decision with divergent values between sources;
- removal of a `DEC-NNN` with an unresolved pending citation;
- removal of third-party content outside the state's `shield` list.

**Never asks** (closed list — decide in silence, with evidence):

- a high-match route already decided by the cascade (territory and regime fixed);
- a non-touch decision, frozen identity (`### DEC-NNN`), or detector;
- file name, section order, and inline-note form;
- anything already answered with applicable scope and current `contextFingerprint` — binding; an obsolete answer requires revalidation;
- a process candidate without human confirmation — stays a candidate and does not enter the decision inventory;

## Gate

- on the final pass, every fragment destined for `docs/decisions/` leaves with a decided `action` and a **non-null** `decId`; on the pre-interview pass, each pending item has a blocking question and does not enter the map as a resolved decision;
- a vault fragment outside `docs/decisions/` (INDEX / TEMPLATES / specs) leaves with `action: keep` and `decId: null`;
- `identity-map.json` records `inventoriedMax` and one entry per processed fragment (`fragmentId`, `decId`, `action`, `domain`, `matchedId` — the pre-existing matched ID, `null` for `create` — and `evidence`);
- no ID is renumbered, reused, or present at the same time as a live clause and in `## Histórico` (INV3);
- `scripts/validate-package.mjs` runs `checkDecIdentity` on the package (`identity-map.json` + `_app-vault/docs/decisions/**`);
- a fragment originating in `.app-work/` never becomes a `DEC-NNN` (D19/INV9): a rule that exists only there is a gap to promote, never an input — if an `.app-work/` fragment arrived here as a decision candidate, it is a routing bug, not a decision;
- in `adopt`, after the interview, if the cascade routed ≥1 candidate to `docs/decisions/` and the final map closes with zero `create`/`amend`/`keep` with `decId`, the phase marks `failed`.
- human promotion always records process origin, `questionKey`, `contextFingerprint`, and confirmation evidence; without those four, the entry is rejected.

## Blocks if

- removal of a `DEC-NNN` with an unresolved pending citation after the interview — block **with the citation list** (file + line), including those in `.app-work/`;
- an inventory that records `create` with an ID less than or equal to inventoried `max` — minting would reuse an existing ID;
- a fragment destined for `docs/decisions/` without `action`/`decId` on the final pass, or a pre-interview pending item without a recorded question;
- “keep pending” / “no canonical decisions” evidence on a `docs/decisions/` entry.

## Writes to the repository

No. The only writes are the checkpoint `.hephaestus/manifests/run-state.json` and the ledgers `.hephaestus/manifests/identity-map.json`, `.hephaestus/manifests/conflicts.json`, and `.hephaestus/manifests/coverage-map.json` (ephemeral, gitignored).

## Outputs

- `.hephaestus/manifests/identity-map.json` — `inventoriedMax` + one entry per fragment (`fragmentId`, `decId`, `action`, `domain`, `matchedId`, `evidence`), consumed by `plan` and `compose`;
- `.hephaestus/manifests/conflicts.json` — value divergences between sources recorded for the interview (`questionKey`, sources, values), never resolved here;
- `.hephaestus/manifests/coverage-map.json` — decision entries (`vault` territory) destined for `_app-vault/docs/decisions/**`; remaining entries enter composition (`compose`);
- phase checkpoint: on start, mark `reconcile` as `in_progress`; when done, `produced`. If there are questions, proceed to `interview` without marking `failed` or releasing `plan`. After answers and return, mark `validated` only with a complete map, no blocking conflict, and `checkDecIdentity` green; a failure that is not an interview pending marks `failed`.
