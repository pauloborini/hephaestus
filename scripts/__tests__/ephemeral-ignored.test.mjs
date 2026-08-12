// AC-2.2.1 e CN12: checkEphemeralIgnored exige a linha `.hephaestus/` no
// `.gitignore` (ou em `.git/info/exclude`) e nenhum arquivo sob `.hephaestus/`
// no índice do git; ausência de git é `skipped`, nunca falha.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_ROOT, mkdtemp, runNode, writeFile } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";

const git = (args, cwd) => spawnSync("git", args, { cwd, encoding: "utf8" });
const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

test("AC-2.2.1/CN12: alvo sem a linha .hephaestus/ no .gitignore reprova nomeando o .gitignore", () => {
  const pkg = mkdtemp("hep-eph-");
  makeValidPackage(pkg);
  writeFile(pkg, ".gitignore", "outra-linha\n");
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes(".gitignore"), result.stderr);
});

test("AC-2.2.1: a mera existência do diretório .hephaestus/ não passa — a linha é exigida", () => {
  const pkg = mkdtemp("hep-eph-");
  makeValidPackage(pkg); // cria .hephaestus/ e .gitignore SEM a linha
  writeFile(pkg, ".gitignore", "# comentário\n");
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes(".gitignore"), result.stderr);
});

test("AC-2.2.1: com a linha presente sai 0 (sem repo git -> índice skipped, nunca falha)", () => {
  const pkg = mkdtemp("hep-eph-");
  makeValidPackage(pkg);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("skipped"), result.stdout);
});

test("AC-2.2.1: arquivo sob .hephaestus/ rastreado no índice reprova mesmo com a linha no .gitignore", () => {
  const pkg = mkdtemp("hep-eph-");
  makeValidPackage(pkg);
  git(["init", "-q"], pkg);
  git(["add", "-f", ".hephaestus/manifests/run-state.json"], pkg);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("tracked"), result.stderr);
});

test("AC-2.2.1: a linha em .git/info/exclude também satisfaz", () => {
  const pkg = mkdtemp("hep-eph-");
  makeValidPackage(pkg);
  git(["init", "-q"], pkg);
  writeFile(pkg, ".git/info/exclude", ".hephaestus/\n");
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});
