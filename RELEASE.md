<!-- Language: **English** · [Português](RELEASE.pt-BR.md) -->

# Hephaestus — release procedure

Maintainer runbook. Does not ship in the user zip (`packExcludes`). Product contract: `DEC-003`
in `_app-vault/docs/decisions/estrutura-do-kit.md`.

## What the user gets

1. GitHub Release `vN` on the public repository.
2. Asset `hephaestus-N.zip`.
3. After unpacking into the skills folder: `skills/hephaestus/` (fixed root, overwrites).

The zip contains the skill, prompts, schemas, templates, catalog, references, LICENSE, and the
validation scripts needed for `/hephaestus` to run standalone. It does not contain `_app-vault/`,
`.app-work/`, `COMMANDS*`, `RELEASE*`, tests, or the publisher.

## Version source

| Piece | Value |
|---|---|
| Canonical | `manifests/kit-manifest.json` → `"version": "N"` |
| Tag | `vN` (annotated, on the `main` SHA) |
| Zip | `hephaestus-N.zip` (from `scripts/pack-release.mjs`) |
| Next | always `N+1` |

## Preflight

- [ ] Clean worktree.
- [ ] `develop` (or cut branch) holds the content to publish.
- [ ] `gh auth status` OK.
- [ ] `kit-manifest.json` version is already this release's `N` (bump committed).
- [ ] `main` will hold the final SHA before the tag (merge/PR).

## Gates (required)

From the repository root:

```bash
node scripts/validate-skill-kit.mjs
node scripts/check-public-docs.mjs
node --test "scripts/__tests__/**/*.test.mjs"
node scripts/pack-release.mjs --dry-run
```

All must exit 0. Dry-run: every entry under `hephaestus/`, with `hephaestus/LICENSE`, and none of
the `packExcludes` paths.

## Pack

```bash
node scripts/pack-release.mjs
```

Expect: `hephaestus-N.zip` at the repo root (already covered by `*.zip` in `.gitignore`).
Do not leave the zip in the tree when running `validate-skill-kit.mjs` — `.zip` is a rejected kit extension.

Optional local smoke:

```bash
mkdir -p /tmp/hephaestus-skills && unzip -o hephaestus-N.zip -d /tmp/hephaestus-skills
test -f /tmp/hephaestus-skills/hephaestus/SKILL.md
```

## Integrate onto `main`

1. Open/update PR `develop` → `main` (or the merge allowed by repo policy).
2. Confirm the final release SHA is on `origin/main`.
3. Do not tag a commit that exists only on `develop`.

## Publish the GitHub Release

On the `main` SHA:

```bash
git tag -a "vN" -m "Hephaestus vN"
git push origin "vN"
gh release create "vN" "hephaestus-N.zip" \
  --title "Hephaestus vN" \
  --notes "Installable skill kit: unpack into your skills folder. Resulting folder: hephaestus/."
```

Proof:

```bash
gh release view "vN"
gh release view "vN" --json assets --jq '.assets[].name'
```

Expect: asset `hephaestus-N.zip`.

## Sync the public tree (optional, separate from the zip)

The zip is the end-user delivery. If the remote `main` tree should also mirror the kit without
development artifacts:

```bash
zsh scripts/publish-hephaestus.sh
```

This does not replace the GitHub Release and does not attach the zip. Excludes come from
`packExcludes` + `.git` + `hephaestus-*.zip`.

## Post-release

- [ ] Release URL recorded.
- [ ] Remove local `hephaestus-N.zip` if no longer needed (`rm hephaestus-N.zip`).
- [ ] Next work starts with a bump to `N+1` in the manifest (only when cutting the next release).

## First release (v1)

- Manifest version: `"1"`.
- Tag: `v1`.
- Artifact: `hephaestus-1.zip`.
- Content: post-`HEPHAESTUS_V1` trail state (13-phase pipeline, zip-release, DEC-002/003).

## Second release (v2)

- Manifest version: `"2"`.
- Tag: `v2`.
- Artifact: `hephaestus-2.zip`.
- Content: DEC-004 (adopt materializes canonical `DEC-NNN` in the same run); DEC-002 archive mirror (`.app-work/done/` removed; completed work moves to `archive/`).
