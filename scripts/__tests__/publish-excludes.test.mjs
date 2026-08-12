// AC-7.2.1 (S8, ancorada): a lista final de `--exclude` do publicador vem do
// mesmo dado do empacotador (`manifests/kit-manifest.json:packExcludes`) mais
// `.git` e o artefato de saída do empacotador (`hephaestus-*.zip`), exclusões
// próprias do publicador — nenhuma exclusão de conteúdo vive literalmente no
// script. Duas listas parciais é exatamente a condição que produziu ISSUE-002.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_ROOT, readJson } from "./helpers/fs-utils.mjs";

const scriptPath = path.join(REPO_ROOT, "scripts", "publish-hephaestus.sh");
const script = fs.readFileSync(scriptPath, "utf8");

const EXCLUDE_LITERAL = /--exclude\s*=\s*['"][^'"]+['"]|--exclude\s+['"][^'"]+['"]/g;

test("AC-7.2.1: nenhum --exclude literal de conteúdo no script de publicação", () => {
  const matches = script.match(EXCLUDE_LITERAL) ?? [];
  assert.deepEqual(
    matches,
    [],
    `exclusões literais sobrevivem no script (o defeito de ISSUE-002): ${matches.join(", ")}`,
  );
});

test("AC-7.2.1: o script deriva a lista de packExcludes do manifesto e soma .git e o zip do release", () => {
  const expressionMatch = script.match(
    /node\s+-e\s+'([^']+)'\s+"(\$\{SOURCE_DIR\}\/manifests\/kit-manifest\.json)"/,
  );
  assert.ok(expressionMatch, "derivação node -e do packExcludes não encontrada no script");
  const [, expression, manifestArg] = expressionMatch;
  assert.ok(expression.includes("packExcludes"), "expressão não lê packExcludes");

  const manifest = readJson(path.join(REPO_ROOT, "manifests", "kit-manifest.json"));
  const result = spawnSync(process.execPath, ["-e", expression, manifestArg.replace("${SOURCE_DIR}", REPO_ROOT)], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const derived = result.stdout.split("\n").filter(Boolean);
  assert.deepEqual(derived, manifest.packExcludes, "derivação diverge do packExcludes do manifesto");

  // A lista final é packExcludes + `.git` + artefato do empacotador
  // (exclusões próprias do publicador): o loop que monta os argumentos
  // adiciona exatamente os dois. O zip de release na raiz não viaja para o
  // repositório público (sem a exclusão, o validador do kit no clone
  // reprovaria a extensão `.zip` — fail-fast sem vazamento, mas o publish
  // não deve nem copiá-lo).
  assert.ok(/for entry in "\$\{PACK_EXCLUDES\[\@\]\}" "\.git" "hephaestus-\*\.zip"/.test(script), "loop não soma .git e hephaestus-*.zip");
  assert.ok(script.includes("--exclude=${entry}"), "argumentos não montados de --exclude=${entry}");
});

test("AC-7.2.1: preservação do comportamento de publicação (rsync absoluto, gh auth, validação)", () => {
  assert.ok(script.includes("set -euo pipefail"), "set -euo pipefail removido");
  assert.ok(script.includes("gh auth status"), "checagem de gh auth removida");
  assert.ok(script.includes("rsync -a --delete"), "rsync absoluto alterado");
  assert.ok(script.includes("validate-skill-kit.mjs"), "validação do kit antes do commit removida");
});

test("gate: sintaxe zsh do publicador válida", () => {
  const result = spawnSync("zsh", ["-n", scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
