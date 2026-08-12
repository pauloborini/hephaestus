// Motor de referência determinístico da composição e do pacote final (Plano
// 04), fora do pack (scripts/__tests__). Materializa em código executável o
// contrato de `prompts/compose.md` sobre a saída do roteamento
// (routing-engine.mjs) e do reconcile (reconcile-engine.mjs): os quatro
// territórios (`AGENTS.md`, `project-rules/`, `_app-vault/`, `.app-work/`),
// o `INDEX.md` derivado dos campos `Afeta:` (nunca escrito à mão), o scaffold
// de `.app-work/` da lista fechada de SCHEMA.md §2 (com `.app-work/.gitignore`
// mesmo em projeto verde) e os manifests do pacote (run-state, snapshot,
// fragments, routing, identity-map, conflicts, coverage-map, plan, report,
// staging-manifest com proveniência).
//
// O pacote final espelha o estado do repositório após `apply`: fontes com
// fragmento roteado saem da origem (mesma semântica do apply simulado do
// Plano 03); o único resto é o fragmento enfileirado (pergunta sem resposta,
// drenada por `interview` no Plano 05), que permanece no lugar.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { buildFragments, buildRouting } from "./routing-engine.mjs";
import { reconcileVault, parseDecisionFile, statementOfFragment } from "./reconcile-engine.mjs";

const readFile = (root, rel) => fs.readFileSync(path.join(root, rel), "utf8");

const sha256Hex = (buffer) => createHash("sha256").update(buffer).digest("hex");

// Destino final de uma entrada de roteamento: destino-pasta (termina em "/")
// recebe o basename da origem.
const destOf = (entry, src) =>
  entry.destinationPath.endsWith("/")
    ? `${entry.destinationPath}${path.basename(src)}`
    : entry.destinationPath;

// artifactType do coverage-map por destino — o enum de `artifact.schema.json`
// é {AGENTS, index, rules, reference, contracts, manifest}; destinos de
// `_app-vault/` e `.app-work/` caem em "reference" (mais próximo; ver Lacunas
// no Impl do Plano 04).
const artifactTypeOf = (destination) => {
  if (destination === "AGENTS.md" || destination.startsWith("AGENTS.md/")) return "AGENTS";
  if (destination.startsWith("project-rules/index/")) return "index";
  if (destination.startsWith("project-rules/rules/")) return "rules";
  if (destination.startsWith("project-rules/contracts/")) return "contracts";
  if (destination.startsWith("project-rules/reference/")) return "reference";
  return "reference";
};

// Deriva o `_app-vault/INDEX.md` dos campos `Afeta:` dos arquivos de decisão
// (SCHEMA.md §7): `## Domínios` (um ponteiro por arquivo), lista de features
// válidas acima de `## Por feature`, `## Por feature` derivado — nunca à mão.
export const deriveIndex = (decisions, { projectName, now }) => {
  const domains = [];
  const featureDomains = new Map();
  const features = new Set();
  for (const [relPath, content] of decisions) {
    const name = path.basename(relPath).replace(/\.md$/, "");
    const parsed = parseDecisionFile(content);
    domains.push({ name, title: parsed.title ?? name });
    for (const feature of parsed.afeta) {
      features.add(feature);
      if (!featureDomains.has(feature)) featureDomains.set(feature, []);
      featureDomains.get(feature).push(name);
    }
  }
  domains.sort((a, b) => a.name.localeCompare(b.name));
  const sortedFeatures = [...features].sort();
  const lines = [
    "---",
    "vault_version: 1",
    `updated: ${now}`,
    `scope: Decisões de produto de ${projectName}`,
    "---",
    "",
    `# ${projectName} — índice do vault`,
    "",
    "## Domínios",
    "",
    ...domains.map((d) => `- [${d.name}](docs/decisions/${d.name}.md) — ${d.title}`),
    "",
    "## Features válidas",
    "",
    sortedFeatures.length > 0 ? sortedFeatures.map((f) => `\`${f}\``).join(", ") : "(nenhuma)",
    "",
    "## Por feature",
    "",
    ...sortedFeatures.map((f) => `- ${f} → ${featureDomains.get(f).join(", ")}`),
    "",
  ];
  return `${lines.join("\n")}`;
};

// AGENTS.md gerado: header real, workflow, precedência e estrutura — sem regra
// de domínio e sem cláusula de decisão (CN8); os índices de project-rules/ são
// alcançáveis pela precedência (checkIndexes do validador).
const AGENTS_TEMPLATE = (projectName) => `# ${projectName} — contrato do agente

## Workflow obrigatório

Antes de iniciar qualquer tarefa, leia \`project-rules/index/README.md\`, aplique as regras acionadas e confira a precedência abaixo.

## Precedência interna

1. \`AGENTS.md\` — contrato do agente e workflow
2. \`project-rules/rules/*\` — regras obrigatórias de domínio e arquitetura
3. \`project-rules/reference/*\` — exemplos e material de apoio
4. \`_app-vault/docs/decisions/\` — decisões de produto (referenciadas por DEC-NNN, nunca copiadas)

## Estrutura do repositório

- \`project-rules/index/\` — índices por tipo de tarefa
- \`project-rules/rules/\` — regras obrigatórias
- \`project-rules/reference/\` — exemplos e notas
- \`project-rules/contracts/\` — contratos externos (somente consulta)
- \`_app-vault/\` — decisões de produto
- \`.app-work/\` — processo (nunca insumo de regra)
`;

const INDEX_README = `# Índice do projeto

## Regras

- \`project-rules/rules/architecture_rules.md\` — arquitetura
- \`project-rules/rules/domain_rules.md\` — domínio

## Referências

- \`project-rules/reference/snippet.md\` — exemplos
- \`project-rules/reference/notas.md\` — notas soltas

## Contratos

- \`project-rules/contracts/openapi.yaml\` — API de pagamentos
`;

// Executa o pipeline de referência adot (fragments -> route -> reconcile ->
// compose) sobre o fixture e devolve o pacote completo.
// Retorno: { fragments, routing, questions, identityMap, conflicts, files,
// composed } — `files` é o Map relPath -> conteúdo do pacote final (árvore
// completa pós-apply); `composed` é a lista de relPaths gravados por apply
// (entrada do staging-manifest e do artifactsWritten).
export const runAdoptPipeline = (fixtureRoot, { now = "2026-08-12" } = {}) => {
  const fragments = buildFragments(fixtureRoot);
  const { routing, questions } = buildRouting(fixtureRoot, { fragments });
  const { identityMap, conflicts, decisions } = reconcileVault({
    fragments,
    routing,
    repoRoot: fixtureRoot,
    now,
  });

  const projectName =
    readFile(fixtureRoot, "AGENTS.md").match(/^#\s+(.+?)\s*—/m)?.[1]?.trim() ?? "Meu Projeto";

  const files = new Map();
  const srcByFragment = new Map(fragments.map((f) => [f.fragmentId, f.provenance[0].sourcePath]));

  // --- Território agents ---
  files.set("AGENTS.md", AGENTS_TEMPLATE(projectName));

  // --- project-rules (gerado + keep byte a byte) ---
  files.set("project-rules/index/README.md", INDEX_README);
  for (const entry of routing) {
    if (entry.regime !== "keep") continue;
    const src = srcByFragment.get(entry.fragmentId);
    if (src) files.set(entry.destinationPath, readFile(fixtureRoot, src));
  }
  const rulesFragments = routing.filter(
    (e) => e.territory === "project-rules" && e.regime === "generate" && e.destinationPath.startsWith("project-rules/rules/"),
  );
  const decisionsByDomain = new Map();
  for (const [rel, content] of decisions) {
    decisionsByDomain.set(path.basename(rel).replace(/\.md$/, ""), content);
  }
  const decisionTitles = new Map();
  for (const [domain, content] of decisionsByDomain) {
    for (const clause of parseDecisionFile(content).clauses) {
      decisionTitles.set(clause.decId, clause.title);
    }
  }
  const domainRulesParts = [];
  for (const entry of rulesFragments) {
    const src = srcByFragment.get(entry.fragmentId);
    if (src) domainRulesParts.push(statementOfFragment(readFile(fixtureRoot, src)));
  }
  const decisionPointers = [...decisionTitles.entries()]
    .map(
      ([decId, title]) =>
        `- ${title} — ver ${decId} em \`_app-vault/docs/decisions/${decIdToDomain(decId, decisionsByDomain)}.md\`.`,
    )
    .join("\n");
  const domainRulesBody = [
    "# Regras de domínio",
    "",
    ...domainRulesParts,
    "",
    "## Decisões de produto vigentes",
    "",
    "Normas de produto com efeito observável pelo usuário final vivem como decisão em `_app-vault/docs/decisions/`; `project-rules/` referencia o ID, nunca copia o valor (D18).",
    "",
    ...(decisionPointers ? decisionPointers.split("\n") : []),
    "",
  ].join("\n");
  files.set("project-rules/rules/domain_rules.md", domainRulesBody);
  for (const entry of routing) {
    if (entry.territory !== "project-rules" || entry.regime !== "generate") continue;
    const src = srcByFragment.get(entry.fragmentId);
    if (!src) continue;
    const dest = destOf(entry, src);
    if (dest.startsWith("project-rules/reference/") || dest.startsWith("project-rules/contracts/")) {
      files.set(dest, readFile(fixtureRoot, src));
    }
  }

  // --- Território vault ---
  for (const [rel, content] of decisions) {
    files.set(rel, content);
  }
  files.set("_app-vault/INDEX.md", deriveIndex(decisions, { projectName, now }));

  // --- Território process (.app-work): scaffold da lista fechada + realocação ---
  files.set(".app-work/.gitignore", "references/\nprivate/\n");
  for (const entry of routing) {
    if (entry.territory !== "process" || entry.regime !== "relocate") continue;
    const src = srcByFragment.get(entry.fragmentId);
    if (!src) continue;
    files.set(destOf(entry, src), readFile(fixtureRoot, src));
  }

  // --- Scaffold raiz ---
  files.set(".gitignore", ".hephaestus/\n");

  // --- Manifests do pacote ---
  const snapshotFiles = fragments.map((f) => {
    const prov = f.provenance[0];
    const abs = path.join(fixtureRoot, prov.sourcePath);
    const buffer = fs.readFileSync(abs);
    return {
      path: prov.sourcePath,
      sha256: sha256Hex(buffer),
      size: buffer.length,
    };
  });
  files.set(
    ".hephaestus/manifests/snapshot.json",
    `${JSON.stringify({ files: snapshotFiles, ignoredRegions: [] }, null, 2)}\n`,
  );
  files.set(
    ".hephaestus/manifests/fragments.json",
    `${JSON.stringify(fragments, null, 2)}\n`,
  );
  files.set(
    ".hephaestus/manifests/routing.json",
    `${JSON.stringify(routing, null, 2)}\n`,
  );
  files.set(
    ".hephaestus/manifests/identity-map.json",
    `${JSON.stringify(identityMap, null, 2)}\n`,
  );
  files.set(
    ".hephaestus/manifests/conflicts.json",
    `${JSON.stringify(conflicts, null, 2)}\n`,
  );

  // coverage-map: uma entrada por fragmento (routed + enfileirado).
  const coverageEntries = [];
  for (const fragment of fragments) {
    const routed = routing.find((e) => e.fragmentId === fragment.fragmentId);
    const question = questions.find((q) => q.fragmentId === fragment.fragmentId);
    const src = fragment.provenance[0].sourcePath;
    if (routed) {
      const dest = destOf(routed, src);
      coverageEntries.push({
        fragmentId: fragment.fragmentId,
        artifactType: artifactTypeOf(dest),
        outputPath: dest,
        derivedFrom: [src],
        validationStatus: "valid",
        territory: routed.territory,
        regime: routed.regime,
      });
    } else if (question) {
      // enfileirado: permanece no lugar até a entrevista (Plano 05)
      coverageEntries.push({
        fragmentId: fragment.fragmentId,
        artifactType: "reference",
        outputPath: src,
        derivedFrom: [src],
        validationStatus: "degraded",
      });
    }
  }
  files.set(
    ".hephaestus/manifests/coverage-map.json",
    `${JSON.stringify({ coverageEntries, lastUpdatedAt: `${now}T00:00:00.000Z` }, null, 2)}\n`,
  );

  // plan.json: operações por fragmento roteado (rastreio obrigatório).
  const planEntries = routing.map((entry) => {
    const src = srcByFragment.get(entry.fragmentId);
    const dest = destOf(entry, src);
    return {
      artifactPath: dest,
      territory: entry.territory,
      regime: entry.regime,
      operation:
        entry.regime === "keep" ? "keep" : entry.regime === "relocate" ? "move" : "create",
      rationale: `regime ${entry.regime} herdado do roteamento (${entry.decidedBy})`,
      origin: entry.fragmentId,
      decidedBy: entry.decidedBy,
      destructive: true,
      approved: true,
    };
  });
  files.set(
    ".hephaestus/plan.json",
    `${JSON.stringify({ version: 1, entries: planEntries }, null, 2)}\n`,
  );

  // run-state: 13 fases validades, modo adopt, métrica efêmera, escrita só em apply.
  const phaseStates = {};
  const THE_13_PHASES = [
    "preflight", "discover", "snapshot", "fragment", "route", "reconcile",
    "interview", "plan", "compose", "verify_staging", "apply",
    "verify_applied", "closeout",
  ];
  for (const phase of THE_13_PHASES) {
    phaseStates[phase] = { status: "validated" };
  }
  const llmDecidedRatio =
    routing.length > 0 ? routing.filter((e) => e.decidedBy === "llm").length / routing.length : 0;

  // --- Composição da lista de artefatos gravados (staging-manifest) ---
  const processFiles = routing
    .filter((e) => e.territory === "process" && e.regime === "relocate")
    .map((e) => destOf(e, srcByFragment.get(e.fragmentId)));
  const prGenerated = routing
    .filter((e) => e.territory === "project-rules" && e.regime === "generate")
    .map((e) => destOf(e, srcByFragment.get(e.fragmentId)));
  const kept = routing.filter((e) => e.regime === "keep").map((e) => e.destinationPath);
  const composed = [
    "AGENTS.md",
    ".gitignore",
    "project-rules/index/README.md",
    ...kept,
    ...prGenerated,
    ...decisions.keys(),
    "_app-vault/INDEX.md",
    ".app-work/.gitignore",
    ...processFiles,
    ".hephaestus/manifests/run-state.json",
    ".hephaestus/manifests/snapshot.json",
    ".hephaestus/manifests/fragments.json",
    ".hephaestus/manifests/routing.json",
    ".hephaestus/manifests/identity-map.json",
    ".hephaestus/manifests/conflicts.json",
    ".hephaestus/manifests/coverage-map.json",
    ".hephaestus/plan.json",
    ".hephaestus/report.md",
  ];
  // lista final sem duplicidade: um artefato por entrada no staging-manifest
  const composedFinal = [...new Set(composed)];

  const runState = {
    runId: "run-adopt-pacote",
    status: "blocked",
    currentPhase: "closeout",
    mode: "adopt",
    llmDecidedRatio,
    phaseStates,
    artifactsWritten: composedFinal
      .filter((rel) => rel !== ".hephaestus/manifests/run-state.json")
      .map((rel) => ({ outputPath: rel, phase: "apply", validationStatus: "valid" })),
    pendingActions: questions.map(
      (q) => `${q.sourcePath} — fila de entrevista não drenada (pergunta em aberto; drenada pelo Plano 05)`,
    ),
    lastUpdatedAt: `${now}T00:00:00.000Z`,
  };
  files.set(
    ".hephaestus/manifests/run-state.json",
    `${JSON.stringify(runState, null, 2)}\n`,
  );

  // report.md: veredito coerente com o gate de resíduo (D26) e pendências.
  // Degradante = `decidedBy: llm` cujo destino vira DEC-NNN nova (action
  // `create` no identity-map) ou regra nova em rules/ (regime `generate`) —
  // mesma semântica do `checkResidueGate` do validador. A materialização do
  // destino pelo compose NÃO desativa a degradação: é a ação de criação da
  // execução que define "vira DEC nova / regra nova" (CN5).
  const llmEntries = routing.filter((e) => e.decidedBy === "llm");
  const actionByFragment = new Map();
  for (const entry of identityMap.entries) {
    actionByFragment.set(entry.fragmentId, entry.action);
  }
  const isDegrading = (entry) => {
    if (entry.destinationPath.startsWith("_app-vault/docs/decisions/")) {
      const action = actionByFragment.get(entry.fragmentId);
      return (
        action === "create" ||
        (action === undefined && (entry.regime === "reconcile" || entry.regime === "generate"))
      );
    }
    if (entry.destinationPath.startsWith("project-rules/rules/")) {
      return entry.regime === "generate";
    }
    return false;
  };
  const residueLabel = (entry) => {
    if (entry.destinationPath.startsWith("_app-vault/docs/decisions/")) {
      return "destino que vira DEC-NNN nova — degrada";
    }
    if (entry.destinationPath.startsWith("project-rules/rules/")) {
      return "regra nova em rules/ — degrada";
    }
    return "destino de referência/processo — não degrada";
  };
  const reportLines = [
    "# Relatório de fechamento",
    "",
    "## Pendências",
    ...(questions.length > 0
      ? questions.map((q) => `- ${q.sourcePath} — destino em aberto (fila de entrevista não drenada; drenada pelo Plano 05).`)
      : ["- nenhuma"]),
    "",
    "## Decisão recomendada por pendência",
    ...(questions.length > 0
      ? ["- Migrar ADR/arquivo em aberto: extrair decisões → `_app-vault/docs/decisions/`; casca → `.app-work/archive/`."]
      : ["- nenhuma"]),
    "",
    "## Resíduo decidido pela LLM",
    ...(llmEntries.length > 0
      ? llmEntries.map((e) => `- ${e.fragmentId} → ${e.destinationPath} (${residueLabel(e)})`)
      : ["- nenhum"]),
    "",
    "## Métricas",
    `llmDecidedRatio: ${llmDecidedRatio}`,
    "",
    "## Candidatos a promoção",
    "- nenhum",
    "",
    "## Confirmações",
    "- AGENTS.md: gerado com workflow e precedência, sem regra de domínio e sem cláusula de decisão.",
    "- project-rules/: regras e referências materializadas; valores de decisão não duplicados (D18).",
    `- Fragmentos com destino no mapa de cobertura; ${questions.length} pendência(s) em aberto.`,
    "- Referências externas: nenhuma.",
    "- run-state.json: fases 13/13 validada.",
    "",
    "## Veredito",
    llmEntries.some(isDegrading)
      ? "degraded-but-usable"
      : questions.length > 0
        ? "needs-followup"
        : "ready",
    "",
  ];
  files.set(".hephaestus/report.md", reportLines.join("\n"));

  // garante que a lista final reflete exatamente o que foi composto
  const missing = composedFinal.filter((rel) => !files.has(rel));
  if (missing.length > 0) {
    throw new Error(`compose-engine: artefatos declarados sem conteúdo: ${missing.join(", ")}`);
  }

  // staging-manifest.json: lista final + proveniência da captura (não entra
  // na lista que descreve).
  const artifacts = composedFinal.map((rel) => ({
    outputPath: rel,
    sha256: sha256Hex(Buffer.from(files.get(rel), "utf8")),
  }));
  files.set(
    ".hephaestus/staging-manifest.json",
    `${JSON.stringify(
      {
        _provenance: {
          fixture: "scripts/__tests__/fixtures/repo-desorganizado",
          capturedAt: now,
          command: "node scripts/__tests__/capture-pacote-adopt.mjs",
          generatedBy:
            "reconcile-engine.mjs + compose-engine.mjs (referência determinística do contrato de prompts/reconcile.md e prompts/compose.md)",
        },
        artifacts,
      },
      null,
      2,
    )}\n`,
  );

  return {
    fragments,
    routing,
    questions,
    identityMap,
    conflicts,
    decisions,
    files,
    composed: composedFinal,
  };
};

const decIdToDomain = (decId, decisionsByDomain) => {
  for (const [domain, content] of decisionsByDomain) {
    if (parseDecisionFile(content).clauses.some((c) => c.decId === decId)) return domain;
  }
  return "produto";
};
