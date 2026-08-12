// AC-7.2.2 e AC-7.2.3 (S2, ancorada): a superfície pública do produto único.
//
// AC-7.2.2 (D1): o termo "AppVault" some do vocabulário dos artefatos
// distribuíveis; só os nomes de path `_app-vault/` e `.app-work/` sobrevivem
// (D5). AC-7.2.3: os pares de idioma continuam linkados (gate recíproco) e os
// dois SKILL listam as mesmas 13 fases, na mesma ordem — o gate de links não
// pega divergência de conteúdo, então a paridade é asserida aqui.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, runNode } from "./helpers/fs-utils.mjs";

const PUBLIC_FILES = [
  "SKILL.md",
  "SKILL.en.md",
  "README.md",
  "README.pt-BR.md",
  "COMMANDS.md",
  "COMMANDS.pt-BR.md",
];

const DISTRIBUTABLE_DIRS = ["prompts", "templates", "schemas", "manifests", "catalog"];

const listDistributableFiles = () => {
  const files = [];
  for (const dir of DISTRIBUTABLE_DIRS) {
    const stack = [path.join(REPO_ROOT, dir)];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const abs = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(abs);
        } else {
          files.push(abs);
        }
      }
    }
  }
  return files;
};

test("AC-7.2.2: nenhum artefato distribuível cita AppVault como produto", () => {
  const files = [...PUBLIC_FILES.map((file) => path.join(REPO_ROOT, file)), ...listDistributableFiles()];
  const violations = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (/app-?vault/i.test(line) && !line.includes("_app-vault")) {
        violations.push(`${path.relative(REPO_ROOT, file)}:${index + 1}: ${line.trim()}`);
      }
    }
  }
  assert.deepEqual(violations, [], "termo AppVault sobrevive como nome de produto em artefato distribuível (D1)");
});

const pipelinePhases = (skillPath) => {
  const lines = fs.readFileSync(skillPath, "utf8").split("\n");
  return lines
    .filter((line) => /^\d+\.\s+`[a-z_]+`\s*$/.test(line))
    .map((line) => line.match(/`([a-z_]+)`/)[1]);
};

test("AC-7.2.3: os dois SKILL listam as mesmas 13 fases, na mesma ordem", () => {
  const pt = pipelinePhases(path.join(REPO_ROOT, "SKILL.md"));
  const en = pipelinePhases(path.join(REPO_ROOT, "SKILL.en.md"));
  assert.equal(pt.length, 13, `SKILL.md deve listar 13 fases, listou ${pt.length}`);
  assert.equal(en.length, 13, `SKILL.en.md deve listar 13 fases, listou ${en.length}`);
  assert.deepEqual(pt, en, "pipeline divergente entre SKILL.md e SKILL.en.md");
});

test("AC-7.2.3: node scripts/check-public-docs.mjs sai 0", () => {
  const result = runNode(["scripts/check-public-docs.mjs"]);
  assert.equal(result.status, 0, result.stderr);
});
