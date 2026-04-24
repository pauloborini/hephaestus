# Extended Memory

## Correções reincidentes

1. **[2026-03-23] ParentDataWidgets devem respeitar o pai imediato** Evitar: usar `Expanded`/`Flexible` fora de `Row`/`Column`/`Flex`, ou envolver esses widgets com wrappers intermediários antes do pai flex. Fazer: manter `Expanded` e `Flexible` como filhos diretos de `Flex`; quando houver scroll ou wrapper visual, reorganizar a árvore em vez de forçar o widget.
2. **[2026-03-31] `Positioned` deve ficar diretamente sob `Stack`** Evitar: colocar `Positioned` ou `Positioned.fill` dentro de `Material`, `InkWell` ou outros wrappers. Fazer: manter `Positioned` como filho direto de `Stack` e mover `Material` ou conteúdo visual para dentro dele.
3. **[2026-04-08] Propostas devem declarar dependências e bloqueios externos** Evitar: propor feature, integração ou rollout como se estivesse completo sem explicitar contas, aprovações, consoles, stores, credenciais, deploys e pré-requisitos fora do repositório. Fazer: antes de recomendar a solução, listar dependências internas, dependências externas, impacto por plataforma e bloqueios para conclusão; se houver impeditivo externo, não apresentar como completo.
4. **[2026-04-09] `LogHelper` deve ser local e opt-in** Evitar: deixar logs de desenvolvimento ativos por padrão ou dependentes apenas de `kDebugMode`, permitindo execução fora da máquina local. Fazer: manter `LogHelper` desligado por padrão, exigir opt-in explícito via configuração local não versionada e nunca tratá-lo como canal válido para ambientes remotos, staging ou produção.

## Preferencias do Usuario

- Responder em PT-BR, de forma direta e técnica, seguindo o `AGENTS.md`.
- Quando houver mudança de código, rodar `flutter analyze` como validação obrigatória do fluxo.
- Quando pedir implementação via comentário ou referência válida, executar de forma objetiva já na primeira passada; se houver risco técnico real, avisar explicitamente em vez de simplificar silenciosamente.
- Preferir textos finais com acentuação correta em PT-BR, especialmente em conteúdo legal e mensagens voltadas ao usuário.
- Prefere receber guias reutilizáveis em `.md` quando isso ajudar a reaplicar padrões em outros projetos.
- Prefere evitar wrappers redundantes quando o componente padrão já resolve o caso diretamente.
- Prefere seguir o padrão centralizado de formatadores e validadores de `app_utils` nos formulários.
- Prefere alinhamentos de contrato com nomes de campos exatamente como estão no código e no backend, sem inferências.
- Prefere que sinais de domínio já persistidos no dado sejam expostos pela própria entidade ou camada adequada, evitando pós-processamento e inferência ad hoc na UI ou Store.
- Em pontos com possível troca futura de fonte de dados, prefere manter o acesso centralizado por getter/abstração na Store em vez de a UI ler a origem concreta diretamente.
- Prefere DTOs com `toUpdateJson()` removendo campos imutáveis ou não editáveis em operações de update.
- Prefere ajustes operacionais diretos sem quebrar configurações existentes, especialmente em `launch.json`, `Makefile`, CI e setup por plataforma.
- Prefere separar configurações sensíveis e operacionais por ambiente, com arquivos e fluxos dedicados de dev e prod.
- Em fluxos operacionais, prefere edição e criação contextuais sem perder a tela base; no mobile, usar bottom sheet quando fizer sentido; no desktop, usar dialog ou painel lateral conforme o padrão da experiência.
- Em formulários contextuais operacionais, prefere mostrar primeiro os campos essenciais e deixar campos opcionais para expansão explícita.
- Em ajustes de responsividade, prefere solução integrada ao fluxo da tela, evitando remendos visuais.
- Em grids responsivos de cards, prefere ocupação uniforme do espaço disponível, evitando cards excessivamente altos e buracos visuais na última linha.
- Prefere que diálogos de decisão crítica não assumam opção padrão: o usuário deve escolher explicitamente antes de confirmar.
- Prefere que evoluções de features respeitem o shell visual padrão já adotado e, quando o domínio for amplo, sejam segmentadas em microáreas operacionais em vez de uma tela única longa.
- Exige separação rigorosa de responsabilidades entre camadas e fluxos reativos; Stores não devem absorver responsabilidades paralelas que pertencem a Services, guards ou fluxos dedicados.
- Quando uma tela bloqueada depender de liberação assíncrona, prefere store dedicada com worker no ciclo de vida apropriado, evitando listeners de navegação espalhados na view.
