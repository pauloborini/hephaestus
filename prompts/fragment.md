# Fragment

## Purpose

Break large sources into smaller, usable units.

The goal is not to summarize the material.
The goal is to preserve every relevant rule in smaller, traceable fragments that are easy to route.

## Inputs

- `.hephaestus/manifests/snapshot.json` (and source→units map);
- `schemas/fragment.schema.json` (output shape).

## Preferred delimiters

- headings
- lists
- checklists
- tables
- thematic sections
- clearly normative blocks

## Procedure

1. Read the entire source before fragmenting.
2. Identify normative blocks, examples, references, preferences, and metadata.
3. Split first by structural sections.
4. Inside large sections, split by rule, checklist, table, or topic.
5. Keep fragments small enough to route, but complete enough not to lose meaning.
6. Record origin, section, and location hint whenever possible.
7. Mark duplicated or conflicting fragments instead of deleting content.

## Mandatory rules

- preserve the link to the origin;
- preserve operational content, not only the general idea;
- do not over-split to the point of losing meaning;
- do not keep huge blocks when there are clear structural divisions;
- record location or origin hint whenever possible;
- do not discard a rule because it looks too specific;
- do not move a decision to inference when the original source states an explicit rule;
- when in doubt, keep the fragment and mark low confidence for later routing.
- on start, apply the single checkpoint rule from `SKILL.md`: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on start, mark `fragment` as `in_progress`; when the phase finishes, mark `fragment` as `produced`; mark `fragment` as `validated` when the minimum output is consistent and covers the sources planned in `snapshot`; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).

## Writes to the repository

No. The only writes are the checkpoint `.hephaestus/manifests/run-state.json` (ephemeral, gitignored) and the ledger `.hephaestus/manifests/fragments.json` (ephemeral, gitignored).

## Minimum output per fragment

- stable identifier;
- original source;
- approximate location;
- preserved text or faithful synthesis;
- provenance (`provenance[]` with `sourcePath`/`startOffset`/`endOffset`) — required;
- initial structural type: section, rule, checklist, example, table, preference, metadata, or unknown;
- notes on conflict, duplication, or ambiguity;
- whether the fragment needs to be split again (`needsSplit`), recorded as an observation field — a mixed fragment marked `needsSplit` and not split blocks the `route` phase;
- phase checkpoint update.

**Do not invent a destination.** In `fragment`, **do not** invent, estimate, or guess `territory`, `regime`, or destination path. Those fields are optional on the schema in this phase; the `route` phase (cascade) decides destination/territory/regime.

## Outputs

`.hephaestus/manifests/fragments.json` — one object per fragment (`fragmentId`, `rawText`, `confidence`, `ambiguity`, `provenance[]` with `sourcePath`/`startOffset`/`endOffset`; `territory`/`regime` optional and typically absent until `route`), valid against `schemas/fragment.schema.json` — consumed by `route` (cascade decides destination) and by the validator `checkCoverage`/`checkKeepBytes` gates.
