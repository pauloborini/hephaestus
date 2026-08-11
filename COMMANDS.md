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

## Validate a generated package

```bash
node scripts/validate-package.mjs /path/to/generated-package
```

Checks the generated `AGENTS.md`, rule indexes, manifests, coverage map, and external-reference report. It exits non-zero on the first invalid contract.

## Publish the public kit — maintainers only

```bash
scripts/publish-hephaestus.sh
```

This command requires authenticated GitHub CLI access. It synchronizes the configured public repository through a temporary directory, validates the outgoing kit, commits, and pushes. It is intentionally mutating; do not run it for local validation.

Environment variables accepted by the publisher:

| Variable | Default | Purpose |
|---|---|---|
| `HARDLESS_SKILL_KIT_PUBLIC_REPO` | `pauloborini/hephaestus` | Target GitHub repository |
| `HARDLESS_SKILL_KIT_PUBLIC_BRANCH` | `main` | Target branch |
| `HARDLESS_SKILL_KIT_PUBLIC_DIR` | repository root | Source directory |
| `HARDLESS_SKILL_KIT_PUBLISH_TMP` | `/tmp/hephaestus-publish` | Temporary clone |
| `HARDLESS_SKILL_KIT_COMMIT_MESSAGE` | publish default | Commit message |
