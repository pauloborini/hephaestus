// AC-2.5.2 e LEG9: validate.md declara os dois alvos (staging | applied) e
// SKILL.md/SKILL.en.md listam as mesmas 13 fases na mesma ordem, com
// verify_staging e verify_applied como fases distintas nas 13.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";
import { THE_13_PHASES } from "./helpers/package-fixture.mjs";

const listPhases = (skillContents) => {
  const matches = [...skillContents.matchAll(/^\s*\d+\.\s*`([a-z_]+)`/gm)].map((m) => m[1]);
  return matches;
};

test("AC-2.5.2: SKILL.md lista as 13 fases com verify_staging e verify_applied distintas", () => {
  const skill = fs.readFileSync(path.join(REPO_ROOT, "SKILL.md"), "utf8");
  const phases = listPhases(skill);
  assert.deepEqual(phases, THE_13_PHASES);
  assert.ok(phases.includes("verify_staging"), "verify_staging ausente");
  assert.ok(phases.includes("verify_applied"), "verify_applied ausente");
  assert.notEqual(phases.indexOf("verify_staging"), phases.indexOf("verify_applied"));
});

test("LEG9: SKILL.en.md lista as mesmas 13 fases na mesma ordem", () => {
  const skillEn = fs.readFileSync(path.join(REPO_ROOT, "SKILL.en.md"), "utf8");
  const phasesEn = listPhases(skillEn);
  assert.deepEqual(phasesEn, THE_13_PHASES);
});

test("AC-2.5.2: validate.md declara os alvos staging e applied", () => {
  const validate = fs.readFileSync(path.join(REPO_ROOT, "prompts", "validate.md"), "utf8");
  assert.match(validate, /staging/);
  assert.match(validate, /applied/);
  assert.match(validate, /Alvo/);
});
