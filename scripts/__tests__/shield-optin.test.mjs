// AC-5.3.1 (D9, seam S4, nível ancorada): a blindagem de conteúdo de terceiros
// é OPT-IN pelo bloco `shield` do estado (`{ path, selector }`), vazia por
// default. Bloco declarado sobrevive byte a byte a execuções sucessivas (não
// entra na síntese); com o mesmo bloco FORA da lista, o conteúdo é reabsorvido
// e a remoção aparece no plano antes de aplicar. Discriminante: se a blindagem
// dependesse de marcador dentro do artefato (contrato que D8 removeu) ou de
// heurística, o arquivo seria reescrito/movido e a asserção de bytes idênticos
// falharia.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { copyFixture } from "./helpers/fixtures.mjs";
import {
  buildRouting,
  buildFragments,
  applyRouting,
} from "./helpers/routing-engine.mjs";

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const GUIDE_SRC = "docs/guides/XPTO_GUIDE/GUIDE.md";

const stateWithShield = (shield) => ({
  routing: { overlay: [] },
  answers: {},
  shield,
});

// Uma execução sobre o fixture: fragmenta, roteia (com o state dado) e aplica.
const runOnce = (fixture, state) => {
  const fragments = buildFragments(fixture);
  const { routing, questions } = buildRouting(fixture, { fragments, state });
  applyRouting(fixture, routing, fragments);
  return { fragments, routing, questions };
};

test("AC-5.3.1: bloco declarado no shield sobrevive byte a byte a três execuções sucessivas", () => {
  const fixture = copyFixture("repo-desorganizado");
  const shield = stateWithShield([{ path: "docs/guides/XPTO_GUIDE/GUIDE.md" }]);
  const guideAbs = path.join(fixture, GUIDE_SRC);
  const originalBytes = fs.readFileSync(guideAbs);
  const hashes = [];
  for (let i = 0; i < 3; i += 1) {
    const { routing, questions } = runOnce(fixture, shield);
    hashes.push(sha256(fs.readFileSync(guideAbs)));
    // blindado decide keep com decidedBy: state e nunca passa pela síntese
    const entry = routing.find(
      (e) => e.fragmentId === buildFragments(fixture).find((f) => f.provenance[0].sourcePath === GUIDE_SRC).fragmentId,
    );
    assert.equal(entry.regime, "keep", `execução ${i + 1}: blindado deve ser keep`);
    assert.equal(entry.decidedBy, "state", `execução ${i + 1}: blindagem decide pelo estado`);
    assert.equal(entry.destinationPath, GUIDE_SRC);
    // nada do conteúdo blindado vira pergunta nem reescrita
    assert.ok(!questions.some((q) => q.sourcePath === GUIDE_SRC));
  }
  assert.equal(hashes[0], hashes[1]);
  assert.equal(hashes[1], hashes[2]);
  // bytes efetivamente preservados, não apenas hash
  assert.deepEqual(fs.readFileSync(guideAbs), originalBytes);
});

test("AC-5.3.1: shield por prefixo de pasta blinda todos os arquivos sob ela", () => {
  const fixture = copyFixture("repo-desorganizado");
  const shield = stateWithShield([{ path: "docs/guides" }]);
  runOnce(fixture, shield);
  const guideAbs = path.join(fixture, GUIDE_SRC);
  assert.ok(fs.existsSync(guideAbs), "arquivo sob pasta blindada deve permanecer no lugar");
  // nada foi movido para .app-work/done/
  assert.ok(!fs.existsSync(path.join(fixture, ".app-work", "done", "GUIDE.md")));
});

test("AC-5.3.1: bloco FORA da lista é reabsorvido e a remoção aparece no plano antes de aplicar", () => {
  const fixture = copyFixture("repo-desorganizado");
  const fragments = buildFragments(fixture);
  const guideFrag = fragments.find((f) => f.provenance[0].sourcePath === GUIDE_SRC);
  assert.ok(guideFrag, "fragmento do guia deve existir antes do apply");
  // shield vazio por default (D9): todo conteúdo é fonte
  const { routing, questions } = runOnce(fixture, stateWithShield([]));
  const guideEntry = routing.find((e) => e.fragmentId === guideFrag.fragmentId);
  assert.ok(guideEntry, "guia deve ser roteado sem shield");
  assert.equal(guideEntry.regime, "relocate");
  // o plano antes de aplicar (mesma derivação do compose-engine: relocate ⇒
  // move, keep ⇒ keep, generate ⇒ create; destino-pasta recebe o basename)
  // lista a reabsorção do guia como operação move — visível antes de aplicar
  const planEntries = routing.map((entry) => {
    const src = fragments.find((f) => f.fragmentId === entry.fragmentId)?.provenance?.[0]?.sourcePath;
    return {
      artifactPath: entry.destinationPath.endsWith("/")
        ? `${entry.destinationPath}${path.basename(src ?? "artefato.md")}`
        : entry.destinationPath,
      territory: entry.territory,
      regime: entry.regime,
      operation:
        entry.regime === "keep" ? "keep" : entry.regime === "relocate" ? "move" : "create",
      origin: entry.fragmentId,
    };
  });
  const moveEntry = planEntries.find((e) => e.origin === guideFrag.fragmentId);
  assert.ok(moveEntry, "operação do guia deve aparecer no plano");
  assert.equal(moveEntry.operation, "move", "remoção/reabsorção é operação move no plano");
  assert.equal(moveEntry.artifactPath, ".app-work/done/GUIDE.md");
  // após o apply (sem blindagem), o conteúdo saiu da origem
  assert.ok(!fs.existsSync(path.join(fixture, GUIDE_SRC)), "sem shield o guia é reabsorvido");
  assert.ok(fs.existsSync(path.join(fixture, ".app-work", "done", "GUIDE.md")));
  // não enfileira: o catálogo decide com confiança alta
  assert.ok(!questions.some((q) => q.sourcePath === GUIDE_SRC));
});

test("AC-5.3.1: o mesmo arquivo fora da lista na execução seguinte é reabsorvido (blindagem é opt-in por execução)", () => {
  const fixture = copyFixture("repo-desorganizado");
  // execução 1: blindado — permanece
  runOnce(fixture, stateWithShield([{ path: "docs/guides/XPTO_GUIDE/GUIDE.md" }]));
  assert.ok(fs.existsSync(path.join(fixture, GUIDE_SRC)));
  // execução 2: mesmo arquivo fora da lista — é reabsorvido
  runOnce(fixture, stateWithShield([]));
  assert.ok(!fs.existsSync(path.join(fixture, GUIDE_SRC)), "blindagem removida ⇒ reabsorve");
  assert.ok(fs.existsSync(path.join(fixture, ".app-work", "done", "GUIDE.md")));
});
