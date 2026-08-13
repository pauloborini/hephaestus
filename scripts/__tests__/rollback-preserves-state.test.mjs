// AC-5.2.2 (INV6, seams S6/S7, nível ancorada): as respostas humanas vivem
// em `.app-work/hephaestus-state.json`, gravado por `interview` FORA da
// transação (exceção declarada de INV1, `prompts/apply.md`). Quando
// `verify(applied)` falha e dispara rollback, o estado permanece intacto com
// as respostas, e a reexecução não repergunta nenhum `questionKey` já
// respondido. Discriminante: se as respostas fossem materializadas em staging
// e aplicadas na transação, o rollback as apagaria e a reexecução repetiria as
// mesmas perguntas — aqui o state nem entra no staging-manifest.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { mkdtemp, runNode, writeFile, writeJson } from "./helpers/fs-utils.mjs";
import { makeValidPackage } from "./helpers/package-fixture.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";
import {
  buildRouting,
  buildFragments,
  questionKeyOf,
  routingQuestionContext,
} from "./helpers/routing-engine.mjs";

const NOW = "2026-08-12";
const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const ADR_SRC = "docs/adr/0001-formato-pagamentos.md";

const stateWithAnswer = () => ({
  meta: {
    packVersion: "1.0.0",
    schemaVersion: "1",
    lastRunAt: `${NOW}T00:00:00.000Z`,
    lastRunId: "run-rollback",
  },
  routing: { overlay: [], forbiddenPatterns: [] },
  answers: {
    [questionKeyOf(routingQuestionContext(ADR_SRC))]: {
      answer: { destinationPath: "_app-vault/docs/decisions/formatos-de-pagamento.md" },
      scope: "this-project",
      sourceEvidence: "docs/adr/0001-formato-pagamentos.md",
      answeredAt: `${NOW}T00:00:00.000Z`,
    },
  },
  shield: [],
});

const addStagingManifest = (pkg) => {
  // a transação cobre apenas artefatos do pacote — o state NUNCA entra no
  // staging-manifest (fora da transação, INV1)
  const agents = fs.readFileSync(path.join(pkg, "AGENTS.md"), "utf8");
  const index = fs.readFileSync(path.join(pkg, "project-rules/index/README.md"), "utf8");
  writeJson(pkg, ".hephaestus/staging-manifest.json", {
    version: 1,
    artifacts: [
      { outputPath: "AGENTS.md", sha256: sha256(agents) },
      { outputPath: "project-rules/index/README.md", sha256: sha256(index) },
    ],
  });
};

test("AC-5.2.2: verify(applied) falha dispara rollback e o estado permanece intacto com as respostas", () => {
  const pkg = mkdtemp("hep-rb-");
  makeValidPackage(pkg);
  writeJson(pkg, ".app-work/hephaestus-state.json", stateWithAnswer());
  addStagingManifest(pkg);

  const stateAbs = path.join(pkg, ".app-work", "hephaestus-state.json");
  const stateHashBefore = sha256(fs.readFileSync(stateAbs));

  // adulterar um artefato da transação após o apply: verify(applied) reprova
  // e o relatório pede rollback (D27) — a adulteração mantém as âncoras
  // (checkAgents passa); o que falha é o hash do staging-manifest
  writeFile(
    pkg,
    "AGENTS.md",
    "# Outro — contrato do agente\n\nProduto vigente: `_app-vault/docs/decisions/`; mapa: `_app-vault/INDEX.md`.\nProcesso: `.app-work/`; mapa: `.app-work/INDEX.md`. `.app-work/` é processo: nunca insumo de regra.\n",
  );
  const failed = runValidator(pkg);
  assert.equal(failed.status, 1, failed.stdout);
  assert.ok(failed.stderr.includes("AGENTS.md"), failed.stderr);
  assert.ok(failed.stderr.includes("rollback"), failed.stderr);

  // rollback simulado (a semântica declarada de apply.md: git + backup/<ts>/,
  // nesta ordem): restaura apenas os artefatos da transação — o state não é
  // tocado porque nunca esteve na transação
  const originalAgents = [
    "# Projeto Teste — contrato do agente",
    "",
    "Conteúdo mínimo de exemplo, sem marcadores.",
    "",
    "Produto vigente: `_app-vault/docs/decisions/`; mapa: `_app-vault/INDEX.md`.",
    "Processo: `.app-work/`; mapa: `.app-work/INDEX.md`. `.app-work/` é processo: nunca insumo de regra.",
    "",
  ].join("\n");
  writeFile(pkg, "AGENTS.md", originalAgents);

  const stateAfter = fs.readFileSync(stateAbs);
  assert.equal(sha256(stateAfter), stateHashBefore, "o estado deve permanecer intacto após o rollback");
  const parsed = JSON.parse(stateAfter.toString("utf8"));
  assert.equal(parsed.answers[questionKeyOf(routingQuestionContext(ADR_SRC))].scope, "this-project");
  assert.equal(
    parsed.answers[questionKeyOf(routingQuestionContext(ADR_SRC))].answer.destinationPath,
    "_app-vault/docs/decisions/formatos-de-pagamento.md",
  );

  // pacote restaurado volta a validar com o estado no lugar (checkStateContract incluso)
  const recovered = runValidator(pkg);
  assert.equal(recovered.status, 0, recovered.stderr);
  assert.ok(recovered.stdout.includes("hephaestus-state.json: contrato OK"), recovered.stdout);
});

test("AC-5.2.2: reexecução após rollback não repergunta questionKey já respondido", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const state = stateWithAnswer();
  const { routing, questions } = buildRouting(fixture, {
    fragments,
    state: {
      routing: state.routing,
      answers: state.answers,
      shield: state.shield,
    },
  });
  assert.ok(
    !questions.some((q) => q.sourcePath === ADR_SRC),
    "ADR respondido não pode voltar para a fila",
  );
  const entry = routing.find(
    (e) => e.fragmentId === fragments.find((f) => f.provenance[0].sourcePath === ADR_SRC).fragmentId,
  );
  assert.ok(entry, "ADR respondido deve ser roteado na reexecução");
  assert.equal(entry.decidedBy, "state");
});
