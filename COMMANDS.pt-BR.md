<!-- Idioma: [English](COMMANDS.md) · **Português** -->

# Hephaestus — referência de comandos

Execute os comandos na raiz do repositório. A suíte não viaja no zip de release (`manifests/kit-manifest.json:packExcludes`), então `node --test` só vale em um checkout do repositório do kit; os demais comandos funcionam também a partir de uma instalação descompactada.

## Validar o kit distribuível

```bash
node scripts/validate-skill-kit.mjs
```

Verifica `requiredFiles`, política de nomenclatura e legado, tipos de arquivo permitidos, alvos linkados pelos templates, os pares de documentação bilíngue e o catálogo de roteamento (destino fora dos quatro territórios reprova o kit). Sai 0 no passe integral, 1 na primeira checagem que falha. Para validar outra raiz:

```bash
node scripts/validate-skill-kit.mjs /caminho/para/hephaestus
```

Conferir os pares de documentos públicos em inglês/português (pares excluídos do zip de release são pulados):

```bash
node scripts/check-public-docs.mjs
```

## Rodar a suíte de testes

```bash
node --test "scripts/__tests__/**/*.test.mjs"
```

Roda o harness de teste do kit com o runner nativo do Node (sem dependências). Fixtures e helpers vivem em `scripts/__tests__/` e ficam de fora do pacote distribuível (`manifests/kit-manifest.json:packExcludes`). Passar o diretório (`node --test scripts/__tests__/`) faz o runner tratá-lo como módulo e falhar antes de coletar qualquer teste.

O golden do roteamento é capturado, não escrito à mão:

```bash
node scripts/__tests__/capture-golden-routing.mjs
```

Recapture só quando a mudança na cascata ou no catálogo for intencional, e revise o diff do golden como parte dessa mudança — recapturar para limpar teste vermelho apaga exatamente a regressão que o golden existe para pegar.

## Validar um pacote gerado

```bash
node scripts/validate-package.mjs /caminho/para/pacote-gerado
```

Roda os gates de pacote contra um repositório produzido pelo Hephaestus — cabeçalho e âncora dupla do `AGENTS.md`, ponte `CLAUDE.md`, alvos dos índices, run state, identidade DEC, território×regime, cobertura, keep bytes, resíduo e conferência de hash aplicado. Manifest ausente em `.hephaestus/` é reportado como pulado, não como falha: o pacote é julgado pelo que declara. `--help` lista todos os gates.

## Gerar o zip de release

```bash
node scripts/pack-release.mjs --dry-run
node scripts/pack-release.mjs
```

O primeiro comando lista as entradas que iriam para o arquivo sem escrever nada. O segundo escreve `hephaestus-<version>.zip` na raiz do repositório: toda entrada é prefixada com a pasta fixa `hephaestus/` (sem versão no nome da pasta, então descompactar por cima de uma instalação existente sobrescreve em vez de acumular), `LICENSE` é incluída, e a lista final de exclusão vem de `manifests/kit-manifest.json:packExcludes` — o mesmo dado consumido pelo publicador.

Versão = inteiro em `manifests/kit-manifest.json:version` (`DEC-003`). Runbook completo do mantenedor (tag, GitHub Release, upload do asset): [RELEASE.pt-BR.md](RELEASE.pt-BR.md) / [RELEASE.md](RELEASE.md).

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
