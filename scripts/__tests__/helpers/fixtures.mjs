// Cópia de fixtures versionados para diretório temporário de teste.
// O fixture `repo-desorganizado/` é versionado no repo (criado no Plano 03,
// antes da captura do golden) e os testes sempre trabalham sobre uma cópia
// em tmp — nunca mutam o fixture versionado.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, mkdtemp } from "./fs-utils.mjs";

export const FIXTURES_DIR = path.join(REPO_ROOT, "scripts", "__tests__", "fixtures");

export const copyFixture = (name) => {
  const src = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(src)) {
    throw new Error(`fixture não encontrado: ${src}`);
  }
  const dest = mkdtemp(`hep-${name}-`);
  const stack = [src];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const s = path.join(current, entry.name);
      const rel = path.relative(src, s);
      const d = path.join(dest, rel);
      if (entry.isDirectory()) {
        fs.mkdirSync(d, { recursive: true });
        stack.push(s);
      } else {
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(s, d);
      }
    }
  }
  return dest;
};
