1. **Analise as Mudanças**:
   - Execute `git status` para identificar os arquivos modificados, adicionados
     ou excluídos.
   - Execute `git diff` para entender o contexto e a lógica das alterações.

2. **Verificação de Qualidade e Segurança**:
   - **Segurança**: Verifique se arquivos sensíveis (como `.env`, chaves de API,
     credenciais) não estão incluídos no commit. Consulte o `.gitignore` se
     necessário.
   - **Flutter/Dart**: Se estiver em um projeto Flutter ou Dart, execute
     `flutter analyze` para garantir a integridade do código. Se houver erros,
     interrompa e notifique o usuário, oferecendo-se para corrigir.

3. **Formule a Mensagem de Commit (Conventional Commits)**:
   - Crie uma mensagem sempre em Português, seguindo o padrão :
     `<tipo>(<escopo opcional>): <descrição curta>`.
   - **Tipos Comuns**:
     - `feat`: Nova funcionalidade.
     - `fix`: Correção de bug.
     - `docs`: Alterações apenas na documentação.
     - `style`: Formatação, pontos e vírgulas, etc (sem alteração de código de
       produção).
     - `refactor`: Refatoração de código (sem fix ou feat).
     - `perf`: Melhoria de performance.
     - `test`: Adição ou correção de testes.
     - `chore`: Tarefas de build, configurações, etc.
   - **Corpo da Mensagem**: Se necessário, adicione uma descrição mais detalhada
     explicando o "porquê" das mudanças.
   - **Breaking Changes**: Indique claramente se houver mudanças que quebram
     compatibilidade.

4. **Confirmação do Usuário**:
   - Proponha a mensagem de commit completa para o usuário.
   - Liste os arquivos que serão adicionados (`git add`).
   - Peça autorização expressa para executar o commit.

5. **Execução**:
   - Com a aprovação, execute:
     1. `git add <arquivos>` (geralmente `git add .`).
     2. `git commit -m "<mensagem>"` (se houver corpo, use múltiplos `-m` ou
        newlines).
   - Confirme o sucesso da operação exibindo o resultado do comando.

