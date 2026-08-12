// AC-2.3.1, AC-2.3.2 e CN3: checkPlanContract exige origin em toda operação
// (rastreio a fragmento ou resposta) e reprova operação destrutiva decidida
// exclusivamente pela LLM sem aprovação registrada (INV7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { REPO_ROOT, mkdtemp, runNode, writeJson } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const withPlan = (pkg, entries) => {
  writeJson(pkg, ".hephaestus/plan.json", { version: 1, entries });
};

const entry = (overrides = {}) => ({
  artifactPath: "project-rules/rules/domain_rules.md",
  territory: "project-rules",
  regime: "generate",
  operation: "create",
  rationale: "nova regra a partir de fragmento",
  origin: "frag-123",
  decidedBy: "detector",
  destructive: false,
  ...overrides,
});

test("AC-2.3.1/CN3: operação sem origin reprova nomeando a operação", () => {
  const pkg = mkdtemp("hep-plan-");
  makeValidPackage(pkg);
  withPlan(pkg, [entry({ origin: undefined })]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("domain_rules.md"), result.stderr);
});

test("AC-2.3.1: com origin rastreável a fragmento passa", () => {
  const pkg = mkdtemp("hep-plan-");
  makeValidPackage(pkg);
  withPlan(pkg, [entry()]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-2.3.2/INV7: destrutiva decidida por llm sem aprovação reprova", () => {
  const pkg = mkdtemp("hep-plan-");
  makeValidPackage(pkg);
  withPlan(pkg, [entry({ operation: "overwrite", decidedBy: "llm", destructive: true })]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("approval"), result.stderr);
});

test("AC-2.3.2: destrutiva decidida por llm com aprovação registrada passa", () => {
  const pkg = mkdtemp("hep-plan-");
  makeValidPackage(pkg);
  withPlan(pkg, [
    entry({ operation: "overwrite", decidedBy: "llm", destructive: true, approved: true }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-2.3.2: destrutiva decidida por human sem aprovação passa", () => {
  const pkg = mkdtemp("hep-plan-");
  makeValidPackage(pkg);
  withPlan(pkg, [entry({ operation: "overwrite", decidedBy: "human", destructive: true })]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});
