// Motor de referência determinístico do modo `maintain` (Plano 06), fora do
// pack (scripts/__tests__). Materializa em código executável o contrato de
// `prompts/discover.md:Escopo por modo` (maintain) e o pipeline de manutenção:
// escopo reduzido guiado por `catalog/drift-catalog.json` + overlay do estado
// (bloco `routing`), fragmentação integral (um maintain que varresse tudo
// produziria o mesmo resultado, só mais devagar — o escopo reduzido diminui o
// custo, não a corretude), roteamento pela cascata existente
// (routing-engine.mjs, sem alteração de níveis) e plano sem ruído (o que não
// é drift cai em `keep` pelo nível 1 — AC-6.1.2).
//
// O kit não tem executor mecânico de prompts; o motor é o ponto onde o
// comportamento determinístico do maintain é exercitado com dados reais.
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "./fs-utils.mjs";
import { buildFragments, buildRouting } from "./routing-engine.mjs";
import { inventoryDecisions } from "./reconcile-engine.mjs";
import { inventoryProcessHygiene } from "./hygiene-engine.mjs";

export const loadDriftCatalog = () =>
  JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "catalog", "drift-catalog.json"), "utf8"),
  );

// Lista de globs vigiados = catálogo base de drift + padrões do overlay do
// estado (bloco `routing`). A lista NUNCA é embutida no prompt nem no motor
// (AC-6.1.3): ferramenta nova entra editando o catálogo ou o overlay.
export const watchedGlobs = (driftCatalog, state = {}) => {
  const base = Array.isArray(driftCatalog.artifacts)
    ? driftCatalog.artifacts.map((a) => a.glob)
    : [];
  const overlay = Array.isArray(state.routing?.overlay)
    ? state.routing.overlay.map((e) => e.pattern).filter((p) => typeof p === "string")
    : [];
  return [...base, ...overlay];
};

// Arquivos presentes sob um glob: glob de pasta (termina em "/") varre
// recursivamente; glob de arquivo é o próprio path. Sempre relativo ao root.
export const globFiles = (root, glob) => {
  const normalized = glob.replace(/^\.\//, "");
  if (normalized.endsWith("/")) {
    const absDir = path.join(root, normalized);
    if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) return [];
    const results = [];
    const stack = [absDir];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const abs = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(abs);
        } else {
          results.push(path.relative(root, abs));
        }
      }
    }
    return results.sort();
  }
  const abs = path.join(root, normalized);
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? [normalized] : [];
};

// Vault integro: `INDEX.md` presente, domínios de `docs/decisions/**` listados
// no índice (deriváveis dos campos `Afeta:`), `DEC-NNN` sem colisão (cláusula
// viva + `## Histórico`) e nenhuma pasta fora da lista fechada de SCHEMA.md §2.
const VAULT_CLOSED = new Set(["INDEX.md", "docs", "specs"]);
const DOCS_CLOSED = new Set(["decisions", "TEMPLATES"]);
const APP_WORK_CLOSED = new Set([
  "INDEX.md", ".gitignore", "hephaestus-state.json", "guides", "roadmap",
  "brainstorming", "prd", "docs", "references", "private", "issues", "archive",
]);

export const checkVaultIntegrity = (root) => {
  const issues = [];
  const vaultRoot = path.join(root, "_app-vault");
  if (!fs.existsSync(vaultRoot)) return { ok: true, issues };
  if (!fs.existsSync(path.join(vaultRoot, "INDEX.md"))) {
    issues.push("_app-vault/INDEX.md ausente — índice derivável dos campos Afeta: não existe");
  }
  for (const entry of fs.readdirSync(vaultRoot, { withFileTypes: true })) {
    if (!VAULT_CLOSED.has(entry.name)) {
      issues.push(`_app-vault/${entry.name} fora da lista fechada de SCHEMA.md §2`);
    }
    if (entry.name === "docs" && entry.isDirectory()) {
      for (const sub of fs.readdirSync(path.join(vaultRoot, "docs"), { withFileTypes: true })) {
        if (!DOCS_CLOSED.has(sub.name)) {
          issues.push(`_app-vault/docs/${sub.name} fora da lista fechada de SCHEMA.md §2`);
        }
      }
    }
  }
  const decisionsDir = path.join(vaultRoot, "docs", "decisions");
  if (fs.existsSync(decisionsDir)) {
    const inventory = inventoryDecisions(decisionsDir);
    for (const id of inventory.clauses.map((c) => c.decId)) {
      if (inventory.historico.includes(id)) {
        issues.push(`${id} presente como cláusula viva e em ## Histórico — ID removido não pode ser reusado`);
      }
    }
    const indexPath = path.join(vaultRoot, "INDEX.md");
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, "utf8");
      for (const domain of inventory.files) {
        const name = path.basename(domain).replace(/\.md$/, "");
        if (!indexContent.includes(`docs/decisions/${name}.md`)) {
          issues.push(`_app-vault/INDEX.md não lista o domínio ${name} — índice não derivável dos Afeta:`);
        }
      }
    }
  }
  const appWork = path.join(root, ".app-work");
  if (fs.existsSync(appWork)) {
    for (const entry of fs.readdirSync(appWork, { withFileTypes: true })) {
      if (!APP_WORK_CLOSED.has(entry.name)) {
        issues.push(`.app-work/${entry.name} fora da lista fechada de SCHEMA.md §2`);
      }
    }
  }
  return { ok: issues.length === 0, issues };
};

// Candidatos a decisão pendentes nas seções `Candidatos a decisão` dos
// `LEDGER.md` dos guides em `.app-work/guides/` (linha que não é o placeholder
// "nenhum ainda" e cujo estado não é promoção registrada).
export const pendingDecisionCandidates = (root) => {
  const candidates = [];
  const guidesDir = path.join(root, ".app-work", "guides");
  if (!fs.existsSync(guidesDir)) return candidates;
  const stack = [guidesDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (entry.name !== "LEDGER.md") continue;
      const content = fs.readFileSync(abs, "utf8");
      const section = content.split("## Candidatos a decisão")[1]?.split(/^## /m)[0] ?? "";
      for (const line of section.split("\n")) {
        if (!line.startsWith("|") || !line.includes("|")) continue;
        const cells = line.split("|").map((c) => c.trim());
        const rule = cells[1];
        if (!rule || rule.length === 0 || rule === "Regra candidata" || rule === "nenhum ainda") {
          continue;
        }
        candidates.push({ guide: path.relative(root, abs), rule });
      }
    }
  }
  return candidates;
};

// Docs, specs e READMEs fora dos territórios canônicos (fonte inalterada em
// maintain — a recentralização decide depois, na cascata).
const CANONICAL_PREFIXES = [".app-work/", "_app-vault/", "project-rules/", ".hephaestus/", ".git/"];

const isCanonical = (rel) => CANONICAL_PREFIXES.some((p) => rel.startsWith(p));

export const findChangedDocs = (root) => {
  const docs = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".git")) continue;
      const abs = path.join(current, entry.name);
      const rel = path.relative(root, abs);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (isCanonical(rel)) continue;
      const base = entry.name.toLowerCase();
      const isDoc = base.endsWith(".md") && (rel.startsWith("docs/") || base.startsWith("readme"));
      const isSpec = /spec/.test(rel.toLowerCase()) && base.endsWith(".md");
      if (isDoc || isSpec) docs.push(rel);
    }
  }
  return docs.sort();
};

// Inventário de maintain: fontes + drift + integridade + candidatos.
export const discoverMaintain = (root, { state = {}, driftCatalog } = {}) => {
  const catalog = driftCatalog ?? loadDriftCatalog();
  const watched = watchedGlobs(catalog, state);
  const artifactsByGlob = new Map(
    (Array.isArray(catalog.artifacts) ? catalog.artifacts : []).map((a) => [a.glob, a]),
  );
  const driftSources = [];
  for (const glob of watched) {
    const tool = artifactsByGlob.get(glob)?.tool ?? "overlay";
    for (const file of globFiles(root, glob)) {
      driftSources.push({ path: file, glob, tool });
    }
  }
  driftSources.sort((a, b) => a.path.localeCompare(b.path));

  const agentsPath = path.join(root, "AGENTS.md");
  const lastRunAt = state.meta?.lastRunAt;
  const agentsChanged =
    fs.existsSync(agentsPath) &&
    (typeof lastRunAt !== "string" || fs.statSync(agentsPath).mtimeMs > Date.parse(lastRunAt));

  const claudePath = path.join(root, "CLAUDE.md");
  const claudeDivergent =
    fs.existsSync(claudePath) &&
    fs.existsSync(agentsPath) &&
    fs.readFileSync(claudePath, "utf8") !== fs.readFileSync(agentsPath, "utf8");

  return {
    mode: "maintain",
    watched,
    driftSources,
    agentsChanged,
    claudeDivergent,
    docs: findChangedDocs(root),
    vault: checkVaultIntegrity(root),
    pendingCandidates: pendingDecisionCandidates(root),
    processHygiene: inventoryProcessHygiene(root),
  };
};

// Pipeline de manutenção sobre um repositório adotado: fragmentação integral
// (mesma do adopt), roteamento pela cascata existente e plano sem ruído.
// Retorno: { fragments, routing, questions, plan, inventory, closeout }.
export const runMaintainPipeline = (root, { state = {}, residue = [], now = "2026-08-12" } = {}) => {
  const inventory = discoverMaintain(root, { state });
  const fragments = buildFragments(root);
  const { routing, questions } = buildRouting(root, { fragments, state, residue, now });
  const srcByFragment = new Map(fragments.map((f) => [f.fragmentId, f.provenance[0].sourcePath]));
  const planEntries = routing.map((entry) => {
    const src = srcByFragment.get(entry.fragmentId);
    return {
      artifactPath: entry.destinationPath,
      territory: entry.territory,
      regime: entry.regime,
      operation: entry.regime === "keep" ? "keep"
        : entry.regime === "relocate" ? "move"
        : entry.regime === "delete" ? "delete"
        : entry.regime === "condense" ? "condense"
        : "create",
      rationale: `regime ${entry.regime} herdado do roteamento (${entry.decidedBy})`,
      origin: entry.fragmentId,
      decidedBy: entry.decidedBy,
      destructive: entry.regime === "delete" || entry.regime === "condense" || entry.regime === "relocate",
    };
  });
  const plan = { version: 1, entries: planEntries };

  // Fechamento: a origem de cada drift é reportada (CN2 — "com a origem
  // reportada no fechamento").
  const closeout = [
    "# Relatório de fechamento (maintain)",
    "",
    "## Drift recentralizado",
    ...inventory.driftSources.map((d) => {
      const routed = routing.find((e) => srcByFragment.get(e.fragmentId) === d.path);
      return routed
        ? `- ${d.path} (${d.tool}) → ${routed.destinationPath} (${routed.regime}, ${routed.decidedBy})`
        : `- ${d.path} (${d.tool}) → em aberto`;
    }),
    "",
  ];

  return { fragments, routing, questions, plan, inventory, closeout: closeout.join("\n") };
};
