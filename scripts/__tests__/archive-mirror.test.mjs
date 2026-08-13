// DEC-002: espelho do archive — guia concluído vai para `.app-work/archive/guides/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  guidePackName,
  isArchiveGuideCatalogRoot,
  isCanonicalArchiveGuidePath,
  isLegacyDonePath,
  resolveArchiveGuideDestination,
} from "./helpers/archive-mirror.mjs";

test("DEC-002: pack *_GUIDE preserva o nome no espelho", () => {
  assert.equal(guidePackName("docs/guides/XPTO_GUIDE/GUIDE.md"), "XPTO_GUIDE");
  assert.equal(
    resolveArchiveGuideDestination("docs/guides/XPTO_GUIDE/GUIDE.md"),
    ".app-work/archive/guides/XPTO_GUIDE/",
  );
  assert.equal(
    resolveArchiveGuideDestination("docs/FOO.md"),
    ".app-work/archive/guides/",
  );
});

test("DEC-002: origem já no espelho é canônica (keep por posição)", () => {
  assert.equal(
    isCanonicalArchiveGuidePath(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(
    resolveArchiveGuideDestination(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"),
    ".app-work/archive/guides/XPTO_GUIDE/",
  );
  assert.equal(isCanonicalArchiveGuidePath(".app-work/archive/perguntas/x/"), false);
});

test("DEC-002: legado sob done/ é detectado para migração (nunca keep)", () => {
  assert.equal(isLegacyDonePath(".app-work/done/GUIDE.md"), true);
  assert.equal(
    isLegacyDonePath(".app-work/done/2026-08/semana-33_08-10_a_08-16/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(isLegacyDonePath(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"), false);
  // migração: legado (flat ou segmentado) vai ao espelho, sem data
  assert.equal(
    resolveArchiveGuideDestination(".app-work/done/GUIDE.md"),
    ".app-work/archive/guides/",
  );
  assert.equal(
    resolveArchiveGuideDestination(
      ".app-work/done/2026-08/semana-33_08-10_a_08-16/XPTO_GUIDE/GUIDE.md",
    ),
    ".app-work/archive/guides/XPTO_GUIDE/",
  );
});

test("DEC-002: raiz do catálogo do espelho é expandida pela cascata", () => {
  assert.equal(isArchiveGuideCatalogRoot(".app-work/archive/guides/"), true);
  assert.equal(isArchiveGuideCatalogRoot(".app-work/done/"), false);
});
