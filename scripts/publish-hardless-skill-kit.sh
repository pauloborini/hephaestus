#!/bin/zsh
set -euo pipefail

REPO_SLUG="${HARDLESS_SKILL_KIT_PUBLIC_REPO:-pauloborini/hardless-skill-kit}"
BRANCH="${HARDLESS_SKILL_KIT_PUBLIC_BRANCH:-main}"
SOURCE_DIR="${HARDLESS_SKILL_KIT_PUBLIC_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
TMP_DIR="${HARDLESS_SKILL_KIT_PUBLISH_TMP:-/tmp/hardless-skill-kit-publish}"
COMMIT_MESSAGE="${HARDLESS_SKILL_KIT_COMMIT_MESSAGE:-chore: publish hardless skill kit update}"

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

rsync -a --delete \
  --exclude '.git' \
  --exclude '.gitkeep' \
  --exclude '.gitignore' \
  --exclude '.DS_Store' \
  --exclude 'scripts/publish-hardless-skill-kit.sh' \
  --exclude '.app-work' \
  "${SOURCE_DIR}/" "${TMP_DIR}/"

node "${TMP_DIR}/scripts/validate-skill-kit.mjs" "${TMP_DIR}"

if [[ -z "$(git -C "${TMP_DIR}" status --short)" ]]; then
  echo "No public distribution changes to publish."
  exit 0
fi

git -C "${TMP_DIR}" add .
git -C "${TMP_DIR}" commit -m "${COMMIT_MESSAGE}"
git -C "${TMP_DIR}" push origin "${BRANCH}"

echo "Published ${REPO_SLUG} on branch ${BRANCH} from ${SOURCE_DIR}"
