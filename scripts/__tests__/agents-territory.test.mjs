// AC-4.2.2 e CN8 (seam S7, nível ancorada): `checkAgentsTerritory` do
// validador reprova regra de produto alojada no `AGENTS.md` — fragmento com
// `territory: vault` cujo `outputPath` é `AGENTS.md` no coverage-map, e
// cláusula de decisão (`### DEC-NNN`) embutida no próprio `AGENTS.md` sem
// ponteiro. O mesmo fragmento apontando para `_app-vault/docs/decisions/`
// passa.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, runNode, writeFile, writeJson } from "./helpers/fs-utils.mjs";
import { makeValidPackage, writeCoverageMap, coverageEntry } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

test("AC-4.2.2/CN8: fragmento vault com outputPath AGENTS.md reprova nomeando o fragmento", () => {
  const pkg = mkdtemp("hep-at-agents-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [
    coverageEntry({
      fragmentId: "frag-dec-1",
      artifactType: "reference",
      outputPath: "AGENTS.md",
      territory: "vault",
      regime: "reconcile",
    }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("frag-dec-1"), result.stderr);
  assert.ok(result.stderr.includes("AGENTS.md"), result.stderr);
});

test("AC-4.2.2/CN8: o mesmo fragmento apontando para _app-vault/docs/decisions/ passa", () => {
  const pkg = mkdtemp("hep-at-vault-");
  makeValidPackage(pkg);
  writeCoverageMap(pkg, [
    coverageEntry({
      fragmentId: "frag-dec-1",
      artifactType: "reference",
      outputPath: "_app-vault/docs/decisions/planos.md",
      territory: "vault",
      regime: "reconcile",
    }),
  ]);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.2/CN8: cláusula de decisão embutida no AGENTS.md sem ponteiro reprova", () => {
  const pkg = mkdtemp("hep-at-embedded-");
  makeValidPackage(pkg);
  writeFile(
    pkg,
    "AGENTS.md",
    "# Projeto Teste — contrato do agente\n\nProduto vigente: `_app-vault/docs/decisions/`; mapa: `_app-vault/INDEX.md`.\nProcesso: `.app-work/`; mapa: `.app-work/INDEX.md`. `.app-work/` é processo: nunca insumo de regra.\n\n### DEC-001 — Cota de export\n\nPlano gratuito: 20 exports/mês.\n",
  );
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("DEC-"), result.stderr);
});

test("AC-4.2.2/CN8: AGENTS.md com workflow e precedência, sem decisão, passa", () => {
  const pkg = mkdtemp("hep-at-clean-");
  makeValidPackage(pkg);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.2/CN8: sem coverage-map o gate não bloqueia pacotes sem a fase", () => {
  const pkg = mkdtemp("hep-at-nocov-");
  makeValidPackage(pkg);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.2: pacote-adopt — nenhum fragmento vault alojado no AGENTS.md (gate agregado)", () => {
  const pacote = path.join(import.meta.dirname, "fixtures", "pacote-adopt");
  const result = runValidator(pacote);
  assert.equal(result.status, 0, result.stderr);
});
