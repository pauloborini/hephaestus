// AC-6.2.1 (CN11/VC6): cunhagem determinística de `ISSUE-NNN` por `max+1`
// sobre as TRÊS seções de `.app-work/issues/INDEX.md` (Abertos, Em
// verificação, Fechados) + campo `Próximo ID livre`, com assinatura estável
// do achado (`sha256` de tipo + path normalizado + enunciado normalizado) e
// dedupe — o mesmo achado em duas rodadas produz uma linha só. Seam S6
// (Staging -> disco), ancorada: o motor de referência (issue-engine.mjs)
// materializa o contrato de `prompts/apply.md:Cunhagem de ISSUE-NNN`.
// Falsificadores: varrer só a seção Abertos reusaria ID de issue encerrada;
// assinatura derivada do texto livre reabriria a issue a cada reformulação.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, mkdtemp, writeFile } from "./helpers/fs-utils.mjs";
import {
  mintIssues,
  parseIssueIndex,
  findingSignatureOf,
  issueIdOf,
} from "./helpers/issue-engine.mjs";

const FINDING = {
  type: "vault-integridade",
  path: "_app-vault/docs/decisions/estrutura.md",
  statement: "pasta fora da lista fechada de SCHEMA.md §2 encontrada no vault",
};

const indexWithClosed004 = () => [
  "# INDEX — Issues",
  "",
  "Registro único de issues/defeitos. Protocolo: [`README.md`](README.md).",
  "",
  "**Próximo ID livre: `ISSUE-005`**",
  "",
  "## Abertos",
  "",
  "| ID | Sev | Feature | Tela | Problema → Esperado | Origem | Estado |",
  "|----|-----|---------|------|---------------------|--------|--------|",
  "",
  "## Em verificação",
  "",
  "| ID | Sev | Feature | Correção | Teste de regressão | Estado |",
  "|----|-----|---------|----------|--------------------|--------|",
  "",
  "## Fechados",
  "",
  "| ID | Sev | Feature | Síntese | Estado |",
  "|----|-----|---------|---------|--------|",
  "| ISSUE-004 | S2 | governanca-kit | publicada em release 1.0 | CLOSED |",
  "",
].join("\n");

const issueIndexPath = (tmp) => path.join(tmp, ".app-work", "issues", "INDEX.md");

test("AC-6.2.1: achado novo cunha ISSUE-005 (max das três seções) e o mesmo achado na rodada seguinte não cunha nem duplica", () => {
  const tmp = mkdtemp("hep-mint-");
  const indexPath = issueIndexPath(tmp);
  writeFile(tmp, ".app-work/issues/INDEX.md", indexWithClosed004());

  // rodada 1: ISSUE-004 só na seção Fechados ⇒ max = 4 ⇒ cunha ISSUE-005
  const first = mintIssues({ indexPath, findings: [FINDING], now: "2026-08-12" });
  assert.equal(first.minted.length, 1);
  assert.equal(first.minted[0].id, "ISSUE-005");
  assert.equal(first.skipped.length, 0);
  const firstParsed = parseIssueIndex(first.index);
  const openRows = firstParsed.rows.filter((r) => r.section === "Abertos");
  assert.deepEqual(
    openRows.map((r) => r.id),
    ["ISSUE-005"],
    `linha nova deve estar em Abertos: ${JSON.stringify(openRows)}`,
  );
  assert.equal(firstParsed.counter, "ISSUE-006");
  assert.equal(
    firstParsed.rows.filter((r) => r.id === "ISSUE-005").length,
    1,
    "uma linha só para o ID cunhado",
  );

  // rodada 2: mesmo achado ⇒ assinatura já registrada ⇒ não cunha, linha intacta
  const second = mintIssues({ indexPath, findings: [FINDING], now: "2026-08-13" });
  assert.equal(second.minted.length, 0);
  assert.equal(second.skipped.length, 1);
  assert.equal(second.index, first.index, "rodada 2 não altera o INDEX.md");

  // contador consistente após as duas rodadas
  const finalParsed = parseIssueIndex(second.index);
  assert.equal(finalParsed.max, 5);
  assert.equal(finalParsed.counter, "ISSUE-006");
});

test("AC-6.2.1: assinatura estável e discriminante — determinismo, normalização sintática e composição tipo+path+enunciado", () => {
  // determinismo: o mesmo achado produz a mesma assinatura em qualquer chamada
  assert.equal(findingSignatureOf(FINDING), findingSignatureOf(FINDING));
  // estabilidade sintática: case, acentos e colapso de whitespace não mudam a
  // assinatura (o que a normalização cobre — reformular a FORMA, não o sentido)
  const reformatted = findingSignatureOf({
    ...FINDING,
    statement: "Pasta FORA da lista fechada de SCHEMA.md §2  encontrada no Vault",
  });
  assert.equal(
    reformatted,
    findingSignatureOf(FINDING),
    "normalização sintática (case/acento/espaço) não pode mudar a assinatura",
  );
  // discriminante: achado distinto no MESMO path tem assinatura diferente —
  // o dedupe não casa por engano (a composição inclui o enunciado normalizado)
  const otherFinding = {
    ...FINDING,
    statement: "conteúdo de decisão duplicado entre territórios",
  };
  assert.notEqual(
    findingSignatureOf(otherFinding),
    findingSignatureOf(FINDING),
    "achado distinto no mesmo path não pode deduplicar por engano",
  );

  // dedupe real com escrita persistida: o mesmo achado na rodada seguinte não
  // cunha ID novo nem altera a linha (a assinatura é a do mesmo achado, não a
  // de uma paráfrase — a regressão provável do plano é mitigada pela
  // composição tipo + path normalizado + enunciado normalizado)
  const tmp = mkdtemp("hep-mint-sig-");
  const indexPath = issueIndexPath(tmp);
  writeFile(tmp, ".app-work/issues/INDEX.md", indexWithClosed004());
  const first = mintIssues({ indexPath, findings: [FINDING] });
  assert.equal(first.minted.length, 1);
  const second = mintIssues({ indexPath, findings: [FINDING] });
  assert.equal(second.minted.length, 0, "o mesmo achado na rodada seguinte reabre a issue (dedupe por assinatura)");
  assert.equal(second.skipped.length, 1);
  assert.equal(second.index, first.index, "rodada seguinte não pode alterar o INDEX.md");
});

test("AC-6.2.1: dedupe por assinatura atravessa seções — linha em Em verificação/Fechados também bloqueia cunhagem", () => {
  const tmp = mkdtemp("hep-mint-sec-");
  const indexPath = issueIndexPath(tmp);
  const withRowInVerification = indexWithClosed004().replace(
    "|----|-----|---------|----------|--------------------|--------|",
    `|----|-----|---------|----------|--------------------|--------|\n| ISSUE-003 | S2 | governanca-kit | corrigido | teste novo | FIXED <!-- findingSignature: ${findingSignatureOf(FINDING)} --> |`,
  );
  writeFile(tmp, ".app-work/issues/INDEX.md", withRowInVerification);
  const result = mintIssues({ indexPath, findings: [FINDING] });
  assert.equal(result.minted.length, 0, "assinatura em outra seção deve deduplicar");
  assert.equal(result.skipped.length, 1);
});

test("AC-6.2.1: contador inconsistente não bloqueia — usa o max das três tabelas e reporta pendência", () => {
  const tmp = mkdtemp("hep-mint-ctr-");
  const indexPath = issueIndexPath(tmp);
  const inconsistent = indexWithClosed004().replace("`ISSUE-005`", "`ISSUE-099`");
  writeFile(tmp, ".app-work/issues/INDEX.md", inconsistent);
  const result = mintIssues({ indexPath, findings: [FINDING] });
  assert.equal(result.minted[0].id, "ISSUE-005", "max das tabelas manda, não o contador");
  assert.ok(
    result.pendencies.some((p) => p.includes("inconsistente")),
    `pendência de contador ausente: ${JSON.stringify(result.pendencies)}`,
  );
});

test("AC-6.2.1: INDEX.md ausente cria a partir do max vazio e reporta pendência sem bloquear", () => {
  const tmp = mkdtemp("hep-mint-abs-");
  const indexPath = issueIndexPath(tmp);
  const result = mintIssues({ indexPath, findings: [FINDING] });
  assert.equal(result.minted[0].id, "ISSUE-001");
  assert.ok(result.pendencies.some((p) => p.includes("ausente")));
  assert.equal(parseIssueIndex(result.index).counter, "ISSUE-002");
});

test("AC-6.2.1: apply.md contrata a cunhagem (max+1 sobre as três seções, assinatura estável, nunca reusar)", () => {
  const apply = fs.readFileSync(path.join(REPO_ROOT, "prompts", "apply.md"), "utf8");
  assert.match(apply, /## Cunhagem de ISSUE-NNN/);
  assert.match(apply, /max\+1/);
  assert.match(apply, /Abertos, Em verificação e Fechados|três seções/);
  assert.match(apply, /findingSignature/);
  assert.match(apply, /sha256/);
  assert.match(apply, /nunca é reusado|nunca reusado/);
  assert.match(apply, /não cunha/);
  assert.match(apply, /create/);
  assert.match(apply, /amend/);
  assert.match(apply, /overwrite/);
  assert.ok(!apply.includes(issueIdOf(0)), "ID de exemplo não pode parecer cunhagem real");
});
