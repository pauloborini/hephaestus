// AC-6.1.3 (D28): a lista de artefatos vigiados em maintain vem do
// `catalog/drift-catalog.json` (base) + overlay do estado (bloco `routing`),
// nunca embutida em prompt. Seam: catálogo -> escopo/cascata; ancorada.
// Asserção discriminante: o MESMO repositório muda de inventário quando SÓ o
// estado muda — entrada nova no overlay com glob de ferramenta fora do
// catálogo base torna o artefato correspondente inventariado, sem nenhuma
// alteração em prompts/.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { REPO_ROOT, writeFile, writeJson, runNode } from "./helpers/fs-utils.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";
import { loadDriftCatalog, watchedGlobs, discoverMaintain } from "./helpers/maintain-engine.mjs";

const BASE_STATE = {
  meta: { lastRunAt: "2026-08-11T00:00:00.000Z" },
  routing: { overlay: [] },
  answers: {},
  shield: [],
};

test("AC-6.1.3/D28: catálogo base tem as 8 entradas de D28 com glob, tool e since", () => {
  const catalog = loadDriftCatalog();
  assert.equal(catalog.artifacts.length, 8);
  const globs = catalog.artifacts.map((a) => a.glob);
  for (const expected of [
    ".cursor/rules/",
    ".cursorrules",
    ".windsurfrules",
    ".github/copilot-instructions.md",
    ".devin/",
    ".clinerules",
    ".aider.conf.yml",
    ".junie/",
  ]) {
    assert.ok(globs.includes(expected), `faltou glob ${expected}`);
  }
  for (const artifact of catalog.artifacts) {
    assert.equal(typeof artifact.tool, "string");
    assert.ok(artifact.tool.length > 0);
    assert.equal(typeof artifact.since, "string");
    assert.ok(artifact.since.length > 0);
  }
  // validador do kit aceita o shape {glob, tool, since}
});

test("AC-6.1.3: glob do overlay torna o artefato inventariado sem tocar em prompts", () => {
  const root = copyFixture("pacote-adopt");
  writeJson(root, ".app-work/hephaestus-state.json", BASE_STATE);
  writeFile(root, ".roo/rules.md", "# Regra do Roo\n\nNenhuma chamada sem idempotência.\n");

  // sem overlay: .roo/ não está no catálogo base ⇒ não é vigiado
  const without = discoverMaintain(root, { state: BASE_STATE });
  assert.ok(
    !without.driftSources.some((d) => d.path === ".roo/rules.md"),
    `inventariou artefato fora do catálogo: ${JSON.stringify(without.driftSources)}`,
  );

  // overlay acrescenta o glob: SÓ o estado mudou, prompts intactos
  const withOverlay = {
    ...BASE_STATE,
    routing: {
      overlay: [{ pattern: ".roo/", destination: ".app-work/archive/", confidence: "alta" }],
    },
  };
  const withEntry = discoverMaintain(root, { state: withOverlay });
  const watched = watchedGlobs(loadDriftCatalog(), withOverlay);
  assert.ok(watched.includes(".roo/"), `overlay não entrou na lista vigiada: ${watched}`);
  const drift = withEntry.driftSources.find((d) => d.path === ".roo/rules.md");
  assert.ok(drift, `artefato do overlay não inventariado: ${JSON.stringify(withEntry.driftSources)}`);
  assert.equal(drift.tool, "overlay");

  // o prompt contrata lista por dado (catálogo + overlay), nunca embutida
  const discover = fs.readFileSync(path.join(REPO_ROOT, "prompts", "discover.md"), "utf8");
  assert.match(discover, /catalog\/drift-catalog\.json/);
  assert.match(discover, /overlay/);
  assert.match(discover, /nunca embutida no prompt/);
  // LEG8: nenhum glob de drift embutido em prompt
  const prompts = fs
    .readdirSync(path.join(REPO_ROOT, "prompts"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.readFileSync(path.join(REPO_ROOT, "prompts", f), "utf8"))
    .join("\n");
  assert.ok(!prompts.includes(".cursorrules"), "glob de drift embutido em prompt (LEG8)");
  assert.ok(!prompts.includes("windsurfrules"), "glob de drift embutido em prompt (LEG8)");
});

test("AC-6.1.3: entradas do catálogo base têm glob e tool por entrada (shape validado pelo kit)", () => {
  const result = runNode(["scripts/validate-skill-kit.mjs"]);
  assert.equal(result.status, 0, result.stderr);
});
