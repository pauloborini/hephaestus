# Snapshot

## Purpose

Freeze a stable inventory of the sources and units that will go on to fragmentation.

## Inputs

- source inventory from `discover`;
- checkpoint `.hephaestus/manifests/run-state.json`.

## Rules

- do not reinterpret rules yet;
- do not assign the final operational role yet;
- record the relation between raw source and processable units;
- update `.hephaestus/manifests/run-state.json` to `currentPhase=snapshot`;
- apply the single checkpoint rule from `SKILL.md`: every write to `.hephaestus/manifests/run-state.json` updates `lastUpdatedAt`; on start, mark `snapshot` as `in_progress`; when the inventory is done, mark `snapshot` as `produced`; mark `snapshot` as `validated` when the map covers every relevant source found in `discover`; a phase that ran and cannot be validated marks `failed` (full re-run on resume, per `prompts/preflight.md`).

## Writes to the repository

No. The only writes are the checkpoint `.hephaestus/manifests/run-state.json` (ephemeral, gitignored) and the ledger `.hephaestus/manifests/snapshot.json` (ephemeral, gitignored).

## Outputs

- `.hephaestus/manifests/snapshot.json` — byte-for-byte freeze of sources: `files` (one entry per source: `path`, `sha256`, `size`) and `ignoredRegions` (declared ignored regions: `path`, `startOffset`, `endOffset`, `reason`) — consumed by the validator `checkCoverage` gate (INV5);
- map from each source to its processable units;
- indication of out-of-scope or empty sources;
- inventory of blocks declared out of synthesis, or an explicit confirmation that there are none;
- phase checkpoint update.
