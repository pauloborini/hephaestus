SHELL := /bin/zsh

SKILL_KIT_NAME := hardless-skill-kit
SKILL_KIT_PRODUCT_DIR := products/$(SKILL_KIT_NAME)
SKILL_KIT_PUBLIC_DIR := $(SKILL_KIT_PRODUCT_DIR)/public
SKILL_KIT_SOURCE_DIR := $(SKILL_KIT_PUBLIC_DIR)
SKILL_KIT_DIST_ROOT := .distribution
SKILL_KIT_STAGE_DIR := $(SKILL_KIT_DIST_ROOT)/$(SKILL_KIT_NAME)
SKILL_KIT_ZIP := $(SKILL_KIT_DIST_ROOT)/$(SKILL_KIT_NAME).zip
SKILL_KIT_REPO_DIR ?= /Volumes/Dados/projetos/$(SKILL_KIT_NAME)
HARDLESS_SKILL_KIT_PUBLIC_REPO ?= pauloborini/hardless-skill-kit
HARDLESS_SKILL_KIT_PUBLIC_BRANCH ?= main
HARDLESS_SKILL_KIT_PUBLISH_TMP ?= /tmp/hardless-skill-kit-publish

.PHONY: skill-kit-dist-clean skill-kit-dist-validate skill-kit-dist-stage skill-kit-dist-zip skill-kit-dist-sync skill-kit-distribute publish-hardless-skill-kit

skill-kit-dist-clean:
	rm -rf "$(SKILL_KIT_STAGE_DIR)" "$(SKILL_KIT_ZIP)"

skill-kit-dist-validate:
	@test -d "$(SKILL_KIT_SOURCE_DIR)" || { echo "Missing $(SKILL_KIT_SOURCE_DIR)"; exit 1; }
	@test -f "$(SKILL_KIT_SOURCE_DIR)/README.md" || { echo "Missing README.md"; exit 1; }
	@test -f "$(SKILL_KIT_SOURCE_DIR)/SKILL.md" || { echo "Missing SKILL.md"; exit 1; }
	@test -f "$(SKILL_KIT_SOURCE_DIR)/scripts/validate-skill-kit.mjs" || { echo "Missing scripts/validate-skill-kit.mjs"; exit 1; }
	@node "$(SKILL_KIT_SOURCE_DIR)/scripts/validate-skill-kit.mjs" "$(SKILL_KIT_SOURCE_DIR)"

skill-kit-dist-stage: skill-kit-dist-clean skill-kit-dist-validate
	@mkdir -p "$(SKILL_KIT_DIST_ROOT)"
	@rsync -a --delete --exclude '.gitkeep' "$(SKILL_KIT_SOURCE_DIR)/" "$(SKILL_KIT_STAGE_DIR)/"
	@echo "Staged $(SKILL_KIT_NAME) into $(SKILL_KIT_STAGE_DIR)"

skill-kit-dist-zip: skill-kit-dist-stage
	@cd "$(SKILL_KIT_DIST_ROOT)" && rm -f "$(SKILL_KIT_NAME).zip" && zip -rq "$(SKILL_KIT_NAME).zip" "$(SKILL_KIT_NAME)"
	@echo "Created $(SKILL_KIT_ZIP)"

skill-kit-dist-sync: skill-kit-dist-stage
	@test -d "$(SKILL_KIT_REPO_DIR)" || { echo "Missing local distribution repo at $(SKILL_KIT_REPO_DIR)"; exit 1; }
	@rsync -a --delete --exclude '.git' --exclude '.gitkeep' "$(SKILL_KIT_STAGE_DIR)/" "$(SKILL_KIT_REPO_DIR)/"
	@echo "Synced staged distribution into $(SKILL_KIT_REPO_DIR)"

skill-kit-distribute: skill-kit-dist-zip
	@echo "Distribution ready:"
	@echo "  public source: $(SKILL_KIT_SOURCE_DIR)"
	@echo "  stage:         $(SKILL_KIT_STAGE_DIR)"
	@echo "  zip:           $(SKILL_KIT_ZIP)"

publish-hardless-skill-kit: skill-kit-dist-stage
	@HARDLESS_SKILL_KIT_PUBLIC_REPO="$(HARDLESS_SKILL_KIT_PUBLIC_REPO)" \
	HARDLESS_SKILL_KIT_PUBLIC_BRANCH="$(HARDLESS_SKILL_KIT_PUBLIC_BRANCH)" \
	HARDLESS_SKILL_KIT_PUBLIC_DIR="$(abspath $(SKILL_KIT_PUBLIC_DIR))" \
	HARDLESS_SKILL_KIT_PUBLISH_TMP="$(HARDLESS_SKILL_KIT_PUBLISH_TMP)" \
	zsh scripts/publish-hardless-skill-kit.sh
