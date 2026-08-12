// Segmentação temporal de `.app-work/done/` (DEC-002):
//   .app-work/done/YYYY-MM/semana-WW_MM-DD_a_MM-DD/<NOME>_GUIDE|/arquivo
// Semana ISO (seg–dom). Pasta do mês = mês da segunda da semana.
// Data = momento em que o guide entra em done/ (ou é reorganizado para o
// nesting). Paths já segmentados são canônicos; flat sob done/ migra.

const pad2 = (n) => String(n).padStart(2, "0");

/** Parse `YYYY-MM-DD` ou Date → Date local à meia-noite. */
export const parseNow = (now) => {
  if (now instanceof Date) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (typeof now === "string" && /^\d{4}-\d{2}-\d{2}/.test(now)) {
    const [y, m, d] = now.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Segunda (início) e domingo (fim) da semana ISO que contém `date`. */
export const isoWeekBounds = (date) => {
  const d = parseNow(date);
  const day = d.getDay(); // 0=dom … 6=sáb
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
};

/** Número da semana ISO (1–53) da data. */
export const isoWeekNumber = (date) => {
  const { monday } = isoWeekBounds(date);
  const t = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
};

/**
 * Segmento temporal sob done/:
 * `{ monthDir: "2026-08", weekDir: "semana-33_08-10_a_08-16" }`
 */
export const doneWeekSegment = (now) => {
  const { monday, sunday } = isoWeekBounds(now);
  const week = isoWeekNumber(monday);
  const monthDir = `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}`;
  const start = `${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
  const end = `${pad2(sunday.getMonth() + 1)}-${pad2(sunday.getDate())}`;
  const weekDir = `semana-${week}_${start}_a_${end}`;
  return { monthDir, weekDir };
};

/** Prefixo canônico: `.app-work/done/YYYY-MM/semana-WW_MM-DD_a_MM-DD` (sem barra final). */
export const doneWeekPrefix = (now) => {
  const { monthDir, weekDir } = doneWeekSegment(now);
  return `.app-work/done/${monthDir}/${weekDir}`;
};

/** Path já no nesting mês/semana canônico. */
export const isSegmentedDonePath = (sourcePath) =>
  /^\.app-work\/done\/\d{4}-\d{2}\/semana-\d{1,2}_\d{2}-\d{2}_a_\d{2}-\d{2}(\/|$)/.test(
    sourcePath,
  );

/** Sob `.app-work/done/` mas ainda flat (legado) — precisa migrar. */
export const isFlatDonePath = (sourcePath) =>
  sourcePath.startsWith(".app-work/done/") && !isSegmentedDonePath(sourcePath);

/** Destino-raiz do catálogo (antes da expansão temporal). */
export const isDoneCatalogRoot = (destination) =>
  destination === ".app-work/done/" || destination === ".app-work/done";

/**
 * Nome do pack `*_GUIDE` presente no path, se houver.
 * Ex.: `docs/guides/XPTO_GUIDE/GUIDE.md` → `XPTO_GUIDE`
 */
export const guidePackName = (sourcePath) => {
  const parts = sourcePath.split("/");
  return parts.find((p) => /_GUIDE$/i.test(p)) ?? null;
};

/**
 * Destino-pasta (termina em `/`) para relocate de guide executado.
 * Pack preserva `<NOME>_GUIDE/`; arquivo solto cai direto na semana.
 */
export const resolveDoneDestination = (sourcePath, now) => {
  if (isSegmentedDonePath(sourcePath)) {
    // já canônico — destino = diretório do arquivo (keep por posição)
    const dir = sourcePath.endsWith("/")
      ? sourcePath
      : `${sourcePath.slice(0, sourcePath.lastIndexOf("/") + 1)}`;
    return dir;
  }
  const prefix = doneWeekPrefix(now);
  const pack = guidePackName(sourcePath);
  if (pack) return `${prefix}/${pack}/`;
  return `${prefix}/`;
};
