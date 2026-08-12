// Motor de referência determinístico da cascata de roteamento (níveis 1-4),
// fora do pack (scripts/__tests__). Materializa em código executável o
// contrato de `prompts/route.md` para os testes do Plano 03: o kit não tem
// executor mecânico de prompts (são contrato do agente), então o motor é o
// ponto onde o comportamento determinístico da cascata é exercitado com
// dados reais (catálogo do repositório, fixture, state).
//
// O nível 5 (resíduo da LLM) é representado por destinos CONGELADOS
// (S9/GUIDE 2.9): o julgamento residual é externo ao código do kit e entra
// no golden como `decidedBy: llm` congelado. `DEFAULT_RESIDUE` fixa esses
// destinos por sourcePath para o fixture repo-desorganizado.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./fs-utils.mjs";
import { writeJson } from "./fs-utils.mjs";

export const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const fragmentIdOf = (rawText) =>
  createHash("sha256")
    .update(normalizeText(rawText).replace(/\s+/g, " ").trim())
    .digest("hex");

// Chave estável de pergunta/resposta (D22): sha256 do CONTEXTO normalizado —
// origem do fragmento + o que falta decidir — nunca do texto literal da
// pergunta. A mesma ambiguidade reaparece com a mesma identidade a cada
// execução, e reformular a prosa da pergunta não gera chave nova (AC-5.2.4).
export const questionKeyOf = (context) =>
  createHash("sha256").update(normalizeText(context)).digest("hex");

// Contexto de roteamento de um fragmento: origem + destino em aberto.
export const routingQuestionContext = (sourcePath) => `route:${sourcePath}`;

const sha256Hex = (buffer) => createHash("sha256").update(buffer).digest("hex");

// --- Destinos legais (lista fechada: AGENTS.md + project-rules/ +
// _app-vault/** + .app-work/** — SCHEMA.md §2) ---
export const isLegalDestination = (destination) => {
  if (typeof destination !== "string" || destination.length === 0) return false;
  if (destination === "AGENTS.md") return true;
  return (
    destination.startsWith("project-rules/") ||
    destination.startsWith("_app-vault/") ||
    destination.startsWith(".app-work/")
  );
};

const territoryOf = (destination) => {
  if (destination === "AGENTS.md") return "agents";
  if (destination.startsWith("project-rules/")) return "project-rules";
  if (destination.startsWith("_app-vault/")) return "vault";
  if (destination.startsWith(".app-work/")) return "process";
  return null;
};

// Matriz INV9 (mesma do validador): process só relocate/keep; vault só
// reconcile/keep; agents e project-rules geram.
const regimeFor = (destination) => {
  const territory = territoryOf(destination);
  if (territory === "vault") return "reconcile";
  if (territory === "process") return "relocate";
  if (territory === "project-rules" || territory === "agents") return "generate";
  return null;
};

// --- Tokenização para o match de catálogo ---
const STOPWORDS = new Set([
  "em", "de", "da", "do", "das", "dos", "para", "com", "na", "no", "nas",
  "nos", "e", "ou", "que", "por", "ao", "aos", "nao", "nao", "é", "sao",
  "como", "se", "uma", "um", "o", "a", "os", "as", "ex", "ja", "mais",
  "menos", "sem", "sob", "entre", "ate", "apos", "sobre", "apenas", "so",
  "quando", "onde", "quem", "qual", "quais", "tipo", "vice", "excluindo",
]);

const termsOf = (text) =>
  [...normalizeText(text).matchAll(/[a-z0-9]{3,}/g)]
    .map((m) => m[0])
    .filter((term) => !STOPWORDS.has(term));

// --- Detectores sintáticos (nível 4) ---
const DEONTIC = /(deve|devem|obrigatori|proibid|precisa|tem de|tem que|nao pode|e proibido)/;
const hasHeading = (text) => /^#{1,3}\s/m.test(text);
const hasNumber = (text) => /\b\d+\b/.test(text);
const isCodeBlock = (text) => text.includes("```");
const isTable = (text) => /^\|.*\|$/m.test(text);

// Destino calculado pela classificação estrutural (nível 1 usa este destino
// para decidir keep por posição; o nível 4 o usa para decidir por detector).
export const structuralDestination = (fragment) => {
  const src = fragment.provenance[0].sourcePath;
  const base = path.basename(src);
  const stem = base.replace(/\.(md|yaml|yml|json|openapi\.json)$/i, "");
  const text = normalizeText(fragment.rawText);

  if (text.includes("openapi") || src.endsWith(".openapi.json")) {
    return `project-rules/contracts/${base}`;
  }
  // heading + verbo deôntico + valor numérico ⇒ candidato a decisão
  if (hasHeading(text) && DEONTIC.test(text) && hasNumber(text)) {
    return "_app-vault/docs/decisions/produto.md";
  }
  // regra de domínio enterrada no AGENTS.md legado ⇒ sai para project-rules
  if (src === "AGENTS.md" && DEONTIC.test(text)) {
    return "project-rules/rules/domain_rules.md";
  }
  // origem já em território canônico ⇒ destino é a própria origem
  if (
    src === "AGENTS.md" ||
    src.startsWith("project-rules/") ||
    src.startsWith("_app-vault/") ||
    src.startsWith(".app-work/")
  ) {
    return src;
  }
  // tabela tipo→arquivo ⇒ índice
  if ((src.includes("index") || text.includes("indice")) && isTable(text)) {
    return `project-rules/index/${stem}.md`;
  }
  // bloco de código sem norma associada ⇒ referência
  if (isCodeBlock(text) && !DEONTIC.test(text)) {
    return `project-rules/reference/${stem}.md`;
  }
  return null;
};

// --- Resolução do catálogo: match mais específico vence o genérico ---
// Especificidade = número de termos distintos do pattern presentes no perfil
// do fragmento (sourcePath + rawText normalizados). Um único termo genérico
// (ex.: "docs", presente no path de quase todo fragmento) não decide: o
// match exige no mínimo 2 termos distintos em comum. Entrada com
// `destination: null` nunca decide — enfileira (retorna match com null).
const MIN_MATCH_SCORE = 2;

// Casamento por radical: termo do pattern casa com termo do perfil quando
// idênticos ou quando compartilham o mesmo prefixo (>= 6 caracteres) — cobre
// flexão de plural/gênero ("concluído" ~ "concluídos", "brainstorms" ~
// "brainstorming") sem stemming completo.
const stemsMatch = (patternTerm, profileTerm) => {
  if (patternTerm === profileTerm) return true;
  const min = Math.min(patternTerm.length, profileTerm.length);
  if (min < 6) return false;
  return patternTerm.slice(0, min) === profileTerm.slice(0, min);
};

export const matchCatalog = (fragment, entries) => {
  const profile = normalizeText(
    `${fragment.provenance[0].sourcePath} ${fragment.rawText}`,
  );
  const profileTerms = new Set(termsOf(profile));
  const scored = [];
  for (const [index, entry] of entries.entries()) {
    const terms = [...new Set(termsOf(entry.pattern))];
    const score = terms.filter((term) =>
      [...profileTerms].some((profileTerm) => stemsMatch(term, profileTerm)),
    ).length;
    if (score >= MIN_MATCH_SCORE) {
      scored.push({ entry, score, index });
    }
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored[0];
};

// --- Cascata: para no primeiro nível que decide ---
// returns { entry } (decidido) ou { question } (enfileirado).
const routeFragment = (fragment, ctx) => {
  const src = fragment.provenance[0].sourcePath;
  const fragmentId = fragment.fragmentId;

  // Bloco shield do state precede o nível 1 (Plano 05): blindagem declarada
  // (path + selector opcional) vence e decide keep com decidedBy: state — a
  // decisão vem da declaração no estado, não de posição. Ausência = vazio.
  for (const entry of ctx.shield) {
    const shieldPath = typeof entry === "string" ? entry : entry.path;
    if (!shieldPath) continue;
    if (src === shieldPath || src.startsWith(`${shieldPath}/`)) {
      return {
        entry: {
          fragmentId,
          territory: territoryOf(src),
          regime: "keep",
          destinationPath: src,
          confidence: 1,
          decidedBy: "state",
          evidence: `shield: blindagem declarada no state (${shieldPath})`,
          needsSplit: false,
        },
      };
    }
  }

  // Nível 1 — não-toque e identidade: destino calculado pela classificação
  // estrutural == origem atual ⇒ keep, decidido por POSIÇÃO (nunca por
  // comparação com execução anterior).
  const structural = structuralDestination(fragment);
  if (structural !== null && structural === src) {
    return {
      entry: {
        fragmentId,
        territory: territoryOf(src),
        regime: "keep",
        destinationPath: src,
        confidence: 1,
        decidedBy: "keep",
        evidence: `destino calculado == origem atual (${src}) — cópia byte a byte`,
        needsSplit: false,
      },
    };
  }

  // Nível 2 — respostas de escopo do projeto (bloco answers do state).
  // Match por questionKey = sha256(contexto normalizado) — o MESMO contexto
  // usado ao enfileirar (AC-5.2.4: reformular o texto da pergunta não muda a
  // chave). Vinculante (D22): divergir do catálogo é violação, não opinião;
  // decide decidedBy: state. Ausência = sem match.
  const questionKey = questionKeyOf(routingQuestionContext(src));
  const answer = ctx.answers[questionKey];
  if (answer && typeof answer.answer?.destinationPath === "string") {
    const destinationPath = answer.answer.destinationPath;
    if (!isLegalDestination(destinationPath)) {
      throw new Error(
        `routing: fragmento ${fragmentId} — resposta de projeto com destino ilegal "${destinationPath}"`,
      );
    }
    return {
      entry: {
        fragmentId,
        territory: territoryOf(destinationPath),
        regime: regimeFor(destinationPath),
        destinationPath,
        confidence: 1,
        decidedBy: "state",
        evidence: `resposta de escopo do projeto (questionKey ${questionKey})`,
        needsSplit: false,
      },
    };
  }

  // Nível 3 — catálogo: overlay do projeto primeiro, base do pack depois;
  // match mais específico vence o genérico. `destination: null` ou confiança
  // baixa NUNCA decide: enfileira pergunta.
  const match = matchCatalog(fragment, ctx.catalog);
  if (match !== null) {
    if (match.entry.destination === null || match.entry.confidence === "baixa") {
      return { question: { fragmentId, sourcePath: src } };
    }
    const destinationPath = match.entry.destination;
    if (!isLegalDestination(destinationPath)) {
      throw new Error(
        `routing: fragmento ${fragmentId} — destino do catálogo "${destinationPath}" fora da lista fechada (SCHEMA.md §2)`,
      );
    }
    return {
      entry: {
        fragmentId,
        territory: territoryOf(destinationPath),
        regime: regimeFor(destinationPath),
        destinationPath,
        confidence: match.entry.confidence === "alta" ? 1 : 0.5,
        decidedBy: "catalog",
        evidence: `catálogo: pattern "${match.entry.pattern}" (${match.score} termo(s) casados)`,
        needsSplit: false,
      },
    };
  }

  // Nível 4 — detectores sintáticos (destino estrutural calculado acima).
  if (structural !== null) {
    const destinationPath = structural;
    if (!isLegalDestination(destinationPath)) {
      throw new Error(
        `routing: fragmento ${fragmentId} — destino do detector "${destinationPath}" fora da lista fechada (SCHEMA.md §2)`,
      );
    }
    return {
      entry: {
        fragmentId,
        territory: territoryOf(destinationPath),
        regime: regimeFor(destinationPath),
        destinationPath,
        confidence: 0.8,
        decidedBy: "detector",
        evidence: `detector sintático acionado (${fragment.provenance[0].sourcePath})`,
        needsSplit: false,
      },
    };
  }

  // Nível 5 — resíduo da LLM: destino CONGELADO (S9). Abaixo do limiar
  // (ausência de decisão congelada) não decide: enfileira.
  const residue = ctx.residue.find((r) => r.sourcePath === src);
  if (residue) {
    const destinationPath = residue.destinationPath;
    if (!isLegalDestination(destinationPath)) {
      throw new Error(
        `routing: fragmento ${fragmentId} — destino de resíduo "${destinationPath}" fora da lista fechada (SCHEMA.md §2)`,
      );
    }
    return {
      entry: {
        fragmentId,
        territory: territoryOf(destinationPath),
        regime: regimeFor(destinationPath),
        destinationPath,
        confidence: residue.confidence,
        decidedBy: "llm",
        evidence: "resíduo decidido pela LLM (destino congelado no golden)",
        needsSplit: false,
      },
    };
  }
  return { question: { fragmentId, sourcePath: src } };
};

// --- Entrada: fragments.json do fixture (1 fragmento por arquivo) ---
export const buildFragments = (root) => {
  const fragments = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === ".hephaestus") continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      const rel = path.relative(root, abs);
      const rawText = fs.readFileSync(abs, "utf8");
      const size = Buffer.byteLength(rawText, "utf8");
      fragments.push({
        fragmentId: fragmentIdOf(rawText),
        rawText,
        territory: "agents",
        regime: "keep",
        confidence: 0.5,
        ambiguity: "medium",
        structuralType: "desconhecido",
        provenance: [{ sourcePath: rel, startOffset: 0, endOffset: size }],
      });
    }
  }
  fragments.sort((a, b) => a.provenance[0].sourcePath.localeCompare(b.provenance[0].sourcePath));
  return fragments;
};

// --- Resíduo congelado do fixture (S9): a LLM decidiu estes destinos na
// captura; o golden os congela. A entrada de IDEIAS vira DEC-NNN nova
// (degradante, D26); a de NOTAS é referência (não degrada). ---
export const DEFAULT_RESIDUE = [
  {
    sourcePath: "docs/NOTAS.md",
    destinationPath: "project-rules/reference/notas.md",
    confidence: 0.8,
  },
  {
    sourcePath: "docs/IDEIAS.md",
    destinationPath: "_app-vault/docs/decisions/ideias.md",
    confidence: 0.9,
  },
];

export const loadCatalog = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(REPO_ROOT, "catalog", "routing-defaults.json"),
      "utf8",
    ),
  );

// Roda a cascata sobre um fixture: retorna { routing, questions }.
// options: { fragments, catalog, state, residue }
export const buildRouting = (root, options = {}) => {
  const fragments = options.fragments ?? buildFragments(root);
  const catalogBase = options.catalog ?? loadCatalog();
  const catalogEntries = Array.isArray(catalogBase) ? catalogBase : catalogBase.entries;
  const state = options.state ?? { routing: { overlay: [] }, answers: {}, shield: [] };
  const overlay = Array.isArray(state.routing?.overlay) ? state.routing.overlay : [];
  const ctx = {
    catalog: [...overlay, ...catalogEntries],
    answers: state.answers ?? {},
    shield: state.shield ?? [],
    residue: options.residue ?? DEFAULT_RESIDUE,
  };
  const routing = [];
  const questions = [];
  for (const fragment of fragments) {
    if (fragment.needsSplit === true) {
      throw new Error(
        `routing: fragmento misto marcado needsSplit e não dividido — cancela a fase (${fragment.fragmentId})`,
      );
    }
    const result = routeFragment(fragment, ctx);
    if (result.question) {
      questions.push({
        questionKey: questionKeyOf(routingQuestionContext(result.question.sourcePath)),
        fragmentId: result.question.fragmentId,
        sourcePath: result.question.sourcePath,
      });
    } else {
      routing.push(result.entry);
    }
  }
  return { routing, questions };
};

// Grava os manifests de execução dentro do fixture (cópia em tmp), no mesmo
// layout que o produto usa (.hephaestus/manifests/).
export const writeRoutingManifests = (root, routing, fragments) => {
  writeJson(root, ".hephaestus/manifests/fragments.json", fragments);
  writeJson(root, ".hephaestus/manifests/routing.json", routing);
};

// Simulação do apply para a prova de idempotência (AC-3.2.2): materializa
// os destinos movendo a origem (copy + rm preserva bytes). Destino de pasta
// (termina com "/", ex. ".app-work/references/") recebe o basename da origem.
// Regime keep não toca nada. O que ficou enfileirado permanece no lugar.
export const applyRouting = (root, routing, fragments) => {
  for (const entry of routing) {
    if (entry.regime === "keep") continue;
    const frag = fragments.find((f) => f.fragmentId === entry.fragmentId);
    const src = frag?.provenance?.[0]?.sourcePath;
    const dest = entry.destinationPath.endsWith("/")
      ? `${entry.destinationPath}${path.basename(src ?? "artefato.md")}`
      : entry.destinationPath;
    const absSrc = src ? path.join(root, src) : null;
    const absDest = path.join(root, dest);
    fs.mkdirSync(path.dirname(absDest), { recursive: true });
    if (absSrc !== null && fs.existsSync(absSrc)) {
      fs.copyFileSync(absSrc, absDest);
      fs.rmSync(absSrc);
    } else {
      fs.writeFileSync(absDest, `# ${path.basename(dest)}\n`);
    }
  }
};

// Deriva o plan.json da segunda passada a partir do routing (regime keep →
// operation keep; o restante não existe na passada 2 sobre fonte inalterada).
export const routingToPlan = (routing) => ({
  version: 1,
  entries: routing.map((entry) => ({
    artifactPath: entry.destinationPath,
    territory: entry.territory,
    regime: entry.regime,
    operation: entry.regime === "keep" ? "keep" : "skip",
    rationale: `regime ${entry.regime} herdado do roteamento (${entry.decidedBy})`,
    origin: entry.fragmentId,
    decidedBy: entry.decidedBy,
    destructive: false,
  })),
});

export const sha256Of = sha256Hex;
