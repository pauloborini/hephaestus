// Espelho do archive (DEC-002): artefato concluído sai da pasta viva e vai
// para `.app-work/archive/guides/<YYYY-MM>/semana-<N>/<NOME>_GUIDE/` (pack)
// ou arquivo solto sob a mesma semana civil. Proibido flat legado
// `archive/guides/<PACK>/`. Path datado no espelho é canônico (não-toque).
// Flat e `.app-work/done/` migram na próxima execução.
// Data: Plano F em `plans/F-fechamento.md` (`Status: CONCLUÍDO`); fallback =
// momento do roteamento (`archiveDate` no motor de testes).

import fs from "node:fs";
import path from "node:path";

const DATED_ARCHIVE_GUIDE_RE =
  /^\.app-work\/archive\/guides\/\d{4}-\d{2}\/semana-\d+\//;

/** Nome do pack `*_GUIDE` presente no path, se houver. */
export const guidePackName = (sourcePath) => {
  const parts = sourcePath.split("/");
  return parts.find((p) => /_GUIDE$/i.test(p)) ?? null;
};

/** Semana civil do mês (organizar-app-work / DailyPace 2026-08-14). */
export const civilWeekOfMonth = (dayOfMonth) => {
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  if (dayOfMonth <= 28) return 4;
  return 5;
};

export const archiveGuideSegmentsFromDate = (date) => {
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const week = `semana-${civilWeekOfMonth(date.getDate())}`;
  return { yearMonth, week };
};

/** Espelho canônico datado: `archive/guides/<YYYY-MM>/semana-<N>/...`. */
export const isDatedArchiveGuidePath = (sourcePath) =>
  DATED_ARCHIVE_GUIDE_RE.test(sourcePath);

/** Legado flat proibido: `archive/guides/<PACK>/` sem `<YYYY-MM>/semana-<N>/`. */
export const isFlatLegacyArchiveGuidePath = (sourcePath) =>
  sourcePath.startsWith(".app-work/archive/guides/") && !isDatedArchiveGuidePath(sourcePath);

/** Origem já no espelho canônico datado. */
export const isCanonicalArchiveGuidePath = (sourcePath) =>
  isDatedArchiveGuidePath(sourcePath);

/** Legado: sob `.app-work/done/` (removido da lista fechada) — precisa migrar. */
export const isLegacyDonePath = (sourcePath) =>
  sourcePath.startsWith(".app-work/done/");

/** Destino-raiz do catálogo (guia concluído), antes da expansão do pack. */
export const isArchiveGuideCatalogRoot = (destination) =>
  destination === ".app-work/archive/guides/" ||
  destination === ".app-work/archive/guides";

export const findPlanoFFechamentoFile = (repoRoot, sourcePath) => {
  if (!repoRoot) return null;
  const pack = guidePackName(sourcePath);
  if (!pack) return null;
  const candidates = [];
  const parts = sourcePath.split("/");
  const packIdx = parts.indexOf(pack);
  if (packIdx >= 0) {
    candidates.push(
      path.join(repoRoot, parts.slice(0, packIdx + 1).join("/"), "plans", "F-fechamento.md"),
    );
  }
  candidates.push(path.join(repoRoot, ".app-work/guides", pack, "plans", "F-fechamento.md"));
  candidates.push(path.join(repoRoot, "guides", pack, "plans", "F-fechamento.md"));
  for (const abs of candidates) {
    if (fs.existsSync(abs)) return abs;
  }
  return null;
};

export const parsePlanoFDate = (content) => {
  if (!/status:\s*conclu[ií]do/i.test(content)) return null;
  const match = content.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (!match) return null;
  const d = new Date(`${match[1]}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const resolveArchiveGuideDate = (repoRoot, sourcePath, fallbackDate) => {
  const fechamento = findPlanoFFechamentoFile(repoRoot, sourcePath);
  if (fechamento) {
    const parsed = parsePlanoFDate(fs.readFileSync(fechamento, "utf8"));
    if (parsed) return parsed;
  }
  return fallbackDate ?? new Date();
};

/**
 * Destino-pasta (termina em `/`) para relocate de guide concluído.
 * Pack preserva `<NOME>_GUIDE/` sob `<YYYY-MM>/semana-<N>/`; arquivo solto
 * cai na semana datada. Origem já no espelho datado é canônico — keep.
 */
export const resolveArchiveGuideDestination = (sourcePath, options = {}) => {
  const { repoRoot, archiveDate } = options;

  if (isCanonicalArchiveGuidePath(sourcePath)) {
    const dir = sourcePath.endsWith("/")
      ? sourcePath
      : `${sourcePath.slice(0, sourcePath.lastIndexOf("/") + 1)}`;
    return dir;
  }

  const pack = guidePackName(sourcePath);
  const date = resolveArchiveGuideDate(repoRoot, sourcePath, archiveDate);
  const { yearMonth, week } = archiveGuideSegmentsFromDate(date);
  const datedBase = `.app-work/archive/guides/${yearMonth}/${week}/`;
  return pack ? `${datedBase}${pack}/` : datedBase;
};
