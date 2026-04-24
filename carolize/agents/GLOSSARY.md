# Glossário & Conceitos de Domínio

## Termos Principais

### Entidades de Negócio

| Termo | Definição |
|-------|-----------|
| **Agendamento** | Compromisso marcado com cliente, podendo ter serviço associado |
| **Cliente** | Pessoa física atendida pelo profissional |
| **Serviço** | Tipo de trabalho oferecido com nome, duração e preço |
| **Receita** | Entrada financeira (pagamento recebido) |
| **Despesa** | Saída financeira (gasto do negócio) |
| **Fatura/Recibo** | Documento PDF gerado para cliente |
| **Assinatura** | Plano pago (PF ou PJ) via Stripe |

### Tipos de Usuário

| Persona | Descrição | Plano |
|---------|-----------|-------|
| **PF (Pessoa Física)** | Autônomo sem CNPJ | R$ 14,90/mês |
| **PJ (Pessoa Jurídica)** | MEI ou empresa | R$ 24,90/mês |

### Termos Técnicos

| Termo | Definição |
|-------|-----------|
| **Store** | Controller GetX que gerencia estado da feature |
| **Entity** | Objeto de domínio imutável (Equatable) |
| **Model** | DTO para serialização/deserialização |
| **Datasource** | Fonte de dados (Firebase, local storage) |
| **Repository** | Abstração que une múltiplos datasources |

## Definições de Tipo

### Entidades Principais

```dart
// lib/features/appointment/domain/entities/
class AppointmentEntity extends Equatable {
  final String id;
  final String clientId;
  final String? serviceId;
  final DateTime dateTime;
  final Duration duration;
  final AppointmentStatus status;
  final double? price;
}

// lib/features/client/domain/entities/
class ClientEntity extends Equatable {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final DateTime createdAt;
}

// lib/features/profile/domain/entities/
class ProfileEntity extends Equatable {
  final String id;
  final String email;
  final String? displayName;
  final String? photoUrl;
  final SubscriptionStatus subscriptionStatus;
  final SubscriptionTier? tier;
}
```

### Enumerações

```dart
// Status de agendamento
enum AppointmentStatus {
  scheduled,   // Agendado
  confirmed,   // Confirmado
  completed,   // Concluído
  cancelled,   // Cancelado
  noShow       // Não compareceu
}

// Status de assinatura
enum SubscriptionStatus {
  none,        // Sem assinatura
  trial,       // Período de teste
  active,      // Ativa
  pastDue,     // Atrasada
  cancelled,   // Cancelada
  expired      // Expirada
}

// Tipo de plano
enum SubscriptionTier {
  pf,          // Pessoa Física
  pj           // Pessoa Jurídica
}
```

## Acrônimos & Abreviações

| Sigla | Significado |
|-------|-------------|
| **PF** | Pessoa Física |
| **PJ** | Pessoa Jurídica |
| **MEI** | Microempreendedor Individual |
| **KPI** | Key Performance Indicator (indicador chave) |
| **PREVC** | Plan → Review → Execute → Verify → Complete |
| **DI** | Dependency Injection |
| **DTO** | Data Transfer Object |

## Regras de Negócio

### Assinaturas

1. Usuário sem assinatura ativa não acessa funcionalidades premium
2. Trial de 7 dias disponível para novos usuários
3. Downgrade de PJ para PF mantém dados (sem funcionalidades extras)
4. Cancelamento mantém acesso até fim do período pago

### Agendamentos

1. Agendamento não pode ser no passado
2. Conflito de horário gera alerta (permite sobrepor)
3. Sincronização com Google Calendar é opcional
4. Cancelamento marca status, não deleta registro

### Faturamento

1. Recibo gerado apenas para agendamentos concluídos
2. PDF inclui dados do profissional e cliente
3. Compartilhamento via WhatsApp/Email disponível

### Financeiro

1. Receitas e despesas são por mês
2. Dashboard mostra período atual por padrão
3. Relatórios podem filtrar por período personalizado

## Domínios e Limites

```
┌─────────────────────────────────────────────────┐
│                   CAROLIZE                       │
├─────────────┬─────────────┬─────────────────────┤
│   AGENDA    │  FINANCEIRO │      FATURAMENTO    │
│             │             │                     │
│ Appointment │  Revenue    │  Invoicing          │
│ Calendar    │  Expense    │  (PDF Generation)   │
│ Client      │  Reports    │                     │
│ Service     │  Dashboard  │                     │
└─────────────┴─────────────┴─────────────────────┘
```

## Recursos Relacionados

- [project-overview.md](PROJECT-OVERVIEW.md) - Visão geral
- [architecture.md](ARCHITECTURE.md) - Arquitetura do sistema
