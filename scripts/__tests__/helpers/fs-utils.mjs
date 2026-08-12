// Helpers de sistema de arquivos para os testes do kit (fora do pacote distribuído).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

export const mkdtemp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

export const writeFile = (dir, relPath, content) => {
  const abs = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return abs;
};

export const writeJson = (dir, relPath, obj) => {
  writeFile(dir, relPath, `${JSON.stringify(obj, null, 2)}\n`);
};

export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

// Copia a árvore do kit para um diretório de teste, excluindo o que não faz
// parte do kit distribuível nem da prova (git, vault de processo, testes).
export const copyKit = (destDir) => {
  const excluded = new Set([".git", ".app-work", ".DS_Store", "node_modules"]);
  const stack = [REPO_ROOT];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (excluded.has(entry.name)) continue;
      if (entry.name === "__tests__" && path.basename(current) === "scripts") continue;
      const src = path.join(current, entry.name);
      const rel = path.relative(REPO_ROOT, src);
      const dst = path.join(destDir, rel);
      if (entry.isDirectory()) {
        fs.mkdirSync(dst, { recursive: true });
        stack.push(src);
      } else {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
      }
    }
  }
};

export const runNode = (args, options = {}) => {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    cwd: REPO_ROOT,
    ...options,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};
