// Captura do fixture `pacote-adopt` (CN1/AC-4.3.x) a partir do fixture
// `scripts/__tests__/fixtures/repo-desorganizado/` (Plano 03).
//
// Uso: node scripts/__tests__/capture-pacote-adopt.mjs
//
// O pipeline de referência (compose-engine.mjs) roda fragments -> route
// (golden replay) -> reconcile -> compose e grava o pacote final com os
// quatro territórios. A proveniência é gravada no cabeçalho do
// `staging-manifest.json`. Regravar só quando o contrato da fronteira mudar,
// registrando o motivo no Impl do plano.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, writeFile } from "./helpers/fs-utils.mjs";
import { runAdoptPipeline } from "./helpers/compose-engine.mjs";

const fixturePath = path.join(
  REPO_ROOT,
  "scripts",
  "__tests__",
  "fixtures",
  "repo-desorganizado",
);
const outPath = path.join(REPO_ROOT, "scripts", "__tests__", "fixtures", "pacote-adopt");

const NOW = "2026-08-12";

const { files, composed, routing, questions } = runAdoptPipeline(fixturePath, { now: NOW });

// Recria o diretório do fixture do zero (captura é regeneração, nunca diff).
fs.rmSync(outPath, { recursive: true, force: true });

// Fontes que permanecem após o apply: apenas fragmentos enfileirados
// (pergunta sem resposta — drenada pelo Plano 05) ficam no lugar.
for (const question of questions) {
  const sourceAbs = path.join(fixturePath, question.sourcePath);
  writeFile(outPath, question.sourcePath, fs.readFileSync(sourceAbs, "utf8"));
}

// Artefatos do pacote (a árvore final composta, incluindo o próprio
// staging-manifest.json, que não entra na lista que descreve).
for (const [rel, content] of files) {
  writeFile(outPath, rel, content);
}

console.log(
  `pacote gravado: ${path.relative(REPO_ROOT, outPath)} (${composed.length} artefatos compostos, ${questions.length} pendência(s) em aberto)`,
);
