// AC-1.2.1, AC-1.2.2 e a prova de morte do LEG5: o contrato do fragmento tem
// territory + regime obrigatórios e independentes, e provenance[] com >= 1 origem.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFileSync } from "node:fs";
import { validate } from "./helpers/json-schema.mjs";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";

const fragmentSchema = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "schemas", "fragment.schema.json"), "utf8"),
);

const validFragment = (overrides = {}) => ({
  fragmentId: "frag-1",
  rawText: "Regra de exemplo.",
  territory: "vault",
  regime: "reconcile",
  confidence: 0.9,
  ambiguity: "low",
  provenance: [{ sourcePath: "docs/guia.md", startOffset: 10, endOffset: 40 }],
  ...overrides,
});

test("AC-1.2.1: fragmento sem regime é rejeitado pelo schema", () => {
  const { regime, ...withoutRegime } = validFragment();
  assert.ok(regime);
  const result = validate(fragmentSchema, withoutRegime);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('"regime"')));
});

test("AC-1.2.1: fragmento com territory vault e regime reconcile é aceito", () => {
  const result = validate(fragmentSchema, validFragment());
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("AC-1.2.1: enum de territory não volta aos papéis de uma dimensão", () => {
  assert.deepEqual(fragmentSchema.properties.territory.enum, [
    "agents",
    "project-rules",
    "vault",
    "process",
  ]);
  assert.deepEqual(fragmentSchema.properties.regime.enum, [
    "keep",
    "generate",
    "reconcile",
    "relocate",
  ]);
  assert.ok(fragmentSchema.required.includes("territory"));
  assert.ok(fragmentSchema.required.includes("regime"));
});

test("AC-1.2.2: provenance com duas origens é aceito", () => {
  const result = validate(
    fragmentSchema,
    validFragment({
      provenance: [
        { sourcePath: "docs/guia.md", startOffset: 10, endOffset: 40 },
        { sourcePath: "docs/manual.md", startOffset: 3, endOffset: 9 },
      ],
    }),
  );
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("AC-1.2.2: provenance vazio é rejeitado (minItems 1)", () => {
  const result = validate(fragmentSchema, validFragment({ provenance: [] }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("minItems")));
});

test("LEG5: operationalRoleCandidate e sourcePath singular saíram do contrato", () => {
  assert.ok(!("operationalRoleCandidate" in fragmentSchema.properties));
  assert.ok(!("sourcePath" in fragmentSchema.properties));
  assert.ok(fragmentSchema.required.includes("provenance"));
  assert.equal(fragmentSchema.properties.provenance.minItems, 1);
  const item = fragmentSchema.properties.provenance.items;
  assert.equal(item.additionalProperties, false);
  assert.deepEqual(Object.keys(item.properties).sort(), [
    "endOffset",
    "sourcePath",
    "startOffset",
  ]);
});
