# Release v7 — 2026-09-11

## Metadados
- Versão: `7`
- Tag: `v7`
- Data: 2026-09-11
- Padrão de branches: gitflow
- Branch de release: `release/v7`
- SHA-base: `c4eb71199c38a25e17a91fd24b2346c8f25de9bf` (`develop` no corte)
- SHA final na `main`: `e7e67d45f56a796fbc687024e35a522aa5bcdd3a`
- Alvo da integração: `main`
- Artefato: `hephaestus-7.zip`
- GitHub Release: https://github.com/pauloborini/hephaestus/releases/tag/v7
- Status: Publicada

## O que há de novo

- **Inglês canônico (DEC-007):** o kit executa sempre a partir de `SKILL.md` e dos prompts de fase em inglês. Documentação em português existe só como par `*.pt-BR.md`. Em divergência de procedimento, o inglês vence. Não existe `SKILL.en.md`.
- **Par `SKILL.pt-BR.md`:** o procedimento em português deixa de ser o arquivo principal; o zip e os gates de docs exigem o par recíproco `Language:` / `Idioma:`.
- **Prompts de fase em inglês:** os 13 corpos em `prompts/` (incluindo `Target: staging|applied` em `validate.md`) passam a ser a fonte operacional, alinhada ao `SKILL.md`.
- **Ciclo de adoção (já em develop desde c4eb711):** `adopt` vs `maintain` por `meta.adoptionStatus`; respostas `this-run` em `run-answers.json`; retornos controlados da entrevista; `DECISION_PROTOCOL` autocontido no pacote gerado.

## Mensagens de loja

Não aplicável (kit zip / GitHub Release; sem lojas).

### en-US
- Title: Hephaestus v7
- What's new: English is now the canonical kit language (DEC-007). Portuguese docs remain as `*.pt-BR.md` pairs. Also ships the adoption lifecycle (`adoptionStatus`, interview loop, generated decision protocol).
- Description: Unpack `hephaestus-7.zip` into your skills folder. Resulting folder: `hephaestus/`.

### pt-BR
- Título: Hephaestus v7
- Novidades: Inglês é o idioma canônico do kit (DEC-007). O português continua no par `*.pt-BR.md`. Inclui o ciclo de adoção (`adoptionStatus`, loop de entrevista, protocolo de decisão gerado).
- Descrição: Descompacte `hephaestus-7.zip` na pasta de skills. Pasta resultante: `hephaestus/`.

## Prova de validação
- `node scripts/validate-skill-kit.mjs`: OK
- `node scripts/check-public-docs.mjs`: OK
- `node --test "scripts/__tests__/**/*.test.mjs"`: 218 testes passando (0 falhas)
- `node scripts/pack-release.mjs --dry-run`: OK (entradas sob `hephaestus/`, inclui `SKILL.md` + `SKILL.pt-BR.md`, sem `SKILL.en.md`)
- `node scripts/pack-release.mjs`: OK (`hephaestus-7.zip`, 68 arquivos, 117308 bytes)
