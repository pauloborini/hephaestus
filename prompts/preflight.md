# Preflight

## Objetivo

Guardar o terreno antes de qualquer trabalho: exigir repositório git e worktree limpa, resolver o modo determinístico e o catálogo, congelar o baseline da transação e só então liberar as fases seguintes. É a fase 1 das 13 — nenhuma fase anterior a `apply` escreve em caminhos canônicos do repositório.

## Entradas

- workspace do usuário (raiz do repositório);
- `catalog/routing-defaults.json` e `catalog/drift-catalog.json` do kit (catálogo base);
- `.app-work/hephaestus-state.json`, quando existir: `meta.adoptionStatus`, bloco `routing` como overlay do catálogo, bloco `shield` e bloco `answers` são consumidos nas fases seguintes.

## Resolução de modo

- `.app-work/hephaestus-state.json` **ausente** ⇒ `mode: adopt`;
- state presente com `meta.adoptionStatus: validated` ⇒ `mode: maintain`;
- state presente sem `meta.adoptionStatus`, ou com `pending`/`applied` ⇒ `mode: adopt`: respostas salvas não provam adoção concluída;
- resolver por presença do state **e** por sua evidência explícita de adoção, nunca por heurística sobre estrutura presente: `_app-vault/`, `project-rules/` ou `AGENTS.md` gerado não são prova de execução anterior (D3);
- `adoptionStatus` desconhecido ou ausente em state legado é tratado conservadoramente como `pending`, sem migração silenciosa;
- gravar o `mode` resolvido no campo `mode` do `.hephaestus/manifests/run-state.json`, lido pela fase seguinte (`discover`).

## Gate

- repositório git válido: `git rev-parse --is-inside-work-tree` sai `0`;
- run novo exige worktree limpa nos dois modos, sem override. Retomada do mesmo `runId` admite somente deltas comprovados por `stateWrite` e pelos recibos transacionais já existentes; qualquer alteração não comprovada bloqueia, também sem override. Usar `git status --porcelain --untracked-files=all` para não esconder arquivos sob um diretório untracked. Desconsiderar apenas os artefatos efêmeros próprios sob `.hephaestus/`, nunca outros arquivos;
- na primeira entrada, registrar `stateWrite: { exists, sha256 }` com o estado observado do arquivo de respostas (`sha256: null` quando ausente); na retomada, comparar com o recibo anterior antes de qualquer merge. Não atualizar o recibo com bytes concorrentes para fazê-los parecer autorizados;
- `mode` resolvido;
- catálogo resolvido: base do pack + overlay do bloco `routing` do state, quando presente;
- baseline: congelar a revisão HEAD inicial no checkpoint de preflight; em `plan`, completar `.hephaestus/manifests/transaction-baseline.json` antes da composição, com todos os paths exatos de criação, sobrescrita, origem/destino de movimento e remoção. Cada entrada registra `path`, `exists` e `sha256` (`null` quando ausente), além de `runId` e `head` no ledger. Revalidar worktree/revisão antes dessa captura; paths existentes devem coincidir com o HEAD inicial ou a fonte congelada. Nunca refazer baseline para absorver delta concorrente. O state de respostas fica fora desse baseline;
- retomada: `run-state.json` de execução anterior interrompida é marcado `status: interrupted` (e `lastUpdatedAt` atualizado) antes de qualquer leitura subsequente ou continuação; reler o arquivo após a marcação; retomar da última fase `validated`, reexecutando integralmente a fase em `in_progress`, `produced` ou `failed` (fase `in_progress` nunca é tratada como concluída após interrupção); se `revalidation` indicar retorno, iniciar na fase `requiredFrom` e invalidar toda fase downstream; quando o impedimento exigir intervenção humana, marcar o run como `blocked` e parar até decisão explícita — o run `blocked` não é retomado sozinho, e a fase que originou o bloqueio é reexecutada integralmente na próxima retomada autorizada.

## Bloqueia se

- fora de repositório git — recusa nomeando a condição;
- worktree com delta não comprovado do mesmo run — recusa listando os arquivos pendentes, sem mutar nada; respostas salvas por si só não autorizam ignorar outros deltas;
- state com campo que o schema não conhece: ignorar o campo e reperguntar o necessário, sem migração (D4);
- baseline inconsistente ou com hash divergente em retomada: bloquear antes de escrever no alvo. Ausência é normal antes de `plan`, mas bloqueia `apply`. Na retomada após escrita parcial, conferir os recibos e recuperar o delta próprio antes de recompor; nunca executar o `apply` inteiro sobre uma transação parcialmente aplicada.

## Escreve no repositório

Não em caminhos canônicos. São gravados apenas o checkpoint `.hephaestus/manifests/run-state.json` e o baseline efêmero `.hephaestus/manifests/transaction-baseline.json` (ambos gitignored).

## Saídas

- `mode` resolvido (`adopt`/`maintain`) no run-state;
- catálogo resolvido (base + overlay);
- `stateWrite`, revisão HEAD inicial em `phaseStates.preflight.notes` e vínculo ao baseline transacional a completar em `plan`, excluindo `.app-work/hephaestus-state.json`;
- `.hephaestus/manifests/run-state.json` com `currentPhase=preflight`; ao concluir, `phaseStates.preflight.status=validated` e a regra única de checkpoint do `SKILL.md` aplicada (toda gravação atualiza `lastUpdatedAt`).
