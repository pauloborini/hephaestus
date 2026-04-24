# RULES: SECURITY

## Segredos
- Nunca commitar `.env`, tokens, chaves ou credenciais.
- Nunca hardcode de segredo em Dart, `build.gradle`, `Info.plist`, `AndroidManifest.xml`, scripts, mocks ou documentação.
- `.env.example` usa apenas placeholders; valores reais devem existir somente nos `.env.*` locais/seguros do ambiente.
- Não expor segredos em prints, screenshots, snippets, issues, PRs ou exemplos de uso.

## Armazenamento local
- Token, refresh token, credencial, session id, segredo e dado sensível persistido devem usar armazenamento seguro (`flutter_secure_storage` ou equivalente seguro por plataforma).
- É proibido persistir dado sensível em `SharedPreferences`, storage web sem proteção adequada, arquivos locais em texto puro ou `sqflite` sem criptografia.
- Cache local deve armazenar apenas o mínimo necessário; se o dado não precisa persistir, não persistir.

## Rede e transporte
- Produção e staging devem usar apenas HTTPS; exceção de cleartext só pode existir para desenvolvimento local explicitamente isolado.
- Não adicionar `android:usesCleartextTraffic="true"` ou relaxar ATS do iOS sem justificativa técnica documentada e aprovação explícita.
- Cliente não deve desabilitar validação TLS/certificado, aceitar certificado inválido nem usar bypass de MITM.
- `SSL pinning` não é default obrigatório do projeto; avaliar e exigir apenas em fluxos de alto impacto financeiro, autenticação crítica ou quando houver suporte operacional para rotação de certificado sem indisponibilidade.

## Logs, observabilidade e PII
- `LogHelper` é o único ponto de entrada permitido para logs de app/infrastructure.
- É proibido criar helper paralelo de logging.
- `print`, `debugPrint` e `dart:developer log` são proibidos fora de exceções controladas em `assert`.
- Não logar payload sensível.
- Nunca logar auth headers, body de login, tokens, cookies, refresh token, documento, dados bancários ou perfil completo.
- Em debug local, logs sensíveis só são aceitáveis quando estritamente necessários para diagnóstico e devem ser mascarados sempre que possível.
- Em release, logs e telemetria devem omitir ou mascarar PII e segredos.
- Log temporário só pode existir via `LogHelper` e deve ter `TODO(paytrainer): remover log temporário ...` no ponto de uso.

## Ambiente de execução e captura
- Detecção de root, jailbreak, emulador e bloqueio de screenshot não são obrigatórios por padrão; aplicar somente em fluxos com requisito real de antifraude, compliance ou proteção de dados altamente sensíveis.
- Quando uma feature exigir proteção adicional, a decisão deve ser explícita no escopo e proporcional ao risco; não aplicar bloqueios globais sem necessidade.
- Telas com credenciais, dados financeiros sensíveis ou informações regulatórias devem avaliar proteção contra screenshot/recents preview.

## Build e release
- Build de release não pode depender de flags inseguras, endpoints de teste ou configurações de debug.
- Para apps/features com risco elevado de engenharia reversa, exigir ofuscação de release (`--obfuscate` + `--split-debug-info`) e redução de superfície nativa quando aplicável.
- Não versionar artefatos de debug, dumps, exports ou bases locais com dados reais.

## Dependências e superfície de ataque
- Evitar adicionar pacote de segurança apenas por checklist; toda dependência nova deve ter benefício claro, manutenção viável e aderência ao risco real.
- Bibliotecas que bypassam SSL, expõem inspeção insegura, armazenam segredo em texto puro ou ampliam superfície sensível devem ser rejeitadas.

## Artefatos e dados de teste
- Não adicionar dumps/exports com dados reais.
- Mocks apenas fictícios em `assets/mocks/`.

## Checklist de revisão
- Segredos fora do código e fora do Git.
- Dados sensíveis persistidos apenas em storage seguro.
- Cleartext/TLS relaxado ausente em produção.
- Logs/telemetria sem PII ou credenciais.
- Controles extras (pinning, root/jailbreak, screenshot block, obfuscation) avaliados por criticidade, não por hábito.
