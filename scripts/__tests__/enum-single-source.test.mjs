// AC-1.1.1, AC-1.1.2, AC-1.1.3 e VC1: o validador decide por enum lido do
// schema, nunca por conjunto declarado no próprio arquivo.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import {
  REPO_ROOT,
  mkdtemp,
  copyKit,
  writeFile,
  writeJson,
  runNode,
} from "./helpers/fs-utils.mjs";
import { makeValidPackage, writeCoverageMap, coverageEntry } from "./helpers/package-fixture.mjs";

const VALIDATOR_REL = path.join("scripts", "validate-package.mjs");
const validatorAbs = path.join(REPO_ROOT, VALIDATOR_REL);

// Monta uma árvore tmp com o validador real + schemas reais (modificáveis).
const makeValidatorTree = (tmp) => {
  fs.mkdirSync(path.join(tmp, "scripts"), { recursive: true });
  fs.copyFileSync(validatorAbs, path.join(tmp, "scripts", "validate-package.mjs"));
  const schemasSrc = path.join(REPO_ROOT, "schemas");
  for (const file of fs.readdirSync(schemasSrc)) {
    fs.mkdirSync(path.join(tmp, "schemas"), { recursive: true });
    fs.copyFileSync(path.join(schemasSrc, file), path.join(tmp, "schemas", file));
  }
  return tmp;
};

const runValidator = (root, pkgDir) => runNode([path.join(root, VALIDATOR_REL), pkgDir]);

test("AC-1.1.2: nenhuma const de vocabulário ALLOWED_* sobrevive no validador", () => {
  const source = fs.readFileSync(validatorAbs, "utf8");
  const matches = source.match(/^const ALLOWED_/gm) ?? [];
  assert.deepEqual(matches, []);
});

test("AC-1.1.1/VC1: valor acrescentado ao enum no schema passa a ser aceito pelo gate", () => {
  // (a) schema com enum estendido -> gate aceita o valor novo
  const tmp = makeValidatorTree(mkdtemp("hep-enum-"));
  const schemaPath = path.join(tmp, "schemas", "fragment.schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  schema.properties.territory.enum.push("guarda");
  writeJson(tmp, "schemas/fragment.schema.json", schema);

  const pkg = mkdtemp("hep-enum-pkg-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [
    coverageEntry({ fragmentId: "frag-guarda", territory: "guarda", regime: "keep" }),
  ]);
  const accepted = runValidator(tmp, pkg);
  assert.equal(accepted.status, 0, accepted.stderr);

  // (b) o mesmo pacote contra o schema real (sem o valor) -> reprova:
  // o gate segue o conjunto do schema, não é permissivo nem hard-coded.
  const rejected = runValidator(REPO_ROOT, pkg);
  assert.equal(rejected.status, 1, rejected.stdout);
  assert.ok(rejected.stderr.includes("territory"), rejected.stderr);
});

test("AC-1.1.3: schema de vocabulário ausente -> exit 1 com o path na mensagem", () => {
  const tmp = makeValidatorTree(mkdtemp("hep-missing-"));
  fs.rmSync(path.join(tmp, "schemas", "run-state.schema.json"));
  const pkg = mkdtemp("hep-missing-pkg-");
  makeValidPackage(pkg);
  const result = runValidator(tmp, pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("run-state.schema.json"), result.stderr);
});

test("AC-1.1.3: schema com JSON inválido -> exit 1 com o path na mensagem", () => {
  const tmp = makeValidatorTree(mkdtemp("hep-invalid-"));
  // run-state.schema.json é lido por checkRunState em todo pacote com run-state.
  writeFile(tmp, "schemas/run-state.schema.json", "{ inválido");
  const pkg = mkdtemp("hep-invalid-pkg-");
  makeValidPackage(pkg);
  const result = runValidator(tmp, pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("run-state.schema.json"), result.stderr);
});
