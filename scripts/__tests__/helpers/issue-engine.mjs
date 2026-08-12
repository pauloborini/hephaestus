// Motor de referência determinístico da cunhagem de `ISSUE-NNN` (Plano 06),
// fora do pack (scripts/__tests__). Materializa em código executável o
// contrato de `prompts/apply.md:Cunhagem de ISSUE-NNN`: inventário do maior
// `ISSUE-NNN` percorrendo as TRÊS seções de `.app-work/issues/INDEX.md`
// (Abertos, Em verificação, Fechados) + campo `Próximo ID livre`; cunhagem
// `max+1` (ID nunca reusado — varrer só a seção Abertos reusaria ID de issue
// encerrada); assinatura estável do achado (`sha256` de tipo + path
// normalizado + enunciado normalizado) com dedupe — o mesmo achado em duas
// rodadas produz uma linha só (VC6/CN11). Escrita upsert de linha: `create`
// (linha nova) ou `amend` (atualização de estado), nunca `overwrite` nem
// remoção (protocolo de `.app-work/issues/README.md`: linha nunca é deletada).
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const normalizeText = (text) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Assinatura estável do achado: tipo + path normalizado + enunciado
// normalizado. Reformular a prosa do enunciado NÃO muda a assinatura — é o
// que impede a rodada seguinte de reabrir a mesma issue (AC-6.2.1).
export const findingSignatureOf = ({ type, path: sourcePath, statement }) =>
  createHash("sha256")
    .update(normalizeText(`${type} ${sourcePath} ${statement}`))
    .digest("hex");

const ISSUE_ID_RE = /^ISSUE-(\d+)$/;
const ROW_RE = /^\|\s*(ISSUE-\d+)\s*\|/;
const SIGNATURE_RE = /<!--\s*findingSignature:\s*([0-9a-f]{64})\s*-->/;
const COUNTER_RE = /\*\*Próximo ID livre:\s*`(ISSUE-(\d+))`\*\*/;

export const issueNumber = (id) => {
  const match = ISSUE_ID_RE.exec(id);
  return match ? Number(match[1]) : 0;
};

export const issueIdOf = (n) => `ISSUE-${String(n).padStart(3, "0")}`;

// Parsing do INDEX.md: contador declarado, seções e linhas (com assinatura).
export const parseIssueIndex = (content) => {
  const rows = [];
  let currentSection = null;
  let counter = null;
  let max = 0;
  for (const line of String(content ?? "").split("\n")) {
    const counterMatch = COUNTER_RE.exec(line);
    if (counterMatch) {
      counter = counterMatch[1];
    }
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      currentSection = heading[1].trim();
      continue;
    }
    if (!currentSection) continue;
    const rowMatch = ROW_RE.exec(line);
    if (!rowMatch) continue;
    const signatureMatch = SIGNATURE_RE.exec(line);
    rows.push({
      id: rowMatch[1],
      section: currentSection,
      signature: signatureMatch ? signatureMatch[1] : null,
    });
    const n = issueNumber(rowMatch[1]);
    if (n > max) max = n;
  }
  return { rows, counter, max };
};

const renderRow = (id, finding, signature, now) => {
  const severity = finding.severity ?? "S2";
  const feature = finding.feature ?? "hephaestus";
  const tela = finding.tela ?? finding.path;
  const problema = finding.statement;
  const esperado = finding.expected ?? "não reabrir na rodada seguinte (dedupe por assinatura)";
  const origem = finding.origem ?? `hephaestus maintain — ${now}`;
  return `| ${id} | ${severity} | ${feature} | ${tela} | ${problema} → ${esperado} | ${origem} | OPEN <!-- findingSignature: ${signature} --> |`;
};

const DEFAULT_INDEX = [
  "# INDEX — Issues",
  "",
  "Registro único de issues/defeitos. Protocolo: [`README.md`](README.md).",
  "",
  "**Próximo ID livre: `ISSUE-001`**",
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
  "",
].join("\n");

// Cunha os achados ainda não registrados. `indexPath` é o caminho absoluto do
// `.app-work/issues/INDEX.md`; retorna o conteúdo final + o que foi cunhado/
// deduplicado + pendências (contador inconsistente, INDEX ausente).
export const mintIssues = ({ indexPath, findings, now = "2026-08-12" } = {}) => {
  const pendencies = [];
  let content = null;
  if (fs.existsSync(indexPath)) {
    content = fs.readFileSync(indexPath, "utf8");
  } else {
    pendencies.push(
      `.app-work/issues/INDEX.md ausente — inventário usa o max das três tabelas (vazio ⇒ max 0) e a inconsistência é reportada como pendência, sem bloquear`,
    );
  }

  const parsed = parseIssueIndex(content ?? "");
  if (parsed.counter !== null && parsed.max + 1 !== issueNumber(parsed.counter)) {
    pendencies.push(
      `contador "Próximo ID livre" (${parsed.counter}) inconsistente com o max das três tabelas (${issueIdOf(parsed.max)}) — inventário usa o max das tabelas, sem bloquear`,
    );
  }

  const existingSignatures = new Set(
    parsed.rows.map((r) => r.signature).filter((s) => s !== null),
  );
  const minted = [];
  const skipped = [];

  for (const finding of findings) {
    const signature = findingSignatureOf(finding);
    if (existingSignatures.has(signature)) {
      skipped.push({
        finding,
        signature,
        reason: "assinatura já registrada — não cunha e não altera a linha existente",
      });
      continue;
    }
    const nextId = issueIdOf(parsed.max + 1);
    parsed.max += 1;
    existingSignatures.add(signature);
    minted.push({ id: nextId, signature, finding });
  }

  if (minted.length === 0 && content !== null) {
    return { index: content, minted, skipped, pendencies };
  }

  // Conteúdo final: linha nova na seção Abertos + contador atualizado.
  const lines = (content ?? DEFAULT_INDEX).split("\n");
  const newRows = minted.map((m) => renderRow(m.id, m.finding, m.signature, now));

  const openIndex = lines.findIndex((l) => l.trim() === "## Abertos");
  const verificationIndex = lines.findIndex((l) => l.trim() === "## Em verificação");
  const nextSection = verificationIndex === -1 ? lines.length : verificationIndex;
  let lastRow = -1;
  for (let i = openIndex + 1; i < nextSection; i += 1) {
    if (ROW_RE.test(lines[i])) lastRow = i;
  }
  const insertAt = lastRow === -1 ? nextSection : lastRow + 1;

  const output = [];
  let inserted = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (i === insertAt && !inserted) {
      for (const row of newRows) output.push(row);
      inserted = true;
    }
    output.push(lines[i]);
  }
  if (!inserted) {
    for (const row of newRows) output.push(row);
  }

  const nextCounter = issueIdOf(parsed.max + 1);
  const finalContent = output
    .map((line) =>
      COUNTER_RE.test(line)
        ? line.replace(COUNTER_RE, `**Próximo ID livre: \`${nextCounter}\`**`)
        : line,
    )
    .join("\n");

  // Escrita upsert real no disco (seam S6 — staging -> disco): o apply cunha E
  // grava; a rodada seguinte relê o arquivo persistido e deduplica pela
  // assinatura já registrada (VC6/CN11 — o mesmo achado não reabre).
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, finalContent);

  return { index: finalContent, minted, skipped, pendencies };
};
