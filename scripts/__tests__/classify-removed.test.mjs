// AC-3.1.4 e LEG3: prompts/classify.md não existe e nenhuma ocorrência de
// "classify" ou "operationalRoleCandidate" sobrevive em SKILL.md, SKILL.en.md,
// prompts/, schemas/ e manifests/ — a taxonomia de uma dimensão não pode
// coexistir com a cascata.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";

const targets = [
  path.join(REPO_ROOT, "SKILL.md"),
  path.join(REPO_ROOT, "SKILL.en.md"),
  path.join(REPO_ROOT, "prompts"),
  path.join(REPO_ROOT, "schemas"),
  path.join(REPO_ROOT, "manifests"),
];

test("AC-3.1.4/LEG3: prompts/classify.md não existe", () => {
  assert.equal(fs.existsSync(path.join(REPO_ROOT, "prompts", "classify.md")), false);
});

test("AC-3.1.4/LEG3: zero ocorrências de classify|operationalRoleCandidate em SKILL/EN/prompts/schemas/manifests", () => {
  const offenders = [];
  for (const target of targets) {
    if (fs.statSync(target).isDirectory()) {
      for (const file of fs.readdirSync(target)) {
        const abs = path.join(target, file);
        if (fs.statSync(abs).isDirectory()) continue;
        const contents = fs.readFileSync(abs, "utf8");
        if (/classify|operationalRoleCandidate/.test(contents)) offenders.push(abs);
      }
    } else {
      const contents = fs.readFileSync(target, "utf8");
      if (/classify|operationalRoleCandidate/.test(contents)) offenders.push(target);
    }
  }
  assert.deepEqual(offenders, []);
});

test("AC-3.1.4: prompts/route.md existe (substituto de classify)", () => {
  assert.equal(fs.existsSync(path.join(REPO_ROOT, "prompts", "route.md")), true);
});
