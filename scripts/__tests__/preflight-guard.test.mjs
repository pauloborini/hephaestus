// AC-2.1.1 e CN6 (INV8): o gate de preflight recusa em worktree suja nos dois
// modos, sem override, listando os arquivos pendentes e sem mutar nada; fora
// de repositório git recusa nomeando a condição. O prompt é o corpo do gate
// (contrato do agente); o teste ancora a condição nos comandos reais de git
// que o prompt manda executar e assere as cláusulas discriminantes do texto.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_ROOT, mkdtemp, writeFile } from "./helpers/fs-utils.mjs";

const git = (args, cwd) => spawnSync("git", args, { cwd, encoding: "utf8" });

const preflightPrompt = () =>
  fs.readFileSync(path.join(REPO_ROOT, "prompts", "preflight.md"), "utf8");

test("AC-2.1.1/CN6: worktree suja é detectada por git status --porcelain e o prompt recusa nos dois modos sem override", () => {
  const tmp = mkdtemp("hep-preflight-");
  git(["init", "-q"], tmp);
  git(["config", "user.email", "t@t"], tmp);
  git(["config", "user.name", "t"], tmp);
  writeFile(tmp, "base.md", "base\n");
  git(["add", "."], tmp);
  git(["commit", "-qm", "base"], tmp);
  writeFile(tmp, "sujo.md", "sujo\n"); // não commitado -> worktree suja

  const status = git(["status", "--porcelain"], tmp);
  assert.equal(status.status, 0, status.stderr);
  assert.ok(status.stdout.includes("sujo.md"), status.stdout);

  const prompt = preflightPrompt();
  assert.match(prompt, /git status --porcelain/);
  assert.match(prompt, /nos dois modos/);
  assert.match(prompt, /sem override/);
  assert.match(prompt, /listando os arquivos pendentes/);
  assert.match(prompt, /sem mutar nada/);
});

test("AC-2.1.1: fora de repositório git a condição do gate falha e o prompt recusa nomeando a condição", () => {
  const tmp = mkdtemp("hep-nogit-");
  writeFile(tmp, "a.md", "a\n");
  const rev = git(["rev-parse", "--is-inside-work-tree"], tmp);
  assert.notEqual(rev.status, 0);

  const prompt = preflightPrompt();
  assert.match(prompt, /repositório git/);
  assert.match(prompt, /recusa nomeando a condição/);
});

test("AC-2.1.1: os comandos do gate (rev-parse, status --porcelain) não mutam o fixture", () => {
  const tmp = mkdtemp("hep-nomut-");
  git(["init", "-q"], tmp);
  writeFile(tmp, "a.md", "conteudo\n");
  const before = fs.readFileSync(path.join(tmp, "a.md"), "utf8");
  git(["rev-parse", "--is-inside-work-tree"], tmp);
  git(["status", "--porcelain"], tmp);
  const after = fs.readFileSync(path.join(tmp, "a.md"), "utf8");
  assert.equal(after, before);
});
