# Release v5 — 2026-09-07

## Metadados
- Versão: `5`
- Tag: `v5`
- Data: 2026-09-07
- Padrão de branches: gitflow
- SHA final na `main`: `1d631f96ba837b941128564eb9a640b9a444a014`
- PR forge → develop: https://github.com/pauloborini/hephaestus/pull/9
- PR develop → main: https://github.com/pauloborini/hephaestus/pull/10
- Artefato: `hephaestus-5.zip`
- GitHub Release: https://github.com/pauloborini/hephaestus/releases/tag/v5
- Status: Publicado (confirmado)

## O que há de novo

- **Divulgação progressiva (Progressive Disclosure):** Divisão dos prompts de fases do pipeline e roteamento em submódulos focados (`prompts/route/detectors.md`, `prompts/route/shield.md`, `prompts/route/catalog.md`, `prompts/route/residual.md`), reduzindo a sobrecarga de tokens e o consumo de contexto no agente.
- **Matriz de anti-invenção (Anti-Invention Matrix):** Formalização dos gates de anti-invenção e regras estritas de regime por território (INV9: vault aceita apenas reconcile/keep; agents/project-rules apenas generate/keep; territory process com regime restrito).
- **Roteamento diferido de fragmentos:** Eliminação da presunção prematura de território/regime na fase de fragmentação, deferindo a classificação estrita para a fase de roteamento.
- **Validação de documentação bilíngue e empacotamento:** Refinamento dos gates de detecção de cabeçalhos bilíngues em documentações públicas e aprimoramento da validação de integridade do artefato zip de release.
- **Concorrência e isolamento nos testes:** Fixtures e rotinas de teste thread-safe para execução paralela confiável sem poluição de estado.
- **Padronização com /release-pipeline:** Adoção do procedimento canônico em `.app-work/releases/BUILD_AND_RELEASE.md` e recibos versionados em `.app-work/releases/`.

## Prova de validação
- `node scripts/validate-skill-kit.mjs`: OK
- `node scripts/check-public-docs.mjs`: OK
- `node --test "scripts/__tests__/**/*.test.mjs"`: 210 testes passando (0 falhas)
- `node scripts/pack-release.mjs --dry-run`: OK
