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
  "SKILL.pt-BR.md",
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
  const en = pipelinePhases(path.join(REPO_ROOT, "SKILL.md"));
  const pt = pipelinePhases(path.join(REPO_ROOT, "SKILL.pt-BR.md"));
  assert.equal(en.length, 13, `SKILL.md deve listar 13 fases, listou ${en.length}`);
  assert.equal(pt.length, 13, `SKILL.pt-BR.md deve listar 13 fases, listou ${pt.length}`);
  assert.deepEqual(pt, en, "pipeline divergente entre SKILL.md e SKILL.pt-BR.md");
});

test("AC-7.2.3: node scripts/check-public-docs.mjs sai 0", () => {
  const result = runNode(["scripts/check-public-docs.mjs"]);
  assert.equal(result.status, 0, result.stderr);
});

test("DEC-007: SKILL.md is the English execution entry; SKILL.en.md does not exist", () => {
  assert.equal(fs.existsSync(path.join(REPO_ROOT, "SKILL.en.md")), false);
  const skill = fs.readFileSync(path.join(REPO_ROOT, "SKILL.md"), "utf8");
  const skillPt = fs.readFileSync(path.join(REPO_ROOT, "SKILL.pt-BR.md"), "utf8");
  assert.match(skill, /## Kit language/);
  assert.match(skill, /DEC-007/);
  assert.match(skill, /never from `SKILL\.pt-BR\.md`/);
  assert.match(skillPt, /## Idioma do kit/);
  assert.match(skillPt, /DEC-007/);
  assert.doesNotMatch(skillPt, /`Alvo: staging`/);
});

test("DEC-007: phase prompts use English Target, not Alvo", () => {
  const validate = fs.readFileSync(path.join(REPO_ROOT, "prompts", "validate.md"), "utf8");
  assert.match(validate, /Target: staging/);
  assert.match(validate, /Target: applied/);
  assert.doesNotMatch(validate, /\bAlvo:/);
});
