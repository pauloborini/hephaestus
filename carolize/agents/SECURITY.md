# Segurança & Compliance

## Visão Geral

Este documento descreve as políticas e práticas de segurança implementadas no Carolize para proteger dados de usuários e garantir conformidade com regulamentações.

## Autenticação & Autorização

### Provedores de Identidade

- **Firebase Auth**: Gerenciamento central de usuários
- **Google Sign-In**: Login via conta Google (único método atual)

### Fluxo de Autenticação

```
User → Google Sign-In → Firebase Auth → JWT Token → App
                            ↓
                     Firestore (user doc)
```

### Tokens & Sessões

- **JWT**: Emitido pelo Firebase Auth
- **Refresh**: Automático via Firebase SDK
- **Expiração**: 1 hora (configurável no Firebase)
- **Armazenamento**: `flutter_secure_storage` (Keychain/Keystore)

### Níveis de Acesso

| Role | Descrição | Acesso |
|------|-----------|--------|
| **Sem assinatura** | Usuário básico | Apenas telas de assinatura |
| **PF** | Pessoa Física | Todas funcionalidades básicas |
| **PJ** | Pessoa Jurídica | Funcionalidades avançadas |

## Segredos & Dados Sensíveis

### Armazenamento Local

| Tipo de Dado | Storage | Criptografia |
|--------------|---------|--------------|
| Tokens de autenticação | `flutter_secure_storage` | Keychain/Keystore nativo |
| Cache de dados | Hive | AES-256 com chave do Keychain |
| Preferências | SharedPreferences | Não (dados não sensíveis) |

### Gerenciamento de Chaves

```dart
// SecurityHelper
class SecurityHelper {
  static Future<List<int>> getEncryptionKey() async {
    // 1. Tenta ler do flutter_secure_storage
    // 2. Se não existe, gera chave com Hive.generateSecureKey()
    // 3. Armazena no Keychain/Keystore
  }
}
```

### Variáveis de Ambiente

**NUNCA commitar:**
- Chaves de API (Stripe, Google)
- Credenciais de Firebase
- Tokens de acesso

**Arquivo `.env.example`:**
```bash
# Copiar para .env e preencher valores
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Regras Obrigatórias para Client-side Flutter

- **Nunca hardcode segredos** em Dart, Gradle, Xcode, `google-services.json`, `Info.plist`, assets, scripts ou arquivos versionados.
- **Client secret, private key, webhook secret e credencial administrativa nunca pertencem ao app.** Se algo for necessário para operação, mover para backend/Cloud Functions.
- **Dados sensíveis locais** só podem ficar em storage seguro (`flutter_secure_storage`, Keychain/Keystore) ou cache criptografado quando houver justificativa real de persistência.
- **`SharedPreferences`, storage em texto puro e logs não podem carregar tokens, session ids, PII sensível, chaves ou payloads confidenciais.**
- **Logs e telemetria devem ser mínimos e sanitizados.** Evitar `print`/`debugPrint` ad hoc; quando indispensável, não registrar payload completo, token, documento, email completo, segredo ou resposta crua de SDK.

## Segurança de Rede no App

### Regras Obrigatórias

- **HTTPS é obrigatório** em toda comunicação remota do app.
- **HTTP claro / cleartext traffic é proibido** salvo exceção rara, temporária e documentada com justificativa operacional.
- **Android** deve manter `android:usesCleartextTraffic="false"` ou política de network security equivalente.
- **iOS** deve manter ATS restritivo; não liberar `NSAllowsArbitraryLoads` sem justificativa documentada.
- O app **não** deve confiar em validação feita apenas no cliente; autorização, regras de negócio críticas e integridade de dados precisam de validação server-side.

### Controles Condicionais por Risco

Os itens abaixo **não são regra universal automática**. Eles devem ser avaliados principalmente para fluxos financeiros, autenticação forte, operações sensíveis ou APIs de alto risco:

- **SSL Pinning**
- **Detecção de root/jailbreak**
- **Bloqueio de emulador**
- **Prevenção de screenshots em telas sensíveis**

Se algum desses controles for proposto, o agente deve declarar explicitamente:

- dependências internas afetadas;
- dependências externas (certificados, provedores, MDM, stores, pipelines);
- impacto por plataforma/ambiente;
- bloqueios e limitações.

Sem isso, o controle **não** pode ser apresentado como solução “completa” ou “garantida”.

## Hardening de Build e Release

- Releases Flutter sensíveis devem considerar **ofuscação** com `--obfuscate` e `--split-debug-info` fora do repositório.
- No Android release, manter `minifyEnabled` e `shrinkResources` quando compatíveis com o app.
- Artefatos de debug, mapas de símbolos e arquivos auxiliares de release devem ficar fora do versionamento quando contiverem material sensível de diagnóstico.
- Hardening client-side **dificulta engenharia reversa**, mas **não** protege segredo que já foi embutido no binário. A regra correta continua sendo: não embutir segredo.

## Checklist Operacional para Reviews

### Sempre verificar

- [ ] Não há segredos, client secrets ou credenciais hardcoded
- [ ] Tokens e dados sensíveis usam storage seguro
- [ ] `SharedPreferences` não está sendo usado para material sensível
- [ ] Logs/telemetria não expõem PII, tokens ou payloads completos
- [ ] Mudanças de rede não liberaram HTTP inseguro nem relaxaram ATS/TLS sem justificativa
- [ ] A solução não depende de “segurança pelo cliente”; backend continua como fonte de verdade

### Verificar quando o escopo tocar mobile/release/rede

- [ ] Android preserva política contra cleartext traffic
- [ ] iOS preserva ATS restritivo
- [ ] Build de release preserva minificação/ofuscação esperada
- [ ] Controles extras como pinning, anti-root e anti-screenshot foram tratados como decisão por risco, com impacto e bloqueios explicitados

## Limites Importantes

- Segurança no client-side **reduz superfície de ataque**, mas **não garante** que “nada ruim aconteça”.
- O app pode ser inspecionado, automatizado, hookado ou executado em ambiente hostil; por isso, segredos e autorizações reais devem permanecer fora do cliente.
- Toda regra deste documento deve ser lida em conjunto com backend, Firestore Rules, Cloud Functions, provedores externos e controles operacionais de release.

## Segurança Firestore

### Regras de Segurança

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só acessam seus próprios dados
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // Clientes pertencem ao usuário
    match /clients/{clientId} {
      allow read, write: if request.auth != null 
                         && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

### Isolamento de Dados

- Cada usuário acessa apenas seus dados
- `ownerId` obrigatório em todas coleções
- Queries sempre filtram por usuário autenticado

## Segurança de Pagamentos

### Stripe Integration

- **Chave publicável**: Apenas no frontend (pk_live/pk_test)
- **Chave secreta**: Apenas no backend (Cloud Functions)
- **PaymentIntent**: Criado via Cloud Functions (nunca no app)
- **Webhooks**: Verificação de assinatura Stripe

### Fluxo Seguro

```
App → Cloud Function (cria PaymentIntent) → Stripe
                    ↓
        PaymentIntent client_secret
                    ↓
App → Stripe SDK (confirma pagamento) → Success
                    ↓
Stripe Webhook → Cloud Function → Atualiza Firestore
```

## Compliance

### LGPD (Lei Geral de Proteção de Dados)

| Requisito | Implementação |
|-----------|---------------|
| Consentimento | Aceite de termos no cadastro |
| Portabilidade | Export de dados (planejado) |
| Exclusão | Conta pode ser deletada |
| Minimização | Coletamos apenas dados necessários |

### Dados Coletados

| Dado | Necessidade | Retenção |
|------|-------------|----------|
| Email | Autenticação | Enquanto conta ativa |
| Nome | Identificação | Enquanto conta ativa |
| Foto | UX (opcional) | Enquanto conta ativa |
| Transações | Faturamento | 5 anos (fiscal) |

## Práticas de Desenvolvimento

### Checklist de Segurança

- [ ] Não logar dados sensíveis (tokens, senhas)
- [ ] Usar HTTPS em todas requisições
- [ ] Validar inputs no frontend E backend
- [ ] Não confiar em dados do cliente
- [ ] Manter dependências atualizadas

### Auditoria

- Firebase oferece logs de autenticação
- Cloud Functions logam execuções
- Stripe Dashboard para transações

## Resposta a Incidentes

1. **Detecção**: Monitorar logs do Firebase
2. **Contenção**: Revogar tokens se necessário
3. **Notificação**: Informar usuários afetados
4. **Correção**: Patch de segurança
5. **Post-mortem**: Documentar e prevenir recorrência

## Recursos Relacionados

- [architecture.md](ARCHITECTURE.md) - Arquitetura geral
- [Firestore Rules](../firestore.rules) - Regras de segurança

## Inconsistências Detectadas

- A chave publicável do Stripe está configurada diretamente no código e marcada com TODO
  para migração para variáveis de ambiente. Priorizar a remoção desse hardcode.
