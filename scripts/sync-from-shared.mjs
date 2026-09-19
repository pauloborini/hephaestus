#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const SKILL_ID = "hephaestus";
const ENGLISH_PAIRS = new Map([
  ["SKILL.md", "SKILL.pt-BR.md"],
  ["README.md", "README.pt-BR.md"],
  ["COMMANDS.md", "COMMANDS.pt-BR.md"],
]);

const sharedRoot = () =>
  path.resolve(process.env.SHARED_ROOT ?? path.join(REPO_ROOT, "..", "shared"));

const sourceRoot = () => path.join(sharedRoot(), "skills", "_shared", SKILL_ID);

const loadPackExcludes = () => {
  const manifestPath = path.join(REPO_ROOT, "manifests", "kit-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return Array.isArray(manifest.packExcludes) ? manifest.packExcludes : [];
};

const listFiles = (root) => {
  const files = new Map();
  if (!fs.existsSync(root)) return files;

  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "__pycache__") continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile() && !/[.]py[co]$/.test(entry.name)) {
        files.set(path.relative(root, absolute).split(path.sep).join("/"), absolute);
      }
    }
  };

  visit(root);
  return files;
};

const isRepoOnlyFile = (relativePath) =>
  relativePath.endsWith(".pt-BR.md") || /^hephaestus-[^/]+[.]zip$/.test(relativePath);

const listPublicManagedFiles = () => {
  const files = new Map();
  const packExcludes = loadPackExcludes();
  const isExcluded = (relativePath) =>
    packExcludes.some(
      (entry) => relativePath === entry || relativePath.startsWith(`${entry}/`),
    );

  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const absolute = path.join(current, entry.name);
      const relativePath = path.relative(REPO_ROOT, absolute).split(path.sep).join("/");
      if (isExcluded(relativePath)) continue;
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile() && !isRepoOnlyFile(relativePath)) {
        files.set(relativePath, absolute);
      }
    }
  };

  visit(REPO_ROOT);
  return files;
};

const stripAtlasFrontmatter = (contents) => {
  if (!contents.startsWith("---\n")) return contents;
  const end = contents.indexOf("\n---\n", 4);
  if (end === -1) return contents;

  const frontmatter = contents
    .slice(4, end)
    .split("\n")
    .filter((line) => !line.startsWith("label:") && !line.startsWith("category:"))
    .map((line) => {
      if (!line.startsWith("description:")) return line;
      const value = line.slice("description:".length).trim();
      return `description: ${value.replace(/^("|')|("|')$/g, "")}`;
    })
    .join("\n");
  const body = contents.slice(end + 5).replace(/^\n+/, "");
  return `---\n${frontmatter}\n---\n\n${body}`;
};

const toPublicBytes = (relativePath, sourceBytes) => {
  let contents = sourceBytes.toString("utf8");
  if (relativePath === "SKILL.md") contents = stripAtlasFrontmatter(contents);

  const portuguesePeer = ENGLISH_PAIRS.get(relativePath);
  if (portuguesePeer) {
    contents = contents.replace(
      "<!-- Language: **English** -->",
      `<!-- Language: **English** · [Português](${portuguesePeer}) -->`,
    );
  }
  return Buffer.from(contents, "utf8");
};

const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

const plan = () => {
  const source = sourceRoot();
  if (!fs.existsSync(source)) {
    throw new Error(`Shared source not found: ${source}`);
  }

  const changes = [];
  const sourceFiles = listFiles(source);
  const targetFiles = listPublicManagedFiles();
  const allPaths = new Set([...sourceFiles.keys(), ...targetFiles.keys()]);
  for (const relativePath of [...allPaths].sort()) {
    const sourcePath = sourceFiles.get(relativePath);
    const targetPath = path.join(REPO_ROOT, relativePath);
    if (!sourcePath) {
      changes.push({ relativePath, action: "delete", desired: null });
      continue;
    }
    const desired = toPublicBytes(relativePath, fs.readFileSync(sourcePath));
    const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
    if (current === null) {
      changes.push({ relativePath, action: "create", desired });
    } else if (!current.equals(desired)) {
      changes.push({ relativePath, action: "update", desired });
    }
  }
  return changes;
};

const dirtyPaths = (relativePaths) => {
  if (relativePaths.length === 0) return new Set();
  const result = spawnSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "--no-renames", "--", ...relativePaths],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`git status failed: ${(result.stderr ?? "").trim()}`);
  }
  return new Set(
    (result.stdout ?? "")
      .split("\n")
      .filter((line) => line.length >= 4)
      .map((line) => line.slice(3).trim()),
  );
};

const writeAtomic = (targetPath, contents) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.sync-${process.pid}-${Date.now()}`,
  );
  try {
    fs.writeFileSync(temporary, contents, { mode: 0o644 });
    fs.renameSync(temporary, targetPath);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary);
  }
};

const selfTest = () => {
  const input =
    "---\nname: hephaestus\nlabel: Hephaestus\ncategory: Engineering\ndescription: x\n---\n\n<!-- Language: **English** -->\n";
  const output = toPublicBytes("SKILL.md", Buffer.from(input, "utf8")).toString("utf8");
  assert.equal(output.includes("label:"), false);
  assert.equal(output.includes("category:"), false);
  assert.equal(output.includes("[Português](SKILL.pt-BR.md)"), true);
  assert.equal(hash(Buffer.from("x")).length, 64);
  console.log("sync-from-shared self-test: OK");
};

const usage = () => {
  console.log(`Usage: node scripts/sync-from-shared.mjs --check|--apply|--self-test

Copies the managed English Hephaestus tree from Shared into this repository.
The public Portuguese documentation, release files, scripts, and resources stay
owned by this repository. This command never builds a zip, commits, or publishes.

Environment:
  SHARED_ROOT   Shared repository root (default: ../shared)
`);
};

const main = () => {
  const mode = process.argv[2];
  if (mode === "--help" || mode === undefined) {
    usage();
    return mode === undefined ? 1 : 0;
  }
  if (mode === "--self-test") {
    selfTest();
    return 0;
  }
  if (mode !== "--check" && mode !== "--apply") {
    usage();
    return 2;
  }

  const changes = plan();
  if (changes.length === 0) {
    console.log("sync-from-shared: no changes");
    return 0;
  }

  if (mode === "--check") {
    for (const change of changes) console.log(`${change.action}|${change.relativePath}`);
    return 1;
  }

  const relativePaths = changes.map((change) => change.relativePath);
  const dirty = dirtyPaths(relativePaths);
  const conflicts = relativePaths.filter((relativePath) => dirty.has(relativePath));
  if (conflicts.length > 0) {
    console.error("sync-from-shared: aborted because managed files are dirty:");
    for (const relativePath of conflicts) console.error(`  ${relativePath}`);
    return 1;
  }

  for (const change of changes) {
    const targetPath = path.join(REPO_ROOT, change.relativePath);
    if (change.action === "delete") {
      fs.unlinkSync(targetPath);
    } else {
      writeAtomic(targetPath, change.desired);
    }
  }
  console.log(`sync-from-shared: applied ${changes.length} file(s)`);
  return plan().length === 0 ? 0 : 1;
};

process.exitCode = main();
