import { test } from "node:test";
import assert from "node:assert/strict";
import {
  guidePackName,
  civilWeekOfMonth,
  isArchiveGuideCatalogRoot,
  isCanonicalArchiveGuidePath,
  isFlatLegacyArchiveGuidePath,
  isLegacyDonePath,
  resolveArchiveGuideDestination,
} from "./helpers/archive-mirror.mjs";

const D = new Date("2026-08-17T12:00:00");

test("DEC-002: semana civil", () => {
  assert.equal(civilWeekOfMonth(1), 1);
  assert.equal(civilWeekOfMonth(8), 2);
  assert.equal(civilWeekOfMonth(17), 3);
  assert.equal(civilWeekOfMonth(22), 4);
  assert.equal(civilWeekOfMonth(31), 5);
});

test("DEC-002: pack vai para archive/guides/<YYYY-MM>/semana-<N>/<PACK>/", () => {
  assert.equal(guidePackName("docs/guides/XPTO_GUIDE/GUIDE.md"), "XPTO_GUIDE");
  assert.equal(
    resolveArchiveGuideDestination("docs/guides/XPTO_GUIDE/GUIDE.md", { archiveDate: D }),
    ".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/",
  );
});

test("DEC-002: path datado é canônico; flat é legado", () => {
  assert.equal(
    isCanonicalArchiveGuidePath(".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(
    isFlatLegacyArchiveGuidePath(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(
    isCanonicalArchiveGuidePath(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md"),
    false,
  );
});

test("DEC-002: done/ e flat migram para o datado", () => {
  assert.equal(isLegacyDonePath(".app-work/done/GUIDE.md"), true);
  assert.equal(
    resolveArchiveGuideDestination(".app-work/done/XPTO_GUIDE/GUIDE.md", { archiveDate: D }),
    ".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/",
  );
  assert.equal(
    resolveArchiveGuideDestination(".app-work/archive/guides/XPTO_GUIDE/GUIDE.md", {
      archiveDate: D,
    }),
    ".app-work/archive/guides/2026-08/semana-3/XPTO_GUIDE/",
  );
  assert.equal(isArchiveGuideCatalogRoot(".app-work/archive/guides/"), true);
});
