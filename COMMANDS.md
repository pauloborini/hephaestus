<!-- Language: **English** · [Português](COMMANDS.pt-BR.md) -->

# Hephaestus — command reference

Run commands from the repository root. The test suite itself does not travel in the release zip (`manifests/kit-manifest.json:packExcludes`), so `node --test` only applies to a checkout of the kit repository; the other commands work from an unpacked install too.

## Validate the distributable kit

```bash
node scripts/validate-skill-kit.mjs
```

Validates `requiredFiles`, naming and legacy policy, allowed file types, template link targets, the bilingual documentation pairs, and the routing catalog (a destination outside the four territories fails the kit). Exits 0 on a full pass, 1 on the first failing check. Pass a path to validate another kit root:

```bash
node scripts/validate-skill-kit.mjs /path/to/hephaestus
```

Check that public English/Portuguese document pairs link each other (pairs excluded from the release zip are skipped):

```bash
node scripts/check-public-docs.mjs
```

## Run the test suite

```bash
node --test "scripts/__tests__/**/*.test.mjs"
```

Runs the kit's test harness with Node's native test runner (no dependencies). Fixtures and helpers live under `scripts/__tests__/` and are excluded from the distributable package (`manifests/kit-manifest.json:packExcludes`). Passing the directory (`node --test scripts/__tests__/`) makes the runner treat it as a module and fail before collecting anything.

The routing golden is captured, not hand-written:

```bash
node scripts/__tests__/capture-golden-routing.mjs
```

Recapture only when a change to the cascade or the catalog is intentional, and review the golden diff as part of that change — recapturing to clear a red test erases the regression the golden exists to catch.

## Validate a generated package

```bash
node scripts/validate-package.mjs /path/to/generated-package
```

Runs the package gates against a repository that Hephaestus produced — `AGENTS.md` header and dual anchors, the `CLAUDE.md` bridge, index targets, run state, DEC identity, territory×regime, coverage, keep bytes, residue, and the applied-hash check. Manifests absent from `.hephaestus/` are reported as skipped rather than failing: a package is judged on what it declares. Use `--help` for the full gate list.

## Build the release zip

```bash
node scripts/pack-release.mjs --dry-run
node scripts/pack-release.mjs
```

The first command lists the entries that would go into the archive without writing anything. The second writes `hephaestus-<version>.zip` at the repository root: every entry is prefixed with the fixed folder `hephaestus/` (no version in the folder name, so unpacking over an existing install overwrites instead of accumulating), `LICENSE` is included, and the final exclusion list comes from `manifests/kit-manifest.json:packExcludes` — the same data the publisher consumes.

Version is the integer in `manifests/kit-manifest.json:version` (`DEC-003`). Full maintainer release runbook (tag, GitHub Release, asset upload): [RELEASE.md](RELEASE.md) / [RELEASE.pt-BR.md](RELEASE.pt-BR.md).

## Publish the public kit — maintainers only

```bash
zsh scripts/publish-hephaestus.sh
```

This command requires authenticated GitHub CLI access. It synchronizes the configured public repository through a temporary directory, validates the outgoing kit, commits, and pushes. It is intentionally mutating; do not run it for local validation.

Environment variables accepted by the publisher:

| Variable | Default | Purpose |
|---|---|---|
| `HEPHAESTUS_PUBLIC_REPO` | `pauloborini/hephaestus` | Target GitHub repository |
| `HEPHAESTUS_PUBLIC_BRANCH` | `main` | Target branch |
| `HEPHAESTUS_PUBLIC_DIR` | repository root | Source directory |
| `HEPHAESTUS_PUBLISH_TMP` | `/tmp/hephaestus-publish` | Temporary clone |
| `HEPHAESTUS_COMMIT_MESSAGE` | publish default | Commit message |
