// AC-3.2.1 e INV2: checkKeepBytes do validador prova a cópia byte a byte —
// para cada entrada `regime: keep` do routing.json, o sha256 do conteúdo de
// origem (provenance do fragmento) é igual ao do range correspondente no
// artefato de destino; divergência reprova nomeando o fragmento e os hashes.
// O nível 1 decide por POSIÇÃO: o fixture não tem nenhum estado anterior
// (.hephaestus/ ausente) e o fragmento editado à mão permanece keep.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { mkdtemp, runNode, writeJson, writeFile } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";
import { buildRouting, buildFragments } from "./helpers/routing-engine.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const archContent = "# Regras de arquitetura\n\nA camada de dados deve ser isolada da camada de UI.\n";

const packageWithKeep = (pkg, mutateAfter) => {
  makeValidPackage(pkg);
  const archPath = "project-rules/rules/architecture_rules.md";
  writeFile(pkg, archPath, archContent);
  const size = Buffer.byteLength(archContent, "utf8");
  const fragment = {
    fragmentId: "frag-arch",
    rawText: archContent,
    territory: "project-rules",
    regime: "keep",
    confidence: 1,
    ambiguity: "low",
    provenance: [{ sourcePath: archPath, startOffset: 0, endOffset: size }],
  };
  writeJson(pkg, ".hephaestus/manifests/fragments.json", [fragment]);
  writeJson(pkg, ".hephaestus/manifests/routing.json", [
    {
      fragmentId: "frag-arch",
      territory: "project-rules",
      regime: "keep",
      destinationPath: archPath,
      confidence: 1,
      decidedBy: "keep",
      evidence: "destino calculado == origem atual",
      needsSplit: false,
    },
  ]);
  mutateAfter?.(pkg, size);
  return pkg;
};

test("AC-3.2.1/INV2: keep com hash de origem == hash de destino passa", () => {
  const pkg = mkdtemp("hep-keep-ok-");
  packageWithKeep(pkg);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-3.2.1/INV2: keep com hash divergente reprova nomeando o fragmento e os dois hashes", () => {
  const pkg = mkdtemp("hep-keep-bad-");
  packageWithKeep(pkg, (root, size) => {
    // adulterar o arquivo de destino depois do roteamento: o fragmento keep
    // reflete o conteúdo de origem; o destino tem outros bytes → divergência
    writeFile(root, "project-rules/rules/architecture_rules.md", "# Outra versao\n".padEnd(size, "x"));
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("frag-arch"), result.stderr);
  assert.ok(result.stderr.includes("mismatch") || /!=/.test(result.stderr), result.stderr);
  const h1 = sha256(Buffer.from(archContent, "utf8"));
  assert.ok(result.stderr.includes(h1), result.stderr);
});

test("AC-3.2.1/INV2: nível 1 decide por posição — arquivo editado à mão em fixture sem estado anterior sai keep", () => {
  const fixture = copyFixture("repo-desorganizado");
  // nenhum .hephaestus/ existe no fixture: não há snapshot de execução
  // anterior para comparar; o não-toque vem de posição (destino == origem)
  const fragments = buildFragments(fixture);
  const { routing } = buildRouting(fixture, { fragments });
  const arch = routing.find(
    (e) => e.destinationPath === "project-rules/rules/architecture_rules.md",
  );
  assert.ok(arch, "fragmento de architecture_rules.md deve estar no routing");
  assert.equal(arch.regime, "keep");
  assert.equal(arch.decidedBy, "keep");
});

test("AC-3.2.1: keep com hash divergente faz o gate falhar nomeando o fragmento (validador real)", () => {
  const pkg = mkdtemp("hep-keep-gate-");
  packageWithKeep(pkg, (root) => {
    fs.rmSync(path.join(root, "project-rules/rules/architecture_rules.md"));
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("frag-arch"), result.stderr);
});
