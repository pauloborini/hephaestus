// AC-2.5.1 (D27): checkAppliedHashes recomputa o sha256 de cada artefato do
// staging-manifest.json lendo o disco; divergência falha com exit 1 nomeando
// o artefato, o hash esperado e o obtido, e o relatório pede rollback.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { REPO_ROOT, mkdtemp, runNode, writeJson } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

const addStagingManifest = (pkg) => {
  const agents = fs.readFileSync(path.join(pkg, "AGENTS.md"), "utf8");
  const index = fs.readFileSync(path.join(pkg, "project-rules/index/README.md"), "utf8");
  writeJson(pkg, ".hephaestus/staging-manifest.json", {
    version: 1,
    artifacts: [
      { outputPath: "AGENTS.md", sha256: sha256(agents) },
      { outputPath: "project-rules/index/README.md", sha256: sha256(index) },
    ],
  });
};

test("AC-2.5.1: sem adulteração, verify(applied) sai 0", () => {
  const pkg = mkdtemp("hep-applied-");
  makeValidPackage(pkg);
  addStagingManifest(pkg);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-2.5.1: artefato adulterado após a escrita reprova nomeando artefato, os dois hashes e rollback", () => {
  const pkg = mkdtemp("hep-applied-");
  makeValidPackage(pkg);
  addStagingManifest(pkg);
  // adulteração mantém as âncoras (checkAgents passa) — o que falha é o hash
  fs.writeFileSync(
    path.join(pkg, "AGENTS.md"),
    "# Outro — contrato do agente\n\nProduto vigente: `_app-vault/docs/decisions/`; mapa: `_app-vault/INDEX.md`.\nProcesso: `.app-work/`; mapa: `.app-work/INDEX.md`. `.app-work/` é processo: nunca insumo de regra.\n",
  );

  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("AGENTS.md"), result.stderr);
  assert.ok(result.stderr.includes("mismatch"), result.stderr);
  assert.ok(result.stderr.includes("rollback"), result.stderr);
});

test("AC-2.5.1: artefato ausente no disco reprova nomeando o artefato", () => {
  const pkg = mkdtemp("hep-applied-");
  makeValidPackage(pkg);
  addStagingManifest(pkg);
  fs.rmSync(path.join(pkg, "project-rules/index/README.md"));

  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("README.md"), result.stderr);
});
