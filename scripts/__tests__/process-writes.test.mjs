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
import { makeValidPackage, approvedPlanEntries } from "./helpers/package-fixture.mjs";

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
  approvalEvidence: "autorização de teste para o run e os paths do plano",
  ...overrides,
});

const packageWithPlan = (entries) => {
  const pkg = mkdtemp("hep-procw-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/plan.json", { version: 1, entries: approvedPlanEntries(entries) });
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

test("AC-6.2.2: scaffold mantido pelo kit (.app-work/INDEX.md) aceita create e amend, nunca overwrite", () => {
  for (const operation of ["create", "amend"]) {
    const pkg = packageWithPlan([
      planEntry({ artifactPath: ".app-work/INDEX.md", regime: "generate", operation }),
    ]);
    const result = runValidator(pkg);
    assert.equal(result.status, 0, `${operation}: ${result.stderr}`);
  }
  const pkg = packageWithPlan([
    planEntry({ artifactPath: ".app-work/INDEX.md", regime: "generate", operation: "overwrite" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /overwrite/);
});

test("AC-6.2.2: escrita derivada (derivedFrom) em .app-work/ é aceita e repete a origem da causa", () => {
  const cause = planEntry({
    artifactPath: ".app-work/guides/X/GUIDE.md",
    regime: "relocate",
    operation: "move",
    origin: "frag-guia",
  });
  const derived = {
    ...cause,
    artifactPath: ".app-work/INDEX.md",
    regime: "generate",
    operation: "amend",
    derivedFrom: cause.artifactPath,
  };
  const pkg = packageWithPlan([cause, derived]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: escrita derivada com derivedFrom ausente ou inconsistente reprova", () => {
  const cause = planEntry({
    artifactPath: ".app-work/guides/X/GUIDE.md",
    regime: "relocate",
    operation: "move",
    origin: "frag-guia",
  });
  // derivedFrom apontando para causa inexistente no plano
  const orphan = {
    ...cause,
    artifactPath: ".app-work/INDEX.md",
    regime: "generate",
    operation: "amend",
    derivedFrom: ".app-work/guides/NAO_EXISTE/GUIDE.md",
  };
  const result = runValidator(packageWithPlan([cause, orphan]));
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /derivedFrom/);
});

// Escrita derivada sobre arquivo que não é mantido pelo kit: só o `derivedFrom`
// a torna legal, então os casos abaixo provam o gate do campo.
const derivedCause = () =>
  planEntry({
    artifactPath: ".app-work/guides/X/GUIDE.md",
    regime: "relocate",
    operation: "move",
    origin: "frag-guia",
  });

const derivedOf = (cause, overrides = {}) => ({
  ...cause,
  artifactPath: ".app-work/archive/README.md",
  regime: "generate",
  operation: "amend",
  derivedFrom: cause.artifactPath,
  ...overrides,
});

test("AC-6.2.2: amend derivado sobre arquivo comum de .app-work/ passa", () => {
  const cause = derivedCause();
  const result = runValidator(packageWithPlan([cause, derivedOf(cause)]));
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: escrita derivada cuja causa não é move/delete/condense ou diverge da causa reprova", () => {
  const cause = derivedCause();
  const amendCause = planEntry({ artifactPath: ".app-work/INDEX.md", regime: "generate", operation: "amend" });
  const cases = [
    { name: "causa amend", entries: [amendCause, derivedOf(amendCause)], pattern: /a causa é move, delete ou condense/ },
    { name: "origin", entries: [cause, derivedOf(cause, { origin: "outra" })], pattern: /origin difere/ },
    {
      name: "contextFingerprint",
      entries: [cause, derivedOf(cause, { contextFingerprint: "b".repeat(64) })],
      pattern: /contextFingerprint difere/,
    },
    { name: "destructive", entries: [cause, derivedOf(cause, { destructive: false })], pattern: /destructive difere/ },
    {
      name: "approvalEvidence",
      entries: [cause, derivedOf(cause, { approvalEvidence: "outra aprovação" })],
      pattern: /approvalEvidence difere/,
    },
  ];
  for (const { name, entries, pattern } of cases) {
    const result = runValidator(packageWithPlan(entries));
    assert.equal(result.status, 1, `${name}: ${result.stdout}`);
    assert.match(result.stderr, pattern, name);
  }
});

test("AC-6.2.2: escrita derivada só corrige por amend dentro de .app-work/, fora do registro do projeto", () => {
  const cause = derivedCause();
  const cases = [
    {
      name: "create",
      derived: derivedOf(cause, { artifactPath: ".app-work/docs/NOVO.md", operation: "create" }),
      pattern: /só corrige referência por amend/,
    },
    {
      name: "fora de .app-work/",
      derived: derivedOf(cause, { artifactPath: "project-rules/rules/x.md" }),
      pattern: /fora de \.app-work\//,
    },
    {
      name: "registro do projeto em issues/",
      derived: derivedOf(cause, { artifactPath: ".app-work/issues/BUG_REGISTRY.md" }),
      pattern: /registro de defeitos do projeto/,
    },
  ];
  for (const { name, derived, pattern } of cases) {
    const result = runValidator(packageWithPlan([cause, derived]));
    assert.equal(result.status, 1, `${name}: ${result.stdout}`);
    assert.match(result.stderr, pattern, name);
  }
});

test("AC-6.2.2: escrita derivada nunca entra em pasta gerida pelo motor (pack.json ou roadmap.json)", () => {
  const cause = derivedCause();
  // nome do arquivo do motor reprova mesmo sem o arquivo no disco
  for (const artifactPath of [".app-work/guides/P_GUIDE/pack.json", ".app-work/guides/P_GUIDE/journal.jsonl"]) {
    const result = runValidator(packageWithPlan([cause, derivedOf(cause, { artifactPath })]));
    assert.equal(result.status, 1, `${artifactPath}: ${result.stdout}`);
    assert.match(result.stderr, /pasta gerida pelo motor/);
  }
  // arquivo comum dentro de pasta marcada no disco: INTENT.md e prosa do roadmap
  const marked = [
    { marker: ".app-work/guides/P_GUIDE/pack.json", artifactPath: ".app-work/guides/P_GUIDE/INTENT.md" },
    { marker: ".app-work/roadmap/m1/roadmap.json", artifactPath: ".app-work/roadmap/m1/slices/S1.md" },
  ];
  for (const { marker, artifactPath } of marked) {
    const pkg = packageWithPlan([cause, derivedOf(cause, { artifactPath })]);
    writeJson(pkg, marker, {});
    const result = runValidator(pkg);
    assert.equal(result.status, 1, `${artifactPath}: ${result.stdout}`);
    assert.match(result.stderr, /pasta gerida pelo motor/);
  }
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
    // regime generate: par canônico da operação de issue (Fase 1/DATA-01)
    planEntry({ artifactPath: ".app-work/issues/INDEX.md", regime: "generate", operation: "amend" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: create em .app-work/issues/INDEX.md passa (cunhagem é create aditivo)", () => {
  const pkg = packageWithPlan([
    planEntry({ artifactPath: ".app-work/issues/INDEX.md", regime: "generate", operation: "create" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-6.2.2: operação fora de .app-work/ não é avaliada pelo gate", () => {
  const pkg = packageWithPlan([
    planEntry({ artifactPath: "project-rules/rules/domain_rules.md", regime: "generate", operation: "create" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});
