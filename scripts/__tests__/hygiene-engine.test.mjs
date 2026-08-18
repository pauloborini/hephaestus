import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, writeFile } from "./helpers/fs-utils.mjs";
import {
  inventoryProcessHygiene,
  isPackConcluded,
} from "./helpers/hygiene-engine.mjs";

const D = new Date("2026-08-17T12:00:00");

test("pack CONCLUÍDO em guides/ reloca para archive datado", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(
    root,
    ".app-work/guides/FOO_GUIDE/plans/F-fechamento.md",
    "Status: CONCLUÍDO\n2026-08-17\n",
  );
  writeFile(root, ".app-work/guides/FOO_GUIDE/GUIDE.md", "# FOO\n");
  assert.equal(isPackConcluded(path.join(root, ".app-work/guides/FOO_GUIDE")), true);
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from.includes("FOO_GUIDE"));
  assert.ok(hit);
  assert.equal(hit.to, ".app-work/archive/guides/2026-08/semana-3/FOO_GUIDE/");
});

test("duplicata byte a byte vira delete da cópia", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/guides/A.md", "mesmo\n");
  writeFile(root, ".app-work/docs/A.md", "mesmo\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.deepEqual(inv.deletes, [".app-work/docs/A.md"]);
});

test("duplicata vivo×archive apaga o archive, não o vivo", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/docs/nota.md", "x\n");
  writeFile(root, ".app-work/archive/docs/nota.md", "x\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.deepEqual(inv.deletes, [".app-work/archive/docs/nota.md"]);
});

test("duplicata em references/ não vira delete", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/references/a/LICENSE", "MIT\n");
  writeFile(root, ".app-work/references/b/LICENSE", "MIT\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.equal(inv.deletes.length, 0);
});

test("private/roadmap reloca para roadmap/", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/private/roadmap/ROADMAP.md", "# r\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from.includes("private/roadmap"));
  assert.ok(hit);
  assert.ok(hit.to.startsWith(".app-work/roadmap/"));
});

test("archive com pasta não nominada é unknown", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/archive/foo-inventado/x.md", "x\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.ok(inv.unknown.some((p) => p.includes("archive/foo-inventado")));
});

test("private/references reloca para references/", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/private/references/clone/README.md", "# oss\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from.includes("private/references"));
  assert.ok(hit);
  assert.ok(hit.to.startsWith(".app-work/references/"));
});

test("pasta fora da lista fechada é unknown (pack-candidate)", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/foo-novo/x.md", "x\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.ok(inv.unknown.some((p) => p.startsWith(".app-work/foo-novo")));
});

test("PRONTO PARA AUDITORIA não é CONCLUÍDO", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(
    root,
    ".app-work/guides/BAR_GUIDE/GUIDE.md",
    "Status: PRONTO PARA AUDITORIA COM PENDÊNCIAS\n",
  );
  writeFile(root, ".app-work/guides/BAR_GUIDE/plans/F-fechamento.md", "Status: PENDENTE\n");
  assert.equal(isPackConcluded(path.join(root, ".app-work/guides/BAR_GUIDE")), false);
});

test("PRD fechado sem citação viva vai para archive/prds/", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/prd/checkout.md", "Status: done\n# checkout\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from === ".app-work/prd/checkout.md");
  assert.ok(hit);
  assert.equal(hit.to, ".app-work/archive/prds/checkout.md");
  assert.equal(hit.reason, "prd-no-consumer");
});

test("PRD Status done ainda citado por pack vivo não arquiva", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/prd/checkout.md", "Status: done\n# checkout\n");
  writeFile(root, ".app-work/guides/LIVE_GUIDE/GUIDE.md", "Status: EM ANDAMENTO\nver checkout.md\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.equal(
    inv.relocate.some((r) => r.from === ".app-work/prd/checkout.md"),
    false,
  );
});

test("brainstorm marcado fechado reloca para archive/perguntas/", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(
    root,
    ".app-work/brainstorming/tema-x/PERGUNTAS_EM_ABERTO.md",
    "Status: fechado\n# tema\n",
  );
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  const hit = inv.relocate.find((r) => r.from === ".app-work/brainstorming/tema-x/");
  assert.ok(hit);
  assert.equal(hit.to, ".app-work/archive/perguntas/tema-x/");
});

test("private/ subpasta fora da lista fechada é unknown", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/private/misc/x.md", "x\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.ok(inv.unknown.some((p) => p === ".app-work/private/misc"));
});

test("guides/ pasta sem _GUIDE é unknown", () => {
  const root = mkdtemp("hep-hyg-");
  writeFile(root, ".app-work/guides/not-a-pack/x.md", "x\n");
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.ok(inv.unknown.some((p) => p === ".app-work/guides/not-a-pack"));
});

test("trecho único vivo cabe no canônico mais completo → condense", () => {
  const root = mkdtemp("hep-hyg-");
  const snippet = "A regra de timeout da fila é 30 segundos sem retry.\n";
  writeFile(root, ".app-work/docs/timeout.md", snippet);
  writeFile(
    root,
    ".app-work/docs/timeout-completo.md",
    `# Timeout\n\n${snippet}\nTambém vale para o worker noturno.\n`,
  );
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.deepEqual(inv.condensed, [
    { from: ".app-work/docs/timeout.md", into: ".app-work/docs/timeout-completo.md" },
  ]);
  assert.equal(inv.deletes.includes(".app-work/docs/timeout.md"), false);
});

test("substring sem mesmo tema não condensa no escuro", () => {
  const root = mkdtemp("hep-hyg-");
  const snippet = "A regra de timeout da fila é 30 segundos sem retry.\n";
  writeFile(root, ".app-work/docs/alpha.md", snippet);
  writeFile(root, ".app-work/prd/omega.md", `# Outro assunto\n\n${snippet}\nFim.\n`);
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.equal(inv.condensed.length, 0);
});

test("dois canônicos possíveis não condensam no escuro", () => {
  const root = mkdtemp("hep-hyg-");
  const snippet = "A regra de timeout da fila é 30 segundos sem retry.\n";
  writeFile(root, ".app-work/docs/timeout.md", snippet);
  writeFile(root, ".app-work/docs/timeout-a.md", `# A\n\n${snippet}\nmais A\n`);
  writeFile(root, ".app-work/docs/timeout-b.md", `# B\n\n${snippet}\nmais B\n`);
  const inv = inventoryProcessHygiene(root, { archiveDate: D });
  assert.equal(inv.condensed.length, 0);
});
