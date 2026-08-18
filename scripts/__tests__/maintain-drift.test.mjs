// AC-6.1.1 e AC-6.1.2 (CN2): o modo `maintain` recentraliza SÓ o drift e deixa
// o resto em `keep` — as duas metades na mesma asserção (pre-mortem do GUIDE).
// Seam S5 (Modo -> escopo), ancorada: fixture adotado (pacote-adopt) com state
// presente (⇒ maintain) onde foi criado `.cursor/rules/arquitetura.mdc` com
// uma regra de arquitetura; o escopo reduzido de `prompts/discover.md` é
// consumido pelo motor de referência (maintain-engine.mjs) e a cascata
// existente (routing-engine.mjs) decide o destino — o drift vira regra em
// `project-rules/rules/` e todo fragmento não relacionado ao drift permanece
// `regime: keep`, com o plano sem nenhuma operação de escrita sobre eles.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, writeFile, writeJson } from "./helpers/fs-utils.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";
import { runMaintainPipeline, discoverMaintain } from "./helpers/maintain-engine.mjs";

const ADOPTED_STATE = {
  meta: {
    packVersion: "1.0.0",
    schemaVersion: "1.0.0",
    lastRunAt: "2026-08-11T00:00:00.000Z",
    lastRunId: "run-anterior",
  },
  routing: { overlay: [] },
  answers: {},
  shield: [],
};

const DRIFT_RULE = "# Arquitetura\n\nToda comunicação com o serviço de pagamentos deve usar HTTPS obrigatoriamente.\n";

const adoptedWithDrift = () => {
  const root = copyFixture("pacote-adopt");
  writeJson(root, ".app-work/hephaestus-state.json", ADOPTED_STATE);
  writeFile(root, ".cursor/rules/arquitetura.mdc", DRIFT_RULE);
  return root;
};

test("AC-6.1.1: escopo de maintain conhece o formato atual do Cursor e a regra é centralizada em project-rules/rules/", () => {
  const root = adoptedWithDrift();

  // metade escopo: o inventário guiado pelo catálogo de drift inclui a regra
  const inventory = discoverMaintain(root, { state: ADOPTED_STATE });
  const drift = inventory.driftSources.find((d) => d.path === ".cursor/rules/arquitetura.mdc");
  assert.ok(drift, `drift não inventariado: ${JSON.stringify(inventory.driftSources)}`);
  assert.equal(drift.tool, "cursor");

  // metade centralização: a cascata classifica a regra e a centraliza
  const { routing, closeout } = runMaintainPipeline(root, { state: ADOPTED_STATE, residue: [] });
  const entry = routing.find(
    (e) => e.destinationPath.startsWith("project-rules/rules/") && e.regime === "generate",
  );
  assert.ok(entry, `nenhum destino project-rules/rules/ no routing: ${JSON.stringify(routing)}`);
  assert.equal(entry.decidedBy, "detector");

  // origem reportada no fechamento (CN2)
  assert.ok(closeout.includes(".cursor/rules/arquitetura.mdc"), closeout);
  assert.ok(closeout.includes("project-rules/rules/"), closeout);

  // o prompt contrata o escopo por dado, nunca por lista embutida
  const discover = fs.readFileSync(path.join(REPO_ROOT, "prompts", "discover.md"), "utf8");
  assert.match(discover, /mode: maintain/);
  assert.match(discover, /catalog\/drift-catalog\.json/);
  assert.match(discover, /overlay/);
  assert.match(discover, /meta\.lastRunAt/);
  assert.match(discover, /CLAUDE\.md/);
  assert.match(discover, /integridade do vault/);
  assert.match(discover, /LEDGER\.md/);
  assert.match(discover, /nunca embutida no prompt/);
});

const hygieneAllow = (inventory, fragments) => {
  const hygiene = inventory.processHygiene ?? { relocate: [], deletes: [] };
  const marked = [...hygiene.deletes, ...hygiene.relocate.flatMap((r) => [r.from, r.to])];
  const isMarked = (p) =>
    Boolean(p) &&
    marked.some((m) => p === m || (m.endsWith("/") ? p.startsWith(m) : p.startsWith(`${m}/`)));
  const srcById = new Map(
    (fragments ?? []).map((f) => [f.fragmentId, f.provenance[0].sourcePath]),
  );
  return (entry) => {
    const dest = entry.destinationPath ?? entry.artifactPath;
    if (!dest?.startsWith(".app-work/")) return false;
    const src = srcById.get(entry.fragmentId ?? entry.origin);
    return isMarked(dest) || isMarked(src);
  };
};

test("AC-6.1.2: todo fragmento não relacionado ao drift permanece keep e o plano não escreve sobre eles", () => {
  const root = adoptedWithDrift();
  const { routing, plan, inventory, fragments } = runMaintainPipeline(root, {
    state: ADOPTED_STATE,
    residue: [],
  });

  const hygieneOk = hygieneAllow(inventory, fragments);
  const nonDrift = routing.filter((e) => e.destinationPath !== "project-rules/rules/domain_rules.md");
  assert.ok(nonDrift.length > 0, "esperava fragmentos não-drift roteados");
  for (const entry of nonDrift) {
    if ((entry.regime === "relocate" || entry.regime === "delete") && hygieneOk(entry)) {
      continue;
    }
    assert.equal(entry.regime, "keep", `não-drift com regime ${entry.regime}: ${entry.destinationPath}`);
  }

  const writes = plan.entries.filter((e) => e.operation !== "keep");
  for (const entry of writes) {
    const driftWrite = entry.artifactPath.startsWith("project-rules/rules/");
    const hygieneWrite =
      (entry.operation === "move" || entry.operation === "delete") && hygieneOk(entry);
    assert.ok(
      driftWrite || hygieneWrite,
      `escrita fora do drift/higiene: ${entry.operation} ${entry.artifactPath}`,
    );
  }
});

test("AC-6.1.2: sem drift nenhum, o plan.json é integralmente keep/skip", () => {
  const root = copyFixture("pacote-adopt");
  writeJson(root, ".app-work/hephaestus-state.json", ADOPTED_STATE);

  const { routing, plan, inventory, fragments } = runMaintainPipeline(root, {
    state: ADOPTED_STATE,
    residue: [],
  });
  assert.ok(routing.length > 0);
  const hygieneOk = hygieneAllow(inventory, fragments);
  for (const entry of plan.entries) {
    const hygieneWrite =
      (entry.operation === "move" || entry.operation === "delete") && hygieneOk(entry);
    assert.ok(
      entry.operation === "keep" || entry.operation === "skip" || hygieneWrite,
      `operação fora de keep/skip sem drift: ${entry.operation} ${entry.artifactPath}`,
    );
  }
});

test("AC-6.1.1/6.1.2: maintain fragmenta a regra de agente como fonte com papel source (não é pasta do kit)", () => {
  const root = adoptedWithDrift();
  const { fragments, routing } = runMaintainPipeline(root, { state: ADOPTED_STATE, residue: [] });
  const driftFragment = fragments.find((f) => f.provenance[0].sourcePath === ".cursor/rules/arquitetura.mdc");
  assert.ok(driftFragment, "regra de agente não fragmentada");
  assert.ok(
    routing.some((e) => e.fragmentId === driftFragment.fragmentId),
    "regra de agente fragmentada mas não roteada",
  );
});
