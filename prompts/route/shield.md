# Route — Shield

> Carregar **somente** quando a cascata estiver no passo shield (precede o nível 1).

### Bloco `shield` (precede o nível 1)

Antes do nível 1, consultar o bloco `shield` do state. Fragmento cujo caminho de origem casa `path` (+ `selector` de seção, quando declarado) de uma entrada é marcado `regime: keep` com `decidedBy: state` — a blindagem declarada vence qualquer outro nível, e o conteúdo blindado nunca passa pela síntese. Ausência do bloco = lista vazia: nada é blindado e todo conteúdo é reabsorvido (D9).
