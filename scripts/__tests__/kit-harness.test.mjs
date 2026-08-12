// AC-1.4.2: o texto de fixture com padrões legados não reprova o kit inteiro,
// porque scripts/__tests__ está em skippedRelativePaths do validate-skill-kit.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { REPO_ROOT, runNode } from "./helpers/fs-utils.mjs";

test("AC-1.4.2: validate-skill-kit sai 0 com fixture contendo memory/", () => {
  const result = runNode(["scripts/validate-skill-kit.mjs"]);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-1.4.2: skippedRelativePaths isenta scripts/__tests__", () => {
  const source = fs.readFileSync(
    path.join(REPO_ROOT, "scripts", "validate-skill-kit.mjs"),
    "utf8",
  );
  assert.ok(source.includes('path.join("scripts", "__tests__")'), source);
});
