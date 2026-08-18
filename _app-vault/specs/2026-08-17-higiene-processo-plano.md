# Higiene de processo e schema completo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/hephaestus` (adopt e maintain) higieniza `.app-work/` no schema fechado da spec, sem skill auxiliar, com padrão novo virando candidato de pack — nunca overlay por projeto.

**Architecture:** O kit continua sem executor de prompts; contratos em `prompts/` + schemas + catálogo. Comportamento determinístico vive nos motores de teste (`scripts/__tests__/helpers/*`). Esta fatia estende `archive-mirror.mjs`, `routing-engine.mjs`, `maintain-engine.mjs` e cria `hygiene-engine.mjs`. Apply ganha `delete`/`condense` na transação. Evolução de schema só no repo do kit (versão N+1 → zip).

**Tech Stack:** Node nativo (`node --test "scripts/__tests__/**/*.test.mjs"`), JSON Schema draft 2020-12, prompts Markdown, catálogos JSON. Sem dependências npm.

**Spec:** `_app-vault/specs/higiene-processo-e-schema-completo.md`

## Global Constraints

- Repo de trabalho: `/Users/pauloborini/Documents/projetos/hephaestus` na branch atual; não mudar de branch sem pedido.
- Não editar `shared/` nem `~/.claude/skills/` nesta fatia (cópia vem do zip depois).
- Não restaurar `done/` como pasta canônica.
- Overlay do state não inventa pasta; alias de vault e `forbiddenPatterns` permanecem.
- Run no alvo nunca escreve `prompts/`, `catalog/` nem `SCHEMA.md` da instalação.
- Relatório/closeout distribuível não cita nome de produto real.
- `roadmap/` é versionado (`.app-work/roadmap/`), nunca `private/`.
- `docs/` é pasta viva canônica; pasta vazia não se cria.
- Commits só se o usuário pedir na sessão de execução; os steps de commit abaixo são o recorte do diff, não ordem obrigatória agora.
- Idioma de artefato do kit: PT-BR nos `*.md` públicos; `SKILL.en.md` / `README.md` / `COMMANDS.md` / `RELEASE.md` em inglês, paridade de contrato.

---

## File map

| Arquivo | Papel |
|---|---|
| `scripts/__tests__/helpers/archive-mirror.mjs` | Espelho datado DEC-002 |
| `scripts/__tests__/helpers/hygiene-engine.mjs` | Inventário interior, duplicata, pack F/STALE, path fora da lista |
| `scripts/__tests__/helpers/routing-engine.mjs` | Cascata: não keep cego em `.app-work/`; delete/condense/relocate |
| `scripts/__tests__/helpers/maintain-engine.mjs` | Discover maintain itens 8–12; `APP_WORK_CLOSED` |
| `catalog/routing-defaults.json` | Destinos de processo |
| `references/vault-schema/SCHEMA.md` | Lista fechada §2 |
| `templates/appwork/INDEX_TEMPLATE.md` | Mapa gerado |
| `_app-vault/docs/decisions/estrutura-do-kit.md` | DEC-002 alterada; DEC-005; DEC-006 |
| `schemas/fragment.schema.json`, `schemas/routing.schema.json` | enum `delete`, `condense` |
| `scripts/validate-package.mjs` | INV9 + `PLAN_OPERATIONS` |
| `prompts/{discover,route,plan,compose,apply,interview,closeout}.md` | Contrato do agente |
| `schemas/pack-candidates.schema.json` | Candidatos efêmeros |
| `manifests/kit-manifest.json` | `version` 4 no Task 7 |

---

### Task 1: Espelho datado (DEC-002)

**Files:**
- Modify: `scripts/__tests__/archive-mirror.test.mjs`
- Modify: `scripts/__tests__/helpers/archive-mirror.mjs` (substituir pelo contrato datado; referência de comportamento: cópia em `shared/skills/_shared/hephaestus/scripts/__tests__/helpers/archive-mirror.mjs` — copiar para este repo, não importar shared)
- Modify: `_app-vault/docs/decisions/estrutura-do-kit.md` (nota `_Alterado` em DEC-002)
- Modify: `prompts/route.md` (expansão datada; flat = relocate)
- Test: `scripts/__tests__/archive-mirror.test.mjs`

**Interfaces:**
- Consumes: nenhum
- Produces: `civilWeekOfMonth(dayOfMonth: number): 1|2|3|4|5`; `archiveGuideSegmentsFromDate(date: Date): { yearMonth: string, week: string }`; `isDatedArchiveGuidePath(sourcePath: string): boolean`; `isFlatLegacyArchiveGuidePath(sourcePath: string): boolean`; `isCanonicalArchiveGuidePath` ≡ datado; `resolveArchiveGuideDestination(sourcePath, options?: { repoRoot?: string, archiveDate?: Date }): string` terminando em `/`

- [ ] **Step 1: Reescrever o teste para o contrato datado (red)**

Substituir o corpo de `scripts/__tests__/archive-mirror.test.mjs` por:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  guidePackName,
  civilWeekOfMonth,
  isArchiveGuideCatalogRoot,
  isCanonicalArchiveGuidePath,
  isFlatLegacyArchiveGuidePath,
  isLegacyDonePath,
  resolveArchiveGuideDestination,
} from "./helpers/archive-mirror.mjs";

const D = new Date("2026-08-17T12:00:00");

test("DEC-002: semana civil", () => {
  assert.equal(civilWeekOfMonth(1), 1);
  assert.equal(civilWeekOfMonth(8), 2);
  assert.equal(civilWeekOfMonth(17), 3);
  assert.equal(civilWeekOfMonth(22), 4);
  assert.equal(civilWeekOfMonth(31), 5);
});

test("DEC-002: pack vai para archive/guides/<YYYY-MM>/semana-<N>/<PACK>/", () => {
  assert.equal(guidePackName("docs/guides/XPTO_GUIDE/GUIDE.md"), "XPTO_GUIDE");
  assert.equal(
    resolveArchiveGuideDestination("docs/guides/XPTO_GUIDE/GUIDE.md", { archiveDate: D }),
    ".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/",
  );
});

test("DEC-002: path datado é canônico; flat é legado", () => {
  assert.equal(
    isCanonicalArchiveGuidePath(".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(
    isFlatLegacyArchiveGuidePath(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(
    isCanonicalArchiveGuidePath(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"),
    false,
  );
});

test("DEC-002: done/ e flat migram para o datado", () => {
  assert.equal(isLegacyDonePath(".app-work/done/GUIDE.md"), true);
  assert.equal(
    resolveArchiveGuideDestination(".app-work/done/XPTO_GUIDE/GUIDE.md", { archiveDate: D }),
    ".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/",
  );
  assert.equal(
    resolveArchiveGuideDestination(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md", {
      archiveDate: D,
    }),
    ".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/",
  );
  assert.equal(isArchiveGuideCatalogRoot(".app-work/archive/guides/"), true);
});
```

- [ ] **Step 2: Rodar o teste e ver falha**

Run: `node --test scripts/__tests__/archive-mirror.test.mjs`

Expected: FAIL (`civilWeekOfMonth` undefined e/ou destino flat).

- [ ] **Step 3: Implementar `archive-mirror.mjs` datado**

Copiar a implementação de `shared/skills/_shared/hephaestus/scripts/__tests__/helpers/archive-mirror.mjs` para `scripts/__tests__/helpers/archive-mirror.mjs` deste repo (arquivo completo; não deixar o comentário “Sem segmentação temporal”).

Em `prompts/route.md`, no nível 3 (expansão de `.app-work/archive/guides/`) e nível 4, garantir:

- origem datada `archive/guides/<YYYY-MM>/semana-<N>/` → keep
- origem flat `archive/guides/<PACK>/` → relocate para datado
- origem `done/` → relocate para datado
- data = Plano F `Status: CONCLUÍDO` senão momento do roteamento

Em DEC-002, acrescentar nota `_Alterado 2026-08-17` descrevendo o path datado e a proibição de flat (texto da spec §4.3). O enunciado vigente da cláusula deve citar `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`.

- [ ] **Step 4: Rodar o teste**

Run: `node --test scripts/__tests__/archive-mirror.test.mjs`

Expected: PASS. Se `routing-cascade.test.mjs` quebrar por golden com path flat, Task 4 recaptura golden; nesta task só archive-mirror precisa verde. Se cascade falhar já, ajustar `resolveArchiveGuideDestination` calls no cascade para passar `{ archiveDate }` estável (ver `golden-routing-adopt.json` `_provenance.capturedAt`).

- [ ] **Step 5: Commit (se pedido)**

```bash
git add scripts/__tests__/helpers/archive-mirror.mjs scripts/__tests__/archive-mirror.test.mjs prompts/route.md _app-vault/docs/decisions/estrutura-do-kit.md
git commit -m "$(cat <<'EOF'
fix: espelho de guides usa archive datado por semana civil

EOF
)"
```

---

### Task 2: Lista fechada + catálogo (DEC-005)

**Files:**
- Modify: `references/vault-schema/SCHEMA.md` §2, §2.2 (Private, Archive, ciclos Guide/PRD + roadmap/docs/legados)
- Modify: `templates/appwork/INDEX_TEMPLATE.md`
- Modify: `catalog/routing-defaults.json`
- Modify: `scripts/__tests__/catalog-contract.test.mjs` (contagem)
- Modify: `scripts/__tests__/helpers/maintain-engine.mjs` (`APP_WORK_CLOSED`)
- Modify: `_app-vault/docs/decisions/estrutura-do-kit.md` (DEC-005 nova)
- Modify: `_app-vault/INDEX.md` (`updated`)
- Test: `scripts/__tests__/catalog-contract.test.mjs`

**Interfaces:**
- Consumes: destinos legais já em `isLegalDestination`
- Produces: `APP_WORK_CLOSED` inclui `INDEX.md`, `docs`, `roadmap` além do set atual; catálogo sem o pattern único `roadmap / research / ops…` → `private/`

- [ ] **Step 1: Teste de catálogo — roadmap não vai a private/**

Em `scripts/__tests__/catalog-contract.test.mjs`, depois dos testes existentes, acrescentar:

```js
test("DEC-005: roadmap vivo não destina private/", () => {
  const roadmap = catalog.entries.filter((e) => /roadmap/i.test(e.pattern));
  assert.ok(roadmap.length >= 1, "faltou entrada de roadmap");
  for (const entry of roadmap) {
    if (entry.destination === null) continue;
    assert.equal(
      entry.destination.startsWith(".app-work/private/"),
      false,
      entry.pattern,
    );
  }
  const vivo = catalog.entries.find((e) => e.destination === ".app-work/roadmap/");
  assert.ok(vivo, "faltou destination .app-work/roadmap/");
});

test("DEC-005: docs vivos e legados e references únicos", () => {
  assert.ok(catalog.entries.some((e) => e.destination === ".app-work/docs/"));
  assert.ok(catalog.entries.some((e) => e.destination === ".app-work/guides/legados/"));
  const privRefs = catalog.entries.find((e) => /private\/references/i.test(e.pattern));
  assert.ok(privRefs);
  assert.equal(privRefs.destination, ".app-work/references/");
});
```

Atualizar `AC-1.5.1` de `entries.length === 36` para **41** (36 − 1 pattern combinado + 6 entradas abaixo). Se o JSON real divergir, recontar com:

```bash
node -e "const c=JSON.parse(require('fs').readFileSync('catalog/routing-defaults.json','utf8')); console.log(c.entries.length, c.entries.filter(e=>e.destination===null).length)"
```

Nulls continuam **10** salvo prova em contrário — não inventar destino concreto nas 10 linhas procedimentais.

- [ ] **Step 2: Rodar e ver falha**

Run: `node --test scripts/__tests__/catalog-contract.test.mjs`

Expected: FAIL (length 36 e/ou sem `.app-work/roadmap/`).

- [ ] **Step 3: Mutar o catálogo**

Remover a entrada cujo `pattern` é `roadmap / research / ops de sessão / dossiê de feature`.

Inserir (confiança `alta`, `since`: `DEC-005`):

```json
{
  "pattern": "roadmap vivo (`ROADMAP.md`, `.app-work/roadmap/`, slices de product-roadmap)",
  "destination": ".app-work/roadmap/",
  "confidence": "alta",
  "since": "DEC-005",
  "reason": "fila de promoção versionada; nunca private/"
},
{
  "pattern": "research de sessão (notas de pesquisa, não roadmap)",
  "destination": ".app-work/private/research/",
  "confidence": "alta",
  "since": "DEC-005",
  "reason": "envelhece; gitignored"
},
{
  "pattern": "ops de sessão (runbook local, excluindo MANUAL_RELEASE)",
  "destination": ".app-work/private/ops/",
  "confidence": "alta",
  "since": "DEC-005",
  "reason": "ops local gitignored"
},
{
  "pattern": "docs de operação/produto vivos (não decisão, não spec técnica)",
  "destination": ".app-work/docs/",
  "confidence": "alta",
  "since": "DEC-005",
  "reason": "processo versionado vivo"
},
{
  "pattern": "guides monolíticos citados sem pack (Fonte legada, guides/legados)",
  "destination": ".app-work/guides/legados/",
  "confidence": "alta",
  "since": "DEC-005",
  "reason": "ainda há consumidor vivo"
},
{
  "pattern": "clones OSS em private/references/ (duplicata do território references)",
  "destination": ".app-work/references/",
  "confidence": "alta",
  "since": "DEC-005",
  "reason": "único lugar para clones; gitignored"
}
```

SCHEMA.md bloco `.app-work/` (substituir a árvore atual):

```text
.app-work/
  INDEX.md
  .gitignore
  guides/<NOME>_GUIDE/
  guides/legados/
  roadmap/                 # ROADMAP.md + slices/ — versionado
  brainstorming/<tema>/
  prd/
  docs/                    # vivos; omitir se vazio
  issues/
  references/              # gitignored — único lugar de clones OSS
  private/                 # auditorias/, ops/, research/, notes/ — gitignored
  archive/
    guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE/
    perguntas/<tema>/
    prds/
    roadmap/<MARCO>_<YYYY-MM>/
    docs/ backlogs/ plans/ sprints/ features/ design-prototipos/
    produto/ qa/ releases/ evidence/ issues/<YYYY>/
```

§2.2: Private **não** lista roadmap como casa. Archive depósito = nomes fixos acima, não “qualquer pasta”. Ciclo Guide = datado. Novo ciclo Roadmap: vivo em `roadmap/`, marco fechado → `archive/roadmap/<MARCO>_<YYYY-MM>/`. Docs vivos → `docs/`; aposentado → `archive/docs/`.

`INDEX_TEMPLATE.md` tabela Pastas canônicas: incluir `guides/legados/`, `roadmap/`, `docs/`; **não** `done/`; archive de guides datado; private sem a palavra roadmap.

`APP_WORK_CLOSED`:

```js
const APP_WORK_CLOSED = new Set([
  "INDEX.md", ".gitignore", "guides", "roadmap", "brainstorming", "prd",
  "docs", "references", "private", "issues", "archive",
]);
```

DEC-005 em `estrutura-do-kit.md`: enunciado = schema de processo da spec §4 (roadmap versionado, docs vivo, legados, depósito nominado, `done/` continua morto). `Afeta: [governanca-kit]`. Atualizar `updated` do `_app-vault/INDEX.md`.

- [ ] **Step 4: Testes**

Run: `node --test scripts/__tests__/catalog-contract.test.mjs`

Expected: PASS. Também `node --test scripts/__tests__/helpers/` não se aplica — rodar `node scripts/validate-skill-kit.mjs` expected exit 0.

- [ ] **Step 5: Commit (se pedido)**

```bash
git add catalog/routing-defaults.json references/vault-schema/SCHEMA.md templates/appwork/INDEX_TEMPLATE.md scripts/__tests__/catalog-contract.test.mjs scripts/__tests__/helpers/maintain-engine.mjs _app-vault/docs/decisions/estrutura-do-kit.md _app-vault/INDEX.md
git commit -m "$(cat <<'EOF'
feat: schema de .app-work com roadmap, docs e legados

EOF
)"
```

---

### Task 3: Regimes `delete` e `condense` (INV9)

**Files:**
- Modify: `schemas/fragment.schema.json` (`properties.regime.enum`)
- Modify: `schemas/routing.schema.json` (`properties.regime.enum`)
- Modify: `scripts/validate-package.mjs` (`TERRITORY_REGIME_RULES.process`, `PLAN_OPERATIONS`)
- Modify: `scripts/__tests__/fragment-contract.test.mjs` (enum esperado)
- Modify: `scripts/__tests__/territory-regime.test.mjs` (matriz legal)
- Modify: `scripts/__tests__/plan-contract.test.mjs` (operation delete aprovada)
- Modify: `prompts/plan.md`, `prompts/route.md` (INV9)
- Test: os três arquivos de teste acima

**Interfaces:**
- Consumes: enum único em `fragment.schema.json` (validador lê daqui)
- Produces: `regime ∈ {keep, generate, reconcile, relocate, delete, condense}`; `operation ∈ {create, amend, overwrite, move, keep, skip, delete, condense}`; process legal = `relocate|keep|delete|condense`

- [ ] **Step 1: Testes red**

Em `fragment-contract.test.mjs`, o `deepEqual` do enum vira:

```js
assert.deepEqual(fragmentSchema.properties.regime.enum, [
  "keep",
  "generate",
  "reconcile",
  "relocate",
  "delete",
  "condense",
]);
```

Em `territory-regime.test.mjs`, acrescentar ao array `legal`:

```js
["process", "delete"],
["process", "condense"],
```

e um teste isolado:

```js
test("INV9: process + delete passa; process + generate continua ilegal", () => {
  const pkg = mkdtemp("hep-tr-del-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [coverageEntry({ fragmentId: "d1", territory: "process", regime: "delete" })]);
  assert.equal(runValidator(pkg).status, 0, runValidator(pkg).stderr);
});
```

Em `plan-contract.test.mjs`:

```js
test("higiene: operation delete com origin passa; llm destrutivo sem approved falha", () => {
  const pkg = mkdtemp("hep-plan-del-");
  makeValidPackage(pkg);
  withPlan(pkg, [
    entry({
      artifactPath: ".app-work/guides/COPIA.md",
      territory: "process",
      regime: "delete",
      operation: "delete",
      decidedBy: "detector",
      destructive: true,
    }),
  ]);
  assert.equal(runValidator(pkg).status, 0);

  const pkg2 = mkdtemp("hep-plan-del-llm-");
  makeValidPackage(pkg2);
  withPlan(pkg2, [
    entry({
      artifactPath: ".app-work/guides/COPIA.md",
      territory: "process",
      regime: "delete",
      operation: "delete",
      decidedBy: "llm",
      destructive: true,
    }),
  ]);
  const r = runValidator(pkg2);
  assert.equal(r.status, 1);
  assert.ok(r.stderr.includes("INV7") || r.stderr.includes("llm"));
});
```

- [ ] **Step 2: Rodar red**

Run: `node --test scripts/__tests__/fragment-contract.test.mjs scripts/__tests__/territory-regime.test.mjs scripts/__tests__/plan-contract.test.mjs`

Expected: FAIL no deepEqual do enum e/ou operation not in enum.

- [ ] **Step 3: Implementar enums e gates**

`fragment.schema.json` e `routing.schema.json`: acrescentar `"delete"`, `"condense"` ao enum de `regime`.

`validate-package.mjs`:

```js
process: ["relocate", "keep", "delete", "condense"],
```

```js
const PLAN_OPERATIONS = new Set([
  "create", "amend", "overwrite", "move", "keep", "skip", "delete", "condense",
]);
```

`prompts/route.md` gate INV9: fragmento `.app-work/` **nunca** `generate`/`reconcile`; permitido `keep|relocate|delete|condense`.

`prompts/plan.md`: `operation` inclui `delete` e `condense`. `destructive: true` quando `delete` ou `condense` (além das condições já listadas).

Não alterar `TERRITORY_REGIME_RULES` de vault/agents/project-rules.

- [ ] **Step 4: Rodar green**

Run: `node --test scripts/__tests__/fragment-contract.test.mjs scripts/__tests__/territory-regime.test.mjs scripts/__tests__/plan-contract.test.mjs scripts/__tests__/enum-single-source.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit (se pedido)**

```bash
git add schemas/fragment.schema.json schemas/routing.schema.json scripts/validate-package.mjs scripts/__tests__/fragment-contract.test.mjs scripts/__tests__/territory-regime.test.mjs scripts/__tests__/plan-contract.test.mjs prompts/plan.md prompts/route.md
git commit -m "$(cat <<'EOF'
feat: regimes delete e condense no território process

EOF
)"
```

---

### Task 4: Motor de higiene + discover/route

**Files:**
- Create: `scripts/__tests__/helpers/hygiene-engine.mjs`
- Create: `scripts/__tests__/hygiene-engine.test.mjs`
- Modify: `scripts/__tests__/helpers/routing-engine.mjs` (`isCanonicalKeepPath`, detectores, `regimeFor`)
- Modify: `scripts/__tests__/helpers/maintain-engine.mjs` (`discoverMaintain` itens 8–12; plano mapeia regime→operation)
- Modify: `prompts/discover.md`
- Modify: `prompts/route.md` nível 4
- Test: `scripts/__tests__/hygiene-engine.test.mjs`, `scripts/__tests__/maintain-drift.test.mjs`

**Interfaces:**
- Consumes: `resolveArchiveGuideDestination` (Task 1); `APP_WORK_CLOSED` (Task 2)
- Produces: `inventoryProcessHygiene(root, options?: { archiveDate?: Date }): { relocate: Array<{from,to,reason}>, deletes: string[], unknown: string[], condensed: Array<{from,into}> }`; `fileSha256(absPath): string`; `isPackConcluded(packDir): boolean`; `isPackStale(packDir): boolean`

- [ ] **Step 1: Teste do motor (red)**

Criar `scripts/__tests__/hygiene-engine.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, writeFile } from "./helpers/fs-utils.mjs";
import {
  inventoryProcessHygiene,
  isPackConcluded,
} from "./helpers/hygiene-engine.mjs";

const D = new Date("2026-08-17T12:00:00");

test("pack CONCLUÍDO em guides/ reloca para archive datado", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(
    root,
    ".app-work/guides/FOO_GUIDE/plans/F-fechamento.md",
    "Status: CONCLUÍDO\n2026-08-17\n",
  );
  writeFile(root, ".app-work/guides/FOO_GUIDE/GUIDE.md", "# FOO\n");
  assert.equal(isPackConcluded(path.join(root, ".app-work/guides/FOO_GUIDE")), true);
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from.includes("FOO_GUIDE"));
  assert.ok(hit);
  assert.equal(hit.to, ".app-work/archive/guides/2026-08/semana-3/FOO_GUIDE/");
});

test("duplicata byte a byte vira delete da cópia", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/guides/A.md", "mesmo\n");
  writeFile(root, ".app-work/docs/A.md", "mesmo\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.ok(inv.deletes.includes(".app-work/docs/A.md") || inv.deletes.includes(".app-work/guides/A.md"));
  assert.equal(inv.deletes.length, 1);
});

test("private/references reloca para references/", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/private/references/clone/README.md", "# oss\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from.includes("private/references"));
  assert.ok(hit);
  assert.ok(hit.to.startsWith(".app-work/references/"));
});

test("pasta fora da lista fechada é unknown (pack-candidate)", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/foo-novo/x.md", "x\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.ok(inv.unknown.some((p) => p.startsWith(".app-work/foo-novo")));
});

test("PRONTO PARA AUDITORIA não é CONCLUÍDO", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(
    root,
    ".app-work/guides/BAR_GUIDE/GUIDE.md",
    "Status: PRONTO PARA AUDITORIA COM PENDÊNCIAS\n",
  );
  writeFile(root, ".app-work/guides/BAR_GUIDE/plans/F-fechamento.md", "Status: PENDENTE\n");
  assert.equal(isPackConcluded(path.join(root, ".app-work/guides/BAR_GUIDE")), false);
});
```

- [ ] **Step 2: Red**

Run: `node --test scripts/__tests__/hygiene-engine.test.mjs`

Expected: FAIL (módulo ausente).

- [ ] **Step 3: Implementar `hygiene-engine.mjs`**

Contrato mínimo (implementar completo no arquivo):

```js
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { resolveArchiveGuideDestination, guidePackName } from "./archive-mirror.mjs";

export const APP_WORK_LIVE_DIRS = new Set([
  "guides", "roadmap", "brainstorming", "prd", "docs",
  "issues", "references", "private", "archive",
]);

export const fileSha256 = (abs) =>
  createHash("sha256").update(fs.readFileSync(abs)).digest("hex");

export const isPackConcluded = (packDir) => {
  const f = path.join(packDir, "plans", "F-fechamento.md");
  if (fs.existsSync(f) && /status:\s*conclu[ií]do/i.test(fs.readFileSync(f, "utf8"))) {
    return true;
  }
  const g = path.join(packDir, "GUIDE.md");
  if (fs.existsSync(g) && /status:\s*conclu[ií]do/i.test(fs.readFileSync(g, "utf8"))) {
    return true;
  }
  return false;
};

export const isPackStale = (packDir) => {
  const g = path.join(packDir, "GUIDE.md");
  const r = path.join(packDir, "README.md");
  const text = [g, r].filter(fs.existsSync).map((p) => fs.readFileSync(p, "utf8")).join("\n");
  return /\bSTALE\b/i.test(text);
};

const walkFiles = (absDir, relBase, acc) => {
  if (!fs.existsSync(absDir)) return;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const rel = `${relBase}/${ent.name}`.replace(/\\/g, "/");
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, rel, acc);
    else acc.push(rel);
  }
};

export const inventoryProcessHygiene = (root, options = {}) => {
  const archiveDate = options.archiveDate ?? new Date();
  const relocate = [];
  const deletes = [];
  const unknown = [];
  const condensed = [];
  const app = path.join(root, ".app-work");
  if (!fs.existsSync(app)) {
    return { relocate, deletes, unknown, condensed };
  }

  for (const ent of fs.readdirSync(app, { withFileTypes: true })) {
    if (ent.name === "hephaestus-state.json" || ent.name === "INDEX.md" || ent.name === ".gitignore") {
      continue;
    }
    if (!APP_WORK_LIVE_DIRS.has(ent.name) && ent.name !== "done") {
      unknown.push(`.app-work/${ent.name}`);
    }
  }

  const doneDir = path.join(app, "done");
  if (fs.existsSync(doneDir)) {
    const files = [];
    walkFiles(doneDir, ".app-work/done", files);
    for (const from of files) {
      relocate.push({
        from,
        to: resolveArchiveGuideDestination(from, { repoRoot: root, archiveDate }),
        reason: "done-legacy",
      });
    }
  }

  const guidesDir = path.join(app, "guides");
  if (fs.existsSync(guidesDir)) {
    for (const ent of fs.readdirSync(guidesDir, { withFileTypes: true })) {
      if (ent.name === "README.md" || ent.name === "legados") continue;
      const packDir = path.join(guidesDir, ent.name);
      if (ent.isDirectory() && /_GUIDE$/i.test(ent.name)) {
        if (isPackConcluded(packDir) || isPackStale(packDir)) {
          const from = `.app-work/guides/${ent.name}/`;
          relocate.push({
            from,
            to: resolveArchiveGuideDestination(`${from}GUIDE.md`, { repoRoot: root, archiveDate }),
            reason: isPackStale(packDir) ? "stale" : "concluded",
          });
        }
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        relocate.push({
          from: `.app-work/guides/${ent.name}`,
          to: `.app-work/guides/legados/${ent.name}`,
          reason: "loose-guide",
        });
      }
    }
  }

  const privRefs = path.join(app, "private", "references");
  if (fs.existsSync(privRefs)) {
    const files = [];
    walkFiles(privRefs, ".app-work/private/references", files);
    for (const from of files) {
      relocate.push({
        from,
        to: from.replace(".app-work/private/references/", ".app-work/references/"),
        reason: "private-references",
      });
    }
  }

  const hashes = new Map();
  const all = [];
  walkFiles(app, ".app-work", all);
  for (const rel of all) {
    const abs = path.join(root, rel);
    if (!fs.statSync(abs).isFile()) continue;
    const h = fileSha256(abs);
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(rel);
  }
  for (const paths of hashes.values()) {
    if (paths.length < 2) continue;
    const canonical = paths.sort()[0];
    for (const extra of paths.slice(1)) deletes.push(extra);
    void canonical;
  }

  const archiveGuides = path.join(app, "archive", "guides");
  if (fs.existsSync(archiveGuides)) {
    for (const ent of fs.readdirSync(archiveGuides, { withFileTypes: true })) {
      if (ent.isDirectory() && !/^\d{4}-\d{2}$/.test(ent.name) && /_GUIDE$/i.test(ent.name)) {
        const from = `.app-work/archive/guides/${ent.name}/`;
        relocate.push({
          from,
          to: resolveArchiveGuideDestination(`${from}GUIDE.md`, { repoRoot: root, archiveDate }),
          reason: "flat-legacy",
        });
      }
    }
  }

  return { relocate, deletes, unknown, condensed };
};
```

Ajuste fino se o teste de duplicata for flaky na escolha de qual path deletar: o teste aceita qualquer um dos dois; manter `length === 1`.

`routing-engine.mjs`:

- `isCanonicalKeepPath`: `.app-work/` só keep se **não** for `done/`, **não** flat archive, **não** `private/references/`, **não** pack concluído/STALE em `guides/<PACK>/`. Importar `isFlatLegacyArchiveGuidePath` e funções de higiene conforme necessário (evitar ciclo: higiene pode receber `isPackConcluded` só).
- `regimeFor`: se o fragmento está em `deletes` do inventário → `delete`; se relocate de higiene → `relocate`; process default continua `relocate` quando destino ≠ origem.
- Nível 4: chamar detectores de higiene **antes** do keep canônico de `.app-work/`.

`maintain-engine.mjs` `discoverMaintain`: além do drift atual, concatenar `inventoryProcessHygiene(root)` em `processHygiene`. Plano:

```js
operation: entry.regime === "keep" ? "keep"
  : entry.regime === "relocate" ? "move"
  : entry.regime === "delete" ? "delete"
  : entry.regime === "condense" ? "condense"
  : "create",
destructive: entry.regime === "delete" || entry.regime === "condense" || entry.regime === "relocate",
```

`prompts/discover.md` — maintain, itens 8–12 da spec §7.1 (copiar a lista).

`prompts/route.md` nível 4 — bullets: pack F/STALE em guides; md solto; private/references; done/; flat archive; duplicata → delete; unknown → enfileira pergunta pack-candidate (não keep).

`maintain-drift.test.mjs`: o teste AC-6.1.2 assume todo não-drift `keep`. **Não quebrar**: a fixture `pacote-adopt` não deve ganhar pack concluído nem duplicata. Se o fixture tiver `.app-work/archive/guides/XPTO_GUIDE/` flat, a Task 1+4 fará relocate — atualizar AC-6.1.2 para permitir `relocate`/`delete` **somente** quando `destinationPath` começa com `.app-work/` **e** o inventário de higiene marcou o path; o resto (AGENTS, project-rules, vault) permanece keep.

- [ ] **Step 4: Green**

Run: `node --test scripts/__tests__/hygiene-engine.test.mjs scripts/__tests__/maintain-drift.test.mjs scripts/__tests__/routing-cascade.test.mjs`

Expected: PASS. Golden: se cascade falhar, recapturar com `node scripts/__tests__/capture-golden.mjs` (ou `capture-golden-routing.mjs` se for esse o nome no repo) **só depois** de conferir o diff do golden à mão.

- [ ] **Step 5: Commit (se pedido)**

```bash
git add scripts/__tests__/helpers/hygiene-engine.mjs scripts/__tests__/hygiene-engine.test.mjs scripts/__tests__/helpers/routing-engine.mjs scripts/__tests__/helpers/maintain-engine.mjs scripts/__tests__/maintain-drift.test.mjs prompts/discover.md prompts/route.md
git commit -m "$(cat <<'EOF'
feat: maintain inventaria e higieniza o interior de .app-work

EOF
)"
```

---

### Task 5: Pack-candidate (DEC-006) — sem overlay de pasta

**Files:**
- Create: `schemas/pack-candidates.schema.json`
- Modify: `prompts/interview.md`
- Modify: `prompts/closeout.md`
- Modify: `prompts/route.md` (fila: path fora de §4)
- Modify: `_app-vault/docs/decisions/estrutura-do-kit.md` (DEC-006)
- Modify: `manifests/kit-manifest.json` `requiredFiles` (incluir o schema novo)
- Create: `scripts/__tests__/pack-candidates.test.mjs`
- Test: esse arquivo + `scripts/validate-skill-kit.mjs`

**Interfaces:**
- Consumes: `inventoryProcessHygiene().unknown`; `questionKeyOf` / `routingQuestionContext`
- Produces: `.hephaestus/pack-candidates.json` shape `{ version: 1, entries: [{ pattern, destination, evidence, answeredAt }] }`; pergunta com `answer.includeInPack: boolean`

- [ ] **Step 1: Schema + teste red**

`schemas/pack-candidates.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Hephaestus Pack Candidates",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "entries"],
  "properties": {
    "version": { "type": "integer", "minimum": 1 },
    "entries": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["pattern", "destination", "evidence", "answeredAt"],
        "properties": {
          "pattern": { "type": "string", "minLength": 1 },
          "destination": { "type": "string", "minLength": 1 },
          "evidence": { "type": "string", "minLength": 1 },
          "answeredAt": { "type": "string", "minLength": 1 }
        }
      }
    }
  }
}
```

`scripts/__tests__/pack-candidates.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";
import { validate } from "./helpers/json-schema.mjs";

const schema = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "schemas", "pack-candidates.schema.json"), "utf8"),
);

test("pack-candidates válido", () => {
  const result = validate(schema, {
    version: 1,
    entries: [{
      pattern: ".app-work/design-x/",
      destination: ".app-work/archive/docs/",
      evidence: "pasta fora da lista fechada; usuario aceitou candidato",
      answeredAt: "2026-08-17T00:00:00.000Z",
    }],
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("interview.md pergunta includeInPack e proíbe overlay de pasta", () => {
  const md = fs.readFileSync(path.join(REPO_ROOT, "prompts", "interview.md"), "utf8");
  assert.match(md, /includeInPack/);
  assert.match(md, /pack-candidates\.json/);
  assert.match(md, /não edita/);
  const close = fs.readFileSync(path.join(REPO_ROOT, "prompts", "closeout.md"), "utf8");
  assert.match(close, /Candidatos a pack/);
});
```

- [ ] **Step 2: Red**

Run: `node --test scripts/__tests__/pack-candidates.test.mjs`

Expected: FAIL (schema ou texto do prompt).

- [ ] **Step 3: Prompts**

`interview.md` — acrescentar eixo **padrão novo de processo**:

Texto obrigatório da pergunta:

> Você criou um padrão novo (`<path ou tipo>`). Gostaria de incluir isso dentro do pack da skill para ficar padronizado em todos os projetos?

`answer.includeInPack` boolean.

- Sim: aplicar destino proposto neste run; gravar entrada em `.hephaestus/pack-candidates.json` (efêmero). **Não** gravar pasta nova em `routing.overlay`. **Não** editar a skill instalada. `scope` da resposta de destino pontual pode ser `this-run` ou `this-project` só para **este path**, nunca como default de pasta.
- Não: mapear para pasta de SCHEMA §2; último recurso `.app-work/archive/docs/`.
- Sem resposta: run `blocked` / closeout `needs-followup`.

`promote-to-catalog` permanece só para **linha de catálogo de tipo já previsto** (ex. glob de ferramenta em `drift-catalog`), não para pasta fora da lista.

`closeout.md` seção 5 vira `## Candidatos a pack` (pack-candidates) + manter menção a promoção de drift-catalog se ainda existir. Sem omitir seção vazia (`nenhuma`).

DEC-006: padrão novo → pack-candidate + pergunta; overlay não evolui schema.

`kit-manifest.json` `requiredFiles`: `"schemas/pack-candidates.schema.json"`.

- [ ] **Step 4: Green**

Run: `node --test scripts/__tests__/pack-candidates.test.mjs` e `node scripts/validate-skill-kit.mjs`

Expected: exit 0.

- [ ] **Step 5: Commit (se pedido)**

```bash
git add schemas/pack-candidates.schema.json scripts/__tests__/pack-candidates.test.mjs prompts/interview.md prompts/closeout.md prompts/route.md _app-vault/docs/decisions/estrutura-do-kit.md manifests/kit-manifest.json
git commit -m "$(cat <<'EOF'
feat: padrão novo vira candidato de pack, não overlay

EOF
)"
```

---

### Task 6: Compose/apply — delete e condense

**Files:**
- Modify: `prompts/apply.md` (ordem transacional)
- Modify: `prompts/compose.md` (deletions no staging)
- Modify: `scripts/__tests__/apply-transaction.test.mjs`
- Modify: `scripts/__tests__/helpers/compose-engine.mjs` (se o motor materializa relocate; estender delete)
- Test: `apply-transaction.test.mjs`

**Interfaces:**
- Consumes: `plan.entries` com `operation` delete/condense
- Produces: `.hephaestus/staging-deletions.json` `{ version: 1, paths: string[] }`; ordem apply: `relocate` → `condense` → `delete` → `reconcile` → `generate` → `keep`

- [ ] **Step 1: Teste de ordem no prompt (red)**

Trocar em `apply-transaction.test.mjs` o `expectedOrder` para:

```js
const expectedOrder = ["relocate", "condense", "delete", "reconcile", "generate", "keep"];
```

Acrescentar:

```js
test("apply remove paths de staging-deletions após backup", () => {
  const prompt = applyPrompt();
  assert.match(prompt, /staging-deletions\.json/);
  assert.match(prompt, /condense/);
  assert.match(prompt, /nota de rastro/);
});
```

- [ ] **Step 2: Red**

Run: `node --test scripts/__tests__/apply-transaction.test.mjs`

Expected: FAIL (ordem sem condense/delete).

- [ ] **Step 3: Prompts**

`apply.md` **Ordem transacional**:

1. `relocate`
2. `condense` — fundir trecho único no canônico + uma linha `_Absorvido <data> — de: <path>.` + remover origem
3. `delete` — unlink dos paths de `.hephaestus/staging-deletions.json` (já copiados no backup)
4. `reconcile`
5. `generate`
6. `keep`

Backup **antes do primeiro byte** inclui arquivos que serão removidos.

Lista final: staging-manifest (gravados) **mais** deletions aplicadas. `artifactsWritten` registra `phase: apply` também para paths deletados (`validationStatus: valid`, operação delete).

`compose.md`: materializar canônicos condensados no staging; emitir `staging-deletions.json` com paths relativos. Não colocar arquivo deletado no `staging-manifest.json`.

Keep-bytes: entradas `keep` inalteradas; `delete` não entra no check de hash de staging-manifest.

- [ ] **Step 4: Green**

Run: `node --test scripts/__tests__/apply-transaction.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit (se pedido)**

```bash
git add prompts/apply.md prompts/compose.md scripts/__tests__/apply-transaction.test.mjs scripts/__tests__/helpers/compose-engine.mjs
git commit -m "$(cat <<'EOF'
feat: apply transaciona condense e delete de processo

EOF
)"
```

---

### Task 7: Docs públicas, SKILL, versão 4

**Files:**
- Modify: `SKILL.md`, `SKILL.en.md` (maintain = higiene; INV9; pack-candidates; sem auxiliar)
- Modify: `README.md`, `README.pt-BR.md`
- Modify: `COMMANDS.md`, `COMMANDS.pt-BR.md` se citarem overlay como evolução de pasta
- Modify: `RELEASE.md`, `RELEASE.pt-BR.md` (seção da versão 4)
- Modify: `manifests/kit-manifest.json` `"version": "4"`
- Modify: `prompts/validate.md` se listar regimes
- Test: `node --test "scripts/__tests__/**/*.test.mjs"`; `node scripts/validate-skill-kit.mjs`; `node scripts/check-public-docs.mjs`

**Interfaces:**
- Consumes: Tasks 1–6
- Produces: pack version 4 (DEC-003)

- [ ] **Step 1: Teste de paridade / kit**

Não há teste novo obrigatório além da suíte. Grep de regressão:

```bash
rg -n "organizar-app-work|done/" SKILL.md SKILL.en.md README.md README.pt-BR.md prompts templates references/vault-schema/SCHEMA.md
```

Expected: `done/` só como legado a migrar; **zero** “rode a auxiliar”. Overlay não descrito como forma de criar pasta.

- [ ] **Step 2: Se o grep achar auxiliar como caminho, é red — limpar nos docs**

- [ ] **Step 3: Editar SKILL (PT e EN)**

Trechos obrigatórios no SKILL.md (espelhar em EN):

- `maintain` inventaria interior de `.app-work/` (itens 8–12).
- INV9: process `keep|relocate|delete|condense`.
- Schema inclui `roadmap/`, `docs/`, `guides/legados/`.
- Padrão novo → entrevista includeInPack → `.hephaestus/pack-candidates.json`; skill instalada imutável.
- Fechamento: auxiliar `organizar-app-work` não faz parte do kit.

Bump `kit-manifest.json` version `"4"`. RELEASE: artefato `hephaestus-4.zip`; changelog: higiene, schema, pack-candidates.

Não publicar zip neste plano (pack-release é comando à parte).

- [ ] **Step 4: Suíte completa**

Run:

```bash
node --test "scripts/__tests__/**/*.test.mjs"
node scripts/validate-skill-kit.mjs
node scripts/check-public-docs.mjs
```

Expected: todos exit 0.

- [ ] **Step 5: Commit (se pedido)**

```bash
git add SKILL.md SKILL.en.md README.md README.pt-BR.md COMMANDS.md COMMANDS.pt-BR.md RELEASE.md RELEASE.pt-BR.md manifests/kit-manifest.json prompts/validate.md
git commit -m "$(cat <<'EOF'
docs: Hephaestus 4 — higiene de processo autocontida

EOF
)"
```

---

## Spec coverage

| Spec | Task |
|---|---|
| §4 schema vivo/archive | 2 |
| §4.3 espelho datado | 1 |
| §5 catálogo roadmap/docs/legados/references | 2 |
| §6 pack-candidate | 5 |
| §7.1 discover 8–12 | 4 |
| §7.2 INV9 delete/condense | 3 |
| §7.3 destrutivo | 3, 6 |
| §7.4 README | 4 (route/compose: README da pasta alterada — incluir no `prompts/compose.md` na Task 4 ou 6: “após relocate/delete de pasta, atualizar README”) |
| §8 auxiliar morta no kit | 7 |
| §9 zip imutável na instalação | 5, 7 |
| §10 DEC-005/006 | 2, 5 |
| §11 testes 1–8 | 1–5 |
| §4.5 vault inalterado | nenhum task de vault além de DEC-004 já existente |

**Gap fechado no plano:** README por pasta (§7.4) — na Task 4, `prompts/compose.md` ganha um bullet: se o plano tocou `guides|prd|docs|issues|archive|roadmap|references|private`, gerar/atualizar `README.md` da pasta (tipo, não nomes eternos). Não restaurar poda.

## Placeholder scan

Nenhum TBD. Contagem 41 do catálogo é a aritmética 36−1+6; Step 1 da Task 2 manda recontar se o JSON divergir.

## Type consistency

`inventoryProcessHygiene` / `isPackConcluded` / `isPackStale` / `fileSha256` usados nas Tasks 4–5 com as mesmas assinaturas. `regime` e `operation` alinhados na Task 3 antes de apply (Task 6).
