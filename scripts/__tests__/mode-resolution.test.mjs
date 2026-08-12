// AC-2.1.2 e VC2: o modo é resolvido por presença de
// `.app-work/hephaestus-state.json`, nunca por heurística sobre estrutura
// canônica presente (D3); o sink `prompts/discover.md:Escopo por modo`
// consome o `mode` com adopt integral e maintain guiado pelo catálogo de
// drift. Asserção discriminante: o fixture A tem a estrutura canônica
// presente e o state ausente — qualquer resolução por estrutura devolveria
// maintain; a resolução declarada devolve adopt.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, mkdtemp, writeFile } from "./helpers/fs-utils.mjs";

const canonicalStructure = (root) => {
  writeFile(root, "AGENTS.md", "# Projeto — contrato do agente\n");
  writeFile(root, "_app-vault/INDEX.md", "# Vault\n");
  writeFile(root, "project-rules/index/README.md", "# Índice\n");
};

const preflightPrompt = () =>
  fs.readFileSync(path.join(REPO_ROOT, "prompts", "preflight.md"), "utf8");

test("AC-2.1.2/VC2: estrutura canônica presente SEM state entra em adopt", () => {
  const tmp = mkdtemp("hep-mode-");
  canonicalStructure(tmp);
  const statePath = path.join(tmp, ".app-work", "hephaestus-state.json");
  assert.equal(fs.existsSync(statePath), false);

  const prompt = preflightPrompt();
  // resolução por presença de arquivo
  assert.match(prompt, /hephaestus-state\.json/);
  assert.match(prompt, /ausente/);
  assert.match(prompt, /adopt/);
  assert.match(prompt, /presente/);
  assert.match(prompt, /maintain/);
  // proibição de heurística por estrutura presente
  assert.match(prompt, /nunca por heurística/);
  assert.match(prompt, /_app-vault/);

  // sink: discover consome o mode com escopo por modo
  const discover = fs.readFileSync(path.join(REPO_ROOT, "prompts", "discover.md"), "utf8");
  assert.match(discover, /## Escopo por modo/);
  assert.match(discover, /mode: adopt/);
  assert.match(discover, /varredura integral/);
  assert.match(discover, /catalog\/drift-catalog\.json/);
});

test("AC-2.1.2: com o state presente resolve maintain", () => {
  const tmp = mkdtemp("hep-mode-");
  canonicalStructure(tmp);
  writeFile(tmp, ".app-work/hephaestus-state.json", "{}\n");
  assert.equal(fs.existsSync(path.join(tmp, ".app-work", "hephaestus-state.json")), true);

  const prompt = preflightPrompt();
  assert.match(prompt, /presente/);
  assert.match(prompt, /maintain/);
});
