
1. **Identificar Arquivo**:
   - Verifique qual arquivo o usuário está editando no momento.

2. **Análise de Código**:
   - Identifique classes, métodos públicos e propriedades.
   - Entenda o propósito do código através do nome e contexto.

3. **Geração de Documentação**:
   - Utilize a _tool_ `replace_file_content` ou `multi_replace_file_content`
     para adicionar comentários `///` (Dartdoc) acima das definições.
   - **Classes**: Descreva a responsabilidade da classe.
   - **Métodos**: Descreva o que faz, parâmetros (`[param]`) e retorno.
   - **Propriedades**: Breve descrição.

4. **Estilo**:
   - Mantenha a documentação concisa e em Português do Brasil.
   - Use Markdown nos comentários se necessário (ex: para listas ou ênfase).

5. **Exemplo**:
   ```dart
   /// Representa um usuário no sistema.
   class User {
     final String id;
     
     User({required this.id});
   }
   ```