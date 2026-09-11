// Fixture programático de pacote válido para os testes do validador.
import { writeFile, writeJson } from "./fs-utils.mjs";
import { createHash } from "node:crypto";

// Recibo de aprovação do fixture: calculado antes da gravação do plano.
export const approvedPlanEntries = (entries) => {
  const prepared = entries.map((entry) => ({
    ...entry,
    contextFingerprint: entry.contextFingerprint ?? createHash("sha256").update(entry.origin ?? "fixture").digest("hex"),
  }));
  const fields = ["artifactPath", "territory", "regime", "operation", "rationale", "origin", "decidedBy", "destructive", "contextFingerprint"];
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(prepared.map((entry) => fields.map((key) => entry[key] ?? null))))
    .digest("hex");
  return prepared.map((entry) => ({ ...entry, planFingerprint: fingerprint }));
};

export const THE_13_PHASES = [
  "preflight",
  "discover",
  "snapshot",
  "fragment",
  "route",
  "reconcile",
  "interview",
  "plan",
  "compose",
  "verify_staging",
  "apply",
  "verify_applied",
  "closeout",
];

export const makeValidPackage = (root) => {
  // A linha .hephaestus/ no .gitignore é exigida por checkEphemeralIgnored
  // (AC-2.2.1/CN12); sem ela todo pacote validado reprova.
  writeFile(root, ".gitignore", ".hephaestus/\n");
  writeFile(
    root,
    "AGENTS.md",
    [
      "# Projeto Teste — contrato do agente",
      "",
      "Conteúdo mínimo de exemplo, sem marcadores.",
      "",
      "Produto vigente: `_app-vault/docs/decisions/`; mapa: `_app-vault/INDEX.md`; protocolo local de decisões: `_app-vault/docs/TEMPLATES/DECISION_PROTOCOL.md`.",
      "Processo: `.app-work/`; mapa: `.app-work/INDEX.md`. `.app-work/` é processo: nunca insumo de regra.",
      "",
    ].join("\n"),
  );
  writeFile(root, "project-rules/index/README.md", "# Índice do projeto\n");
  writeFile(
    root,
    "_app-vault/docs/TEMPLATES/DECISION_PROTOCOL.md",
    [
      "# Protocolo local de decisões",
      "",
      "## Fonte de verdade",
      "",
      "Somente docs/decisions/ contém regras vigentes.",
      "",
      "## Identidade e numeração",
      "",
      "A identidade semântica preserva DEC-NNN quando o valor muda.",
      "",
      "## Alteração, adição e remoção",
      "",
      "Alterar in-place, criar com max+1 e remover com histórico.",
      "",
      "## Promoção humana",
      "",
      "Candidatos exigem confirmação humana explícita.",
      "",
    ].join("\n"),
  );

  const phaseStates = {};
  for (const phase of THE_13_PHASES) {
    phaseStates[phase] = { status: phase === "preflight" ? "in_progress" : "not_started" };
  }

  writeJson(root, ".hephaestus/manifests/run-state.json", {
    runId: "run-test",
    status: "running",
    currentPhase: "preflight",
    phaseStates,
    artifactsWritten: [],
    lastUpdatedAt: "2026-08-12T00:00:00.000Z",
  });
  return root;
};

export const writeCoverageMap = (root, entries) => {
  writeJson(root, ".hephaestus/manifests/coverage-map.json", {
    coverageEntries: entries,
    lastUpdatedAt: "2026-08-12T00:00:00.000Z",
  });
};

export const coverageEntry = (overrides = {}) => ({
  fragmentId: "frag-1",
  artifactType: "rules",
  outputPath: "project-rules/rules/domain_rules.md",
  derivedFrom: ["docs/guia.md"],
  validationStatus: "valid",
  ...overrides,
});
