// AC-4.1.1, AC-4.1.2 e AC-4.1.3 (INV3/VC5, seam S3, nível ancorada): o motor
// de referência do reconcile casa decisões por `DEC-NNN` explícito e altera
// in-place (o ID permanece, a nota inline é empilhada); o inventário de
// numeração varre cláusulas vivas E IDs de `## Histórico` (SCHEMA.md §4.7) —
// restringir às vivas é o P0-3 do pre-mortem; e remoção com citação pendente
// bloqueia com a lista, inclusive dentro de `.app-work/` (caminhos ocultos).
// O gate `checkDecIdentity` do validador reprova ID nas duas listas, create
// com ID <= max inventariado e renumeração detectável (matchedId divergente).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, runNode, writeFile, writeJson } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";
import {
  reconcileVault,
  inventoryDecisions,
  normalizeStatement,
  parseDecisionFile,
} from "./helpers/reconcile-engine.mjs";

const NOW = "2026-08-12";
const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const fragmentOf = (rawText, sourcePath) => ({
  fragmentId: `frag-${Math.random().toString(16).slice(2)}`,
  rawText,
  territory: "vault",
  regime: "reconcile",
  confidence: 0.9,
  ambiguity: "low",
  provenance: [{ sourcePath, startOffset: 0, endOffset: Buffer.byteLength(rawText, "utf8") }],
});

const vaultRoute = (fragment, destinationPath, decidedBy = "detector") => ({
  fragmentId: fragment.fragmentId,
  territory: "vault",
  regime: "reconcile",
  destinationPath,
  confidence: 0.9,
  decidedBy,
  evidence: "teste reconcile",
  needsSplit: false,
});

const decisionFile = (domain, { title, afeta = [], clauses = [], historico = [] }) => {
  const lines = [`# ${title}`, "", `Afeta: [${afeta.join(", ")}]`, ""];
  for (const clause of clauses) {
    lines.push(`### ${clause.decId} — ${clause.title}`, "", clause.statement, "");
    for (const note of clause.notes ?? []) {
      lines.push(`_Alterado ${note.date} — era: ${note.old}. Motivo: ${note.motivo}._`, "");
    }
  }
  if (historico.length > 0) {
    lines.push("## Histórico", "");
    for (const line of historico) lines.push(line, "");
  }
  return `${lines.join("\n")}\n`;
};

test("AC-4.1.1: valor alterado mantém o ID e ganha nota inline (amend in-place)", () => {
  const repo = mkdtemp("hep-dec-016-");
  const vaultPath = path.join(repo, "_app-vault", "docs", "decisions");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      afeta: ["billing"],
      clauses: [
        {
          decId: "DEC-016",
          title: "Cota de export do plano gratuito",
          statement: "Plano gratuito: 20 exports/mês.",
        },
      ],
    }),
  );

  // fragmento com o ID congelado pela cascata (nível 1) e o valor novo
  const fragment = fragmentOf(
    "### DEC-016 — Cota de export do plano gratuito\n\nPlano gratuito: 30 exports/mês.\n",
    "docs/cota.md",
  );
  const { identityMap, decisions } = reconcileVault({
    fragments: [fragment],
    routing: [vaultRoute(fragment, "_app-vault/docs/decisions/planos.md")],
    repoRoot: repo,
    now: NOW,
  });

  // a ação é amend, o ID permanece DEC-016 (nunca create com ID novo)
  assert.equal(identityMap.entries.length, 1);
  const entry = identityMap.entries[0];
  assert.equal(entry.action, "amend");
  assert.equal(entry.decId, "DEC-016");
  assert.equal(entry.matchedId, "DEC-016");

  // o arquivo materializado mantém o heading, troca o enunciado e empilha a nota
  const content = decisions.get("_app-vault/docs/decisions/planos.md");
  assert.ok(content.includes("### DEC-016 — Cota de export do plano gratuito"), content);
  assert.ok(content.includes("Plano gratuito: 30 exports/mês."), content);
  assert.ok(!content.includes("DEC-017"), content);
  assert.ok(
    content.includes(
      "_Alterado 2026-08-12 — era: 20 exports/mês. Motivo: valor alterado na reconciliação._",
    ),
    content,
  );

  // parse round-trip: a nota volta como nota (não como enunciado)
  const parsed = parseDecisionFile(content);
  const clause = parsed.clauses.find((c) => c.decId === "DEC-016");
  assert.equal(normalizeStatement(clause.statement), normalizeStatement("Plano gratuito: 30 exports/mês."));
  assert.equal(clause.notes.length, 1);
  assert.equal(clause.notes[0].old, "20 exports/mês");
});

test("AC-4.1.1: notas novas empilham acima das anteriores e podam além de três", () => {
  const repo = mkdtemp("hep-dec-notes-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [
        {
          decId: "DEC-016",
          title: "Cota de export do plano gratuito",
          statement: "Plano gratuito: 20 exports/mês.",
          notes: [
            { date: "2026-08-03", old: "18/mês", motivo: "mercado" },
            { date: "2026-08-02", old: "15/mês", motivo: "reajuste" },
            { date: "2026-08-01", old: "10/mês", motivo: "feedback do piloto" },
          ],
        },
      ],
    }),
  );
  const fragment = fragmentOf(
    "### DEC-016 — Cota de export do plano gratuito\n\nPlano gratuito: 40 exports/mês.\n",
    "docs/cota.md",
  );
  const { decisions } = reconcileVault({
    fragments: [fragment],
    routing: [vaultRoute(fragment, "_app-vault/docs/decisions/planos.md")],
    repoRoot: repo,
    now: NOW,
  });
  const content = decisions.get("_app-vault/docs/decisions/planos.md");
  const parsed = parseDecisionFile(content);
  const clause = parsed.clauses.find((c) => c.decId === "DEC-016");
  // 1 nova + 3 anteriores = 4 → poda a mais antiga; a mais nova fica no topo
  assert.equal(clause.notes.length, 3);
  assert.equal(clause.notes[0].date, "2026-08-12");
  assert.equal(clause.notes[1].date, "2026-08-03");
  assert.equal(clause.notes[2].date, "2026-08-02");
});

test("AC-4.1.2: inventário inclui o Histórico — DEC-003 viva + DEC-002 só no Histórico cunha DEC-004", () => {
  const repo = mkdtemp("hep-dec-004-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [
        { decId: "DEC-003", title: "Limite de projetos", statement: "Teto de 3 projetos." },
      ],
      historico: ["- 2026-08-01 — DEC-002 removida. Era: teto de 2 projetos. Motivo: abolido."],
    }),
  );
  // fragmento candidato (sem heading DEC) exige create
  const fragment = fragmentOf(
    "## Cota de consultas\nO plano deve permitir no máximo 25 consultas por mês.\n",
    "docs/README.md",
  );
  const { identityMap } = reconcileVault({
    fragments: [fragment],
    routing: [vaultRoute(fragment, "_app-vault/docs/decisions/produto.md")],
    repoRoot: repo,
    now: NOW,
  });
  assert.equal(identityMap.inventoriedMax, 3);
  assert.equal(identityMap.entries[0].action, "create");
  assert.equal(identityMap.entries[0].decId, "DEC-004");
  assert.equal(identityMap.entries[0].matchedId, null);
});

test("AC-4.1.2 (discriminante — pre-mortem P0-3): DEC-002 só no Histórico e sem cláusula viva maior cunha DEC-003, nunca reusa DEC-002", () => {
  const repo = mkdtemp("hep-dec-reuse-");
  // mesmo caso real deste repositório: DEC-001 viva, DEC-002 apenas no Histórico
  writeFile(
    repo,
    "_app-vault/docs/decisions/estrutura-do-kit.md",
    decisionFile("estrutura-do-kit", {
      title: "Estrutura do kit",
      clauses: [
        { decId: "DEC-001", title: "Regra viva", statement: "O kit é um produto único." },
      ],
      historico: ["- 2026-08-01 — DEC-002 removida. Era: formato antigo. Motivo: substituído."],
    }),
  );
  const fragment = fragmentOf(
    "## Limite de consultas\nO plano deve permitir no máximo 25 consultas por mês.\n",
    "docs/README.md",
  );
  const { identityMap } = reconcileVault({
    fragments: [fragment],
    routing: [vaultRoute(fragment, "_app-vault/docs/decisions/produto.md")],
    repoRoot: repo,
    now: NOW,
  });
  // inventário completo: max sobre {DEC-001 viva, DEC-002 no Histórico} = 2
  assert.equal(identityMap.inventoriedMax, 2);
  assert.equal(identityMap.entries[0].decId, "DEC-003");
  assert.notEqual(identityMap.entries[0].decId, "DEC-002");
});

test("AC-4.1.2: ID congelado que reapareceria no Histórico bloqueia (reuso proibido)", () => {
  const repo = mkdtemp("hep-dec-frozen-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      historico: ["- 2026-08-01 — DEC-002 removida. Era: x. Motivo: y."],
    }),
  );
  // fragmento com heading DEC-002 (ID congelado) e corpo — cláusula não existe
  const fragment = fragmentOf(
    "### DEC-002 — Limite antigo\n\nO plano permitia 5 consultas.\n",
    "docs/legado.md",
  );
  assert.throws(
    () =>
      reconcileVault({
        fragments: [fragment],
        routing: [vaultRoute(fragment, "_app-vault/docs/decisions/planos.md")],
        repoRoot: repo,
        now: NOW,
      }),
    (error) => error.message.includes("DEC-002") && error.message.includes("reuso"),
  );
});

test("AC-4.1.3: remoção com citação pendente em .app-work/ bloqueia listando as citações", () => {
  const repo = mkdtemp("hep-dec-rem-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [
        { decId: "DEC-009", title: "Teto de projetos", statement: "Teto de 3 projetos." },
      ],
    }),
  );
  // citação pendente SÓ dentro de .app-work/ (caminho oculto — exige --hidden)
  writeFile(repo, ".app-work/private/auditoria.md", "Regra com citação pendente: conforme DEC-009.\n");

  // fragmento com heading DEC-009 e corpo vazio ⇒ candidato a remoção
  const fragment = fragmentOf("### DEC-009 — Teto de projetos\n", "docs/legado.md");
  assert.throws(
    () =>
      reconcileVault({
        fragments: [fragment],
        routing: [vaultRoute(fragment, "_app-vault/docs/decisions/planos.md")],
        repoRoot: repo,
        now: NOW,
      }),
    (error) =>
      error.message.includes("DEC-009") &&
      error.message.includes("bloqueado") &&
      error.message.includes(".app-work/private/auditoria.md"),
  );
});

test("AC-4.1.3: sem citação pendente, a remoção prossegue e grava a linha em ## Histórico", () => {
  const repo = mkdtemp("hep-dec-rem-ok-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [
        { decId: "DEC-009", title: "Teto de projetos", statement: "Teto de 3 projetos." },
      ],
    }),
  );
  const fragment = fragmentOf("### DEC-009 — Teto de projetos\n", "docs/legado.md");
  const { identityMap, decisions } = reconcileVault({
    fragments: [fragment],
    routing: [vaultRoute(fragment, "_app-vault/docs/decisions/planos.md")],
    repoRoot: repo,
    now: NOW,
  });
  assert.equal(identityMap.entries[0].action, "remove");
  assert.equal(identityMap.entries[0].decId, "DEC-009");
  const content = decisions.get("_app-vault/docs/decisions/planos.md");
  assert.ok(!/^###\s+DEC-009/m.test(content), content);
  assert.ok(content.includes("## Histórico"), content);
  assert.ok(content.includes("DEC-009 removida"), content);
  const parsed = parseDecisionFile(content);
  assert.deepEqual(parsed.historico, ["DEC-009"]);
});

test("AC-4.1.1/4.1.2: enunciado idêntico cai em keep e não reescreve (preserva INV2)", () => {
  const repo = mkdtemp("hep-dec-keep-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [
        { decId: "DEC-016", title: "Cota de export do plano gratuito", statement: "Plano gratuito: 20 exports/mês." },
      ],
    }),
  );
  const fragment = fragmentOf(
    "### DEC-016 — Cota de export do plano gratuito\n\nPlano gratuito: 20 exports/mês.\n",
    "docs/cota.md",
  );
  const { identityMap, decisions } = reconcileVault({
    fragments: [fragment],
    routing: [vaultRoute(fragment, "_app-vault/docs/decisions/planos.md")],
    repoRoot: repo,
    now: NOW,
  });
  assert.equal(identityMap.entries[0].action, "keep");
  // keep não produz escrita: nenhum arquivo de decisão novo no mapa
  assert.equal(decisions.size, 0);
});

test("INV3/checkDecIdentity: ID ao mesmo tempo vivo e no Histórico reprova o pacote", () => {
  const pkg = mkdtemp("hep-dec-gate-both-");
  makeValidPackage(pkg);
  writeFile(
    pkg,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [
        { decId: "DEC-001", title: "Regra", statement: "Valor vigente." },
      ],
      historico: ["- 2026-08-01 — DEC-001 removida. Era: x. Motivo: y."],
    }),
  );
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("DEC-001"), result.stderr);
  assert.ok(result.stderr.includes("Histórico"), result.stderr);
});

test("INV3/checkDecIdentity: create com ID menor ou igual ao max inventariado reprova", () => {
  const pkg = mkdtemp("hep-dec-gate-create-");
  makeValidPackage(pkg);
  writeFile(
    pkg,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [{ decId: "DEC-002", title: "Regra", statement: "Valor vigente." }],
    }),
  );
  writeJson(pkg, ".hephaestus/manifests/identity-map.json", {
    version: 1,
    inventoriedMax: 2,
    entries: [
      {
        fragmentId: "frag-x",
        decId: "DEC-002",
        action: "create",
        domain: "planos",
        matchedId: null,
        evidence: "teste",
      },
    ],
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("DEC-002"), result.stderr);
  assert.ok(result.stderr.includes("inventariado"), result.stderr);
});

test("INV3/checkDecIdentity: renumeração detectável (amend com matchedId divergente) reprova", () => {
  const pkg = mkdtemp("hep-dec-gate-re-");
  makeValidPackage(pkg);
  writeFile(
    pkg,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [{ decId: "DEC-016", title: "Cota", statement: "Plano gratuito: 20 exports/mês." }],
    }),
  );
  writeJson(pkg, ".hephaestus/manifests/identity-map.json", {
    version: 1,
    inventoriedMax: 16,
    entries: [
      {
        fragmentId: "frag-x",
        decId: "DEC-017",
        action: "amend",
        domain: "planos",
        matchedId: "DEC-016",
        evidence: "teste",
      },
    ],
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("renumeração"), result.stderr);
});

test("INV3/checkDecIdentity: pacote com cunhagem correta passa pelo gate", () => {
  const pkg = mkdtemp("hep-dec-gate-ok-");
  makeValidPackage(pkg);
  writeFile(
    pkg,
    "_app-vault/docs/decisions/planos.md",
    decisionFile("planos", {
      title: "Planos",
      clauses: [{ decId: "DEC-001", title: "Regra", statement: "Valor vigente." }],
    }),
  );
  writeJson(pkg, ".hephaestus/manifests/identity-map.json", {
    version: 1,
    inventoriedMax: 0,
    entries: [
      {
        fragmentId: "frag-x",
        decId: "DEC-001",
        action: "create",
        domain: "planos",
        matchedId: null,
        evidence: "teste",
      },
    ],
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
});

test("AC-4.1.x: reconcile.md declara inventário, identidade e gate; kit-manifest lista o prompt", () => {
  const reconcile = fs.readFileSync(
    path.join(import.meta.dirname, "..", "..", "prompts", "reconcile.md"),
    "utf8",
  );
  for (const section of [
    "Inventário de identidade",
    "## Identidade",
    "## Verificações",
    "## Gate",
    "## Bloqueia se",
    "## Escreve no repositório",
  ]) {
    assert.ok(reconcile.includes(section), `reconcile.md deve conter "${section}"`);
  }
  // inventário: cláusulas vivas E IDs de ## Histórico; proibido restringir às vivas
  assert.match(reconcile, /## Histórico/);
  assert.match(reconcile, /max/);
  assert.match(reconcile, /nunca/i);
  // nota inline no formato fixo
  assert.match(reconcile, /_Alterado <data> — era: <valor antigo>\. Motivo: <motivo>\._/);
  // remoção exige citação pendente inclusive em .app-work/ (--hidden)
  assert.match(reconcile, /\.app-work/);
  assert.match(reconcile, /--hidden/);
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "..", "..", "manifests", "kit-manifest.json"),
      "utf8",
    ),
  );
  assert.ok(manifest.requiredFiles.includes("prompts/reconcile.md"), "kit-manifest deve listar prompts/reconcile.md");
});

test("AC-4.1.2: inventoryDecisions varre arquivos e histórico — estrutura mínima", () => {
  const repo = mkdtemp("hep-inv-");
  writeFile(
    repo,
    "_app-vault/docs/decisions/a.md",
    decisionFile("a", {
      title: "A",
      clauses: [{ decId: "DEC-003", title: "X", statement: "Valor." }],
    }),
  );
  writeFile(
    repo,
    "_app-vault/docs/decisions/b.md",
    decisionFile("b", {
      title: "B",
      historico: ["- 2026-08-01 — DEC-007 removida. Era: y. Motivo: z."],
    }),
  );
  const inventory = inventoryDecisions(path.join(repo, "_app-vault", "docs", "decisions"));
  assert.equal(inventory.max, 7);
  assert.ok(inventory.historico.includes("DEC-007"));
  assert.equal(inventory.clauses.length, 1);
});

test("DEC-004: legado ### D1 sob features vira create DEC-001 (não keep sem decId)", () => {
  const repo = mkdtemp("hep-legacy-d1-");
  const fragment = fragmentOf(
    "### D1 · Modelo de confiança\n\nO profissional deve registrar a sessão.\n",
    ".app-vault/docs/features/checkin/DECISOES_CHECKIN.md",
  );
  const { identityMap, decisions } = reconcileVault({
    fragments: [fragment],
    routing: [
      vaultRoute(fragment, "_app-vault/docs/decisions/checkin.md"),
    ],
    repoRoot: repo,
    now: NOW,
  });
  assert.equal(identityMap.entries.length, 1);
  assert.equal(identityMap.entries[0].action, "create");
  assert.equal(identityMap.entries[0].decId, "DEC-001");
  assert.ok(decisions.has("_app-vault/docs/decisions/checkin.md"));
  assert.match(
    decisions.get("_app-vault/docs/decisions/checkin.md"),
    /### DEC-001/,
  );
});
