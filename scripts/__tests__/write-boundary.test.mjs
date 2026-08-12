// AC-2.4.1 (INV1) e AC-2.4.4 (LEG4): nenhuma cláusula declara escrita em
// caminho versionado do repositório fora de `prompts/apply.md` e da exceção
// declarada de `prompts/interview.md` (que grava `.app-work/hephaestus-state.json`
// fora da transação — INV1, implementada no Plano 05); `prompts/synthesize.md`
// está morto.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./helpers/fs-utils.mjs";

const promptsDir = path.join(REPO_ROOT, "prompts");

const WRITE_VERBS =
  /(?:grava(?:r)?|escreve(?:r)?|persist(?:ir|e)?|sobrescreve(?:r)?|sobrescrita|copia(?:r)?)/i;
const REPO_PATHS =
  /(?:AGENTS\.md|project-rules\/|_app-vault\/|\.app-work\/(?!hephaestus-state\.json))/;
const READ_OR_NEGATED =
  /(?:^|\s)(?:não|nao|nunca|não-|ler|leia|lê|veja|revisar|revisa|conferir|confirmar|somente leitura|apenas leitura)/i;

// Prompts que declaram escrita no repositório: apply (transação) e interview
// (exceção de INV1 — estado versionado fora da transação).
const WRITE_PROMPTS = new Set(["apply.md", "interview.md"]);

test("AC-2.4.1/INV1: todo prompt declara Escreve no repositório; só apply.md e interview.md (exceção declarada) declaram sim", () => {
  const prompts = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  assert.ok(prompts.includes("apply.md"), "apply.md deve existir");
  for (const file of prompts) {
    const contents = fs.readFileSync(path.join(promptsDir, file), "utf8");
    const section = contents.match(/## Escreve no repositório[^\n]*\n([\s\S]*?)(?=\n## |$)/);
    assert.ok(section, `${file}: seção "Escreve no repositório" ausente`);
    const value = section[1]
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";
    if (WRITE_PROMPTS.has(file)) {
      assert.match(value, /sim/i, `${file}: deve declarar escrita`);
    } else {
      assert.match(value, /não|nao/i, `${file}: deve declarar que não escreve no repositório`);
    }
  }
});

test("AC-2.4.1/INV1: nenhuma cláusula de escrita em caminho versionado fora de apply.md e da exceção declarada de interview.md", () => {
  const prompts = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  const offenders = [];
  for (const file of prompts) {
    if (file === "apply.md") continue;
    const contents = fs.readFileSync(path.join(promptsDir, file), "utf8");
    const lines = contents.split("\n");
    for (const line of lines) {
      if (line.includes(".hephaestus/")) continue; // efêmero gitignored
      if (!WRITE_VERBS.test(line)) continue;
      if (READ_OR_NEGATED.test(line)) continue;
      if (REPO_PATHS.test(line)) {
        offenders.push(`${file}: ${line.trim()}`);
      }
    }
  }
  // a exceção declarada de interview.md grava exclusivamente o estado
  // versionado; qualquer outra linha com escrita em caminho versionado é
  // violação de INV1
  assert.deepEqual(offenders, []);
});

test("AC-2.4.1/INV1: interview.md grava exclusivamente .app-work/hephaestus-state.json", () => {
  const interview = fs.readFileSync(path.join(promptsDir, "interview.md"), "utf8");
  const lines = interview.split("\n");
  const offenders = [];
  for (const line of lines) {
    if (line.includes(".hephaestus/")) continue;
    if (!WRITE_VERBS.test(line)) continue;
    if (READ_OR_NEGATED.test(line)) continue;
    if (REPO_PATHS.test(line)) offenders.push(line.trim());
  }
  assert.deepEqual(offenders, [], "interview.md não pode escrever em caminho versionado além do state");
  assert.match(interview, /\.app-work\/hephaestus-state\.json/);
  assert.match(interview, /fora da transação/);
  assert.match(interview, /merge/);
  assert.match(interview, /nunca/);
});

test("AC-2.4.1/INV1: a exceção nominal de interview está declarada em apply.md", () => {
  const apply = fs.readFileSync(path.join(promptsDir, "apply.md"), "utf8");
  assert.match(apply, /interview/);
  assert.match(apply, /\.app-work\/hephaestus-state\.json/);
  assert.match(apply, /fora da transação/);
});

test("AC-2.4.4/LEG4: prompts/synthesize.md não existe", () => {
  assert.equal(fs.existsSync(path.join(promptsDir, "synthesize.md")), false);
});

test("AC-2.4.4/LEG4: nenhuma ocorrência de synthesize em SKILL.md, SKILL.en.md, manifests/ e prompts/", () => {
  const targets = [
    path.join(REPO_ROOT, "SKILL.md"),
    path.join(REPO_ROOT, "SKILL.en.md"),
    path.join(REPO_ROOT, "manifests"),
    promptsDir,
  ];
  const offenders = [];
  for (const target of targets) {
    if (fs.statSync(target).isDirectory()) {
      for (const file of fs.readdirSync(target)) {
        const abs = path.join(target, file);
        if (fs.statSync(abs).isDirectory()) continue;
        const contents = fs.readFileSync(abs, "utf8");
        if (contents.includes("synthesize")) offenders.push(abs);
      }
    } else {
      const contents = fs.readFileSync(target, "utf8");
      if (contents.includes("synthesize")) offenders.push(target);
    }
  }
  assert.deepEqual(offenders, []);
});
