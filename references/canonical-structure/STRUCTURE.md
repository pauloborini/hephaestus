# Canonical Structure Notes

## Objetivo

Descrever como interpretar a estrutura canônica sem amarrar o kit a um domínio específico.

## Leitura sugerida

- `AGENTS.md`
  - entrypoint humano e operacional do pacote gerado
- `project-rules/index/*`
  - roteadores por tipo de tarefa
- `project-rules/rules/*`
  - regras normativas e obrigatórias
- `project-rules/reference/*`
  - apoio, exemplos e contratos longos
- `project-rules/contracts/*`
  - contratos externos (ex.: OpenAPI), quando existirem — somente consulta
- `.hephaestus/manifests/*`
  - rastreabilidade, cobertura e validação do processo de geração

## Regra central

A estrutura existe para reduzir improviso e custo de contexto.
Ela não existe para maximizar o número de arquivos.

## Notas

- O pacote gerado é agnóstico de framework: a estrutura é fixa, o conteúdo (gates, checklists, comandos) é preenchido conforme o stack real do projeto.
- Não existe pasta de memória na estrutura canônica; preferências persistentes de agente pertencem ao sistema de memória do cliente.
