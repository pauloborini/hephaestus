// AC-1.4.1: o harness node --test coleta este arquivo. O red foi observado
// com uma asserção deliberadamente falsa (exit != 0 com contagem # tests
// incluindo este arquivo) e removida em seguida; a versão final fica verde.
import { test } from "node:test";
import assert from "node:assert/strict";

test("AC-1.4.1: o runner coleta arquivos *.test.mjs de scripts/__tests__/", () => {
  assert.equal(1 + 1, 2);
});
