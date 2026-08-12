// AC-2.4.2 e AC-2.4.3: apply exige backup completo antes do primeiro byte
// (semântica append), bloqueia com backup incompleto e worktree suja, escreve
// na ordem `relocate` -> `reconcile` -> `generate` -> `keep`, e grava a lista
// final do `staging-manifest.json` inteiro — nunca um subconjunto (mutador
// absoluto, §0 do GUIDE).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, mkdtemp, writeFile, writeJson } from "./helpers/fs-utils.mjs";

const applyPrompt = () =>
  fs.readFileSync(path.join(REPO_ROOT, "prompts", "apply.md"), "utf8");

test("AC-2.4.2: gate exige backup completo antes do primeiro byte; bloqueia com backup incompleto e worktree suja", () => {
  const prompt = applyPrompt();
  assert.match(prompt, /antes do primeiro byte/);
  assert.match(prompt, /backup completo/);
  assert.match(prompt, /## Bloqueia se/);
  assert.match(prompt, /backup incompleto/);
  assert.match(prompt, /worktree suja/);
  assert.match(prompt, /sem rotação nem reuso/);
});

test("AC-2.4.2: staging com artefatos nos quatro regimes e a ordem declarada é relocate -> reconcile -> generate -> keep", () => {
  const tmp = mkdtemp("hep-apply-");
  writeFile(tmp, ".hephaestus/staging/AGENTS.md", "# X — contrato do agente\n");
  writeFile(tmp, ".hephaestus/staging/project-rules/rules/domain_rules.md", "# regra\n");
  writeFile(tmp, ".hephaestus/staging/_app-vault/docs/decisions/dec-001.md", "### DEC-001\n");
  writeFile(tmp, ".hephaestus/staging/.app-work/hephaestus-state.json", "{}\n");
  writeJson(tmp, ".hephaestus/staging-manifest.json", {
    version: 1,
    artifacts: [
      { outputPath: "AGENTS.md", regime: "keep", sha256: "a".repeat(64) },
      { outputPath: "project-rules/rules/domain_rules.md", regime: "generate", sha256: "b".repeat(64) },
      { outputPath: "_app-vault/docs/decisions/dec-001.md", regime: "reconcile", sha256: "c".repeat(64) },
      { outputPath: ".app-work/hephaestus-state.json", regime: "relocate", sha256: "d".repeat(64) },
    ],
  });

  const prompt = applyPrompt();
  const orderSection =
    prompt.split("## Ordem transacional de escrita")[1]?.split("## Lista final")[0] ?? "";
  const expectedOrder = ["relocate", "reconcile", "generate", "keep"];
  let lastIndex = -1;
  for (const regime of expectedOrder) {
    const index = orderSection.indexOf(regime);
    assert.ok(index > lastIndex, `regime ${regime} fora da ordem em apply.md`);
    lastIndex = index;
  }
});

test("AC-2.4.3: lista final é o staging-manifest.json inteiro, nunca um subconjunto", () => {
  const prompt = applyPrompt();
  assert.match(prompt, /staging-manifest\.json/);
  assert.match(prompt, /nunca um subconjunto/);
  assert.match(prompt, /artifactsWritten/);
});

test("AC-2.4.3: a exceção de INV1 está declarada — interview grava o state fora da transação e o rollback nunca o reverte", () => {
  const prompt = applyPrompt();
  assert.match(prompt, /interview/);
  assert.match(prompt, /hephaestus-state\.json/);
  assert.match(prompt, /fora da transação/);
  assert.match(prompt, /rollback/);
  assert.match(prompt, /nunca/);
});
