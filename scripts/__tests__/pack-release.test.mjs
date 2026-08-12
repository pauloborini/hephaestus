// AC-7.1.1 (S8, ancorada), AC-7.1.2 (S2, ancorada) e CN7 (prova executável).
//
// O zip é o artefato que o usuário descompacta na pasta de skills (CN7): a
// prova lê o container ZIP real (leitor mínimo com node puro, sem unzip) e
// confere raiz fixa `hephaestus/`, `LICENSE` presente, ausência dos paths
// excluídos e estabilidade do prefixo (descompactar por cima sobrescreve em
// vez de acumular). A asserção discriminante de AC-7.1.1 muta o manifesto e
// exige que o conteúdo do zip mude — falha se a exclusão vier de lista
// hard-coded dentro do script.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_ROOT, mkdtemp, copyKit, runNode, readJson } from "./helpers/fs-utils.mjs";

const runPack = (cwd, args = []) =>
  spawnSync(process.execPath, ["scripts/pack-release.mjs", ...args], { cwd, encoding: "utf8" });

const dryRunEntries = (cwd) => {
  const result = runPack(cwd, ["--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.split("\n").filter(Boolean);
};

// Leitor mínimo do central directory de um zip (assinatura PK\x01\x02):
// devolve a lista de nomes de entradas, na ordem em que foram gravadas.
const zipEntryNames = (zipPath) => {
  const buffer = fs.readFileSync(zipPath);
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  assert.notEqual(eocdOffset, -1, "zip sem EOCD");
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdSize = buffer.readUInt32LE(eocdOffset + 12);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const names = [];
  let cursor = cdOffset;
  const cdEnd = cdOffset + cdSize;
  while (cursor < cdEnd && names.length < totalEntries) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50, "entrada central inválida");
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    names.push(buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8"));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return names;
};

const EXCLUDED_PREFIXES = [
  "_app-vault",
  ".app-work",
  "COMMANDS.md",
  "COMMANDS.pt-BR.md",
  "RELEASE.md",
  "RELEASE.pt-BR.md",
  "scripts/__tests__",
  "scripts/publish-hephaestus.sh",
  ".gitignore",
  ".gitkeep",
  ".DS_Store",
];

const assertNoExcludedEntries = (entries) => {
  for (const entry of entries) {
    for (const prefix of EXCLUDED_PREFIXES) {
      assert.ok(
        !(entry === `hephaestus/${prefix}` || entry.startsWith(`hephaestus/${prefix}/`)),
        `entrada excluída presente no zip: ${entry} (prefixo ${prefix})`,
      );
    }
  }
};

test("AC-7.1.1: dry-run lista só entradas sob hephaestus/, com LICENSE, sem artefato de desenvolvimento", () => {
  const entries = dryRunEntries(REPO_ROOT);
  assert.equal(entries[0], "hephaestus/", "primeira entrada deve ser hephaestus/");
  for (const entry of entries) {
    assert.ok(entry.startsWith("hephaestus/"), `entrada fora da raiz: ${entry}`);
  }
  assert.ok(entries.includes("hephaestus/LICENSE"), "LICENSE ausente do dry-run");
  assertNoExcludedEntries(entries);
});

test("AC-7.1.1: exclusões vêm do manifesto — acrescentar entrada ao packExcludes altera o zip", () => {
  const dir = mkdtemp("hep-pack-");
  copyKit(dir);
  const probe = "references/README.md";
  const manifestPath = path.join(dir, "manifests", "kit-manifest.json");

  const before = dryRunEntries(dir);
  assert.ok(
    before.includes(`hephaestus/${probe}`),
    "controle: references/README.md precisa existir no dry-run antes da mutação",
  );

  const manifest = readJson(manifestPath);
  manifest.packExcludes = [...manifest.packExcludes, probe];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const after = dryRunEntries(dir);
  assert.ok(
    !after.includes(`hephaestus/${probe}`),
    "entrada acrescentada ao packExcludes continua no zip — a exclusão não vem do manifesto",
  );
});

test("AC-7.1.2: requiredFiles ausente falha nomeando o arquivo e não escreve o zip", () => {
  const dir = mkdtemp("hep-pack-");
  copyKit(dir);
  const manifestPath = path.join(dir, "manifests", "kit-manifest.json");
  const manifest = readJson(manifestPath);
  manifest.requiredFiles = [...manifest.requiredFiles, "prompts/arquivo-inexistente.md"];
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = runPack(dir);
  assert.equal(result.status, 1, "empacotador deve falhar com requiredFiles ausente");
  assert.ok(result.stderr.includes("arquivo-inexistente.md"), result.stderr);
  const zips = fs.readdirSync(dir).filter((file) => file.endsWith(".zip"));
  assert.deepEqual(zips, [], "zip foi escrito mesmo com requiredFiles ausente");
});

test("CN7: zip real tem raiz hephaestus, LICENSE, sem artefato de desenvolvimento e prefixo estável", () => {
  const dir = mkdtemp("hep-pack-");
  copyKit(dir);
  fs.mkdirSync(path.join(dir, ".app-work", "probe"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".app-work", "probe", "x.md"), "# probe\n");
  fs.writeFileSync(path.join(dir, "_app-vault", "probe.md"), "# probe vault\n");

  const result = runPack(dir);
  assert.equal(result.status, 0, result.stderr);
  const zips = fs.readdirSync(dir).filter((file) => file.endsWith(".zip"));
  assert.equal(zips.length, 1, `esperava um zip, achei: ${zips.join(", ")}`);
  assert.ok(/^hephaestus-[\d.]+\.zip$/.test(zips[0]), `nome de zip inesperado: ${zips[0]}`);

  const entries = zipEntryNames(path.join(dir, zips[0]));
  assert.equal(entries[0], "hephaestus/", "primeira entrada do zip deve ser hephaestus/");
  for (const entry of entries) {
    assert.ok(entry.startsWith("hephaestus/"), `entrada fora da raiz: ${entry}`);
    assert.ok(!entry.startsWith("hephaestus-"), `versão embutida no prefixo: ${entry}`);
  }
  assert.ok(entries.includes("hephaestus/LICENSE"), "LICENSE ausente do zip");
  assertNoExcludedEntries(entries);

  // Descompactar por cima sobrescreve em vez de acumular: o mesmo zip,
  // descompactado num diretório de skills, sempre grava sob hephaestus/.
  const skillsDir = path.join(dir, "skills");
  const unzip = spawnSync("unzip", ["-q", "-o", path.join(dir, zips[0]), "-d", skillsDir], {
    encoding: "utf8",
  });
  assert.equal(unzip.status, 0, unzip.stderr);
  assert.ok(fs.existsSync(path.join(skillsDir, "hephaestus", "SKILL.md")), "skills/hephaestus/SKILL.md ausente");
  assert.ok(fs.existsSync(path.join(skillsDir, "hephaestus", "SKILL.en.md")), "skills/hephaestus/SKILL.en.md ausente");
  assert.ok(!fs.existsSync(path.join(skillsDir, "hephaestus-1")), "pasta com versão criada ao descompactar");
  assert.ok(!fs.existsSync(path.join(skillsDir, "hephaestus", "COMMANDS.md")), "COMMANDS.md vazou para o zip");
});

test("gate: node scripts/pack-release.mjs --dry-run sai 0 no repo real", () => {
  const result = runNode(["scripts/pack-release.mjs", "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
});
