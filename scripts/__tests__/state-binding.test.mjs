// AC-5.2.1 e AC-5.2.4 (VC3/INV6, seam S4, nível ancorada): o nível 2 da
// cascata consulta `answers[questionKey]` do estado versionado ANTES do
// catálogo, dos detectores e do resíduo da LLM — resposta de escopo do
// projeto vence e decide `decidedBy: state` (D22, vinculante); e o
// `questionKey = sha256(contexto normalizado)` é estável sob reformulação do
// texto da pergunta (a chave deriva do contexto, nunca da prosa — AC-5.2.4).
// A prova é discriminante: o mesmo fragmento sem a resposta cai no destino do
// catálogo; com a resposta, o destino é o dela.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { copyFixture } from "./helpers/fixtures.mjs";
import {
  buildRouting,
  buildFragments,
  questionKeyOf,
  routingQuestionContext,
} from "./helpers/routing-engine.mjs";

// Fragmento cujo catálogo real (routing-defaults.json) decide `.app-work/references/`
// (clones OSS em archive/ → específico vence o genérico). Resposta de projeto
// aponta para OUTRO destino legal — se o nível 2 fosse consultado depois do
// catálogo, o destino seria o do catálogo e a asserção falharia.
const SRC = "docs/archive/clones-oss/analise-argus.md";
const ANSWER_DESTINATION = "project-rules/reference/analise-argus.md";

const answerFor = (destinationPath, scope = "this-project") => ({
  answer: { destinationPath },
  scope,
  sourceEvidence: "docs/brainstorming/tema-x.md",
  answeredAt: "2026-08-12T00:00:00.000Z",
});

test("AC-5.2.1: resposta this-project divergindo do catálogo decide o destino e registra decidedBy: state", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const questionKey = questionKeyOf(routingQuestionContext(SRC));
  const { routing, questions } = buildRouting(fixture, {
    fragments,
    state: {
      routing: { overlay: [] },
      answers: { [questionKey]: answerFor(ANSWER_DESTINATION) },
      shield: [],
    },
  });
  const entry = routing.find((e) => e.fragmentId === fragments.find((f) => f.provenance[0].sourcePath === SRC).fragmentId);
  assert.ok(entry, `fragmento ${SRC} deveria estar roteado`);
  assert.equal(entry.destinationPath, ANSWER_DESTINATION);
  assert.equal(entry.decidedBy, "state");
  assert.match(entry.evidence, /questionKey/);
  assert.ok(entry.regime === "generate" || entry.regime === "reconcile", entry.regime);

  // asserção discriminante: SEM a resposta, o mesmo fragmento cai no catálogo
  const { routing: without } = buildRouting(fixture, { fragments });
  const entryWithout = without.find((e) => e.fragmentId === entry.fragmentId);
  assert.ok(entryWithout, "fragmento deveria ser roteado mesmo sem resposta");
  assert.notEqual(entryWithout.destinationPath, ANSWER_DESTINATION);
  assert.equal(entryWithout.decidedBy, "catalog");
  assert.equal(entryWithout.destinationPath, ".app-work/references/");
});

test("AC-5.2.1: resposta decide o ADR enfileirado — reuso sem reperguntar", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  // o ADR aceito é o caso do fixture que enfileira (destination null no catálogo)
  const adrSrc = "docs/adr/0001-formato-pagamentos.md";
  const adrQuestionKey = questionKeyOf(routingQuestionContext(adrSrc));
  const { routing, questions } = buildRouting(fixture, {
    fragments,
    state: {
      routing: { overlay: [] },
      answers: { [adrQuestionKey]: answerFor("_app-vault/docs/decisions/formatos-de-pagamento.md") },
      shield: [],
    },
  });
  const entry = routing.find((e) => e.fragmentId === fragments.find((f) => f.provenance[0].sourcePath === adrSrc).fragmentId);
  assert.ok(entry, "ADR com resposta deveria ser roteado");
  assert.equal(entry.decidedBy, "state");
  assert.equal(entry.destinationPath, "_app-vault/docs/decisions/formatos-de-pagamento.md");
  assert.equal(entry.regime, "reconcile");
  // nada do ADR sobra na fila — não repergunta o que já foi respondido
  assert.ok(!questions.some((q) => q.sourcePath === adrSrc), "ADR respondido não pode reenfileirar");
});

test("AC-5.2.1: resposta com destino ilegal bloqueia nomeando o fragmento", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const questionKey = questionKeyOf(routingQuestionContext(SRC));
  assert.throws(
    () =>
      buildRouting(fixture, {
        fragments,
        state: {
          routing: { overlay: [] },
          answers: { [questionKey]: answerFor("fora/dos-territorios.md") },
          shield: [],
        },
      }),
    (error) =>
      error.message.includes("destino ilegal") &&
      error.message.includes("fora/dos-territorios.md"),
  );
});

test("AC-5.2.4: questionKey deriva do contexto normalizado e é estável sob reformulação do texto da pergunta", () => {
  // a chave é função do contexto (origem + o que falta decidir); o texto da
  // pergunta não entra na computação — reformular a prosa não gera chave nova
  const context = routingQuestionContext("docs/adr/0001-formato-pagamentos.md");
  const keyA = questionKeyOf(context);
  const keyB = questionKeyOf(context); // recomputação após "reformular a pergunta"
  assert.equal(keyA, keyB);
  assert.equal(keyA.length, 64); // sha256 hex
  // contextos diferentes produzem chaves diferentes
  const other = questionKeyOf(routingQuestionContext("docs/IDEIAS.md"));
  assert.notEqual(keyA, other);
  // a resposta gravada sob a chave do contexto é reusada independentemente de
  // qualquer texto de pergunta (o motor nem recebe texto — só o contexto)
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const { routing } = buildRouting(fixture, {
    fragments,
    state: {
      routing: { overlay: [] },
      answers: { [keyA]: answerFor("_app-vault/docs/decisions/formatos-de-pagamento.md") },
      shield: [],
    },
  });
  const entry = routing.find(
    (e) => e.fragmentId === fragments.find((f) => f.provenance[0].sourcePath === "docs/adr/0001-formato-pagamentos.md").fragmentId,
  );
  assert.ok(entry, "resposta reusada pela chave do contexto");
  assert.equal(entry.decidedBy, "state");
});

test("AC-5.2.4: a chave de enfileiramento é a mesma da consulta do nível 2 (reuso ponta a ponta)", () => {
  const fixture = copyFixture("repo-desorganizado");
  // primeira passada sem respostas: o ADR enfileira com a chave do contexto
  const { questions } = buildRouting(fixture, {});
  const adrQuestion = questions.find((q) => q.sourcePath === "docs/adr/0001-formato-pagamentos.md");
  assert.ok(adrQuestion, "ADR deveria enfileirar sem resposta");
  assert.equal(adrQuestion.questionKey, questionKeyOf(routingQuestionContext("docs/adr/0001-formato-pagamentos.md")));
  // segunda passada com a resposta gravada sob essa mesma chave: decidido, não enfileira
  const fragments = buildFragments(fixture);
  const { routing, questions: after } = buildRouting(fixture, {
    fragments,
    state: {
      routing: { overlay: [] },
      answers: { [adrQuestion.questionKey]: answerFor("_app-vault/docs/decisions/formatos-de-pagamento.md") },
      shield: [],
    },
  });
  assert.ok(!after.some((q) => q.sourcePath === "docs/adr/0001-formato-pagamentos.md"));
  assert.ok(routing.some((e) => e.decidedBy === "state"));
});

test("AC-5.2.x: estado com campo de topo desconhecido não bloqueia a cascata (D4)", () => {
  const fixture = copyFixture("repo-desorganizado");
  const questionKey = questionKeyOf(routingQuestionContext(SRC));
  const { routing } = buildRouting(fixture, {
    state: {
      routing: { overlay: [] },
      answers: { [questionKey]: answerFor(ANSWER_DESTINATION) },
      shield: [],
      futureBlock: { algumCampo: true },
    },
  });
  assert.ok(routing.some((e) => e.decidedBy === "state"));
});
