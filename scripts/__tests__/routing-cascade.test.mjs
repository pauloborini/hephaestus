// AC-3.1.1 (S3, golden replay), AC-3.1.3 e AC-3.1.5: a cascata de roteamento
// decide pelos níveis 1-4 com evidência; match mais específico vence o
// genérico; destino ilegal bloqueia nomeando o fragmento; fragmento misto
// needsSplit não dividido cancela a fase. O motor de referência
// (routing-engine.mjs) materializa o contrato de `prompts/route.md` com os
// dados reais (fixture repo-desorganizado + catálogo do repositório); o
// golden `golden-routing-adopt` congela a saída (S9: resíduo llm congelado).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  REPO_ROOT,
  mkdtemp,
  runNode,
  writeJson,
} from "./helpers/fs-utils.mjs";
import { copyFixture, FIXTURES_DIR } from "./helpers/fixtures.mjs";
import { validate } from "./helpers/json-schema.mjs";
import {
  buildRouting,
  buildFragments,
  matchCatalog,
} from "./helpers/routing-engine.mjs";

const routingSchema = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "schemas", "routing.schema.json"), "utf8"),
);

const goldenPath = path.join(FIXTURES_DIR, "golden-routing-adopt.json");
const loadGolden = () => JSON.parse(fs.readFileSync(goldenPath, "utf8"));

const bySrc = (routing, fragments, src) => {
  const frag = fragments.find((f) => f.provenance[0].sourcePath === src);
  return routing.find((e) => e.fragmentId === frag.fragmentId);
};

test("AC-3.1.1: match mais específico vence o genérico (catálogo com genérico declarado primeiro)", () => {
  const tmp = mkdtemp("hep-spec-");
  writeJson(tmp, "catalog.json", {
    entries: [
      {
        pattern: "archive/ legado do vault (não-OSS / depósito do usuário)",
        destination: ".app-work/archive/",
        confidence: "alta",
        since: "teste",
        reason: "genérico declarado primeiro — a ordem de declaração NÃO pode vencer",
      },
      {
        pattern: "clones OSS / análise competitiva em archive/ do vault",
        destination: ".app-work/references/",
        confidence: "alta",
        since: "teste",
        reason: "específico",
      },
    ],
  });
  const fragment = {
    fragmentId: "frag-clone",
    rawText: "Clones OSS do produto: análise competitiva de recursos.",
    provenance: [{ sourcePath: "docs/archive/clones-oss/analise.md", startOffset: 0, endOffset: 10 }],
  };
  const result = buildRouting(tmp, {
    fragments: [fragment],
    catalog: JSON.parse(fs.readFileSync(path.join(tmp, "catalog.json"), "utf8")),
    residue: [],
  });
  assert.equal(result.routing.length, 1, JSON.stringify(result));
  const entry = result.routing[0];
  assert.equal(entry.destinationPath, ".app-work/references/");
  assert.equal(entry.decidedBy, "catalog");
});

test("AC-3.1.1: níveis 1 a 4 são determinísticos (golden replay)", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const { routing, questions } = buildRouting(fixture, {
    fragments,
    now: "2026-08-12",
  });

  // golden existe com proveniência (fixture, data, comando)
  const golden = loadGolden();
  assert.ok(golden._provenance, "golden sem proveniência");
  assert.equal(golden._provenance.fixture, "scripts/__tests__/fixtures/repo-desorganizado");
  assert.ok(golden._provenance.capturedAt, "golden sem data de captura");
  assert.ok(golden._provenance.command, "golden sem comando de captura");

  // replay: a saída re-emitida é byte a byte a capturada
  assert.deepEqual(routing, golden.entries);
  assert.equal(questions.length, golden.questionCount);

  // toda entrada do golden é válida pelo routing.schema.json
  for (const entry of golden.entries) {
    const result = validate(routingSchema, entry);
    assert.equal(result.valid, true, `${entry.fragmentId}: ${result.errors.join("; ")}`);
  }

  // asserções discriminantes sobre o golden:
  // clone OSS em archive/ → references (específico vence o genérico)
  const clone = bySrc(routing, fragments, "docs/archive/clones-oss/analise-argus.md");
  assert.equal(clone.destinationPath, ".app-work/references/");
  assert.equal(clone.decidedBy, "catalog");
  // ADR aceito (destination null no catálogo) nunca decide: enfileira
  assert.ok(!bySrc(routing, fragments, "docs/adr/0001-formato-pagamentos.md"));
  assert.ok(questions.some((q) => q.sourcePath === "docs/adr/0001-formato-pagamentos.md"));
  // guia executado → done/YYYY-MM/semana-…/XPTO_GUIDE/ (DEC-002)
  const guide = bySrc(routing, fragments, "docs/guides/XPTO_GUIDE/GUIDE.md");
  assert.equal(
    guide.destinationPath,
    ".app-work/done/2026-08/semana-33_08-10_a_08-16/XPTO_GUIDE/",
  );
  // resíduo congelado com decidedBy llm (S9)
  const residue = routing.filter((e) => e.decidedBy === "llm");
  assert.equal(residue.length, 2);
});

test("AC-3.1.3: destino ilegal bloqueia a cascata nomeando o fragmento", () => {
  const tmp = mkdtemp("hep-illegal-");
  writeJson(tmp, "catalog.json", {
    entries: [
      {
        pattern: "pasta fora dos territórios",
        destination: "nada/fora-dos-territorios",
        confidence: "alta",
        since: "teste",
        reason: "destino ilegal para o teste",
      },
    ],
  });
  const fragment = {
    fragmentId: "frag-ilegal",
    rawText: "Conteúdo da pasta fora dos territórios.",
    provenance: [{ sourcePath: "docs/material.md", startOffset: 0, endOffset: 10 }],
  };
  assert.throws(
    () =>
      buildRouting(tmp, {
        fragments: [fragment],
        catalog: JSON.parse(fs.readFileSync(path.join(tmp, "catalog.json"), "utf8")),
        residue: [],
      }),
    (error) => error.message.includes("frag-ilegal") && error.message.includes("nada/fora-dos-territorios"),
  );
});

test("AC-3.1.3: fragmento originado em .app-work/ nunca recebe generate nem reconcile", () => {
  const tmp = mkdtemp("hep-process-");
  const fragment = {
    fragmentId: "frag-guide",
    rawText: "# Guide — pack em andamento\n",
    provenance: [{ sourcePath: ".app-work/guides/X_GUIDE/GUIDE.md", startOffset: 0, endOffset: 10 }],
  };
  const { routing } = buildRouting(tmp, { fragments: [fragment], residue: [] });
  assert.equal(routing.length, 1);
  assert.equal(routing[0].regime, "keep"); // posição: destino calculado == origem
  assert.ok(!["generate", "reconcile"].includes(routing[0].regime));
});

test("AC-3.1.5: needsSplit não dividido bloqueia a fase nomeando o fragmento", () => {
  const tmp = mkdtemp("hep-split-");
  const fragment = {
    fragmentId: "frag-misto",
    needsSplit: true,
    rawText: "## Limite\nO plano deve permitir 10 itens.\n",
    provenance: [{ sourcePath: "docs/misto.md", startOffset: 0, endOffset: 10 }],
  };
  assert.throws(
    () => buildRouting(tmp, { fragments: [fragment], residue: [] }),
    (error) => error.message.includes("frag-misto") && error.message.includes("needsSplit"),
  );
});

test("AC-3.1.5: dividido em dois fragmentos coerentes, a cascata prossegue", () => {
  const tmp = mkdtemp("hep-split-ok-");
  const fragments = [
    {
      fragmentId: "frag-a",
      rawText: "## Limite\nO plano deve permitir 10 itens.\n",
      provenance: [{ sourcePath: "docs/misto.md", startOffset: 0, endOffset: 10 }],
    },
    {
      fragmentId: "frag-b",
      rawText: "```yaml\nport: 8080\n```\n",
      provenance: [{ sourcePath: "docs/misto.md", startOffset: 10, endOffset: 20 }],
    },
  ];
  const { routing } = buildRouting(tmp, { fragments, residue: [] });
  assert.equal(routing.length, 2);
});

test("AC-3.1.1/3.1.3/3.1.5: route.md declara a cascata, o bloqueio de destino ilegal e a fila", () => {
  const route = fs.readFileSync(path.join(REPO_ROOT, "prompts", "route.md"), "utf8");
  // cinco níveis na ordem
  const order = [
    "Nível 1", "Nível 2", "Nível 3", "Nível 4", "Nível 5",
  ];
  let cursor = 0;
  for (const marker of order) {
    const index = route.indexOf(marker);
    assert.ok(index > cursor, `route.md deve conter "${marker}" em ordem`);
    cursor = index;
  }
  // para no primeiro nível que decide
  assert.match(route, /para no primeiro nível que decide|primeiro nível que decide/i);
  // destination null nunca decide: enfileira
  assert.match(route, /destination: null/i);
  assert.match(route, /enfileira/i);
  // match mais específico vence o genérico
  assert.match(route, /especificidade|mais específico vence o genérico/i);
  // lista fechada de destinos (SCHEMA §2)
  assert.match(route, /_app-vault/i);
  assert.match(route, /\.app-work/i);
  assert.match(route, /project-rules/i);
  // needsSplit bloqueia
  assert.match(route, /needsSplit/);
  // a cascata nunca pergunta: perguntas nascem enfileiradas
  assert.match(route, /nunca/i);
});
