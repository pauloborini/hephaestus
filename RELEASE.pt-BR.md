<!-- Idioma: [English](RELEASE.md) · **Português** -->

# Hephaestus — procedimento de release

Runbook do mantenedor. Não viaja no zip do usuário (`packExcludes`). Contrato de produto:
`DEC-003` em `_app-vault/docs/decisions/estrutura-do-kit.md`.

## O que o usuário recebe

1. GitHub Release `vN` no repositório público.
2. Asset `hephaestus-N.zip`.
3. Ao descompactar na pasta de skills: `skills/hephaestus/` (raiz fixa, sobrescreve).

O zip contém skill, prompts, schemas, templates, catalog, references, LICENSE e scripts de
validação necessários para `/hephaestus` funcionar sozinho. Não contém `_app-vault/`,
`.app-work/`, `COMMANDS*`, `RELEASE*`, testes nem o publicador.

## Fonte da versão

| Peça | Valor |
|---|---|
| Canônico | `manifests/kit-manifest.json` → `"version": "N"` |
| Tag | `vN` (anotada, no SHA da `main`) |
| Zip | `hephaestus-N.zip` (gerado por `scripts/pack-release.mjs`) |
| Próxima | sempre `N+1` |

## Pré-flight

- [ ] Worktree limpa.
- [ ] Branch `develop` (ou a de corte) contém o conteúdo a publicar.
- [ ] `gh auth status` OK.
- [ ] Versão em `kit-manifest.json` já é o `N` desta release (bump commitado).
- [ ] `main` receberá o SHA final antes da tag (merge/PR).

## Gates (obrigatórios)

Na raiz do repositório:

```bash
node scripts/validate-skill-kit.mjs
node scripts/check-public-docs.mjs
node --test "scripts/__tests__/**/*.test.mjs"
node scripts/pack-release.mjs --dry-run
```

Todos exit 0. Dry-run: toda entrada sob `hephaestus/`, com `hephaestus/LICENSE`, sem paths de
`packExcludes`.

## Empacotar

```bash
node scripts/pack-release.mjs
```

Espera: `hephaestus-N.zip` na raiz (já coberto por `*.zip` no `.gitignore`).
Não deixe o zip na árvore ao rodar `validate-skill-kit.mjs` — extensão `.zip` é rejeitada no kit.

Smoke local opcional:

```bash
mkdir -p /tmp/hephaestus-skills && unzip -o hephaestus-N.zip -d /tmp/hephaestus-skills
test -f /tmp/hephaestus-skills/hephaestus/SKILL.md
```

## Integrar na `main`

1. Abrir/atualizar PR `develop` → `main` (ou merge autorizado pela política do repo).
2. Confirmar que o SHA final da release está em `origin/main`.
3. Não taguear commit que ainda só existe em `develop`.

## Publicar GitHub Release

No SHA da `main`:

```bash
git tag -a "vN" -m "Hephaestus vN"
git push origin "vN"
gh release create "vN" "hephaestus-N.zip" \
  --title "Hephaestus vN" \
  --notes "Skill kit instalável: descompacte na pasta de skills. Pasta resultante: hephaestus/."
```

Prova:

```bash
gh release view "vN"
gh release view "vN" --json assets --jq '.assets[].name'
```

Espera: asset `hephaestus-N.zip`.

## Sincronizar árvore pública (opcional, separado do zip)

O zip é a entrega ao usuário final. Se a `main` remota também deve espelhar o kit sem
artefatos de desenvolvimento:

```bash
zsh scripts/publish-hephaestus.sh
```

Não substitui a GitHub Release; não anexa o zip. Exclusões vêm de `packExcludes` + `.git` +
`hephaestus-*.zip`.

## Pós-release

- [ ] URL da release anotada.
- [ ] Remover `hephaestus-N.zip` local se não for mais útil (`rm hephaestus-N.zip`).
- [ ] Próximo trabalho começa com bump para `N+1` no manifesto (só quando for cortar a próxima).

## Primeira release (v1)

- Versão manifesto: `"1"`.
- Tag: `v1`.
- Artefato: `hephaestus-1.zip`.
- Conteúdo: estado pós-trilha `HEPHAESTUS_V1` (pipeline 13 fases, zip-release, DEC-002/003).

## Segunda release (v2)

- Versão manifesto: `"2"`.
- Tag: `v2`.
- Artefato: `hephaestus-2.zip`.
- Conteúdo: DEC-004 (adopt materializa `DEC-NNN` canônico na mesma execução); DEC-002 espelho do archive (`.app-work/done/` removido; concluídos vão para `archive/`).
