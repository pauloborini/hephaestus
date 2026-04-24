# RULES: COMPONENTS

## Estrutura
- Componentes de feature devem ficar em `presentation/components`.
- Em telas complexas, segmentar por contexto (`section_*`).

## Extração
- Item de lista deve ser componente em arquivo próprio.
- Evitar função privada longa para componente reutilizável.
- Passou de ~300 linhas em um arquivo de UI: extrair os componentes privados relevantes para arquivos próprios, sem manter a tela inchada em um único arquivo.
- Se o arquivo principal ultrapassar esse limite, não deixar formulários, cards, sections, overlays ou itens auxiliares como classes privadas locais.

## Organização
- Usar barrel file por contexto quando houver múltiplos componentes.
- Importar componentes por pacote/barrel, sem relativo profundo.
- Quando houver vários componentes relacionados da mesma tela/fluxo, criar subpasta por contexto e mover a composição auxiliar para lá.
- Em pages/widgets stateful, organizar os métodos por intenção: lifecycle/setup/bootstrap acima do `build`; ações disparadas por interação do usuário (`onTap`, `onPressed`, submit, edição, remoção, navegação acionada pela view) no final do arquivo.

## Regra de negócio
- Componentes visuais não decidem regra de negócio.
- Fluxos e side effects ficam em store/service.
