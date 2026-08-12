// AC-4.2.1 e INV4 (D18, seam S7, nível ancorada): `checkDuplicatedValue` do
// validador reprova o mesmo valor de decisão repetido literalmente em
// `project-rules/**` sem citar a `DEC-NNN` correspondente na mesma linha ou
// no mesmo bloco; com a citação (ou sem o número — a referência prescrita),
// passa. A extração exige número + unidade (nunca um dígito solto) para não
// reprovar por coincidência textual. O split obrigatório do caso híbrido é
// documentado em `prompts/reconcile.md:Verificações` (SCHEMA.md §8).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, runNode, writeFile } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const decisionClause = (decId, title, statement) =>
  `# Planos\n\nAfeta: [billing]\n\n### ${decId} — ${title}\n\n${statement}\n`;

const packageWithValue = (pkg, { ruleContent }) => {
  makeValidPackage(pkg);
  writeFile(
    pkg,
    "_app-vault/docs/decisions/planos.md",
    decisionClause("DEC-016", "Cota de export do plano gratuito", "Plano gratuito: 20 exports/mês."),
  );
  writeFile(pkg, "project-rules/rules/domain_rules.md", ruleContent);
  return pkg;
};

test("AC-4.2.1/INV4: mesmo limite nos dois territórios sem citar o ID reprova nomeando os dois lugares", () => {
  const pkg = mkdtemp("hep-st-dup-");
  packageWithValue(pkg, {
    ruleContent: [
      "# Regras de domínio",
      "",
      "O limite de consultas é de 20 exports/mês para todos os clientes.",
      "",
    ].join("\n"),
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("20 exports/mês"), result.stderr);
  assert.ok(result.stderr.includes("DEC-016"), result.stderr);
  assert.ok(result.stderr.includes("domain_rules.md"), result.stderr);
});

test("AC-4.2.1/INV4: citação `conforme DEC-016` no mesmo bloco e sem o número passa", () => {
  const pkg = mkdtemp("hep-st-cite-");
  // a referência prescrita: project-rules/ cita o ID, nunca copia o valor
  packageWithValue(pkg, {
    ruleContent: [
      "# Regras de domínio",
      "",
      "O limite de consultas segue a decisão de produto conforme DEC-016.",
      "",
    ].join("\n"),
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.1/INV4: valor com a citação no mesmo bloco também passa (referência permitida)", () => {
  const pkg = mkdtemp("hep-st-citeval-");
  packageWithValue(pkg, {
    ruleContent: [
      "# Regras de domínio",
      "",
      "Aplicar o limite de 20 exports/mês conforme DEC-016 no backend.",
      "",
    ].join("\n"),
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.1: dígito solto sem unidade não é valor de decisão — não reprova por coincidência", () => {
  const pkg = mkdtemp("hep-st-bare-");
  packageWithValue(pkg, {
    ruleContent: [
      "# Regras de domínio",
      "",
      "O pipeline roda 20 jobs em paralelo na esteira de CI.",
      "",
    ].join("\n"),
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.1: citação de outro DEC-NNN no mesmo bloco não libera a duplicação", () => {
  const pkg = mkdtemp("hep-st-wrongid-");
  packageWithValue(pkg, {
    ruleContent: [
      "# Regras de domínio",
      "",
      "O limite de consultas é de 20 exports/mês (conforme DEC-999).",
      "",
    ].join("\n"),
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("DEC-016"), result.stderr);
});

test("AC-4.2.1: sem vault de decisões o gate é skipped (pacotes sem território vault)", () => {
  const pkg = mkdtemp("hep-st-skip-");
  makeValidPackage(pkg);
  writeFile(pkg, "project-rules/rules/domain_rules.md", "O limite é de 20 exports/mês.\n");
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.2.1: reconcile.md documenta o split obrigatório do caso híbrido", () => {
  const reconcile = fs.readFileSync(
    path.join(import.meta.dirname, "..", "..", "prompts", "reconcile.md"),
    "utf8",
  );
  const split = reconcile.slice(reconcile.indexOf("Split obrigatório"));
  assert.ok(split.length > 0, "reconcile.md deve documentar o split obrigatório");
  assert.match(split, /docs\/decisions\//);
  assert.match(split, /project-rules\//);
  assert.match(split, /referenciando o ID|referencia o ID|referencia a `DEC-NNN`/i);
  assert.match(split, /nunca copiando o número|nunca copia o valor/i);
});
