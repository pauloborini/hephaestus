// AC-3.2.2 e INV11: duas execuções sem alteração de fonte produzem diff
// vazio — o plan.json da segunda passada não contém operação diferente de
// keep/skip e nenhum DEC-NNN novo é cunhado. Golden replay: a primeira
// passada é a captura golden-routing-adopt; a segunda roda sobre o estado
// aplicado (apply simulado movendo origens + reconcile simulado completando
// a adoção — cunha o heading `### DEC-NNN — …` nos destinos de decisão,
// como a execução real faz na mesma rodada, DEC-004).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, runNode, writeJson } from "./helpers/fs-utils.mjs";
import { copyFixture, FIXTURES_DIR } from "./helpers/fixtures.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";
import {
  buildRouting,
  buildFragments,
  applyRouting,
  routingToPlan,
} from "./helpers/routing-engine.mjs";
import { reconcileVault } from "./helpers/reconcile-engine.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const loadGolden = () =>
  JSON.parse(
    fs.readFileSync(path.join(FIXTURES_DIR, "golden-routing-adopt.json"), "utf8"),
  );

test("AC-3.2.2/INV11: segunda passada sobre fonte inalterada produz plan só com keep/skip", () => {
  const fixture = copyFixture("repo-desorganizado");
  const golden = loadGolden();

  // passada 1 — re-emissão: igual ao golden (a captura)
  const fragments1 = buildFragments(fixture);
  const pass1 = buildRouting(fixture, { fragments: fragments1 });
  assert.deepEqual(pass1.routing, golden.entries);
  // determinismo: mesma entrada, mesma saída
  const pass1b = buildRouting(fixture, { fragments: fragments1 });
  assert.deepEqual(pass1b.routing, pass1.routing);

  // apply simulado: materializa os destinos movendo as origens (bytes iguais)
  applyRouting(fixture, pass1.routing, fragments1);

  // reconcile simulado (DEC-004): a execução real completa a adoção na mesma
  // rodada — o reconcile cunha o heading canônico nos destinos de decisão.
  // Sem esta etapa a passada 2 re-reconciliaria um arquivo que a execução
  // real deixa canônico (INV11 mede a estabilidade pós-execução).
  const reconciled = reconcileVault({
    fragments: fragments1,
    routing: pass1.routing,
    repoRoot: fixture,
    now: "2026-08-13",
  });
  for (const [relPath, content] of reconciled.decisions) {
    fs.writeFileSync(path.join(fixture, relPath), content);
  }

  // passada 2 — fonte inalterada, tudo no lugar: tudo keep
  const pass2 = buildRouting(fixture);
  assert.ok(pass2.routing.length > 0, "passada 2 deve rotear os arquivos aplicados");
  for (const entry of pass2.routing) {
    assert.equal(entry.regime, "keep", `${entry.destinationPath} deveria ser keep na reexecução`);
  }

  // nenhum DEC-NNN novo: nenhuma entrada com destino em docs/decisions com
  // regime de criação (generate/reconcile) na segunda passada
  const decEntries = pass2.routing.filter((e) =>
    e.destinationPath.startsWith("_app-vault/docs/decisions/"),
  );
  for (const entry of decEntries) {
    assert.equal(entry.regime, "keep", "fragmento de decisão não pode ser recriado na reexecução");
  }

  // plan.json da segunda passada: só keep/skip, validado pelo checkPlanContract real
  const plan = routingToPlan(pass2.routing);
  for (const entry of plan.entries) {
    assert.ok(["keep", "skip"].includes(entry.operation), `operação ${entry.operation} proibida na reexecução`);
  }
  const pkg = mkdtemp("hep-idem-plan-");
  makeValidPackage(pkg);
  writeJson(pkg, ".hephaestus/plan.json", plan);
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});
