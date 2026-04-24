# Hardless Skill Kit Development

Esta pasta separa explicitamente duas coisas:

- `public/`
  - payload exato enviado ao repositório público de distribuição;
  - deve funcionar por clone ou `.zip`;
  - contém `README.md`, `SKILL.md`, prompts, templates, references, schemas, manifests e scripts do kit.

- `.specs/features/hardless-skill-kit/`
  - requisitos, design, tasks e decisões;
  - permanece apenas neste repositório de desenvolvimento;
  - não entra no payload público.

## Regra de manutenção

Se o arquivo precisa estar disponível para o usuário final, ele deve viver em:

```text
products/hardless-skill-kit/public/
```

Se o arquivo serve para desenvolvimento, iteração ou governança, ele não deve ir para `public/`.

## Fluxos principais

- validar payload público:
  - `make skill-kit-dist-validate`
- gerar staging e `.zip`:
  - `make skill-kit-distribute`
- publicar no repositório público:
  - `make publish-hardless-skill-kit`

## Repositório público

- `pauloborini/hardless-skill-kit`

O fluxo de publish deve empurrar apenas o conteúdo de `public/`, nunca a árvore inteira deste repositório.
