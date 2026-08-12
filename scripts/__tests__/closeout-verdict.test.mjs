// AC-3.3.1 e AC-3.3.2 (D26, S9 parcial): checkResidueGate do validador
// confronta o routing.json (entradas degradantes: decidedBy llm cujo destino
// é arquivo novo em _app-vault/docs/decisions/ ou project-rules/rules/) com o
// veredito e a lista nominal do report.md — o veredito exigido degrada por
// TIPO de destino, nunca por proporção; veredito degradado sem lista nominal
// reprova. Golden replay: o routing vem do golden-routing-adopt (S9).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, runNode, writeJson, writeFile } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";
import { FIXTURES_DIR } from "./helpers/fixtures.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const goldenEntries = () =>
  JSON.parse(
    fs.readFileSync(path.join(FIXTURES_DIR, "golden-routing-adopt.json"), "utf8"),
  ).entries;

// Estado de execução coerente para o gate: routing.json (do golden) +
// fragments.json (a entrada keep materializada no disco, para o
// checkKeepBytes não ficar sem prova) — as entradas não-keep não são
// conferidas pelo keep-bytes e podem carregar provenance vazia.
const KEEP_CONTENT =
  "# Regras de arquitetura\n\nA camada de dados deve ser isolada da camada de UI.\n";

const packageWithRouting = (pkg, entries) => {
  makeValidPackage(pkg);
  const fragments = [];
  for (const entry of entries) {
    if (entry.regime === "keep") {
      writeFile(pkg, entry.destinationPath, KEEP_CONTENT);
      const size = Buffer.byteLength(KEEP_CONTENT, "utf8");
      fragments.push({
        fragmentId: entry.fragmentId,
        rawText: KEEP_CONTENT,
        territory: entry.territory,
        regime: "keep",
        confidence: 1,
        ambiguity: "low",
        provenance: [
          { sourcePath: entry.destinationPath, startOffset: 0, endOffset: size },
        ],
      });
    } else {
      fragments.push({
        fragmentId: entry.fragmentId,
        rawText: "texto de execução",
        territory: entry.territory,
        regime: entry.regime,
        confidence: 0.5,
        ambiguity: "medium",
        provenance: [],
      });
    }
  }
  writeJson(pkg, ".hephaestus/manifests/fragments.json", fragments);
  writeJson(pkg, ".hephaestus/manifests/routing.json", entries);
  return pkg;
};

const report = (verdict, { list = true, ratio = true } = {}) => {
  const degrading = goldenEntries().find(
    (e) => e.decidedBy === "llm" && e.destinationPath.startsWith("_app-vault/docs/decisions/"),
  );
  const lines = [
    "# Relatório de fechamento",
    "",
    "## Resíduo decidido pela LLM",
  ];
  if (list && degrading) {
    lines.push(`- ${degrading.fragmentId} → ${degrading.destinationPath} (destino que vira DEC-NNN nova)`);
  } else {
    lines.push("- nenhum");
  }
  lines.push("", "## Métricas");
  lines.push(ratio ? "- llmDecidedRatio: 0.18" : "- nenhuma");
  lines.push("", "## Veredito");
  lines.push(verdict);
  return `${lines.join("\n")}\n`;
};

test("AC-3.3.1/CN5: resíduo de llm que vira DEC nova degrada e resíduo de referência não", () => {
  const pkg = mkdtemp("hep-verdict-deg-");
  packageWithRouting(pkg, goldenEntries());
  writeFile(pkg, ".hephaestus/report.md", report("degraded-but-usable"));
  assert.equal(runValidator(pkg).status, 0, "veredito exigido degraded com lista nominal deve passar");

  // mesma entrada apontando project-rules/reference/ → veredito ready permitido
  const refPkg = mkdtemp("hep-verdict-ref-");
  const entries = goldenEntries().map((e) =>
    e.decidedBy === "llm" && e.destinationPath.startsWith("_app-vault/docs/decisions/")
      ? { ...e, destinationPath: "project-rules/reference/notas.md" }
      : e,
  );
  packageWithRouting(refPkg, entries);
  writeFile(refPkg, ".hephaestus/report.md", report("ready"));
  assert.equal(runValidator(refPkg).status, 0, "resíduo de referência não degrada — ready permitido");
});

test("AC-3.3.1: com entrada degradante, veredito ready reprova", () => {
  const pkg = mkdtemp("hep-verdict-ready-");
  packageWithRouting(pkg, goldenEntries());
  writeFile(pkg, ".hephaestus/report.md", report("ready"));
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("degraded"), result.stderr);
});

test("AC-3.3.1: gate degrada por tipo de destino, não por proporção — 1 degradante entre 10 entradas degrada", () => {
  const pkg = mkdtemp("hep-verdict-prop-");
  const entries = goldenEntries();
  // 10 entradas, 1 degradante: um gate percentual (teto) deixaria passar ready
  assert.equal(entries.length, 10);
  packageWithRouting(pkg, entries);
  writeFile(pkg, ".hephaestus/report.md", report("degraded-but-usable"));
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
  // e ready com a mesma proporção reprova (o tipo de destino manda, não o volume)
  writeFile(pkg, ".hephaestus/report.md", report("ready"));
  const readyResult = runValidator(pkg);
  assert.equal(readyResult.status, 1, readyResult.stdout);
});

test("AC-3.3.2: veredito degradado sem a lista nominal das entradas degradantes reprova", () => {
  const pkg = mkdtemp("hep-verdict-nolist-");
  packageWithRouting(pkg, goldenEntries());
  writeFile(pkg, ".hephaestus/report.md", report("degraded-but-usable", { list: false }));
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("fragmentId") || result.stderr.includes("nominal"), result.stderr);
});

test("AC-3.3.1: llmDecidedRatio sempre reportado no relatório", () => {
  const pkg = mkdtemp("hep-verdict-noratio-");
  packageWithRouting(pkg, goldenEntries());
  writeFile(pkg, ".hephaestus/report.md", report("degraded-but-usable", { ratio: false }));
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("llmDecidedRatio"), result.stderr);
});

test("AC-3.3.1: run-state aceita llmDecidedRatio e reprova fora do intervalo", () => {
  const pkg = mkdtemp("hep-verdict-ratio-");
  makeValidPackage(pkg);
  const runStatePath = path.join(pkg, ".hephaestus", "manifests", "run-state.json");
  const runState = JSON.parse(fs.readFileSync(runStatePath, "utf8"));
  runState.llmDecidedRatio = 0.18;
  writeJson(pkg, ".hephaestus/manifests/run-state.json", runState);
  assert.equal(runValidator(pkg).status, 0, "ratio válido deve passar");

  runState.llmDecidedRatio = 1.5;
  writeJson(pkg, ".hephaestus/manifests/run-state.json", runState);
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("llmDecidedRatio"), result.stderr);
});
