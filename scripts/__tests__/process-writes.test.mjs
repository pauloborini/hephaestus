// AC-6.2.2 (INV10/D19): `checkProcessWrites` — escrita ativa em `.app-work/`
// só existe em `issues/` e é sempre aditiva. Seam S7 (Disco -> verificação),
// ancorada: o validador REAL (`scripts/validate-package.mjs`) roda sobre um
// pacote com `plan.json` customizado e decide.
// Falsificadores: gate permitir reescrita de conteúdo de processo (guide e
// brainstorm são processo — D19 proíbe gerar/sobrescrever) ou permitir
// sobrescrita do registro de issues (linha de issue é permanente pelo
// protocolo de `.app-work/issues/README.md`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeJson, runNode } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const planEntry = (overrides = {}) => ({
  artifactPath: ".app-work/guides/X/GUIDE.md",
  territory: "process",
  regime: "relocate",
  operation: "move",
  rationale: "regime relocate herdado do roteamento",
  origin: "frag-guia",
  decidedBy: "catalog",
  destructive: true,
  approved: true,
  ...overrides,
});

const packageWithPlan = (entries) => {
  const pkg = mkdtemp("hep-procw-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/plan.json", { version: 1, entries });
  return pkg;
};

test("AC-6.2.2: overwrite sobre .app-work/guides/X/GUIDE.md reprova (conteúdo de processo nunca é sobrescrito)", () => {
  const pkg = packageWithPlan([planEntry({ operation: "overwrite" })]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /escrita em processo/);
  assert.match(result.stderr, /\.app-work\/guides\/X\/GUIDE\.md/);
  assert.match(result.stderr, /fora de issues\/|overwrite/);
});

test("AC-6.2.2: create/amend fora de issues/ reprova (guia e brainstorm são processo, nunca gerados)", () => {
  for (const operation of ["create", "amend"]) {
    const pkg = packageWithPlan([planEntry({ operation })]);
    const result = runValidator(pkg);
    assert.equal(result.status, 1, `operation ${operation}: ${result.stdout}`);
    assert.match(result.stderr, /escrita em processo/);
  }
});

test("AC-6.2.2: move sobre .app-work/guides/X/GUIDE.md passa (processo só move/keep/skip)", () => {
  const pkg = packageWithPlan([planEntry({ operation: "move" })]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: overwrite sobre .app-work/issues/INDEX.md reprova (registro de issues é permanente)", () => {
  const pkg = packageWithPlan([
    planEntry({ artifactPath: ".app-work/issues/INDEX.md", operation: "overwrite" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /escrita em processo/);
  assert.match(result.stderr, /issues\/INDEX\.md/);
});

test("AC-6.2.2: amend sobre .app-work/issues/INDEX.md passa (linha nova/atualização de estado é aditiva)", () => {
  const pkg = packageWithPlan([
    planEntry({ artifactPath: ".app-work/issues/INDEX.md", operation: "amend" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: create em .app-work/issues/INDEX.md passa (cunhagem é create aditivo)", () => {
  const pkg = packageWithPlan([
    planEntry({ artifactPath: ".app-work/issues/INDEX.md", operation: "create" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: operação fora de .app-work/ não é avaliada pelo gate", () => {
  const pkg = packageWithPlan([
    planEntry({ artifactPath: "project-rules/rules/domain_rules.md", operation: "create" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});
