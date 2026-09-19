#!/bin/zsh
set -euo pipefail

REPO_SLUG="${HEPHAESTUS_PUBLIC_REPO:-pauloborini/hephaestus}"
BRANCH="${HEPHAESTUS_PUBLIC_BRANCH:-main}"
SOURCE_DIR="${HEPHAESTUS_PUBLIC_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
TMP_DIR="${HEPHAESTUS_PUBLISH_TMP:-/tmp/hephaestus-publish}"
COMMIT_MESSAGE="${HEPHAESTUS_COMMIT_MESSAGE:-chore: publish hephaestus update}"

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Missing source dir: ${SOURCE_DIR}"
  exit 1
fi

if [[ ! -f "${SOURCE_DIR}/README.md" ]]; then
  echo "Missing public README.md in ${SOURCE_DIR}"
  exit 1
fi

gh auth status >/dev/null

if [[ -d "${TMP_DIR}/.git" ]]; then
  git -C "${TMP_DIR}" fetch origin "${BRANCH}"
  git -C "${TMP_DIR}" checkout "${BRANCH}"
  git -C "${TMP_DIR}" reset --hard "origin/${BRANCH}"
else
  rm -rf "${TMP_DIR}"
  gh repo clone "${REPO_SLUG}" "${TMP_DIR}"
fi

# Final rsync exclusion list: manifest `packExcludes` (single source of truth,
# VC4) + `.git` and the packager output artifact (`hephaestus-*.zip`),
# publisher-specific exclusions. No content exclusion lives
# literally here — two partial lists reproduce the leak that
# originated ISSUE-002.
PACK_EXCLUDES=("${(@f)$(node -e 'const fs=require("node:fs");const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write((m.packExcludes||[]).join("\n"));' "${SOURCE_DIR}/manifests/kit-manifest.json")}")
RSYNC_EXCLUDES=()
for entry in "${PACK_EXCLUDES[@]}" ".git" "hephaestus-*.zip"; do
  RSYNC_EXCLUDES+=("--exclude=${entry}")
done

rsync -a --delete "${RSYNC_EXCLUDES[@]}" "${SOURCE_DIR}/" "${TMP_DIR}/"

node "${SOURCE_DIR}/scripts/validate-skill-kit.mjs" "${TMP_DIR}"

if [[ -z "$(git -C "${TMP_DIR}" status --short)" ]]; then
  echo "No public distribution changes to publish."
  exit 0
fi

git -C "${TMP_DIR}" add .
git -C "${TMP_DIR}" commit -m "${COMMIT_MESSAGE}"
git -C "${TMP_DIR}" push origin "${BRANCH}"

echo "Published ${REPO_SLUG} on branch ${BRANCH} from ${SOURCE_DIR}"
