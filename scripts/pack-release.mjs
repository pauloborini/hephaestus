#!/usr/bin/env node
// Empacotador do release (D13, D14, VC4, S8).
//
// Lê `manifests/kit-manifest.json`, confere que todo `requiredFiles` existe na
// árvore de desenvolvimento, coleta a árvore aplicando `packExcludes` por
// prefixo de path, prefixa cada entrada com `hephaestus/` (raiz fixa, sem
// versão no nome da pasta) e escreve `hephaestus-<version>.zip` na raiz.
//
// `--dry-run` imprime a lista de entradas (uma por linha) e não escreve nada.
//
// Sem dependências externas: o container ZIP é montado com `node:zlib`
// (deflate) e CRC32 próprio, para rodar em Node >= 18.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const rootDir = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(rootDir, "manifests", "kit-manifest.json");
const dryRun = process.argv.includes("--dry-run");

const fail = (message) => {
  console.error(`pack-release failed: ${message}`);
  process.exit(1);
};

if (!fs.existsSync(manifestPath)) {
  fail(`missing manifest: ${manifestPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const packExcludes = Array.isArray(manifest.packExcludes) ? manifest.packExcludes : [];

if (!Array.isArray(manifest.requiredFiles) || manifest.requiredFiles.length === 0) {
  fail("kit-manifest.json must declare requiredFiles");
}

const missingFiles = manifest.requiredFiles.filter((relativePath) => {
  return !fs.existsSync(path.join(rootDir, relativePath));
});

if (missingFiles.length > 0) {
  fail(`missing required files:\n${missingFiles.join("\n")}`);
}

// Exclusão por prefixo de path: `entry` casa o próprio arquivo/pasta e tudo
// que vive sob ela. `packExcludes` é a lista final (VC4) — nenhuma exclusão
// de conteúdo vive hard-coded aqui.
const isExcluded = (relativePath) => {
  return packExcludes.some((entry) => {
    return relativePath === entry || relativePath.startsWith(`${entry}/`);
  });
};

// O próprio artefato do empacotador (release anterior na mesma árvore) nunca
// viaja no zip — é saída, não conteúdo.
const isOwnZip = (relativePath) => /^hephaestus-.*\.zip$/.test(path.basename(relativePath));

const collectFiles = (dirPath) => {
  const files = [];
  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const absolutePath = path.join(current, entry.name);
      const relativePath = path.relative(rootDir, absolutePath);
      if (isExcluded(relativePath) || isOwnZip(relativePath)) continue;
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else {
        files.push(relativePath);
      }
    }
  }
  return files;
};

const files = collectFiles(rootDir).sort();
// Entrada de diretório raiz primeiro: descompactar sempre cria/sobrescreve
// `hephaestus/`, nunca uma segunda pasta com versão no nome.
const entries = ["hephaestus/", ...files.map((relativePath) => `hephaestus/${relativePath}`)];

if (dryRun) {
  process.stdout.write(`${entries.join("\n")}\n`);
  process.exit(0);
}

if (typeof manifest.version !== "string" || manifest.version.length === 0) {
  fail("kit-manifest.json must declare a version");
}

const zipPath = path.join(rootDir, `hephaestus-${manifest.version}.zip`);

// --- container ZIP mínimo (local headers + central directory + EOCD) ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date) => {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = (date.getFullYear() - 1980) << 9 | (date.getMonth() + 1) << 5 | date.getDate();
  return { time, day };
};

const { time: dosTime, day: dosDate } = dosDateTime(new Date());

const localHeader = (name, method, crc, compressedSize, uncompressedSize) => {
  const nameBuffer = Buffer.from(name, "utf8");
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // local file header signature
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(method, 8);
  header.writeUInt16LE(dosTime, 10);
  header.writeUInt16LE(dosDate, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressedSize, 18);
  header.writeUInt32LE(uncompressedSize, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  header.writeUInt16LE(0, 28); // extra length
  return Buffer.concat([header, nameBuffer]);
};

const centralRecord = (name, method, crc, compressedSize, uncompressedSize, offset) => {
  const nameBuffer = Buffer.from(name, "utf8");
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0); // central directory signature
  record.writeUInt16LE(20, 4); // version made by
  record.writeUInt16LE(20, 6); // version needed
  record.writeUInt16LE(0, 8); // flags
  record.writeUInt16LE(method, 10);
  record.writeUInt16LE(dosTime, 12);
  record.writeUInt16LE(dosDate, 14);
  record.writeUInt32LE(crc, 16);
  record.writeUInt32LE(compressedSize, 20);
  record.writeUInt32LE(uncompressedSize, 24);
  record.writeUInt16LE(nameBuffer.length, 28);
  record.writeUInt16LE(0, 30); // extra length
  record.writeUInt16LE(0, 32); // comment length
  record.writeUInt16LE(0, 34); // disk number start
  record.writeUInt16LE(0, 36); // internal attributes
  record.writeUInt32LE(0, 38); // external attributes
  record.writeUInt32LE(offset, 42); // local header offset
  return Buffer.concat([record, nameBuffer]);
};

const buildArchive = () => {
  const chunks = [];
  const centralRecords = [];
  let offset = 0;

  for (const entryName of entries) {
    const absolutePath = entryName === "hephaestus/" ? null : path.join(rootDir, entryName.slice("hephaestus/".length));
    const isDirectory = entryName.endsWith("/");
    const data = isDirectory ? Buffer.alloc(0) : fs.readFileSync(absolutePath);
    const uncompressedSize = data.length;
    const crc = crc32(data);
    const compressed = isDirectory ? data : zlib.deflateRawSync(data);
    const method = isDirectory ? 0 : 8;
    const header = localHeader(entryName, method, crc, compressed.length, uncompressedSize);
    chunks.push(header, compressed);
    centralRecords.push(
      centralRecord(entryName, method, crc, compressed.length, uncompressedSize, offset),
    );
    offset += header.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralRecords);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with central directory
  eocd.writeUInt16LE(centralRecords.length, 8); // entries on this disk
  eocd.writeUInt16LE(centralRecords.length, 10); // total entries
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(offset, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...chunks, centralDirectory, eocd]);
};

const archive = buildArchive();
fs.writeFileSync(zipPath, archive);
console.log(`Wrote ${path.relative(rootDir, zipPath)} (${entries.length - 1} files, ${archive.length} bytes)`);
