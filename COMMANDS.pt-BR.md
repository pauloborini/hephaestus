<!-- Idioma: [English](COMMANDS.md) · **Português** -->

# Hephaestus — referência de comandos

Execute os comandos na raiz do repositório.

## Validar o kit distribuível

```bash
node scripts/validate-skill-kit.mjs
```

Valida manifesto, política de nomenclatura, arquivos obrigatórios, extensões suportadas e referências proibidas. Para validar outra raiz:

```bash
node scripts/validate-skill-kit.mjs /caminho/para/hephaestus
```

Cheque se os pares de documentos públicos em inglês/português apontam um para o outro:

```bash
node scripts/check-public-docs.mjs
```

## Rodar a suíte de testes

```bash
node --test "scripts/__tests__/**/*.test.mjs"
```

Roda o harness de teste do kit com o runner nativo do Node (sem dependências). Fixtures e helpers vivem em `scripts/__tests__/` e ficam de fora do pacote distribuível (`manifests/kit-manifest.json:packExcludes`).

## Validar um pacote gerado

```bash
node scripts/validate-package.mjs /caminho/para/pacote-gerado
```

Verifica `AGENTS.md`, índices de regras, manifests, mapa de cobertura e relatório de referências externas. Sai com erro no primeiro contrato inválido.

## Publicar o kit público — apenas mantenedores

```bash
zsh scripts/publish-hephaestus.sh
```

Exige GitHub CLI autenticado. Sincroniza o repositório público configurado via diretório temporário, valida o kit de saída, cria commit e envia ao remoto. É mutável; não use para validação local.

| Variável | Default | Função |
|---|---|---|
| `HEPHAESTUS_PUBLIC_REPO` | `pauloborini/hephaestus` | Repositório GitHub alvo |
| `HEPHAESTUS_PUBLIC_BRANCH` | `main` | Branch alvo |
| `HEPHAESTUS_PUBLIC_DIR` | raiz do repositório | Diretório-fonte |
| `HEPHAESTUS_PUBLISH_TMP` | `/tmp/hephaestus-publish` | Clone temporário |
| `HEPHAESTUS_COMMIT_MESSAGE` | padrão de publicação | Mensagem de commit |
