import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { resolveArchiveGuideDestination } from "./archive-mirror.mjs";

export const APP_WORK_LIVE_DIRS = new Set([
  "guides", "roadmap", "brainstorming", "prd", "docs",
  "issues", "references", "private", "archive",
]);

export const ARCHIVE_DEPOSIT = new Set([
  "guides", "perguntas", "prds", "roadmap", "docs", "backlogs", "plans",
  "sprints", "features", "design-prototipos", "produto", "qa", "releases",
  "evidence", "issues",
]);

const PRIVATE_LIVE_SUBDIRS = new Set(["auditorias", "ops", "research", "notes"]);

/** Status explícito de fechamento (PRD aposentado / brainstorm marcado fechado). */
const CLOSED_STATUS =
  /(?:^|\n)\s*(?:[-*]\s*)?(?:\*\*)?status(?:\*\*)?:\s*(?:done|conclu[ií]do|fechado|arquivado|aposentado|closed)\b/i;

const isTextish = (rel) => /\.(md|txt|json|yml|yaml)$/i.test(rel);

const LIVE_DUP_RANK = [
  "guides", "docs", "prd", "roadmap", "brainstorming", "issues",
];

const isArchiveRel = (rel) => rel.startsWith(".app-work/archive/");

const isHashableDuplicateRel = (rel) =>
  !rel.startsWith(".app-work/references/") &&
  !rel.startsWith(".app-work/private/") &&
  !rel.startsWith(".app-work/done/");

const liveDupRank = (rel) => {
  const top = rel.split("/")[1];
  const i = LIVE_DUP_RANK.indexOf(top);
  return i === -1 ? LIVE_DUP_RANK.length : i;
};

const pickCanonicalDuplicate = (paths) => {
  const lives = paths.filter((p) => !isArchiveRel(p));
  if (lives.length === 0) return null;
  return [...lives].sort((a, b) => {
    const rank = liveDupRank(a) - liveDupRank(b);
    return rank !== 0 ? rank : a.localeCompare(b);
  })[0];
};

const CONDENSE_MIN = 40;
const GENERIC_STEM = /^(readme|index|license|guid)$/i;

const normalizeForCondense = (text) => text.replace(/\s+/g, " ").trim().toLowerCase();

const fileStem = (rel) => path.basename(rel).replace(/\.[^.]+$/, "").toLowerCase();

const sameCondenseTheme = (fromRel, intoRel) => {
  const sa = fileStem(fromRel);
  const sb = fileStem(intoRel);
  if (sa === sb) return true;
  if (GENERIC_STEM.test(sa) || GENERIC_STEM.test(sb)) return sa === sb;
  const fromLc = fromRel.toLowerCase();
  const intoLc = intoRel.toLowerCase();
  if (sa.length >= 4 && (sb.includes(sa) || intoLc.includes(sa))) return true;
  if (sb.length >= 4 && (sa.includes(sb) || fromLc.includes(sb))) return true;
  return false;
};

const isCondenseScanRel = (rel) =>
  isHashableDuplicateRel(rel) && !isArchiveRel(rel) && isTextish(rel);

const collectCondensed = (root, all, occupied) => {
  const files = [];
  for (const rel of all) {
    if (!isCondenseScanRel(rel) || occupied.has(rel)) continue;
    const abs = path.join(root, rel);
    if (!fs.statSync(abs).isFile()) continue;
    const norm = normalizeForCondense(fs.readFileSync(abs, "utf8"));
    if (norm.length < CONDENSE_MIN) continue;
    files.push({
      rel,
      norm,
      len: norm.length,
      protectedPack: isProtectedLiveGuideFile(rel, root),
    });
  }
  const condensed = [];
  for (const from of files) {
    if (from.protectedPack) continue;
    const containers = files.filter(
      (into) =>
        into.rel !== from.rel &&
        into.len > from.len &&
        into.norm.includes(from.norm) &&
        sameCondenseTheme(from.rel, into.rel),
    );
    if (containers.length !== 1) continue;
    condensed.push({ from: from.rel, into: containers[0].rel });
  }
  return condensed;
};

export const fileSha256 = (abs) =>
  createHash("sha256").update(fs.readFileSync(abs)).digest("hex");

export const isPackConcluded = (packDir) => {
  const f = path.join(packDir, "plans", "F-fechamento.md");
  if (fs.existsSync(f) && /status:\s*conclu[ií]do/i.test(fs.readFileSync(f, "utf8"))) {
    return true;
  }
  const g = path.join(packDir, "GUIDE.md");
  if (fs.existsSync(g) && /status:\s*conclu[ií]do/i.test(fs.readFileSync(g, "utf8"))) {
    return true;
  }
  return false;
};

export const isPackStale = (packDir) => {
  const g = path.join(packDir, "GUIDE.md");
  const r = path.join(packDir, "README.md");
  const text = [g, r].filter(fs.existsSync).map((p) => fs.readFileSync(p, "utf8")).join("\n");
  return /\bSTALE\b/i.test(text);
};

const isProtectedLiveGuideFile = (rel, root) => {
  const m = rel.match(/^\.app-work\/guides\/([^/]+_GUIDE)\//i);
  if (!m) return false;
  const packDir = path.join(root, ".app-work", "guides", m[1]);
  return !isPackConcluded(packDir) && !isPackStale(packDir);
};

const ingestTextDir = (root, relBase, parts) => {
  const absDir = path.join(root, relBase);
  if (!fs.existsSync(absDir)) return;
  const files = [];
  walkFiles(absDir, relBase, files);
  for (const rel of files) {
    if (!isTextish(rel)) continue;
    parts.push(rel);
    parts.push(fs.readFileSync(path.join(root, rel), "utf8"));
  }
};

const liveCitationHaystack = (root) => {
  const parts = [];
  ingestTextDir(root, ".app-work/roadmap", parts);
  const guides = path.join(root, ".app-work", "guides");
  if (fs.existsSync(guides)) {
    for (const ent of fs.readdirSync(guides, { withFileTypes: true })) {
      if (!ent.isDirectory() || !/_GUIDE$/i.test(ent.name)) continue;
      const packDir = path.join(guides, ent.name);
      if (isPackConcluded(packDir) || isPackStale(packDir)) continue;
      ingestTextDir(root, `.app-work/guides/${ent.name}`, parts);
    }
  }
  return parts.join("\n").toLowerCase();
};

const isCitedInHaystack = (haystack, fromRel, prefix) => {
  const fromPrd = fromRel.slice(prefix.length);
  const base = path.basename(fromPrd);
  const stem = base.replace(/\.md$/i, "");
  const needles = [fromPrd.toLowerCase(), base.toLowerCase()];
  if (!/^(readme|index)$/i.test(stem) && stem.length >= 4) {
    needles.push(stem.toLowerCase());
  }
  return needles.some((n) => haystack.includes(n));
};

const dirHasClosedStatus = (absDir) => {
  if (!fs.existsSync(absDir)) return false;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      if (dirHasClosedStatus(abs)) return true;
    } else if (isTextish(ent.name) && CLOSED_STATUS.test(fs.readFileSync(abs, "utf8"))) {
      return true;
    }
  }
  return false;
};

const walkFiles = (absDir, relBase, acc) => {
  if (!fs.existsSync(absDir)) return;
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const rel = `${relBase}/${ent.name}`.replace(/\\/g, "/");
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, rel, acc);
    else acc.push(rel);
  }
};

export const inventoryProcessHygiene = (root, options = {}) => {
  const archiveDate = options.archiveDate ?? new Date();
  const relocate = [];
  const deletes = [];
  const unknown = [];
  const condensed = [];
  const app = path.join(root, ".app-work");
  if (!fs.existsSync(app)) {
    return { relocate, deletes, unknown, condensed };
  }

  for (const ent of fs.readdirSync(app, { withFileTypes: true })) {
    if (ent.name === "hephaestus-state.json" || ent.name === "INDEX.md" || ent.name === ".gitignore") {
      continue;
    }
    if (!APP_WORK_LIVE_DIRS.has(ent.name) && ent.name !== "done") {
      unknown.push(`.app-work/${ent.name}`);
    }
  }

  const doneDir = path.join(app, "done");
  if (fs.existsSync(doneDir)) {
    const files = [];
    walkFiles(doneDir, ".app-work/done", files);
    for (const from of files) {
      relocate.push({
        from,
        to: resolveArchiveGuideDestination(from, { repoRoot: root, archiveDate }),
        reason: "done-legacy",
      });
    }
  }

  const guidesDir = path.join(app, "guides");
  if (fs.existsSync(guidesDir)) {
    for (const ent of fs.readdirSync(guidesDir, { withFileTypes: true })) {
      if (ent.name === "README.md" || ent.name === "legados") continue;
      const packDir = path.join(guidesDir, ent.name);
      if (ent.isDirectory() && /_GUIDE$/i.test(ent.name)) {
        if (isPackConcluded(packDir) || isPackStale(packDir)) {
          const from = `.app-work/guides/${ent.name}/`;
          relocate.push({
            from,
            to: resolveArchiveGuideDestination(`${from}GUIDE.md`, { repoRoot: root, archiveDate }),
            reason: isPackStale(packDir) ? "stale" : "concluded",
          });
        }
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        relocate.push({
          from: `.app-work/guides/${ent.name}`,
          to: `.app-work/guides/legados/${ent.name}`,
          reason: "loose-guide",
        });
      } else if (ent.isDirectory()) {
        unknown.push(`.app-work/guides/${ent.name}`);
      }
    }
  }

  const privRefs = path.join(app, "private", "references");
  if (fs.existsSync(privRefs)) {
    const files = [];
    walkFiles(privRefs, ".app-work/private/references", files);
    for (const from of files) {
      relocate.push({
        from,
        to: from.replace(".app-work/private/references/", ".app-work/references/"),
        reason: "private-references",
      });
    }
  }

  const privRoadmap = path.join(app, "private", "roadmap");
  if (fs.existsSync(privRoadmap)) {
    const files = [];
    walkFiles(privRoadmap, ".app-work/private/roadmap", files);
    for (const from of files) {
      relocate.push({
        from,
        to: from.replace(".app-work/private/roadmap/", ".app-work/roadmap/"),
        reason: "private-roadmap",
      });
    }
  }

  const privRoot = path.join(app, "private");
  if (fs.existsSync(privRoot)) {
    for (const ent of fs.readdirSync(privRoot, { withFileTypes: true })) {
      if (ent.name === "references" || ent.name === "roadmap") continue;
      if (ent.isDirectory() && !PRIVATE_LIVE_SUBDIRS.has(ent.name)) {
        unknown.push(`.app-work/private/${ent.name}`);
      }
    }
  }

  const haystack = liveCitationHaystack(root);
  const prdDir = path.join(app, "prd");
  if (fs.existsSync(prdDir)) {
    const files = [];
    walkFiles(prdDir, ".app-work/prd", files);
    for (const from of files) {
      if (!isTextish(from)) continue;
      const body = fs.readFileSync(path.join(root, from), "utf8");
      if (!CLOSED_STATUS.test(body)) continue;
      if (isCitedInHaystack(haystack, from, ".app-work/prd/")) continue;
      relocate.push({
        from,
        to: from.replace(".app-work/prd/", ".app-work/archive/prds/"),
        reason: "prd-no-consumer",
      });
    }
  }

  const brainstormDir = path.join(app, "brainstorming");
  if (fs.existsSync(brainstormDir)) {
    for (const ent of fs.readdirSync(brainstormDir, { withFileTypes: true })) {
      if (ent.name === "README.md") continue;
      const abs = path.join(brainstormDir, ent.name);
      if (ent.isDirectory()) {
        if (!dirHasClosedStatus(abs)) continue;
        relocate.push({
          from: `.app-work/brainstorming/${ent.name}/`,
          to: `.app-work/archive/perguntas/${ent.name}/`,
          reason: "brainstorm-closed",
        });
      } else if (ent.isFile() && isTextish(ent.name) && CLOSED_STATUS.test(fs.readFileSync(abs, "utf8"))) {
        const stem = ent.name.replace(/\.[^.]+$/, "");
        relocate.push({
          from: `.app-work/brainstorming/${ent.name}`,
          to: `.app-work/archive/perguntas/${stem}/${ent.name}`,
          reason: "brainstorm-closed",
        });
      }
    }
  }

  const archiveRoot = path.join(app, "archive");
  if (fs.existsSync(archiveRoot)) {
    for (const ent of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      if (!ARCHIVE_DEPOSIT.has(ent.name)) {
        unknown.push(`.app-work/archive/${ent.name}`);
      }
    }
  }

  const hashes = new Map();
  const all = [];
  walkFiles(app, ".app-work", all);
  for (const rel of all) {
    if (!isHashableDuplicateRel(rel)) continue;
    const abs = path.join(root, rel);
    if (!fs.statSync(abs).isFile()) continue;
    const h = fileSha256(abs);
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(rel);
  }
  for (const paths of hashes.values()) {
    if (paths.length < 2) continue;
    const canonical = pickCanonicalDuplicate(paths);
    if (!canonical) continue;
    for (const extra of paths) {
      if (extra === canonical) continue;
      if (isProtectedLiveGuideFile(extra, root)) continue;
      deletes.push(extra);
    }
  }

  const archiveGuides = path.join(app, "archive", "guides");
  if (fs.existsSync(archiveGuides)) {
    for (const ent of fs.readdirSync(archiveGuides, { withFileTypes: true })) {
      if (ent.isDirectory() && !/^\d{4}-\d{2}$/.test(ent.name) && /_GUIDE$/i.test(ent.name)) {
        const from = `.app-work/archive/guides/${ent.name}/`;
        relocate.push({
          from,
          to: resolveArchiveGuideDestination(`${from}GUIDE.md`, { repoRoot: root, archiveDate }),
          reason: "flat-legacy",
        });
      }
    }
  }

  const occupied = new Set([
    ...deletes,
    ...relocate.flatMap((r) => (r.from.endsWith("/") ? [] : [r.from])),
  ]);
  condensed.push(...collectCondensed(root, all, occupied));

  return { relocate, deletes, unknown, condensed };
};
