# Release v6 — 2026-09-09

## Metadados
- Versão: `6`
- Tag: `v6`
- Data: 2026-09-09
- Padrão de branches: gitflow
- Alvo da integração: `main`
- Artefato: `hephaestus-6.zip`
- GitHub Release: https://github.com/pauloborini/hephaestus/releases/tag/v6
- Status: Publicada

## O que há de novo

- **Empacotamento puro da skill:** Exclusão sistemática de pastas de desenvolvimento (`resources/`, `scripts/`, `.app-work/`, `_app-vault/`) e testes do pacote distribuível via manifesto (`packExcludes`). O artefato zip final é reduzido para ~107 KB e contém estritamente o kit funcional da skill.
- **Conformidade para instalação e hosts:** Normalização de caracteres e formatação (hífens padrão) para instalação limpa e sem atrito no Gemini App e outros ambientes suportados.
- **Comunicação clara e acessível:** Atualização da diretriz universal de comunicação no `AGENTS.md.template` e na referência canônica para linguagem direta, clara e explicativa em português simples, sem jargões excessivos e sem analogias.
- **Isolamento de testes e blindagem de resíduos:** Aprimoramento do harness de testes (`fs-utils.mjs`) para ignorar arquivos `.zip` durante a cópia temporária do kit, blindando a suíte de testes contra resíduos de build.

## Prova de validação
- `node scripts/validate-skill-kit.mjs`: OK
- `node scripts/check-public-docs.mjs`: OK
- `node --test "scripts/__tests__/**/*.test.mjs"`: 210 testes passando (0 falhas)
- `node scripts/pack-release.mjs --dry-run`: OK
- `node scripts/pack-release.mjs`: OK (`hephaestus-6.zip` gerado com 66 arquivos)
