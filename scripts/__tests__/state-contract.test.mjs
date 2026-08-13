// AC-5.1.1 e AC-5.1.2 (CN10, seam S4, ancorada): o contrato do estado
// versionado `.app-work/hephaestus-state.json` — quatro blocos (meta, routing,
// answers, shield), sem métricas, nome em minúsculo (D7/D29). Campo de topo
// desconhecido é ignorado e registrado como observação, nunca bloqueia (D4);
// bloco conhecido malformado reprova nomeando o bloco; variante em caixa alta
// reprova indicando o esperado. A prova é o gate real (`checkStateContract` do
// validador) sobre o pacote-adopt (que passa no validador inteiro) com o state
// adicionado.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, runNode, writeJson } from "./helpers/fs-utils.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";

const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const QUESTION_KEY = "ab12cd34ef56";
const VALID_STATE = {
  meta: {
    packVersion: "1.0.0",
    schemaVersion: "1",
    lastRunAt: "2026-08-12T00:00:00.000Z",
    lastRunId: "run-1",
  },
  routing: {
    overlay: [],
    forbiddenPatterns: [],
  },
  answers: {
    [QUESTION_KEY]: {
      answer: { destinationPath: ".app-work/archive/guides/" },
      scope: "this-project",
      sourceEvidence: "docs/brainstorming/tema-x.md",
      answeredAt: "2026-08-12T00:00:00.000Z",
    },
  },
  shield: [],
};

// Pacote de teste = cópia do pacote-adopt (válido no validador inteiro) + o
// state sob teste. O validador falha no primeiro check; o state só é alcançado
// se o pacote base estiver válido — a falha/observação é sempre do state.
const packageWithState = (state) => {
  const pkg = copyFixture("pacote-adopt");
  writeJson(pkg, ".app-work/hephaestus-state.json", state);
  return pkg;
};

test("AC-5.1.1: quatro blocos válidos + bloco de topo desconhecido saem 0 com observação registrada", () => {
  const pkg = packageWithState({
    ...VALID_STATE,
    futureBlock: { campoSemanticoDeVersaoFutura: true },
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 0, result.stderr);
  // a observação do bloco desconhecido é registrada na saída do check (D4)
  assert.ok(
    result.stdout.includes('bloco de topo desconhecido "futureBlock" ignorado (D4)'),
    result.stdout,
  );
  assert.ok(result.stdout.includes("Package validation passed"), result.stdout);
});

test("AC-5.1.1: bloco answers malformado reprova com erro 1 nomeando answers", () => {
  const pkg = packageWithState({
    ...VALID_STATE,
    answers: {
      [QUESTION_KEY]: {
        answer: { destinationPath: ".app-work/archive/guides/" },
        scope: "this-project",
        // sourceEvidence ausente — bloco conhecido malformado
      },
    },
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("answers"), result.stderr);
  assert.ok(result.stderr.includes("sourceEvidence"), result.stderr);
});

test("AC-5.1.2: nome do estado em caixa alta reprova indicando o esperado em minúsculo", () => {
  const pkg = copyFixture("pacote-adopt");
  writeJson(pkg, ".app-work/HEPHAESTUS-STATE.json", VALID_STATE);
  const result = runValidator(pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("HEPHAESTUS-STATE.json"), result.stderr);
  assert.ok(result.stderr.includes("hephaestus-state.json"), result.stderr);
  assert.ok(result.stderr.includes("minúsculo"), result.stderr);
});

test("AC-5.1.2: campo de métrica dentro de bloco conhecido reprova (nada de telemetria no estado)", () => {
  const pkg = packageWithState({
    ...VALID_STATE,
    meta: {
      packVersion: "1.0.0",
      schemaVersion: "1",
      llmDecidedRatio: 0.3, // métrica efêmera — D29 manda viver em .hephaestus/
    },
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("meta"), result.stderr);
  assert.ok(result.stderr.includes("llmDecidedRatio"), result.stderr);
});

test("AC-5.1.x: bloco shield com item sem path reprova nomeando shield", () => {
  const pkg = packageWithState({
    ...VALID_STATE,
    shield: [{ selector: "#secao" }],
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("shield"), result.stderr);
  assert.ok(result.stderr.includes("path"), result.stderr);
});

test("AC-5.1.x: routing overlay com entrada sem destination reprova nomeando routing", () => {
  const pkg = packageWithState({
    ...VALID_STATE,
    routing: {
      overlay: [{ pattern: "algum padrão", confidence: "alta" }],
    },
  });
  const result = runValidator(pkg);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("routing"), result.stderr);
  assert.ok(result.stderr.includes("destination"), result.stderr);
});
