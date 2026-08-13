// AC-1.5.1, AC-1.5.2 e AC-1.5.3: o catálogo base de roteamento é a conversão
// fiel do catálogo vivo `catalog/routing-defaults.json`, com destinos legais.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import {
  REPO_ROOT,
  mkdtemp,
  copyKit,
  writeJson,
  runNode,
} from "./helpers/fs-utils.mjs";

const catalog = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "catalog", "routing-defaults.json"), "utf8"),
);

const LEGAL_PREFIXES = ["project-rules/", "_app-vault/", ".app-work/"];

const isLegalDestination = (destination) => {
  if (destination === null) return true;
  if (typeof destination !== "string" || destination.length === 0) return false;
  if (destination === "AGENTS.md") return true;
  return LEGAL_PREFIXES.some((prefix) => destination.startsWith(prefix));
};

test("AC-1.5.1: toda linha da Tabela vigente virou entrada (36), com as 4 baixas em destination null", () => {
  assert.equal(Array.isArray(catalog.entries), true);
  assert.equal(catalog.entries.length, 36);
  const low = catalog.entries.filter((entry) => entry.confidence === "baixa");
  assert.equal(low.length, 4);
  for (const entry of low) {
    assert.equal(entry.destination, null, `linha baixa com destino concreto: ${entry.pattern}`);
  }
  for (const entry of catalog.entries) {
    assert.equal(typeof entry.pattern, "string");
    assert.ok(entry.pattern.length > 0);
    assert.ok(["alta", "baixa"].includes(entry.confidence));
    assert.equal(typeof entry.since, "string");
    assert.equal(typeof entry.reason, "string");
  }
});

test("AC-1.5.1: destination null é exatamente as 10 linhas sem destino único (6 alta + 4 baixa)", () => {
  // Divergência registrada no Impl do Plano 01 vs AC declarado: além das 4
  // linhas de confiança baixa (destino "—" na Tabela vigente), 6 linhas de
  // confiança alta não têm destino único conversível: 5 têm destino
  // procedimental multi-passo ("extrair DECs → ...") e 1 ("logo / asset de
  // marca") aponta para `assets/` na raiz, fora da lista fechada de SCHEMA.md
  // §2 e de project-rules/. Converter qualquer uma delas em destino concreto
  // seria roteamento silencioso de um caso que exige procedimento ou pergunta.
  const nulls = catalog.entries.filter((entry) => entry.destination === null);
  assert.equal(nulls.length, 10);
  for (const entry of nulls) {
    assert.equal(typeof entry.reason, "string");
    assert.ok(entry.reason.length > 0, `null sem reason: ${entry.pattern}`);
  }
});

test("AC-1.5.2: o catálogo real só declara destinos legais", () => {
  const illegal = catalog.entries.filter((entry) => !isLegalDestination(entry.destination));
  assert.deepEqual(illegal, []);
});

test("AC-1.5.2: validador do catálogo reprova destino ilegal nomeando a entrada", () => {
  const tmp = mkdtemp("hep-catalog-");
  copyKit(tmp);
  const mutated = structuredClone(catalog);
  mutated.entries.push({
    pattern: "pasta-teste-ilegal",
    destination: "nada/fora-dos-territorios",
    confidence: "alta",
    since: "teste",
    reason: "entrada mutante para o teste",
  });
  writeJson(tmp, "catalog/routing-defaults.json", mutated);
  const result = runNode(["scripts/validate-skill-kit.mjs", tmp]);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("pasta-teste-ilegal"), result.stderr);
});

test("AC-1.5.3: assets absorvidos listados em requiredFiles e SCHEMA.md sem AppVault", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "manifests", "kit-manifest.json"), "utf8"),
  );
  for (const required of [
    "references/vault-schema/SCHEMA.md",
    "templates/vault/DECISION_TEMPLATE.md",
    "templates/vault/INDEX_TEMPLATE.md",
    "templates/vault/ISSUES_README_TEMPLATE.md",
    "templates/vault/ISSUES_INDEX_TEMPLATE.md",
    "catalog/routing-defaults.json",
    "catalog/drift-catalog.json",
    "schemas/routing.schema.json",
  ]) {
    assert.ok(manifest.requiredFiles.includes(required), `faltou requiredFiles: ${required}`);
  }
  const schemaDoc = fs.readFileSync(
    path.join(REPO_ROOT, "references", "vault-schema", "SCHEMA.md"),
    "utf8",
  );
  assert.ok(!schemaDoc.includes("AppVault"));
});

test("AC-1.5.3: validate-skill-kit sai 0 com os assets absorvidos", () => {
  const result = runNode(["scripts/validate-skill-kit.mjs"]);
  assert.equal(result.status, 0, result.stderr);
});
