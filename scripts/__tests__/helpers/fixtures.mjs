// Cópia de fixtures versionados para diretório temporário de teste.
// O fixture `repo-desorganizado/` é versionado no repo (criado no Plano 03,
// antes da captura do golden) e os testes sempre trabalham sobre uma cópia
// em tmp — nunca mutam o fixture versionado.
//
// Thread-safety: cada chamada materializa um snapshot exclusivo via mkdtemp
// + fs.cpSync. Nunca escreve de volta na árvore compartilhada em fixtures/.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, mkdtemp } from "./fs-utils.mjs";

export const FIXTURES_DIR = path.join(REPO_ROOT, "scripts", "__tests__", "fixtures");

const safePrefix = (name) => String(name).replace(/[^a-zA-Z0-9._-]+/g, "_");

export const copyFixture = (name) => {
  const src = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(src)) {
    throw new Error(`fixture não encontrado: ${src}`);
  }
  // Diretório exclusivo por chamada (sufixo aleatório do mkdtemp). cpSync
  // recursivo evita o TOCTOU do walk manual (readdir → copyFile) sob
  // concorrência do runner padrão do node:test.
  const dest = mkdtemp(`hep-${safePrefix(name)}-`);
  fs.cpSync(src, dest, { recursive: true, force: true, errorOnExist: false });
  return dest;
};
