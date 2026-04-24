# Carolize - Visão Geral do Projeto

## Introdução

**Carolize** é uma plataforma de gestão financeira e operacional para profissionais autônomos e microempreendedores. O sistema permite controle completo de agendamentos, clientes, receitas, despesas e faturamento, com integração nativa ao Google Calendar e processamento de pagamentos via Stripe.

## Público-Alvo

- **Pessoa Física (PF)**: Profissionais autônomos como cabeleireiros, personal trainers, consultores
- **Pessoa Jurídica (PJ)**: Microempreendedores MEI e pequenas empresas de serviços
- **Planos**: R$ 14,90/mês (PF) | R$ 24,90/mês (PJ)

## Stack Tecnológica

### Aplicação Mobile/Web (Flutter)
- **Linguagem**: Dart (SDK ^3.9.2)
- **Framework**: Flutter
- **Gerenciador de Estado**: GetX
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Auth + Google Sign-In

### Landing Page
- **Framework**: Next.js (TypeScript)
- **Estilização**: Tailwind CSS
- **Deploy**: Vercel

### Portal de Documentação
- **Framework**: Next.js (TypeScript)
- **Renderização**: Markdown (react-markdown)

### Backend/Infraestrutura
- **Cloud**: Firebase (Firestore, Auth, Cloud Functions)
- **Pagamentos**: Stripe
- **Calendário**: Google Calendar API (googleapis)

## Estrutura do Projeto

```
carolize/
├── lib/                    # Código Flutter principal
│   ├── core/               # Configurações, constantes, DI
│   ├── features/           # Módulos de funcionalidades
│   │   ├── appointment/    # Gestão de agendamentos
│   │   ├── calendar/       # Integração Google Calendar
│   │   ├── client/         # Cadastro de clientes
│   │   ├── dashboard/      # Painel principal com KPIs
│   │   ├── expense/        # Controle de despesas
│   │   ├── invoicing/      # Faturamento e recibos PDF
│   │   ├── login/          # Autenticação
│   │   ├── profile/        # Perfil do usuário
│   │   ├── reports/        # Relatórios financeiros
│   │   ├── revenue/        # Controle de receitas
│   │   ├── service/        # Cadastro de serviços
│   │   └── subscription/   # Gestão de assinaturas
│   └── shared/             # Componentes compartilhados
├── packages/               # Pacotes locais
│   ├── app_utils/          # Utilitários e helpers
│   ├── app_design/         # Design system
│   └── app_infrastructure/ # Serviços de infraestrutura
├── landing-page/           # Site institucional (Next.js)
└── docs/                   # Portal de documentação (Next.js)
```

## Principais Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Dashboard** | Painel com KPIs de receitas, despesas e saldo |
| **Agendamentos** | Criar, editar e gerenciar compromissos |
| **Google Calendar** | Sincronização bidirecional de eventos |
| **Clientes** | Cadastro completo com histórico |
| **Serviços** | Catálogo de serviços com preços |
| **Receitas** | Registro de entradas financeiras |
| **Despesas** | Controle de gastos |
| **Faturamento** | Geração de recibos em PDF |
| **Relatórios** | Análises financeiras e gráficos |

## Integrações Externas

- **Firebase Auth**: Autenticação com Google
- **Cloud Firestore**: Banco de dados NoSQL
- **Cloud Functions**: Backend serverless para Stripe
- **Stripe**: Processamento de pagamentos e assinaturas
- **Google Calendar API**: Sincronização de agenda

## Checklist de Início Rápido

1. Instalar dependências: `flutter pub get`
2. Configurar Firebase: Verificar `firebase_options.dart`
3. Executar app: `flutter run`
4. Landing page: `cd landing-page && npm run dev`
5. Verificar documentação: `cd docs/portal && npm run dev`

## Próximos Passos

- Consulte [architecture.md](ARCHITECTURE.md) para detalhes da arquitetura
- Veja o fluxo no `AGENTS.md` (seção de Planejamento) para o processo de trabalho
- Acesse [tooling.md](TOOLING.md) para configuração do ambiente
