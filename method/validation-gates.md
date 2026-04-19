# Validation Gates

## Objetivo

Definir guardrails transversais do alpha do Hardless MCP.

## Gates Universais

### Escrita

- nao iniciar escrita sem classificacao valida;
- nao iniciar escrita se a tarefa estiver `blocked`;
- nao esconder quando um fallback padrao do Hardless estiver sendo usado.

### Remocao

- nao inferir remocao implicita sem pedido ou aprovacao correspondente;
- explicitar impacto colateral quando a remocao for parte do pedido.

### Validacao

- nao concluir sem validacao declarada;
- priorizar checagem deterministica quando existir;
- se nao houver validacao deterministica, registrar claramente que a conclusao dependeu de criterio heuristico.

### Contexto

- se o contexto estiver incompleto, stale ou contraditorio, registrar isso em vez de fingir certeza;
- nao expandir leitura de referencia sem gatilho.

## Checklist por Tipo

O alpha deve suportar checklists por tipo de tarefa, mas eles devem morar em artefatos curados do workspace, nao no metodo fixo do produto.

O metodo fixo so define a existencia do mecanismo.

## Intencao de Produto

O Hardless nao quer apenas orientar; quer impedir que o runtime conclua ciclos mal formados.
