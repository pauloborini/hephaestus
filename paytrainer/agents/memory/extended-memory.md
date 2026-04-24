# Extended Memory

Memória persistente e complementar do repositório.

Regras de uso:
- Este arquivo só deve ser aplicado quando `AGENTS.md` habilitar `use_extended_memory`
- Este arquivo complementa o comportamento do agente, mas não substitui `AGENTS.md`, `agents/index/*.md` nem `agents/rules/*.md`
- Este arquivo não deve virar log de tarefas, changelog, backlog ou documentação de feature
- Registrar apenas preferências duráveis, correções reincidentes e guardrails que mudem decisões futuras do agente

## Preferencias do Usuario

- Bloqueios de acesso por papel devem ser centralizados no `AuthService` e validados no splash e no pós-login, nunca apenas no router.
- Valores canônicos de enums devem ficar em UPPERCASE inclusive quando forem internos do app; exceções de lowercase só são aceitáveis para identificadores técnicos de terceiros, como `providerPaymentMethodId` da Celcoin.

## Correcoes Reincidentes

1. (adicione aqui apenas correcoes recorrentes com acao preventiva)
