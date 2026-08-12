// AC-3.1.2 e INV5: checkCoverage do validador reprova snapshot com byte não
// coberto por fragmento nem região ignorada declarada, nomeando o arquivo e o
// offset; com cobertura completa (ou região ignorada declarada) passa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, runNode, writeJson } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const snapshot = (files, ignoredRegions = []) => ({
  files,
  ignoredRegions,
});

const fragment = (fragmentId, sourcePath, startOffset, endOffset) => ({
  fragmentId,
  rawText: "texto",
  territory: "agents",
  regime: "keep",
  confidence: 0.5,
  ambiguity: "medium",
  provenance: [{ sourcePath, startOffset, endOffset }],
});

test("AC-3.1.2/INV5: snapshot 100% coberto por fragmentos passa", () => {
  const pkg = mkdtemp("hep-cov-ok-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/manifests/snapshot.json", snapshot([
    { path: "docs/guia.md", sha256: "a".repeat(64), size: 100 },
  ]));
  writeJson(pkg, ".hephaestus/manifests/fragments.json", [
    fragment("frag-1", "docs/guia.md", 0, 100),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-3.1.2/INV5: trecho de fonte sem fragmento reprova nomeando arquivo e offset", () => {
  const pkg = mkdtemp("hep-cov-gap-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/manifests/snapshot.json", snapshot([
    { path: "docs/guia.md", sha256: "a".repeat(64), size: 100 },
  ]));
  // fragmento cobre só [0, 40): os bytes 40..99 não pertencem a ninguém
  writeJson(pkg, ".hephaestus/manifests/fragments.json", [
    fragment("frag-1", "docs/guia.md", 0, 40),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("docs/guia.md"), result.stderr);
  assert.ok(result.stderr.includes("40"), result.stderr);
});

test("AC-3.1.2/INV5: região ignorada declarada cobre o gap e passa", () => {
  const pkg = mkdtemp("hep-cov-ign-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/manifests/snapshot.json", snapshot(
    [{ path: "docs/guia.md", sha256: "a".repeat(64), size: 100 }],
    [{ path: "docs/guia.md", startOffset: 40, endOffset: 100, reason: "exemplo não-normativo" }],
  ));
  writeJson(pkg, ".hephaestus/manifests/fragments.json", [
    fragment("frag-1", "docs/guia.md", 0, 40),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-3.1.2/INV5: provenance fora do snapshot reprova", () => {
  const pkg = mkdtemp("hep-cov-out-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/manifests/snapshot.json", snapshot([
    { path: "docs/guia.md", sha256: "a".repeat(64), size: 100 },
  ]));
  writeJson(pkg, ".hephaestus/manifests/fragments.json", [
    fragment("frag-1", "docs/outro.md", 0, 10),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("docs/outro.md"), result.stderr);
});
