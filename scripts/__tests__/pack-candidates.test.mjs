import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";
import { validate } from "./helpers/json-schema.mjs";

const schema = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "schemas", "pack-candidates.schema.json"), "utf8"),
);

test("pack-candidates válido", () => {
  const result = validate(schema, {
    version: 1,
    entries: [{
      pattern: ".app-work/design-x/",
      destination: ".app-work/archive/docs/",
      evidence: "pasta fora da lista fechada; usuario aceitou candidato",
      answeredAt: "2026-08-17T00:00:00.000Z",
    }],
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("interview.md pergunta includeInPack e proíbe overlay de pasta", () => {
  const md = fs.readFileSync(path.join(REPO_ROOT, "prompts", "interview.md"), "utf8");
  assert.match(md, /includeInPack/);
  assert.match(md, /pack-candidates\.json/);
  assert.match(md, /não edita/);
  const close = fs.readFileSync(path.join(REPO_ROOT, "prompts", "closeout.md"), "utf8");
  assert.match(close, /Candidatos a pack/);
});
