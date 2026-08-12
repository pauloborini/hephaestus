// AC-1.2.3 e LEG10: run-state.schema.json lista as 13 fases em currentPhase,
// phaseStates e artifactState.phase, sem citar classify/synthesize/export_apply.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync } from "node:fs";
import { validate } from "./helpers/json-schema.mjs";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";
import { THE_13_PHASES, makeValidPackage } from "./helpers/package-fixture.mjs";
import { mkdtemp, readJson } from "./helpers/fs-utils.mjs";

const runStateSchema = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "schemas", "run-state.schema.json"), "utf8"),
);

const LEGACY_PHASES = ["classify", "synthesize", "export_apply", "closeout_review"];

test("AC-1.2.3: currentPhase enum tem exatamente as 13 fases, na ordem do pipeline", () => {
  assert.deepEqual(runStateSchema.properties.currentPhase.enum, THE_13_PHASES);
});

test("AC-1.2.3: phaseStates requer as mesmas 13 fases", () => {
  const phaseKeys = Object.keys(runStateSchema.properties.phaseStates.properties);
  assert.deepEqual(phaseKeys, THE_13_PHASES);
  assert.deepEqual(runStateSchema.properties.phaseStates.required, THE_13_PHASES);
});

test("AC-1.2.3: artifactState.phase usa o mesmo enum de 13 fases", () => {
  assert.deepEqual(
    runStateSchema.$defs.artifactState.properties.phase.enum,
    THE_13_PHASES,
  );
});

test("AC-1.2.3: nenhum dos três pontos cita fases do pipeline de 8", () => {
  const enums = [
    runStateSchema.properties.currentPhase.enum,
    Object.keys(runStateSchema.properties.phaseStates.properties),
    runStateSchema.$defs.artifactState.properties.phase.enum,
  ];
  for (const enumValues of enums) {
    for (const legacy of LEGACY_PHASES) {
      assert.ok(!enumValues.includes(legacy), `fase legada "${legacy}" ainda no enum`);
    }
  }
});

test("AC-1.2.3: run-state com as 13 fases é aceito pelo schema; com fase antiga, rejeitado", () => {
  const tmp = mkdtemp("hep-runstate-");
  makeValidPackage(tmp);
  const runState = readJson(path.join(tmp, ".hephaestus", "manifests", "run-state.json"));
  const ok = validate(runStateSchema, runState);
  assert.equal(ok.valid, true, ok.errors.join("\n"));

  const withLegacy = structuredClone(runState);
  withLegacy.phaseStates.classify = { status: "not_started" };
  const rejected = validate(runStateSchema, withLegacy);
  assert.equal(rejected.valid, false);
});
