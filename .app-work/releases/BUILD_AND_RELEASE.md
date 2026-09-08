# Build e release de Hephaestus

Procedimento canônico do repositório para o `/release-pipeline`. Mantenedor runbook.
Não viaja no zip do usuário (`packExcludes`). Contrato de produto: `DEC-003` em `_app-vault/docs/decisions/estrutura-do-kit.md`.

## Contrato entre repositórios

| Repositório | Responsabilidade | Não faz |
| --- | --- | --- |
| `hephaestus` | Código da skill, prompts, schemas, templates, catálogo, gates, empacotamento e GitHub Release | Servir links externos de CDN ou publicar pacotes em registries de linguagem |

O identificador da release é `vN`; a versão canônica está em `manifests/kit-manifest.json` (`"version": "N"`).

## Padrão de branches

| Campo | Valor |
| --- | --- |
| Padrão | gitflow |
| Branch de integração de features | `develop` |
| Fonte de `release/*` | `develop` |
| Alvo da integração da release | `main` |
| Sincronização final | `main → develop` |
| Estratégia de merge | `--no-ff` (preserva histórico de PR) |
| Tag | Anotada `vN` (no SHA final da `main`) |
| Branches efêmeras | Apagar pós-sync |

### Conflito entre branches de release

Antes do corte, verificar `git branch -r | grep release/`. Se houver `release/*` remota, bloquear o novo corte. Hotfix escapa desta regra.
Tag pré-integração é proibida: a tag deve ser criada exclusivamente sobre o commit final integrado na `main`.

## Bump

- Fonte canônica única: `manifests/kit-manifest.json` → campo `"version": "N"`.
- Regra de incremento: sempre inteiros sequenciais `N+1` (`v1`, `v2`, `v3`, `v4`, `v5`, ...).
- Tag: `vN` (anotada).
- Artefato gerado: `hephaestus-N.zip`.

## Matriz de alvos

| Plataforma/canal | Comando ou mecanismo | Destino | Visibilidade | Evidência esperada |
| --- | --- | --- | --- | --- |
| Kit distribuível (.zip) | `node scripts/pack-release.mjs` | Raiz (`hephaestus-N.zip`) | Público (GitHub Release) | Arquivo `hephaestus-N.zip` gerado com raiz fixa `hephaestus/` e gates exit 0 |
| GitHub Release | `gh release create "vN" "hephaestus-N.zip" --title "Hephaestus vN" --notes "..."` | GitHub Releases (`pauloborini/hephaestus`) | Público | Release criada com tag `vN` e asset `hephaestus-N.zip` listado |
| Sincronização da árvore pública (opcional) | `zsh scripts/publish-hephaestus.sh` | Remote `main` | Público | Árvore limpa sem artefatos de desenvolvimento |

## Gates obrigatórios

Executados na raiz do repositório antes da geração do zip final e da publicação:

```bash
node scripts/validate-skill-kit.mjs
node scripts/check-public-docs.mjs
node --test "scripts/__tests__/**/*.test.mjs"
node scripts/pack-release.mjs --dry-run
```

Critério: todos devem terminar com exit 0.

## Backups e preservação (gate)

Não aplicável: repositório sem infraestrutura remota de banco, flags dinâmicas ou Remote Config.

## Recibo da release (gate)

`.app-work/releases/RELEASE_v<N>.md` — criado no commit de preparação, com metadados, changelog e histórico.
Ausência do recibo bloqueia a tag e a GitHub Release.

## Prova final

1. Commit final integrado em `main`.
2. Tag anotada `vN` criada no commit final da `main` e enviada ao remoto.
3. GitHub Release `vN` criada com asset `hephaestus-N.zip`.
4. Verificação com `gh release view "vN" --json assets --jq '.assets[].name'` retornando `hephaestus-N.zip`.
