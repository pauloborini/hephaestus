// Captura do golden `golden-routing-adopt` (S3/S9) a partir do fixture
// `scripts/__tests__/fixtures/repo-desorganizado/` (Plano 03).
//
// Uso: node scripts/__tests__/capture-golden-routing.mjs
//
// O motor de referência (routing-engine.mjs) emite os níveis 1-4
// (determinísticos) com o catálogo real do repositório; o nível 5 (resíduo
// da LLM) entra congelado via DEFAULT_RESIDUE (S9). A proveniência é gravada
// no cabeçalho do arquivo. Regravar só quando o contrato da fronteira mudar,
// registrando o motivo no Impl do plano.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";
import { buildRouting, buildFragments } from "./helpers/routing-engine.mjs";

const fixturePath = path.join(
  REPO_ROOT,
  "scripts",
  "__tests__",
  "fixtures",
  "repo-desorganizado",
);

const fragments = buildFragments(fixturePath);
const { routing, questions } = buildRouting(fixturePath, {
  fragments,
});

const golden = {
  _provenance: {
    fixture: "scripts/__tests__/fixtures/repo-desorganizado",
    capturedAt: "2026-08-13",
    command: "node scripts/__tests__/capture-golden-routing.mjs",
    generatedBy:
      "routing-engine.mjs (níveis 1-4 determinísticos, catálogo real) + resíduo da LLM congelado (S9); espelho do archive DEC-002",
    fragmentCount: fragments.length,
  },
  entries: routing,
  questionCount: questions.length,
};

const outPath = path.join(
  REPO_ROOT,
  "scripts",
  "__tests__",
  "fixtures",
  "golden-routing-adopt.json",
);
fs.writeFileSync(outPath, `${JSON.stringify(golden, null, 2)}\n`);
console.log(
  `golden gravado: ${path.relative(REPO_ROOT, outPath)} (${routing.length} entradas, ${questions.length} perguntas)`,
);
