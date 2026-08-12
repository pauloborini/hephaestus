// Motor de referência determinístico da fase reconcile (Plano 04), fora do
// pack (scripts/__tests__). Materializa em código executável o contrato de
// `prompts/reconcile.md`: inventário de numeração sobre cláusulas vivas E IDs
// de `## Histórico` (SCHEMA.md §4.7), casamento por `DEC-NNN` explícito,
// alteração in-place com nota inline (`_Alterado <data> — era: <antigo>.
// Motivo: <motivo>._`, empilhando acima das anteriores e podando além de 3),
// cunhagem `max+1` e remoção com checagem de citações pendentes — inclusive
// dentro de `.app-work/` (caminhos ocultos, `--hidden`).
//
// O kit não tem executor mecânico de prompts; o motor é o ponto onde o
// comportamento determinístico do reconcile é exercitado com dados reais.
// A materialização das decisões em arquivos (nota, `## Histórico`, Afeta)
// também vive aqui (`decisions` no retorno), consumida por
// `compose-engine.mjs` e pelos testes.
import fs from "node:fs";
import path from "node:path";

// Normalização de enunciado para casamento: minúsculas, sem acento, espaços
// colapsados, pontuação final removida.
const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?)\]}»]+$/, "");

export const normalizeStatement = (statement) => normalizeText(statement);

// Extrai valores de decisão (número + unidade; moeda) — mesma família do gate
// `checkDuplicatedValue` do validador.
const DEC_VALUE_PATTERNS = [
  /R\$\s?\d+(?:[.,]\d+)?(?:\s*\/\s*[a-zà-ú]+)?/gi,
  /\b\d+(?:[.,]\d+)?\s+[a-zà-ú]{2,}(?:\s*\/\s*[a-zà-ú]{2,})?(?:\s+por\s+[a-zà-ú]{2,})?/gi,
];

export const extractDecisionValues = (text) => {
  const values = new Set();
  for (const pattern of DEC_VALUE_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      values.add(match[0].replace(/\s+/g, " ").trim().replace(/[.,;:!?)\]}»]+$/, ""));
    }
  }
  return [...values];
};

const DEONTIC_RE =
  /(deve|devem|obrigatori|proibid|precisa|tem de|tem que|nao pode|e proibido)/;

// --- Parsing de arquivo de decisão (`docs/decisions/<dominio>.md`) ---
export const parseDecisionFile = (content) => {
  const historicoIndex = content.indexOf("## Histórico");
  const livePart = historicoIndex === -1 ? content : content.slice(0, historicoIndex);
  const historicoPart = historicoIndex === -1 ? "" : content.slice(historicoIndex);
  const titleMatch = livePart.match(/^#\s+(.+)$/m);
  const afetaMatch = livePart.match(/^Afeta:\s*\[([^\]]*)\]/m);
  const clauses = [];
  const headingRe = /^###\s+(DEC-\d+)\s*—\s*(.+)$/gm;
  const boundaries = [];
  for (const match of livePart.matchAll(headingRe)) {
    boundaries.push({ index: match.index, decId: match[1], title: match[2].trim() });
  }
  for (let i = 0; i < boundaries.length; i += 1) {
    const start = boundaries[i].index;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].index : livePart.length;
    const section = livePart.slice(start, end);
    const lines = section.split("\n");
    const statementLines = [];
    const notes = [];
    for (const line of lines.slice(1)) {
      const noteMatch = line.match(/^_Alterado\s+(.+?)\s*—\s*era:\s*(.+?)\.\s*Motivo:\s*(.+?)_$/);
      if (noteMatch) {
        notes.push({
          date: noteMatch[1].trim(),
          old: noteMatch[2].trim(),
          motivo: noteMatch[3].trim(),
        });
      } else if (line.trim()) {
        statementLines.push(line.trim());
      }
    }
    clauses.push({
      decId: boundaries[i].decId,
      title: boundaries[i].title,
      statement: statementLines.join("\n"),
      notes,
    });
  }
  const historico = new Set();
  for (const match of historicoPart.matchAll(/DEC-(\d+)/g)) {
    historico.add(`DEC-${match[1]}`);
  }
  return {
    title: titleMatch?.[1]?.trim(),
    afeta: afetaMatch ? afetaMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [],
    clauses,
    historico: [...historico],
  };
};

// Inventário de numeração: cláusulas vivas E IDs de `## Histórico`, em TODOS
// os arquivos de `_app-vault/docs/decisions/` (SCHEMA.md §4.7). Restringir às
// vivas é o P0-3 do pre-mortem (reuso silencioso de ID removido).
export const inventoryDecisions = (vaultDir) => {
  if (!fs.existsSync(vaultDir)) {
    return { files: [], clauses: [], historico: [], max: 0 };
  }
  const files = [];
  const stack = [vaultDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (entry.name.endsWith(".md")) {
        files.push(abs);
      }
    }
  }
  files.sort();
  const clauses = [];
  const historico = new Set();
  let max = 0;
  for (const file of files) {
    const parsed = parseDecisionFile(fs.readFileSync(file, "utf8"));
    for (const clause of parsed.clauses) {
      clauses.push({ ...clause, file: path.basename(file) });
      const n = Number(clause.decId.slice(4));
      if (n > max) max = n;
    }
    for (const id of parsed.historico) {
      historico.add(id);
      const n = Number(id.slice(4));
      if (n > max) max = n;
    }
  }
  return { files, clauses, historico: [...historico], max };
};

// Similaridade de enunciado: Jaccard sobre tokens significativos (>= 3 chars,
// sem stopwords básicas); >= 0.6 casa como a mesma regra.
const STOPWORDS = new Set([
  "em", "de", "da", "do", "das", "dos", "para", "com", "na", "no", "nas",
  "nos", "e", "ou", "que", "por", "ao", "aos", "nao", "é", "sao", "como",
  "se", "uma", "um", "o", "a", "os", "as", "ja", "mais", "menos", "sem",
  "sob", "entre", "ate", "apos", "sobre", "apenas", "so", "quando", "onde",
]);

const tokensOf = (text) =>
  [...normalizeText(text).matchAll(/[a-z0-9]{3,}/g)]
    .map((m) => m[0])
    .filter((t) => !STOPWORDS.has(t));

const similarity = (a, b) => {
  const ta = new Set(tokensOf(a));
  const tb = new Set(tokensOf(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const token of ta) if (tb.has(token)) common += 1;
  return common / (ta.size + tb.size - common);
};

// Citações pendentes de um ID fora do arquivo dono do heading — inclui
// `.app-work/` (caminhos ocultos, SCHEMA.md §4.7) e outros arquivos de
// decisão (cross-domínio). Ignora `.git/` e `.hephaestus/`.
const findPendingCitations = (repoRoot, decId, ownerFileAbs) => {
  const citations = [];
  const stack = [repoRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === ".hephaestus") continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      const rel = path.relative(repoRoot, abs);
      if (abs === ownerFileAbs) continue;
      const content = fs.readFileSync(abs, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i += 1) {
        if (new RegExp(`\\b${decId}\\b`).test(lines[i])) {
          citations.push({ file: rel, line: i + 1, text: lines[i].trim() });
        }
      }
    }
  }
  return citations;
};

// Extrai o enunciado de um fragmento: para fragmento com heading DEC, o corpo
// sob o heading; para candidato, as sentenças deônticas (ou o corpo não-título).
export const statementOfFragment = (rawText) => {
  const lines = rawText.split("\n").filter((l) => l.trim());
  const headingIndex = lines.findIndex((l) => /^###\s+DEC-\d+\s*—/.test(l));
  if (headingIndex !== -1) {
    return lines.slice(headingIndex + 1).join("\n").trim();
  }
  const bodyLines = lines.filter((l) => !/^#+\s/.test(l));
  if (bodyLines.length === 0) return "";
  const deontic = bodyLines.filter((l) => DEONTIC_RE.test(normalizeText(l)));
  return (deontic.length > 0 ? deontic : bodyLines).join("\n").trim();
};

// Título de cláusula a partir do fragmento: o heading mais específico
// (nível mais profundo) — ex.: "## Limite de consultas" → "Limite de consultas".
const clauseTitleOf = (rawText) => {
  const headings = [...rawText.matchAll(/^(#{2,})\s+(.+)$/gm)].map((m) => ({
    depth: m[1].length,
    title: m[2].trim(),
  }));
  if (headings.length === 0) {
    const h1 = rawText.match(/^#\s+(.+)$/m);
    if (h1) return h1[1].trim();
    return null;
  }
  headings.sort((a, b) => b.depth - a.depth);
  return headings[0].title;
};

// Features kebab-case derivadas do par título+enunciado: tokens significativos
// do título que também ocorrem no enunciado (o sujeito da regra) — ex. título
// "Limite de consultas" + enunciado "…20 consultas por mês" ⇒ [consultas];
// título sem correspondência no enunciado não vira feature (Afeta: []).
const featuresOf = (title, statement) => {
  const titleTokens = new Set(tokensOf(title));
  const statementTokens = new Set(tokensOf(statement));
  return [...titleTokens]
    .filter((t) => statementTokens.has(t))
    .map((t) => t.toLowerCase());
};

const renderNote = (note) => `_Alterado ${note.date} — era: ${note.old}. Motivo: ${note.motivo}._`;

// Renderiza um arquivo de decisão por domínio.
const renderDecisionFile = ({ title, afeta, clauses, historicoLines }) => {
  const lines = [`# ${title}`, "", `Afeta: [${afeta.join(", ")}]`, ""];
  for (const clause of clauses) {
    lines.push(`### ${clause.decId} — ${clause.title}`, "");
    if (clause.statement) {
      lines.push(clause.statement, "");
    }
    for (const note of clause.notes) {
      lines.push(renderNote(note), "");
    }
  }
  if (historicoLines.length > 0) {
    lines.push("## Histórico", "");
    for (const line of historicoLines) {
      lines.push(line, "");
    }
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return `${lines.join("\n")}\n`;
};

// Reconcile sobre um repositório: devolve { identityMap, conflicts, decisions }.
// `decisions` é um Map relPath -> conteúdo final dos arquivos de decisão
// materializados (create/amend/remove); keep não gera escrita.
export const reconcileVault = ({ fragments, routing, repoRoot, now }) => {
  const vaultDir = path.join(repoRoot, "_app-vault", "docs", "decisions");
  const inventory = inventoryDecisions(vaultDir);
  const inventoriedMax = inventory.max;
  const entries = [];
  const conflicts = [];
  const domainState = new Map();
  const touchedDomains = new Set();

  const stateOf = (domain) => {
    if (!domainState.has(domain)) {
      const existingAbs = inventory.files.find(
        (f) => path.basename(f).replace(/\.md$/, "") === domain,
      );
      const existing = existingAbs
        ? parseDecisionFile(fs.readFileSync(existingAbs, "utf8"))
        : { title: null, afeta: [], clauses: [], historico: [] };
      domainState.set(domain, {
        title: existing.title ?? domain.charAt(0).toUpperCase() + domain.slice(1),
        afeta: new Set(existing.afeta),
        clauses: new Map(existing.clauses.map((c) => [c.decId, c])),
        historicoLines: [],
      });
    }
    return domainState.get(domain);
  };

  const vaultRoutes = routing.filter((e) => {
    if (e.territory !== "vault") return false;
    const dest = e.destinationPath ?? "";
    return (
      dest.includes("/docs/decisions/") &&
      dest.endsWith(".md")
    );
  });
  for (const route of vaultRoutes) {
    const fragment = fragments.find((f) => f.fragmentId === route.fragmentId);
    const rawText = fragment?.rawText ?? "";
    const domain = (route.destinationPath.replace(/\/+$/, "").split("/").pop() ?? "").replace(/\.md$/, "");
    const headingMatch = rawText.match(/^###\s+(DEC-\d+)\s*—\s*(.+)$/m);
    const statement = statementOfFragment(rawText);
    let action;
    let decId;
    let matchedId = null;

    if (headingMatch) {
      // ID congelado pela cascata (nível 1): casa por DEC-NNN explícito.
      decId = headingMatch[1];
      const clause = inventory.clauses.find((c) => c.decId === decId);
      if (!statement.trim()) {
        const ownerAbs = inventory.files.find(
          (f) => path.basename(f).replace(/\.md$/, "") === domain,
        );
        const citations = findPendingCitations(repoRoot, decId, ownerAbs ?? "");
        if (citations.length > 0) {
          const list = citations.map((c) => `${c.file}:${c.line}`).join(", ");
          throw new Error(
            `reconcile: remoção de ${decId} com citação pendente — bloqueado (${citations.length} citação(ões)): ${list}`,
          );
        }
        action = "remove";
        matchedId = decId;
      } else if (clause && normalizeStatement(clause.statement) === normalizeStatement(statement)) {
        action = "keep";
        matchedId = decId;
      } else if (clause) {
        action = "amend";
        matchedId = decId;
      } else if (inventory.historico.includes(decId)) {
        throw new Error(
          `reconcile: ID ${decId} congelado no fragmento mas presente em ## Histórico — reuso proibido (INV3)`,
        );
      } else {
        action = "create";
        if (Number(decId.slice(4)) <= inventoriedMax) {
          throw new Error(
            `reconcile: ID congelado ${decId} reusaria numeração existente (max inventariado ${inventoriedMax})`,
          );
        }
        inventory.max = Math.max(inventory.max, Number(decId.slice(4)));
      }
    } else {
      // Candidato: casa por similaridade de enunciado; sem a quem casar, create.
      let best = null;
      let bestScore = 0;
      for (const clause of inventory.clauses) {
        const score = similarity(clause.statement, statement);
        if (score > bestScore) {
          bestScore = score;
          best = clause;
        }
      }
      if (best && bestScore >= 0.6) {
        decId = best.decId;
        matchedId = decId;
        action =
          normalizeStatement(best.statement) === normalizeStatement(statement) ? "keep" : "amend";
      } else {
        decId = `DEC-${String(inventory.max + 1).padStart(3, "0")}`;
        inventory.max += 1;
        action = "create";
      }
    }

    entries.push({
      fragmentId: route.fragmentId,
      decId,
      action,
      domain,
      matchedId,
      evidence: `reconcile: ${action} — ${action === "create" ? `cunhagem max+1 sobre inventário ${inventoriedMax}` : `casado com ${decId}`}`,
    });

    // Aplica a ação no estado do domínio (materialização final ao renderizar).
    // keep não toca o domínio: nenhuma escrita sai do reconcile (INV2).
    if (action === "create" || action === "amend" || action === "remove") {
      touchedDomains.add(domain);
    }
    const state = stateOf(domain);
    if (action === "create") {
      const title = clauseTitleOf(rawText) ?? headingMatch?.[2]?.trim() ?? decId;
      state.clauses.set(decId, { decId, title, statement, notes: [] });
      for (const feature of featuresOf(title, statement)) state.afeta.add(feature);
    } else if (action === "amend") {
      const oldClause = state.clauses.get(decId);
      const oldValue = extractDecisionValues(oldClause?.statement ?? "")[0] ?? oldClause?.statement ?? "";
      const note = { date: now, old: oldValue, motivo: "valor alterado na reconciliação" };
      const notes = [note, ...(oldClause?.notes ?? [])].slice(0, 3);
      state.clauses.set(decId, { ...oldClause, statement, notes });
    } else if (action === "remove") {
      const removed = state.clauses.get(decId);
      state.clauses.delete(decId);
      state.historicoLines.push(
        `- ${now} — ${decId} removida. Era: ${removed?.statement ?? "—"}. Motivo: removida na reconciliação.`,
      );
    }
  }

  const decisions = new Map();
  for (const domain of touchedDomains) {
    const state = domainState.get(domain);
    const clauses = [...state.clauses.values()].sort((a, b) =>
      Number(a.decId.slice(4)) - Number(b.decId.slice(4)),
    );
    decisions.set(
      `_app-vault/docs/decisions/${domain}.md`,
      renderDecisionFile({
        title: state.title,
        afeta: [...state.afeta].sort(),
        clauses,
        historicoLines: state.historicoLines,
      }),
    );
  }

  return {
    identityMap: { version: 1, inventoriedMax, entries },
    conflicts: { version: 1, conflicts },
    decisions,
  };
};
