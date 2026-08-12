// AC-1.3.2 e AC-1.3.3: o mecanismo hephaestus:immutable morreu no kit inteiro
// (LEG1 + LEG2) e o validador do kit segue verde sem o schema removido.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { REPO_ROOT, runNode } from "./helpers/fs-utils.mjs";

const KIT_PATHS = [
  "SKILL.md",
  "SKILL.en.md",
  "prompts",
  "schemas",
  "scripts",
  "manifests",
];

const collectFiles = (relPath) => {
  const abs = path.join(REPO_ROOT, relPath);
  if (fs.statSync(abs).isFile()) return [relPath];
  const out = [];
  const stack = [abs];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryAbs = path.join(current, entry.name);
      const entryRel = path.relative(REPO_ROOT, entryAbs);
      // scripts/__tests__ fica fora do kit distribuível (packExcludes);
      // o AC-1.3.2 varre o kit, não o harness.
      if (entryRel === path.join("scripts", "__tests__")) continue;
      if (entry.isDirectory()) {
        stack.push(entryAbs);
      } else {
        out.push(entryRel);
      }
    }
  }
  return out;
};

test("AC-1.3.2/LEG1+LEG2: nenhuma ocorrência de immutable no kit", () => {
  const offenders = [];
  for (const relPath of KIT_PATHS) {
    for (const file of collectFiles(relPath)) {
      const contents = fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
      if (/immutable/i.test(contents)) {
        offenders.push(file);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("AC-1.3.2: schema immutable-blocks-report não existe mais", () => {
  assert.equal(
    fs.existsSync(path.join(REPO_ROOT, "schemas", "immutable-blocks-report.schema.json")),
    false,
  );
});

test("AC-1.3.3: kit-manifest não exige mais o schema apagado", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "manifests", "kit-manifest.json"), "utf8"),
  );
  assert.ok(!manifest.requiredFiles.includes("schemas/immutable-blocks-report.schema.json"));
});

test("AC-1.3.3: validate-skill-kit sai 0 após a remoção", () => {
  const result = runNode(["scripts/validate-skill-kit.mjs"]);
  assert.equal(result.status, 0, result.stderr);
});
