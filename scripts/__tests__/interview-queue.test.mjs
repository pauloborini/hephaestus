// AC-5.2.3 e CN4 (prova executável de 2.1, seam S4, ancorada): perguntas
// nascem ENFILEIRADAS em `route` e `reconcile` e nunca são feitas na fase de
// origem — o ponto único de interrupção é `prompts/interview.md` (D22). O
// scan varre os prompts por instrução direta de perguntar (fora de negação e
// fora do canal da fila), e o motor prova o comportamento: fragmento sem
// decisão vira `questions.json` (enfileirado), nunca decisão silenciosa nem
// interação na fase de origem.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";
import { buildRouting, buildFragments } from "./helpers/routing-engine.mjs";

const promptsDir = path.join(REPO_ROOT, "prompts");
const readPrompt = (name) => fs.readFileSync(path.join(promptsDir, name), "utf8");

// Instrução direta de perguntar ao usuário (imperativo de interrogação na
// fase de origem). Negação e canal da fila isentam a linha.
const ASK_IMPERATIVES =
  /(?:pergunte|perguntar ao usuário|questione|faça a pergunta|faça as perguntas|interrompa o usuário|perguntar na hora|pergunte ao usuário)/i;
const FILA_CHANNEL =
  /(?:enfileir|fila|nasce|drenad|bloqueante|questionKey|nunca|não|nao|justifica|registra)/i;

test("AC-5.2.3: route.md e reconcile.md não instruem perguntar — só enfileiram", () => {
  for (const file of ["route.md", "reconcile.md"]) {
    const contents = readPrompt(file);
    const offenders = [];
    for (const line of contents.split("\n")) {
      if (!ASK_IMPERATIVES.test(line)) continue;
      if (FILA_CHANNEL.test(line)) continue;
      offenders.push(line.trim());
    }
    assert.deepEqual(offenders, [], `${file}: instrução direta de perguntar na fase de origem`);
  }
});

test("AC-5.2.3: as duas fases declaram o canal da fila e a lista do que nunca pergunta", () => {
  for (const file of ["route.md", "reconcile.md"]) {
    const contents = readPrompt(file);
    assert.match(contents, /Fila de perguntas/, `${file}: seção da fila ausente`);
    assert.match(contents, /enfileira/, `${file}: deve enfileirar`);
    assert.match(contents, /Justifica pergunta/, `${file}: lista fechada do que justifica pergunta`);
    assert.match(contents, /Nunca pergunta/, `${file}: lista fechada do que nunca pergunta`);
  }
});

test("AC-5.2.3: só interview.md contém instrução de perguntar (ponto único de interrupção)", () => {
  const interview = readPrompt("interview.md");
  assert.match(interview, /pergunt/i);
  assert.match(interview, /lote/);
  assert.match(interview, /dreno único|drenar/i);
  // as demais fases não perguntam: nenhum outro prompt tem seção de entrevista
  const others = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md") && f !== "interview.md" && f !== "apply.md");
  for (const file of others) {
    const contents = readPrompt(file);
    assert.ok(!contents.includes("## Entrevista"), `${file}: seção de entrevista fora do lugar`);
  }
});

test("CN4: pergunta nasce enfileirada e nunca é feita na fase de origem (motor)", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const { routing, questions } = buildRouting(fixture, { fragments });

  // o ADR aceito (destination null no catálogo) não é decidido em silêncio:
  // vira pergunta enfileirada, com questionKey e fragmentId — e nada na saída
  // da fase de origem é uma interrogação (a fila é o único canal)
  const adrQuestion = questions.find((q) => q.sourcePath === "docs/adr/0001-formato-pagamentos.md");
  assert.ok(adrQuestion, "ADR deveria enfileirar pergunta");
  assert.ok(adrQuestion.questionKey && adrQuestion.fragmentId, "pergunta enfileirada sem identidade");
  const adrFrag = fragments.find((f) => f.provenance[0].sourcePath === "docs/adr/0001-formato-pagamentos.md");
  assert.ok(!routing.some((e) => e.fragmentId === adrFrag.fragmentId), "enfileirado não pode ser roteado");

  // todo fragmento sai roteado OU enfileirado — nunca em silêncio (gate)
  const routedIds = new Set(routing.map((e) => e.fragmentId));
  const questionIds = new Set(questions.map((q) => q.fragmentId));
  for (const fragment of fragments) {
    assert.ok(
      routedIds.has(fragment.fragmentId) || questionIds.has(fragment.fragmentId),
      `fragmento ${fragment.provenance[0].sourcePath} saiu em silêncio`,
    );
  }
});
