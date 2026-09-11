# Closeout

## Purpose

Do the final review of what was generated after `apply` and deliver a consistent package closeout to the user, with an explicit verdict and the list of what the LLM decided on its own. Closeout **does not decide anything new**: the residue gate (`route` phase) marks; this phase translates that into a verdict.

## Inputs

- run-state and post-`apply` manifests (`coverage-map`, `routing`, external-references);
- package applied in the four territories;
- `templates/` / report shape.

## Rules

- apply the single checkpoint rule from `SKILL.md` throughout the phase: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on start, mark `closeout` as `in_progress`; when the report is done, mark `closeout` as `produced`; mark `closeout` as `validated` when the minimum output is consistent with the manifests and `apply` artifacts; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`);
- check `.hephaestus/manifests/run-state.json` before starting: if the previous `apply` phase is not `validated`, record a pending and re-run what is missing; in `mode: adopt`, `meta.adoptionStatus` must also be `validated`, or the result is `needs-followup`;
- check `.hephaestus/manifests/coverage-map.json`: every relevant fragment needs a destination (`artifactType` + `outputPath`); pending per fragment without a destination;
- check `.hephaestus/manifests/external-references-report.json` when present; pending per external reference without recorded internalization;
- review `AGENTS.md` and `project-rules/` for rules that should have gone to `project-rules/rules/*` but stayed in `AGENTS.md`, or a final tree inflated with empty files;
- review the four package territories — `AGENTS.md`, `project-rules/`, `_app-vault/`, and `.app-work/` — confirming each received only what the plan determined, with no rule-value leak across territories;
- in `mode: adopt`, check complete vault adoption: `INDEX.md` present; `docs/decisions/` with `### DEC-NNN` clauses coherent with `identity-map.json` when discover marked decision material; **no** folder under the vault outside the closed §2 list remaining on disk; scaffold-only `docs/decisions/` with still-living decision sources (or only moved to `.app-work/` without promotion) ⇒ **blocking** pending and verdict `needs-followup` (not `ready`, not “acceptable degraded”);
- **never alter `AGENTS.md`, `project-rules/`, `_app-vault/`, or `.app-work/` during closeout** — closeout reviews and points; corrections return to `apply` on the next run;
- check `.hephaestus/manifests/routing.json`: `decidedBy: llm` entries whose destination is a new file in `_app-vault/docs/decisions/` or `project-rules/rules/` are **degrading** (D26) and enter the report's named list; residue entries in `project-rules/reference/`, `project-rules/index/`, or `.app-work/` do not degrade;
- report `llmDecidedRatio` (share of fragments decided by the LLM) **always, with no cap** — the degradation criterion is destination type, never volume;
- do not pin a stack tool: the review records what was used, without recommending replacement of analyzer/linter/validator outside a `<preencher na síntese>` placeholder;
- do not cite a real project in any closeout item.

## Verdict

- `ready` — no degrading entry and no blocking pending; in `adopt`, complete canonical vault and `meta.adoptionStatus: validated` (decisions materialized when there was a source);
- `degraded-but-usable` — there is a degrading entry (named list required) or a controlled pending; the package is usable with caveats; **do not** use this verdict for “empty decisions/ on first adoption” when there was decision material — that is `needs-followup`;
- `needs-followup` — an open blocking pending (for example undrained interview queue; incomplete vault adoption: legacy decisions not promoted to `DEC-NNN`); the run is not treated as complete.

## Outputs

`.hephaestus/report.md` — omit no section even when empty (with explicit `none`), containing:

1. `## Pendings` — remaining pending list;
2. `## Recommended decision per pending` — an objective decision for each pending;
3. `## Residue decided by the LLM` — explicit list of degrading entries (one line per entry: `fragmentId → destinationPath`, marking when the destination becomes a new `DEC-NNN` or a new rule) and of non-degrading residue entries;
4. `## Metrics` — line `llmDecidedRatio: <0..1>` with the measured ratio;
5. `## Pack candidates` — entries from `.hephaestus/pack-candidates.json` (new pattern accepted for the pack); also list promotion candidates for a glob already expected in `drift-catalog` (not a folder outside the list), when present;
6. `## Confirmations` — final `AGENTS.md` state; final `project-rules/` state; confirmation that relevant fragments have a destination on the coverage map (`.hephaestus/manifests/coverage-map.json`); explicit summary of external references found and what should be internalized; confirmation of the final `.hephaestus/manifests/run-state.json` state;
7. `## Verdict` — final line with `ready`, `degraded-but-usable`, or `needs-followup`.

The report is consumed by the `checkResidueGate` gate in `scripts/validate-package.mjs` (coherence between degrading `routing.json` entries and the verdict/list).

## Writes to the repository

No. The report is written to `.hephaestus/report.md` (ephemeral, gitignored); the review reads and points; corrections return to `apply` on the next run.
