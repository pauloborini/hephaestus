// DEC-002: segmentação temporal de `.app-work/done/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  doneWeekPrefix,
  doneWeekSegment,
  guidePackName,
  isFlatDonePath,
  isSegmentedDonePath,
  resolveDoneDestination,
} from "./helpers/done-path.mjs";

test("DEC-002: semana ISO 33 de 2026-08-12 → 2026-08/semana-33_08-10_a_08-16", () => {
  assert.deepEqual(doneWeekSegment("2026-08-12"), {
    monthDir: "2026-08",
    weekDir: "semana-33_08-10_a_08-16",
  });
  assert.equal(
    doneWeekPrefix("2026-08-12"),
    ".app-work/done/2026-08/semana-33_08-10_a_08-16",
  );
});

test("DEC-002: semana que cruza mês fica sob o mês da segunda", () => {
  // 2026-07-29 (qua) → semana 31, seg 07-27 … dom 08-02 → pasta 2026-07
  assert.deepEqual(doneWeekSegment("2026-07-29"), {
    monthDir: "2026-07",
    weekDir: "semana-31_07-27_a_08-02",
  });
});

test("DEC-002: pack *_GUIDE preserva o nome sob a semana", () => {
  assert.equal(guidePackName("docs/guides/XPTO_GUIDE/GUIDE.md"), "XPTO_GUIDE");
  assert.equal(
    resolveDoneDestination("docs/guides/XPTO_GUIDE/GUIDE.md", "2026-08-12"),
    ".app-work/done/2026-08/semana-33_08-10_a_08-16/XPTO_GUIDE/",
  );
  assert.equal(
    resolveDoneDestination("docs/FOO.md", "2026-08-12"),
    ".app-work/done/2026-08/semana-33_08-10_a_08-16/",
  );
});

test("DEC-002: flat sob done/ migra; segmentado é canônico", () => {
  assert.equal(isFlatDonePath(".app-work/done/GUIDE.md"), true);
  assert.equal(
    isSegmentedDonePath(".app-work/done/2026-08/semana-33_08-10_a_08-16/XPTO_GUIDE/GUIDE.md"),
    true,
  );
  assert.equal(
    isFlatDonePath(".app-work/done/2026-08/semana-33_08-10_a_08-16/XPTO_GUIDE/GUIDE.md"),
    false,
  );
  assert.equal(
    resolveDoneDestination(".app-work/done/GUIDE.md", "2026-08-12"),
    ".app-work/done/2026-08/semana-33_08-10_a_08-16/",
  );
});
