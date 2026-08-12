// Fixture programático de pacote válido para os testes do validador.
import { writeFile, writeJson } from "./fs-utils.mjs";

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
    "# Projeto Teste — contrato do agente\n\nConteúdo mínimo de exemplo, sem marcadores.\n",
  );
  writeFile(root, "project-rules/index/README.md", "# Índice do projeto\n");

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
