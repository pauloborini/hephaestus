<!-- Language: **English** · [Português](COMMANDS.pt-BR.md) -->

# Hephaestus — command reference

Run commands from the repository root.

## Validate the distributable kit

```bash
node scripts/validate-skill-kit.mjs
```

Validates the kit manifest, naming policy, required files, supported file types, and forbidden references. Pass a path to validate another kit root:

```bash
node scripts/validate-skill-kit.mjs /path/to/hephaestus
```

Check that public English/Portuguese document pairs link each other:

```bash
node scripts/check-public-docs.mjs
```

## Run the test suite

```bash
node --test "scripts/__tests__/**/*.test.mjs"
```

Runs the kit's test harness with Node's native test runner (no dependencies). Fixtures and helpers live under `scripts/__tests__/` and are excluded from the distributable package (`manifests/kit-manifest.json:packExcludes`).

## Validate a generated package

```bash
node scripts/validate-package.mjs /path/to/generated-package
```

Checks the generated `AGENTS.md`, rule indexes, manifests, coverage map, and external-reference report. It exits non-zero on the first invalid contract.

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
