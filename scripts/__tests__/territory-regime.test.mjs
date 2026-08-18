// AC-1.3.1 e INV9: combinação ilegal territory x regime reprova o pacote
// nomeando o fragmento; combinação legal passa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { REPO_ROOT, mkdtemp, runNode } from "./helpers/fs-utils.mjs";
import { makeValidPackage, writeCoverageMap, coverageEntry } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) =>
  runNode([`${REPO_ROOT}/scripts/validate-package.mjs`, pkgDir]);

test("AC-1.3.1/INV9: territory process + regime generate reprova nomeando o fragmento", () => {
  const pkg = mkdtemp("hep-tr-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [
    coverageEntry({ fragmentId: "frag-process", territory: "process", regime: "generate" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("frag-process"), result.stderr);
  assert.ok(result.stderr.includes("process"), result.stderr);
  assert.ok(result.stderr.includes("generate"), result.stderr);
});

test("AC-1.3.1/INV9: territory process também reprova regime reconcile", () => {
  const pkg = mkdtemp("hep-tr-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [
    coverageEntry({ fragmentId: "frag-process-2", territory: "process", regime: "reconcile" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
});

test("AC-1.3.1: o mesmo fragmento com regime relocate passa", () => {
  const pkg = mkdtemp("hep-tr-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [
    coverageEntry({ fragmentId: "frag-process-3", territory: "process", regime: "relocate" }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("INV9: matriz legal — vault só reconcile/keep, agents/project-rules só generate/keep", () => {
  const legal = [
    ["vault", "reconcile"],
    ["vault", "keep"],
    ["agents", "generate"],
    ["agents", "keep"],
    ["project-rules", "generate"],
    ["project-rules", "keep"],
    ["process", "relocate"],
    ["process", "keep"],
    ["process", "delete"],
    ["process", "condense"],
  ];
  const illegal = [
    ["vault", "generate"],
    ["vault", "relocate"],
    ["agents", "reconcile"],
    ["agents", "relocate"],
    ["project-rules", "reconcile"],
    ["project-rules", "relocate"],
  ];
  for (const [territory, regime] of legal) {
    const pkg = mkdtemp("hep-tr-");
    makeValidPackage(pkg);
    writeCoverageMap(pkg, [coverageEntry({ territory, regime })]);
    const result = runValidator(pkg);
    assert.equal(result.status, 0, `${territory}/${regime}: ${result.stderr}`);
  }
  for (const [territory, regime] of illegal) {
    const pkg = mkdtemp("hep-tr-");
    makeValidPackage(pkg);
    writeCoverageMap(pkg, [coverageEntry({ territory, regime })]);
    const result = runValidator(pkg);
    assert.equal(result.status, 1, `${territory}/${regime} deveria reprovar`);
  }
});

test("INV9: process + delete passa; process + generate continua ilegal", () => {
  const pkg = mkdtemp("hep-tr-del-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [coverageEntry({ fragmentId: "d1", territory: "process", regime: "delete" })]);
  assert.equal(runValidator(pkg).status, 0, runValidator(pkg).stderr);
});
