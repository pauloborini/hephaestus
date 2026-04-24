# RULES: UI

## Não negociável
- Proibido `.sp/.h/.w/.r` (ScreenUtil).
- Proibido `Colors.*` e `Color(0x...)`.
- Proibido string user-facing hardcoded.
- Em UI que passar de ~300 linhas, fragmentar a composição em novos arquivos; não concentrar tela grande com vários componentes privados no mesmo arquivo.

## Componentes padrão Paytrainer (antes de Material/Cupertino “cru”)

**Sempre** procurar primeiro no design system (`packages/paytrainer_design/`) e nos padrões do app; **não** introduzir widgets equivalentes do Flutter só por conveniência.

| Necessidade | Usar (exemplos) | Evitar na UI de produto |
|-------------|-----------------|-------------------------|
| Botão primário/secundário | `StandardButton`, `StandardGhostButton`, `StandardTextButton` | `ElevatedButton`, `TextButton` solto para ações principais |
| Ação só com ícone | `StandardIconButton` | `IconButton` |
| Confirmação / alerta | `AppDialog.showConfirmation`, `AppDialog.showCustom` | `showDialog` + `AlertDialog` |
| Bottom sheet | componentes padrão do app / design (ex. fluxos existentes com bottom sheet) | `showModalBottomSheet` com layout ad-hoc sem padrão |
| Cartão, campos, tags | `StandardCard`, `StandardFormField`, `StandardTag`, etc. | Duplicar o mesmo visual com `Container`/`Card` genérico |

Se não existir componente para um caso novo: alinhar com o time ou estender o design system; não deixar solução “one-off” com APIs cruas do Flutter sem justificativa.

## Design system
- Cores via `context.colors.*`.
- Tipografia via `context.textStyles.*`.
- Espaçamento via `context.spacing.*`.

## Responsividade
- Usar extensões do projeto: `16.font`, `24.icon`, `100.width`, `48.height`, `12.adaptive`.

## Responsabilidades
- View abre dialog/bottom sheet e compõe a tela.
- Feedback efêmero de overlay/snackbar/toast sai do canal da Store/AppStore; a View não deve duplicar esse papel nem ler `errorMessage` como estado de render.
- Store não abre overlay diretamente e não recebe `BuildContext`.
- Ao criar/expandir uma tela complexa, deixar o arquivo principal focado em orquestração; componentes visuais e seções devem ser extraídos para `presentation/components`.
- Em `StatefulWidget`, manter no topo apenas ciclo de vida, setup inicial, leitura de argumentos, inicialização e helpers diretamente ligados ao bootstrap da tela; handlers de interação do usuário devem ficar no final do arquivo, abaixo do `build`.

## Navegação
- Sempre via `AppNavigator`.
