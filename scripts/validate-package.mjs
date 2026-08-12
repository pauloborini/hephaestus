#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

// Os enums de vocabulário são lidos dos schemas (fonte única), nunca
// redeclarados aqui: alterar o schema altera o gate na execução seguinte.
// A memoização por path é correta porque o processo é de vida curta e valida
// um pacote por invocação — schema editado no meio da execução não é esperado.
const schemaCache = new Map();

const loadSchema = (schemaRelPath) => {
  const schemaPath = path.join(import.meta.dirname, "..", "schemas", schemaRelPath);
  if (!fs.existsSync(schemaPath)) {
    fail(`schema not found: ${schemaPath} (loadEnum: ${schemaRelPath})`);
  }
  if (schemaCache.has(schemaPath)) {
    return schemaCache.get(schemaPath);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (error) {
    fail(`schema ${schemaPath}: invalid JSON (${error.message})`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail(`schema ${schemaPath}: expected JSON object at root`);
  }
  schemaCache.set(schemaPath, parsed);
  return parsed;
};

const resolvePointer = (obj, pointer, schemaRelPath) => {
  let current = obj;
  for (const segment of pointer.split(".")) {
    if (current === null || typeof current !== "object" || !(segment in current)) {
      fail(`schema ${schemaRelPath}: pointer "${pointer}" not found (segment "${segment}")`);
    }
    current = current[segment];
  }
  return current;
};

const loadEnum = (schemaRelPath, pointer) => {
  const value = resolvePointer(loadSchema(schemaRelPath), pointer, schemaRelPath);
  if (!Array.isArray(value)) {
    fail(`schema ${schemaRelPath}: pointer "${pointer}" must be an enum array`);
  }
  return new Set(value);
};

const loadPropertyNames = (schemaRelPath, pointer = "properties") => {
  const value = resolvePointer(loadSchema(schemaRelPath), pointer, schemaRelPath);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`schema ${schemaRelPath}: pointer "${pointer}" must be an object`);
  }
  return new Set(Object.keys(value));
};

const PLACEHOLDER_PATTERN = /<preencher[^>]*>|<[^>]*preencher[^>]*>/i;

const AGENTS_HEADER_PATTERN = /^# .+— contrato do agente/m;

const fail = (message, exitCode = 1) => {
  console.error(`Validation failed: ${message}`);
  process.exit(exitCode);
};

const printUsage = () => {
  console.log(
    [
      "Usage: node scripts/validate-package.mjs <pacote>",
      "",
      "Validates a generated Hephaestus package:",
      "  - AGENTS.md real header (no placeholder)",
      "  - project-rules/index/*.md pointing to existing files",
      "  - .hephaestus/manifests/run-state.json structural shape (no unknown properties)",
      "  - .hephaestus/manifests/external-references-report.json structural shape",
      "  - .hephaestus/manifests/coverage-map.json structural shape (fragmentId required)",
      "  - territory x regime legality per coverage entry",
      "  - .hephaestus/ gitignored (CN12) and absent from the git index",
      "  - .hephaestus/plan.json contract (origin tracing; INV7)",
      "  - process writes: no write outside .app-work/issues/, always additive (INV10)",
      "  - DEC identity: no renumbered/reused ID, none live and in Histórico (INV3)",
      "  - single territory: no decision value duplicated in project-rules without citation (INV4)",
      "  - AGENTS territory: no vault fragment housed in AGENTS.md (CN8)",
      "  - snapshot coverage: every byte belongs to a fragment or declared ignored region (INV5)",
      "  - keep bytes: routing keep fragments copied byte by byte (INV2)",
      "  - residue gate: llm residue degrading destinations require degraded verdict + nominal list (D26)",
      "  - verify(applied): disk hash vs .hephaestus/staging-manifest.json (D27)",
      "",
      "Exit 0 on full pass, exit 1 on first failing check.",
    ].join("\n"),
  );
};

const requireString = (obj, key, fileLabel) => {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    fail(`${fileLabel}: expected JSON object at root`);
  }
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    fail(`${fileLabel}: missing required property "${key}"`);
  }
  if (typeof obj[key] !== "string" || obj[key].length === 0) {
    fail(`${fileLabel}: property "${key}" must be a non-empty string`);
  }
  return obj[key];
};

const readJsonObject = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${path.relative(process.cwd(), filePath)}: invalid JSON (${error.message})`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail(`${path.relative(process.cwd(), filePath)}: expected JSON object at root`);
  }
  return parsed;
};

const readJsonValue = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${path.relative(process.cwd(), filePath)}: invalid JSON (${error.message})`);
  }
  return parsed;
};

const checkAgents = (root) => {
  const agentsPath = path.join(root, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    fail("AGENTS.md: file not found in package root");
  }
  const contents = fs.readFileSync(agentsPath, "utf8");
  if (!AGENTS_HEADER_PATTERN.test(contents)) {
    fail("AGENTS.md: first heading does not match `<project name> — contrato do agente`");
  }
  if (PLACEHOLDER_PATTERN.test(contents)) {
    fail("AGENTS.md: contains placeholder (`<...>` / `<preencher...>`) — must be replaced");
  }
  return "AGENTS.md header OK; no placeholders.";
};

const globMatch = (rootDir, linkedPath) => {
  const segments = linkedPath.split("/");
  const fileName = segments[segments.length - 1];
  const stem = fileName.replace(/\*/g, "");
  const prefix = fileName.slice(0, fileName.indexOf("*"));
  const searchRoot = path.join(rootDir, ...segments.slice(0, -1));
  if (!fs.existsSync(searchRoot)) {
    return false;
  }
  const stack = [searchRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      const baseName = entry.name;
      if (baseName.includes("*")) {
        continue;
      }
      if (fileName.includes("*")) {
        if (baseName.startsWith(prefix) && baseName.endsWith(stem)) {
          return true;
        }
      } else if (baseName === fileName) {
        return true;
      }
    }
  }
  return false;
};

const checkIndexes = (root) => {
  const indexRoot = path.join(root, "project-rules", "index");
  if (!fs.existsSync(indexRoot)) {
    fail("project-rules/index/: directory not found in package");
  }
  const indexFiles = fs
    .readdirSync(indexRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(indexRoot, entry.name));

  const missing = [];
  for (const indexPath of indexFiles) {
    const contents = fs.readFileSync(indexPath, "utf8");
    const matches = [
      ...contents.matchAll(/`(project-rules\/[^`]+)`/g),
    ].map((match) => match[1]);

    for (const linkedPath of matches) {
      const hasWildcard = linkedPath.includes("*");
      const matched = globMatch(root, linkedPath);
      if (!matched) {
        missing.push(`${path.relative(root, indexPath)} -> ${linkedPath}`);
      }
    }
  }

  if (missing.length > 0) {
    fail(
      `project-rules/index/: references point to missing files:\n${missing.join("\n")}`,
    );
  }
  return `${indexFiles.length} index file(s) reference existing targets.`;
};

const checkRunState = (root) => {
  const runStatePath = path.join(root, ".hephaestus", "manifests", "run-state.json");
  const parsed = readJsonObject(runStatePath);
  if (parsed === null) {
    return "run-state.json: not present (skipped).";
  }
  const fileLabel = path.relative(root, runStatePath);

  const allowedTopLevel = loadPropertyNames("run-state.schema.json", "properties");
  const allowedStatus = loadEnum("run-state.schema.json", "properties.status.enum");
  const allowedModes = loadEnum("run-state.schema.json", "properties.mode.enum");
  const allowedPhases = loadEnum("run-state.schema.json", "properties.currentPhase.enum");
  const allowedPhaseStatus = loadEnum("run-state.schema.json", "$defs.phaseState.properties.status.enum");
  const allowedArtifactPhase = loadEnum("run-state.schema.json", "$defs.artifactState.properties.phase.enum");
  const allowedArtifactValidation = loadEnum("run-state.schema.json", "$defs.artifactState.properties.validationStatus.enum");

  for (const key of Object.keys(parsed)) {
    if (!allowedTopLevel.has(key)) {
      fail(`${fileLabel}: unknown property "${key}" — additionalProperties is false`);
    }
  }

  requireString(parsed, "runId", fileLabel);
  requireString(parsed, "status", fileLabel);
  requireString(parsed, "currentPhase", fileLabel);
  requireString(parsed, "lastUpdatedAt", fileLabel);

  if (!allowedStatus.has(parsed.status)) {
    fail(`${fileLabel}: status "${parsed.status}" not in enum`);
  }
  if (parsed.mode !== undefined && !allowedModes.has(parsed.mode)) {
    fail(`${fileLabel}: mode "${parsed.mode}" not in enum`);
  }
  if (parsed.llmDecidedRatio !== undefined) {
    if (
      typeof parsed.llmDecidedRatio !== "number" ||
      parsed.llmDecidedRatio < 0 ||
      parsed.llmDecidedRatio > 1
    ) {
      fail(`${fileLabel}: llmDecidedRatio must be a number in [0, 1] (D29 — métrica efêmera, nunca no state versionado)`);
    }
  }
  if (!allowedPhases.has(parsed.currentPhase)) {
    fail(`${fileLabel}: currentPhase "${parsed.currentPhase}" not in enum`);
  }

  if (!Object.prototype.hasOwnProperty.call(parsed, "phaseStates")) {
    fail(`${fileLabel}: missing required property "phaseStates"`);
  }
  const phaseStates = parsed.phaseStates;
  if (typeof phaseStates !== "object" || phaseStates === null || Array.isArray(phaseStates)) {
    fail(`${fileLabel}: phaseStates must be an object`);
  }
  for (const phase of Object.keys(phaseStates)) {
    if (!allowedPhases.has(phase)) {
      fail(`${fileLabel}: phaseStates unknown phase "${phase}"`);
    }
  }
  for (const phase of allowedPhases) {
    if (!Object.prototype.hasOwnProperty.call(phaseStates, phase)) {
      fail(`${fileLabel}: phaseStates missing required phase "${phase}"`);
    }
    const state = phaseStates[phase];
    if (typeof state !== "object" || state === null || Array.isArray(state)) {
      fail(`${fileLabel}: phaseStates.${phase} must be an object`);
    }
    if (typeof state.status !== "string" || !allowedPhaseStatus.has(state.status)) {
      fail(
        `${fileLabel}: phaseStates.${phase}.status "${state.status}" not in enum`,
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(state, "notes") &&
      !Array.isArray(state.notes)
    ) {
      fail(`${fileLabel}: phaseStates.${phase}.notes must be an array when present`);
    }
  }

  if (!Object.prototype.hasOwnProperty.call(parsed, "artifactsWritten")) {
    fail(`${fileLabel}: missing required property "artifactsWritten"`);
  }
  if (!Array.isArray(parsed.artifactsWritten)) {
    fail(`${fileLabel}: artifactsWritten must be an array`);
  }
  for (const [index, artifact] of parsed.artifactsWritten.entries()) {
    if (typeof artifact !== "object" || artifact === null || Array.isArray(artifact)) {
      fail(`${fileLabel}: artifactsWritten[${index}] must be an object`);
    }
    if (typeof artifact.outputPath !== "string" || artifact.outputPath.length === 0) {
      fail(`${fileLabel}: artifactsWritten[${index}].outputPath must be non-empty string`);
    }
    if (typeof artifact.phase !== "string" || !allowedArtifactPhase.has(artifact.phase)) {
      fail(`${fileLabel}: artifactsWritten[${index}].phase not in enum`);
    }
    if (
      typeof artifact.validationStatus !== "string" ||
      !allowedArtifactValidation.has(artifact.validationStatus)
    ) {
      fail(
        `${fileLabel}: artifactsWritten[${index}].validationStatus not in enum`,
      );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(parsed, "pendingActions") &&
    !Array.isArray(parsed.pendingActions)
  ) {
    fail(`${fileLabel}: pendingActions must be an array when present`);
  }

  return "run-state.json: required keys, enums and no unknown properties.";
};

// CN10 / AC-5.1.x (D7, D29, D4): contrato do estado versionado
// `.app-work/hephaestus-state.json` (nome em minúsculo é gate — variante em
// caixa alta reprova indicando o esperado). Quatro blocos (meta, routing,
// answers, shield), sem métricas. Bloco de topo que o schema não conhece é
// IGNORADO e registrado como observação (D4 — retrocompatibilidade zero:
// ignora o que não entende e repergunta o necessário, nunca migra); bloco
// conhecido malformado reprova nomeando o bloco.
const STATE_KNOWN_BLOCKS = ["meta", "routing", "answers", "shield"];
const STATE_ANSWER_SCOPES = ["this-run", "this-project", "promote-to-catalog"];

const checkStateContract = (root) => {
  const appWorkPath = path.join(root, ".app-work");
  if (!fs.existsSync(appWorkPath)) {
    return "hephaestus-state.json: not present (skipped).";
  }
  const wrongCase = fs
    .readdirSync(appWorkPath)
    .find(
      (name) =>
        name.toLowerCase() === "hephaestus-state.json" && name !== "hephaestus-state.json",
    );
  if (wrongCase) {
    fail(
      `.app-work/${wrongCase}: nome do estado em caixa alta — esperado .app-work/hephaestus-state.json em minúsculo (D7)`,
    );
  }
  const statePath = path.join(appWorkPath, "hephaestus-state.json");
  if (!fs.existsSync(statePath)) {
    return "hephaestus-state.json: not present (skipped).";
  }
  const parsed = readJsonObject(statePath);
  const fileLabel = path.relative(root, statePath);

  // Campo de topo desconhecido (schema de versão futura ou edição à mão):
  // observação, nunca bloqueio (D4).
  const observations = [];
  for (const key of Object.keys(parsed)) {
    if (!STATE_KNOWN_BLOCKS.includes(key)) {
      observations.push(`bloco de topo desconhecido "${key}" ignorado (D4)`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "meta")) {
    const meta = parsed.meta;
    if (typeof meta !== "object" || meta === null || Array.isArray(meta)) {
      fail(`${fileLabel}: bloco "meta" deve ser um objeto`);
    }
    for (const key of Object.keys(meta)) {
      if (!["packVersion", "schemaVersion", "lastRunAt", "lastRunId"].includes(key)) {
        fail(`${fileLabel}: meta: campo desconhecido "${key}" — nenhuma métrica vive no estado (D29)`);
      }
    }
    for (const key of ["packVersion", "schemaVersion", "lastRunAt", "lastRunId"]) {
      if (
        Object.prototype.hasOwnProperty.call(meta, key) &&
        (typeof meta[key] !== "string" || meta[key].length === 0)
      ) {
        fail(`${fileLabel}: meta: ${key} deve ser string não vazia`);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "routing")) {
    const routing = parsed.routing;
    if (typeof routing !== "object" || routing === null || Array.isArray(routing)) {
      fail(`${fileLabel}: bloco "routing" deve ser um objeto`);
    }
    for (const key of Object.keys(routing)) {
      if (!["overlay", "forbiddenPatterns"].includes(key)) {
        fail(`${fileLabel}: routing: campo desconhecido "${key}"`);
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(routing, "forbiddenPatterns") &&
      (!Array.isArray(routing.forbiddenPatterns) ||
        routing.forbiddenPatterns.some((p) => typeof p !== "string" || p.length === 0))
    ) {
      fail(`${fileLabel}: routing: forbiddenPatterns deve ser um array de strings não vazias`);
    }
    if (Object.prototype.hasOwnProperty.call(routing, "overlay")) {
      const overlay = routing.overlay;
      if (!Array.isArray(overlay)) {
        fail(`${fileLabel}: routing: overlay deve ser um array`);
      }
      for (const [index, entry] of overlay.entries()) {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
          fail(`${fileLabel}: routing: overlay[${index}] deve ser um objeto`);
        }
        for (const requiredKey of ["pattern", "destination", "confidence"]) {
          if (!Object.prototype.hasOwnProperty.call(entry, requiredKey)) {
            fail(`${fileLabel}: routing: overlay[${index}] sem "${requiredKey}"`);
          }
        }
        if (typeof entry.pattern !== "string" || entry.pattern.length === 0) {
          fail(`${fileLabel}: routing: overlay[${index}].pattern deve ser string não vazia`);
        }
        if (
          entry.destination !== null &&
          (typeof entry.destination !== "string" || entry.destination.length === 0)
        ) {
          fail(`${fileLabel}: routing: overlay[${index}].destination deve ser string ou null`);
        }
        if (!["alta", "baixa"].includes(entry.confidence)) {
          fail(`${fileLabel}: routing: overlay[${index}].confidence deve ser "alta"|"baixa"`);
        }
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "answers")) {
    const answers = parsed.answers;
    if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
      fail(`${fileLabel}: bloco "answers" deve ser um objeto (questionKey -> resposta)`);
    }
    for (const [questionKey, answer] of Object.entries(answers)) {
      if (questionKey.length === 0) {
        fail(`${fileLabel}: answers: questionKey vazia`);
      }
      if (typeof answer !== "object" || answer === null || Array.isArray(answer)) {
        fail(`${fileLabel}: answers: resposta de "${questionKey}" deve ser um objeto`);
      }
      for (const requiredKey of ["answer", "scope", "sourceEvidence"]) {
        if (!Object.prototype.hasOwnProperty.call(answer, requiredKey)) {
          fail(`${fileLabel}: answers: "${questionKey}" sem "${requiredKey}"`);
        }
      }
      if (
        typeof answer.answer !== "object" ||
        answer.answer === null ||
        Array.isArray(answer.answer)
      ) {
        fail(`${fileLabel}: answers: "${questionKey}".answer deve ser objeto estruturado`);
      }
      if (!STATE_ANSWER_SCOPES.includes(answer.scope)) {
        fail(
          `${fileLabel}: answers: "${questionKey}".scope fora de {this-run, this-project, promote-to-catalog}`,
        );
      }
      if (typeof answer.sourceEvidence !== "string" || answer.sourceEvidence.length === 0) {
        fail(`${fileLabel}: answers: "${questionKey}".sourceEvidence deve ser string não vazia`);
      }
      if (
        Object.prototype.hasOwnProperty.call(answer, "answeredAt") &&
        (typeof answer.answeredAt !== "string" || answer.answeredAt.length === 0)
      ) {
        fail(`${fileLabel}: answers: "${questionKey}".answeredAt deve ser string não vazia`);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "shield")) {
    const shield = parsed.shield;
    if (!Array.isArray(shield)) {
      fail(`${fileLabel}: bloco "shield" deve ser um array`);
    }
    for (const [index, entry] of shield.entries()) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        fail(`${fileLabel}: shield[${index}] deve ser um objeto`);
      }
      if (typeof entry.path !== "string" || entry.path.length === 0) {
        fail(`${fileLabel}: shield[${index}].path deve ser string não vazia`);
      }
      if (
        Object.prototype.hasOwnProperty.call(entry, "selector") &&
        (typeof entry.selector !== "string" || entry.selector.length === 0)
      ) {
        fail(`${fileLabel}: shield[${index}].selector deve ser string não vazia`);
      }
    }
  }

  const observationNote =
    observations.length > 0 ? `; observação: ${observations.join("; ")}` : "";
  return `hephaestus-state.json: contrato OK (4 blocos, sem métricas, nome em minúsculo)${observationNote}.`;
};

const checkExternalReferences = (root) => {
  const extRefPath = path.join(
    root,
    ".hephaestus",
    "manifests",
    "external-references-report.json",
  );
  const parsed = readJsonObject(extRefPath);
  if (parsed === null) {
    return "external-references-report.json: not present (skipped).";
  }
  const fileLabel = path.relative(root, extRefPath);

  const allowedRefStatus = loadEnum("external-references-report.schema.json", "$defs.referenceEntry.properties.status.enum");

  if (!Object.prototype.hasOwnProperty.call(parsed, "references")) {
    fail(`${fileLabel}: missing required property "references"`);
  }
  const references = parsed.references;
  if (!Array.isArray(references)) {
    fail(`${fileLabel}: references must be an array`);
  }
  for (const [index, entry] of references.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${fileLabel}: references[${index}] must be an object`);
    }
    for (const requiredKey of [
      "sourceFile",
      "referencedPath",
      "status",
      "reason",
      "recommendation",
    ]) {
      if (
        typeof entry[requiredKey] !== "string" ||
        entry[requiredKey].length === 0
      ) {
        fail(
          `${fileLabel}: references[${index}].${requiredKey} must be a non-empty string`,
        );
      }
    }
    if (!allowedRefStatus.has(entry.status)) {
      fail(`${fileLabel}: references[${index}].status not in enum`);
    }
  }

  return `external-references-report.json: ${references.length} entry(ies) structurally valid.`;
};

const checkCoverageMap = (root) => {
  const coveragePath = path.join(root, ".hephaestus", "manifests", "coverage-map.json");
  const parsed = readJsonObject(coveragePath);
  if (parsed === null) {
    return "coverage-map.json: not present (skipped).";
  }
  const fileLabel = path.relative(root, coveragePath);

  const allowedArtifactType = loadEnum("artifact.schema.json", "properties.artifactType.enum");
  const allowedCoverageValidation = loadEnum("artifact.schema.json", "properties.validationStatus.enum");

  if (!Object.prototype.hasOwnProperty.call(parsed, "coverageEntries")) {
    fail(`${fileLabel}: missing required property "coverageEntries"`);
  }
  if (!Object.prototype.hasOwnProperty.call(parsed, "lastUpdatedAt")) {
    fail(`${fileLabel}: missing required property "lastUpdatedAt"`);
  }
  if (
    typeof parsed.lastUpdatedAt !== "string" ||
    parsed.lastUpdatedAt.length === 0
  ) {
    fail(`${fileLabel}: lastUpdatedAt must be a non-empty string`);
  }
  const entries = parsed.coverageEntries;
  if (!Array.isArray(entries)) {
    fail(`${fileLabel}: coverageEntries must be an array`);
  }

  for (const [index, entry] of entries.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${fileLabel}: coverageEntries[${index}] must be an object`);
    }
    for (const requiredKey of [
      "fragmentId",
      "artifactType",
      "outputPath",
      "derivedFrom",
      "validationStatus",
    ]) {
      if (!Object.prototype.hasOwnProperty.call(entry, requiredKey)) {
        fail(
          `${fileLabel}: coverageEntries[${index}] missing required property "${requiredKey}"`,
        );
      }
    }
    if (typeof entry.fragmentId !== "string" || entry.fragmentId.length === 0) {
      fail(
        `${fileLabel}: coverageEntries[${index}].fragmentId must be a non-empty string`,
      );
    }
    if (!allowedArtifactType.has(entry.artifactType)) {
      fail(
        `${fileLabel}: coverageEntries[${index}].artifactType "${entry.artifactType}" not in enum`,
      );
    }
    if (typeof entry.outputPath !== "string" || entry.outputPath.length === 0) {
      fail(
        `${fileLabel}: coverageEntries[${index}].outputPath must be a non-empty string`,
      );
    }
    if (!Array.isArray(entry.derivedFrom)) {
      fail(
        `${fileLabel}: coverageEntries[${index}].derivedFrom must be an array`,
      );
    }
    if (!allowedCoverageValidation.has(entry.validationStatus)) {
      fail(
        `${fileLabel}: coverageEntries[${index}].validationStatus "${entry.validationStatus}" not in enum`,
      );
    }
  }

  return `coverage-map.json: ${entries.length} entry(ies) structurally valid.`;
};

// INV9: nenhum fragmento com territory `process` recebe `generate` nem
// `reconcile`; a matriz cobre os quatro territórios e, para qualquer valor
// futuro do enum de territory, o default conservador é apenas `keep`.
const TERRITORY_REGIME_RULES = {
  process: ["relocate", "keep"],
  vault: ["reconcile", "keep"],
  agents: ["generate", "keep"],
  "project-rules": ["generate", "keep"],
};

const checkTerritoryRegime = (root) => {
  const coveragePath = path.join(root, ".hephaestus", "manifests", "coverage-map.json");
  const parsed = readJsonObject(coveragePath);
  if (parsed === null) {
    return "territory×regime: coverage-map not present (skipped).";
  }
  const fileLabel = path.relative(root, coveragePath);

  const territoryEnum = loadEnum("fragment.schema.json", "properties.territory.enum");
  const regimeEnum = loadEnum("fragment.schema.json", "properties.regime.enum");

  let evaluated = 0;
  const entries = Array.isArray(parsed.coverageEntries) ? parsed.coverageEntries : [];
  for (const [index, entry] of entries.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${fileLabel}: coverageEntries[${index}] must be an object`);
    }
    if (typeof entry.territory !== "string" || typeof entry.regime !== "string") {
      continue;
    }
    if (!territoryEnum.has(entry.territory)) {
      fail(
        `${fileLabel}: coverageEntries[${index}].territory "${entry.territory}" not in enum`,
      );
    }
    if (!regimeEnum.has(entry.regime)) {
      fail(
        `${fileLabel}: coverageEntries[${index}].regime "${entry.regime}" not in enum`,
      );
    }
    const legalRegimes = TERRITORY_REGIME_RULES[entry.territory] ?? ["keep"];
    if (!legalRegimes.includes(entry.regime)) {
      fail(
        `coverage-map: fragment ${entry.fragmentId} has illegal territory×regime: territory "${entry.territory}" + regime "${entry.regime}"`,
      );
    }
    evaluated += 1;
  }
  return `territory×regime: ${evaluated} entrie(s) legally combined.`;
};

// INV3 / AC-4.1.x (D17): identidade de decisão. `checkDecIdentity` coleta os
// IDs de `_app-vault/docs/decisions/**` de DUAS fontes — headings `### DEC-NNN`
// (cláusulas vivas) e IDs citados nas linhas da seção `## Histórico` — e
// reprova quando: um ID aparece nas duas listas (decisão removida reusada como
// viva); o `identity-map.json` registra `create` com ID menor ou igual ao
// `inventoriedMax` (cunhagem reusaria ID existente) ou reusa ID presente em
// `## Histórico`; ou registra `keep`/`amend`/`remove` com `decId` diferente do
// `matchedId` (renumeração detectável). Restringir o inventário às cláusulas
// vivas é o P0-3 do pre-mortem: um vault com `DEC-002` só no `## Histórico`
// passaria a cunhar `DEC-002` de novo, reapontando toda citação externa.
const DEC_HEADING_RE = /^###\s+(DEC-\d+)\b/gm;

const collectDecisionIds = (root) => {
  const decisionsDir = path.join(root, "_app-vault", "docs", "decisions");
  if (!fs.existsSync(decisionsDir)) {
    return { live: [], historico: [], max: 0 };
  }
  const live = new Set();
  const historico = new Set();
  let max = 0;
  const stack = [decisionsDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      const content = fs.readFileSync(abs, "utf8");
      const historicoIndex = content.indexOf("## Histórico");
      const livePart = historicoIndex === -1 ? content : content.slice(0, historicoIndex);
      const historicoPart = historicoIndex === -1 ? "" : content.slice(historicoIndex);
      for (const match of livePart.matchAll(DEC_HEADING_RE)) {
        live.add(match[1]);
      }
      for (const match of historicoPart.matchAll(/DEC-(\d+)/g)) {
        historico.add(`DEC-${match[1]}`);
      }
    }
  }
  for (const id of [...live, ...historico]) {
    const n = Number(id.slice(4));
    if (n > max) max = n;
  }
  return { live: [...live], historico: [...historico], max };
};

const DEC_ACTIONS = new Set(["keep", "amend", "create", "remove"]);

const checkDecIdentity = (root) => {
  const identityPath = path.join(root, ".hephaestus", "manifests", "identity-map.json");
  const decisionsDir = path.join(root, "_app-vault", "docs", "decisions");
  if (!fs.existsSync(identityPath) && !fs.existsSync(decisionsDir)) {
    return "identidade DEC: sem _app-vault/docs/decisions/ e sem identity-map.json (skipped).";
  }
  const ids = collectDecisionIds(root);
  const fileLabel = path.relative(root, identityPath);

  const both = ids.live.filter((id) => ids.historico.includes(id));
  if (both.length > 0) {
    fail(
      `identidade DEC: ${both[0]} presente ao mesmo tempo como cláusula viva e em ## Histórico — ID removido não pode ser reusado (INV3)`,
    );
  }

  const identity = readJsonObject(identityPath);
  if (identity === null) {
    return "identidade DEC: identity-map.json ausente; IDs do vault conferidos sem mapa (sem cunhagem a validar).";
  }
  if (!Object.prototype.hasOwnProperty.call(identity, "inventoriedMax")) {
    fail(`${fileLabel}: missing required property "inventoriedMax"`);
  }
  if (
    typeof identity.inventoriedMax !== "number" ||
    identity.inventoriedMax < 0 ||
    !Number.isInteger(identity.inventoriedMax)
  ) {
    fail(`${fileLabel}: inventoriedMax must be a non-negative integer`);
  }
  if (!Array.isArray(identity.entries)) {
    fail(`${fileLabel}: missing "entries" array`);
  }
  const inventoriedMax = identity.inventoriedMax;
  for (const [index, entry] of identity.entries.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${fileLabel}: entries[${index}] must be an object`);
    }
    for (const requiredKey of ["fragmentId", "decId", "action", "domain", "matchedId"]) {
      if (!Object.prototype.hasOwnProperty.call(entry, requiredKey)) {
        fail(`${fileLabel}: entries[${index}] missing required property "${requiredKey}"`);
      }
    }
    if (typeof entry.fragmentId !== "string" || entry.fragmentId.length === 0) {
      fail(`${fileLabel}: entries[${index}] fragmentId must be a non-empty string`);
    }
    if (typeof entry.decId !== "string" || !/^DEC-\d+$/.test(entry.decId)) {
      fail(`${fileLabel}: entries[${index}] decId "${entry.decId}" must match DEC-NNN`);
    }
    if (typeof entry.domain !== "string" || entry.domain.length === 0) {
      fail(`${fileLabel}: entries[${index}] domain must be a non-empty string`);
    }
    if (!DEC_ACTIONS.has(entry.action)) {
      fail(`${fileLabel}: entries[${index}] action "${entry.action}" not in {keep, amend, create, remove}`);
    }
    const decNumber = Number(entry.decId.slice(4));
    if (entry.action === "create") {
      if (entry.matchedId !== null) {
        fail(`${fileLabel}: entries[${index}] create com matchedId "${entry.matchedId}" — create não casa com ID pré-existente (INV3)`);
      }
      if (decNumber <= inventoriedMax) {
        fail(
          `${fileLabel}: entries[${index}] create ${entry.decId} com ID menor ou igual ao max inventariado (${inventoriedMax}) — cunhagem reusaria ID existente (INV3)`,
        );
      }
      if (ids.historico.includes(entry.decId)) {
        fail(`${fileLabel}: entries[${index}] create ${entry.decId} reusa ID presente em ## Histórico (INV3)`);
      }
    } else {
      if (typeof entry.matchedId !== "string" || entry.matchedId !== entry.decId) {
        fail(
          `${fileLabel}: entries[${index}] ${entry.action} de ${entry.decId} com matchedId "${entry.matchedId}" — renumeração detectável (INV3)`,
        );
      }
      if (entry.action === "remove") {
        if (!ids.historico.includes(entry.decId)) {
          fail(`${fileLabel}: entries[${index}] remove de ${entry.decId} sem linha em ## Histórico no vault (INV3)`);
        }
      } else if (!ids.live.includes(entry.decId)) {
        fail(`${fileLabel}: entries[${index}] ${entry.action} de ${entry.decId} sem cláusula viva correspondente no vault (INV3)`);
      }
    }
  }
  return `identidade DEC: ${ids.live.length} cláusula(s) viva(s), ${ids.historico.length} ID(s) no Histórico, ${identity.entries.length} entrada(s) no mapa sem reuso nem renumeração (INV3).`;
};

// INV4 / AC-4.2.1 (D18): um valor de regra existe em exatamente um território.
// `checkDuplicatedValue` extrai de cada cláusula de `_app-vault/docs/decisions/**`
// os VALORES — números com unidade, limites, itens de enumeração explícita —
// e procura ocorrência literal dos mesmos valores em `project-rules/**`.
// Ocorrência acompanhada da citação da `DEC-NNN` correspondente na mesma linha
// ou no mesmo bloco (parágrafo) é a referência prescrita e passa; ocorrência
// sem citação reprova nomeando o valor, a DEC-NNN e o arquivo de project-rules.
// A extração exige número + unidade (nunca um dígito solto) para não reprovar
// por coincidência textual de um `20` qualquer.
const DEC_VALUE_PATTERNS = [
  // moeda: R$ 99, R$ 99/ano
  /R\$\s?\d+(?:[.,]\d+)?(?:\s*\/\s*[a-zà-ú]+)?/gi,
  // número + unidade (ex.: 20 exports/mês, 20 consultas por mês, 3 projetos)
  /\b\d+(?:[.,]\d+)?\s+[a-zà-ú]{2,}(?:\s*\/\s*[a-zà-ú]{2,})?(?:\s+por\s+[a-zà-ú]{2,})?/gi,
];

const extractDecisionValues = (decisionsFile, body) => {
  const values = new Set();
  for (const pattern of DEC_VALUE_PATTERNS) {
    for (const match of body.matchAll(pattern)) {
      values.add(match[0].replace(/\s+/g, " ").trim().replace(/[.,;:!?)\]}»]+$/, ""));
    }
  }
  return [...values];
};

const listMdFiles = (root, relDir) => {
  const absDir = path.join(root, relDir);
  if (!fs.existsSync(absDir)) return [];
  const files = [];
  const stack = [absDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (entry.name.endsWith(".md")) {
        files.push(path.relative(root, abs));
      }
    }
  }
  return files.sort();
};

const checkDuplicatedValue = (root) => {
  const decisionsFiles = listMdFiles(root, path.join("_app-vault", "docs", "decisions"));
  if (decisionsFiles.length === 0) {
    return "território único: sem _app-vault/docs/decisions/ (skipped).";
  }
  const prFiles = listMdFiles(root, path.join("project-rules"));
  if (prFiles.length === 0) {
    return "território único: sem project-rules/ (skipped).";
  }
  const prContents = prFiles.map((rel) => ({
    rel,
    content: fs.readFileSync(path.join(root, rel), "utf8"),
  }));

  const tokens = [];
  for (const rel of decisionsFiles) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    const clauses = content.split(/^###\s+DEC-\d+/m);
    const heads = [...content.matchAll(/^###\s+(DEC-\d+)\b/gm)].map((m) => m[1]);
    for (let i = 0; i < heads.length; i += 1) {
      const body = clauses[i + 1] ?? "";
      const bodyPart = body.split(/^##\s/m)[0];
      for (const value of extractDecisionValues(rel, bodyPart)) {
        tokens.push({ value, decId: heads[i], file: rel });
      }
    }
  }

  for (const token of tokens) {
    for (const { rel, content } of prContents) {
      const paragraphs = content.split(/\n\s*\n/);
      for (const paragraph of paragraphs) {
        const normalized = paragraph.replace(/\s+/g, " ");
        if (!normalized.includes(token.value)) continue;
        const citesId = new RegExp(`\\b${token.decId}\\b`).test(normalized);
        if (!citesId) {
          fail(
            `território único: valor "${token.value}" da ${token.decId} (${token.file}) duplicado literalmente em ${rel} sem citar o ID — project-rules/ referencia a DEC-NNN, nunca copia o valor (D18/INV4)`,
          );
        }
      }
    }
  }
  return `território único: ${tokens.length} valor(es) de decisão conferido(s) contra ${prFiles.length} arquivo(s) de project-rules/ sem duplicação sem citação (INV4).`;
};

// CN8 / AC-4.2.2: `checkAgentsTerritory` reprova regra de produto alojada no
// `AGENTS.md`. Duas frentes: (a) o `coverage-map.json` registra fragmento com
// `territory: vault` cujo `outputPath` é `AGENTS.md` — a cascata realocaria o
// fragmento, o gate confirma que não sobrou; (b) o `AGENTS.md` contém cláusula
// de decisão (`### DEC-NNN`) embutida, sem ponteiro — valor de decisão não
// mora no AGENTS.md.
const checkAgentsTerritory = (root) => {
  const coveragePath = path.join(root, ".hephaestus", "manifests", "coverage-map.json");
  const parsed = readJsonObject(coveragePath);
  if (parsed !== null) {
    const entries = Array.isArray(parsed.coverageEntries) ? parsed.coverageEntries : [];
    for (const [index, entry] of entries.entries()) {
      if (typeof entry !== "object" || entry === null) continue;
      if (
        entry.territory === "vault" &&
        (entry.outputPath === "AGENTS.md" || entry.outputPath.startsWith("AGENTS.md/"))
      ) {
        fail(
          `AGENTS.md: fragmento ${entry.fragmentId} com territory vault alojado no AGENTS.md (coverage-map[${index}]) — regra de produto fora do território (CN8)`,
        );
      }
    }
  }
  const agentsPath = path.join(root, "AGENTS.md");
  if (fs.existsSync(agentsPath)) {
    const contents = fs.readFileSync(agentsPath, "utf8");
    if (/^###\s+DEC-\d+/m.test(contents)) {
      fail("AGENTS.md: contém cláusula de decisão (### DEC-NNN) sem ponteiro — valor de decisão não mora no AGENTS.md (CN8)");
    }
  }
  return "AGENTS.md: nenhum fragmento vault alojado; sem cláusula DEC embutida (CN8).";
};

// CN12 / AC-2.2.1 (D6): `.hephaestus/` é 100% gitignored. Exige a linha
// `.hephaestus/` no `.gitignore` do alvo (ou em `.git/info/exclude`) e que
// nenhum arquivo sob `.hephaestus/` conste do índice do git — por amostragem
// do diretório com `git ls-files --error-unmatch`; ausência de git é
// `skipped`, nunca falha.
const EPHEMERAL_LINE = ".hephaestus/";

const hasIgnoreLine = (ignorePath) => {
  if (!fs.existsSync(ignorePath)) return false;
  return fs
    .readFileSync(ignorePath, "utf8")
    .split("\n")
    .some((line) => line.trim().startsWith(EPHEMERAL_LINE));
};

const sampleFilesUnder = (root, hephDir, max = 10) => {
  const results = [];
  const stack = [hephDir];
  while (stack.length > 0 && results.length < max) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (results.length >= max) break;
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else {
        results.push(path.relative(root, absolutePath));
      }
    }
  }
  return results;
};

const checkEphemeralIgnored = (root) => {
  const gitignorePath = path.join(root, ".gitignore");
  const excludePath = path.join(root, ".git", "info", "exclude");
  const ignoredByGitignore = hasIgnoreLine(gitignorePath);
  const ignoredByExclude = hasIgnoreLine(excludePath);
  if (!ignoredByGitignore && !ignoredByExclude) {
    fail(
      `${path.relative(process.cwd(), gitignorePath)}: missing "${EPHEMERAL_LINE}" line — .hephaestus/ must be gitignored (apply scaffolds it)`,
    );
  }

  const hephDir = path.join(root, ".hephaestus");
  if (!fs.existsSync(hephDir)) {
    return ".hephaestus/: ignore line present; no .hephaestus dir to check in the git index.";
  }
  const tracked = [];
  let gitAvailable = true;
  for (const rel of sampleFilesUnder(root, hephDir)) {
    const res = spawnSync("git", ["ls-files", "--error-unmatch", "--", rel], {
      cwd: root,
      encoding: "utf8",
    });
    if (res.error || res.status === 128) {
      gitAvailable = false;
      break;
    }
    if (res.status === 0) {
      tracked.push(rel);
    }
  }
  if (!gitAvailable) {
    return ".hephaestus/: ignore line present; git index check skipped (no git repository here).";
  }
  if (tracked.length > 0) {
    fail(`.hephaestus/: tracked in git index: ${tracked.join(", ")}`);
  }
  return ".hephaestus/: ignore line present; no ephemeral file tracked in the git index.";
};

// CN3 / AC-2.3.1 e AC-2.3.2 (INV7): o plano aprovável exige rastreio de toda
// operação a fragmento ou resposta (`origin`) e reprova operação destrutiva
// decidida exclusivamente pela LLM sem aprovação registrada. `destructive` é
// campo derivado no plan.json (nunca preenchido à mão); o gate aplica INV7
// sobre o resultado derivado.
const PLAN_OPERATIONS = new Set(["create", "amend", "overwrite", "move", "keep", "skip"]);
const PLAN_DECIDED_BY = new Set(["keep", "state", "catalog", "detector", "llm", "human"]);

const checkPlanContract = (root) => {
  const planPath = path.join(root, ".hephaestus", "plan.json");
  const parsed = readJsonObject(planPath);
  if (parsed === null) {
    return "plan.json: not present (skipped).";
  }
  const fileLabel = path.relative(root, planPath);
  if (!Array.isArray(parsed.entries)) {
    fail(`${fileLabel}: missing "entries" array`);
  }
  for (const [index, entry] of parsed.entries.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${fileLabel}: entries[${index}] must be an object`);
    }
    if (typeof entry.artifactPath !== "string" || entry.artifactPath.length === 0) {
      fail(`${fileLabel}: entries[${index}] missing artifactPath`);
    }
    if (!PLAN_OPERATIONS.has(entry.operation)) {
      fail(
        `${fileLabel}: entries[${index}] (${entry.artifactPath}) operation "${entry.operation}" not in enum`,
      );
    }
    if (typeof entry.origin !== "string" || entry.origin.length === 0) {
      fail(
        `${fileLabel}: entries[${index}] (${entry.artifactPath}) missing origin — every operation must trace to a fragment or an answer`,
      );
    }
    if (entry.decidedBy !== undefined && !PLAN_DECIDED_BY.has(entry.decidedBy)) {
      fail(
        `${fileLabel}: entries[${index}] (${entry.artifactPath}) decidedBy "${entry.decidedBy}" not in enum`,
      );
    }
    if (entry.destructive === true && entry.decidedBy === "llm" && entry.approved !== true) {
      fail(
        `${fileLabel}: entries[${index}] (${entry.artifactPath}) destructive operation decided by llm without recorded approval (INV7)`,
      );
    }
  }
  return `plan.json: ${parsed.entries.length} entrie(s) contractually valid.`;
};

// AC-2.5.1 (D27): verify(applied) recomputa o sha256 de cada artefato do
// `staging-manifest.json` lendo o disco; divergência (ou ausência) chama
// `fail()` nomeando o artefato, o hash esperado e o obtido, e o relatório
// pede rollback.
const sha256File = (filePath) => {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
};

const checkAppliedHashes = (root, manifestPath) => {
  const parsed = readJsonObject(manifestPath);
  if (parsed === null) {
    return "staging-manifest.json: not present (skipped).";
  }
  const fileLabel = path.relative(root, manifestPath);
  if (!Array.isArray(parsed.artifacts)) {
    fail(`${fileLabel}: missing "artifacts" array`);
  }
  for (const [index, artifact] of parsed.artifacts.entries()) {
    if (typeof artifact !== "object" || artifact === null || Array.isArray(artifact)) {
      fail(`${fileLabel}: artifacts[${index}] must be an object`);
    }
    if (typeof artifact.outputPath !== "string" || artifact.outputPath.length === 0) {
      fail(`${fileLabel}: artifacts[${index}] missing outputPath`);
    }
    if (typeof artifact.sha256 !== "string" || artifact.sha256.length !== 64) {
      fail(`${fileLabel}: artifacts[${index}] (${artifact.outputPath}) missing sha256`);
    }
    const diskPath = path.join(root, artifact.outputPath);
    if (!fs.existsSync(diskPath)) {
      fail(
        `${fileLabel}: ${artifact.outputPath} missing on disk — divergence triggers rollback`,
      );
    }
    const actual = sha256File(diskPath);
    if (actual !== artifact.sha256) {
      fail(
        `${fileLabel}: ${artifact.outputPath} hash mismatch (expected ${artifact.sha256}, got ${actual}) — divergence triggers rollback`,
      );
    }
  }
  return `verify(applied): ${parsed.artifacts.length} artefato(s) with disk hash equal to staging-manifest.`;
};

// INV5 / AC-3.1.2 (D21): cobertura de 100% do snapshot — todo byte pertence a
// um fragmento (provenance do fragments.json) ou a uma região ignorada
// declarada (snapshot.json:ignoredRegions). Gap reprova nomeando o arquivo e
// o offset; provenance fora do snapshot também reprova.
const checkCoverage = (root) => {
  const snapshotPath = path.join(root, ".hephaestus", "manifests", "snapshot.json");
  const snapshot = readJsonObject(snapshotPath);
  if (snapshot === null) {
    return "coverage: snapshot.json not present (skipped).";
  }
  const fragmentsPath = path.join(root, ".hephaestus", "manifests", "fragments.json");
  const fragments = readJsonValue(fragmentsPath);
  if (fragments === null) {
    fail("coverage: fragments.json not present — snapshot coverage cannot be proven (INV5)");
  }
  const files = Array.isArray(snapshot.files) ? snapshot.files : [];
  const ignored = Array.isArray(snapshot.ignoredRegions) ? snapshot.ignoredRegions : [];
  const fragmentList = Array.isArray(fragments) ? fragments : [];
  if (!Array.isArray(snapshot.files)) {
    fail(`${path.relative(root, snapshotPath)}: missing "files" array`);
  }
  const fileIndex = new Set();
  for (const [index, file] of files.entries()) {
    if (typeof file !== "object" || file === null || Array.isArray(file)) {
      fail(`${path.relative(root, snapshotPath)}: files[${index}] must be an object`);
    }
    if (typeof file.path !== "string" || file.path.length === 0) {
      fail(`${path.relative(root, snapshotPath)}: files[${index}] missing path`);
    }
    if (typeof file.size !== "number" || file.size < 0) {
      fail(`${path.relative(root, snapshotPath)}: files[${index}] (${file.path}) missing size`);
    }
    fileIndex.add(file.path);
  }

  // intervalos cobertos por arquivo (fragmentos + regiões ignoradas)
  const rangesByFile = new Map();
  const addRange = (filePath, startOffset, endOffset) => {
    if (!rangesByFile.has(filePath)) rangesByFile.set(filePath, []);
    rangesByFile.get(filePath).push({ startOffset, endOffset });
  };
  for (const [index, fragment] of fragmentList.entries()) {
    if (typeof fragment !== "object" || fragment === null || Array.isArray(fragment)) {
      fail(`fragments.json: entry ${index} must be an object`);
    }
    const provenance = Array.isArray(fragment.provenance) ? fragment.provenance : [];
    for (const prov of provenance) {
      if (typeof prov !== "object" || prov === null || typeof prov.sourcePath !== "string") {
        fail(`fragments.json: ${fragment.fragmentId} — provenance sem sourcePath`);
      }
      if (!fileIndex.has(prov.sourcePath)) {
        fail(
          `coverage: fragmento ${fragment.fragmentId} tem provenance ${prov.sourcePath} fora do snapshot (INV5)`,
        );
      }
      addRange(prov.sourcePath, prov.startOffset, prov.endOffset);
    }
  }
  for (const [index, region] of ignored.entries()) {
    if (typeof region !== "object" || region === null || typeof region.path !== "string") {
      fail(`${path.relative(root, snapshotPath)}: ignoredRegions[${index}] must have a path`);
    }
    if (!fileIndex.has(region.path)) {
      fail(`coverage: região ignorada ${region.path} fora do snapshot (INV5)`);
    }
    addRange(region.path, region.startOffset, region.endOffset);
  }

  for (const file of files) {
    const ranges = (rangesByFile.get(file.path) ?? [])
      .filter((r) => r.endOffset >= r.startOffset)
      .sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);
    let cursor = 0;
    for (const range of ranges) {
      if (range.startOffset > cursor) {
        fail(
          `coverage: ${file.path} byte ${cursor} não pertence a fragmento nem região ignorada declarada (INV5)`,
        );
      }
      if (range.endOffset > cursor) cursor = range.endOffset;
    }
    if (cursor < file.size) {
      fail(
        `coverage: ${file.path} bytes ${cursor}..${file.size - 1} não cobertos por fragmento nem região ignorada declarada (INV5)`,
      );
    }
  }
  return `coverage: ${files.length} arquivo(s) do snapshot com 100% dos bytes cobertos (INV5).`;
};

// INV2 / AC-3.2.1 (D16): regra do não-toque. Para cada entrada `regime: keep`
// do routing.json, o sha256 do conteúdo de origem REGISTRADO (rawText do
// fragmento, a fonte congelada em fragments.json — o staging não contém a
// fonte do usuário) deve ser igual ao sha256 do range correspondente no
// artefato de destino — cópia byte a byte, nunca regeneração.
const sha256Buffer = (buffer) => createHash("sha256").update(buffer).digest("hex");

const readRange = (root, filePath, startOffset, endOffset) => {
  const abs = path.join(root, filePath);
  if (!fs.existsSync(abs)) return null;
  const buffer = fs.readFileSync(abs);
  if (startOffset > buffer.length || endOffset > buffer.length) return null;
  return buffer.subarray(startOffset, endOffset);
};

const checkKeepBytes = (root) => {
  const routingPath = path.join(root, ".hephaestus", "manifests", "routing.json");
  const routing = readJsonValue(routingPath);
  if (routing === null) {
    return "keep bytes: routing.json not present (skipped).";
  }
  const entries = Array.isArray(routing) ? routing : routing.entries;
  if (!Array.isArray(entries)) {
    fail(`${path.relative(root, routingPath)}: missing "entries" array`);
  }
  const fragmentsPath = path.join(root, ".hephaestus", "manifests", "fragments.json");
  const fragments = readJsonValue(fragmentsPath);
  if (fragments === null) {
    fail("keep bytes: fragments.json not present — keep bytes cannot be proven (INV2)");
  }
  const fragmentIndex = new Map(
    (Array.isArray(fragments) ? fragments : []).map((fragment) => [fragment.fragmentId, fragment]),
  );
  let keepCount = 0;
  for (const entry of entries) {
    if (entry.regime !== "keep") continue;
    keepCount += 1;
    const fragment = fragmentIndex.get(entry.fragmentId);
    if (!fragment) {
      fail(`keep bytes: fragmento ${entry.fragmentId} sem correspondente em fragments.json`);
    }
    const sourceHash = sha256Buffer(Buffer.from(fragment.rawText ?? "", "utf8"));
    const provenance = Array.isArray(fragment.provenance) ? fragment.provenance : [];
    for (const prov of provenance) {
      const destBytes = readRange(root, entry.destinationPath, prov.startOffset, prov.endOffset);
      if (destBytes === null) {
        fail(
          `keep bytes: fragmento ${entry.fragmentId} — destino ${entry.destinationPath} ausente/incompleto no disco`,
        );
      }
      const destHash = sha256Buffer(destBytes);
      if (sourceHash !== destHash) {
        fail(
          `keep bytes: fragmento ${entry.fragmentId} — hash de origem ${sourceHash} != hash de destino ${destHash} (regra do não-toque violada, INV2)`,
        );
      }
    }
  }
  return `keep bytes: ${keepCount} fragmento(s) keep com cópia byte a byte comprovada (INV2).`;
};

// D26 / AC-3.3.1 e AC-3.3.2: gate qualitativo de resíduo. Entrada
// `decidedBy: llm` cujo destinationPath é arquivo NOVO em
// `_app-vault/docs/decisions/` (vira DEC-NNN nova) ou em
// `project-rules/rules/` (regra nova) é DEGRADANTE — o veredito exigido do
// report.md é `degraded-but-usable` e cada degradante aparece nominalmente no
// relatório. Resíduo em reference/index/.app-work não degrada. `llmDecidedRatio`
// é sempre reportado. O critério é o tipo de destino, nunca o volume.
const RESIDUE_DEGRADING_PREFIXES = ["_app-vault/docs/decisions/", "project-rules/rules/"];

const checkResidueGate = (root) => {
  const routingPath = path.join(root, ".hephaestus", "manifests", "routing.json");
  const routing = readJsonValue(routingPath);
  if (routing === null) {
    return "resíduo: routing.json not present (skipped).";
  }
  const entries = Array.isArray(routing) ? routing : routing.entries;
  if (!Array.isArray(entries)) {
    fail(`${path.relative(root, routingPath)}: missing "entries" array`);
  }
  const reportPath = path.join(root, ".hephaestus", "report.md");
  if (!fs.existsSync(reportPath)) {
    return "resíduo: report.md not present (skipped — closeout ainda não rodou).";
  }
  const report = fs.readFileSync(reportPath, "utf8");

  const verdictMatch = report.match(/(?:^|\n)\s*(ready|degraded-but-usable|needs-followup)\s*(?:\n|$)/);
  if (!verdictMatch) {
    fail("report.md: veredito (ready/degraded-but-usable/needs-followup) ausente");
  }
  const verdict = verdictMatch[1];

  if (!/llmDecidedRatio:\s*(?:1(?:\.0+)?|0(?:\.\d+)?|\.\d+)/.test(report)) {
    fail("report.md: llmDecidedRatio ausente — a proporção de resíduo é sempre reportada (D26)");
  }

  const degrading = [];
  const nonDegrading = [];
  for (const entry of entries) {
    if (entry.decidedBy !== "llm") continue;
    const hitsPrefix = RESIDUE_DEGRADING_PREFIXES.some((prefix) =>
      entry.destinationPath.startsWith(prefix),
    );
    if (hitsPrefix && !fs.existsSync(path.join(root, entry.destinationPath))) {
      degrading.push(entry);
    } else {
      nonDegrading.push(entry);
    }
  }

  if (degrading.length > 0) {
    if (verdict !== "degraded-but-usable") {
      fail(
        `report.md: veredito "${verdict}" incompatível com ${degrading.length} entrada(s) degradante(s) decidida(s) pela LLM (D26) — exige degraded-but-usable`,
      );
    }
    for (const entry of degrading) {
      if (!report.includes(entry.fragmentId)) {
        fail(
          `report.md: entrada degradante ${entry.fragmentId} (${entry.destinationPath}) ausente da lista nominal do resíduo (D26)`,
        );
      }
    }
  }
  return `resíduo: ${degrading.length} degradante(s), ${nonDegrading.length} não-degradante(s), veredito ${verdict} coerente.`;
};

// INV10 / AC-6.2.2 (D19): escrita ativa em `.app-work/` só existe em
// `issues/` e é sempre aditiva. `checkProcessWrites` percorre o plan.json:
// operação com destino em `.app-work/` fora de `issues/` só pode ser
// `move`/`keep`/`skip` (guia, brainstorm e PRD são processo — conteúdo de
// processo nunca é gerado nem sobrescrito); operação com destino sob
// `.app-work/issues/` nunca é `overwrite` (linha de issue é permanente pelo
// protocolo de `.app-work/issues/README.md`).
const PROCESS_NONWRITABLE_OPERATIONS = new Set(["create", "amend", "overwrite"]);

const checkProcessWrites = (root) => {
  const planPath = path.join(root, ".hephaestus", "plan.json");
  const parsed = readJsonObject(planPath);
  if (parsed === null) {
    return "escrita em processo: plan.json not present (skipped).";
  }
  const fileLabel = path.relative(root, planPath);
  if (!Array.isArray(parsed.entries)) {
    fail(`${fileLabel}: missing "entries" array`);
  }
  let evaluated = 0;
  for (const [index, entry] of parsed.entries.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`${fileLabel}: entries[${index}] must be an object`);
    }
    const dest = typeof entry.artifactPath === "string" ? entry.artifactPath : "";
    if (!dest.startsWith(".app-work/")) continue;
    evaluated += 1;
    if (!dest.startsWith(".app-work/issues/")) {
      if (PROCESS_NONWRITABLE_OPERATIONS.has(entry.operation)) {
        fail(
          `escrita em processo: ${dest} — operação "${entry.operation}" em .app-work/ fora de issues/ (INV10/D19) — conteúdo de processo só move/keep/skip, nunca é gerado nem sobrescrito`,
        );
      }
    } else if (entry.operation === "overwrite") {
      fail(
        `escrita em processo: ${dest} — overwrite do registro de issues (INV10) — linha de issue é permanente, nunca sobrescrita nem deletada (protocolo .app-work/issues/README.md)`,
      );
    }
  }
  return `escrita em processo: ${evaluated} operação(ões) com destino em .app-work/ legal(is) (INV10).`;
};

const main = (argv) => {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }
  const positional = argv.slice(2).filter((arg) => !arg.startsWith("-"));
  if (positional.length === 0) {
    console.error("Error: missing package directory argument");
    printUsage();
    process.exit(2);
  }
  const root = path.resolve(positional[0]);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    fail(`package directory not found: ${root}`, 2);
  }

  const reports = [
    checkAgents(root),
    checkIndexes(root),
    checkRunState(root),
    checkStateContract(root),
    checkExternalReferences(root),
    checkCoverageMap(root),
    checkTerritoryRegime(root),
    checkDecIdentity(root),
    checkDuplicatedValue(root),
    checkAgentsTerritory(root),
    checkEphemeralIgnored(root),
    checkPlanContract(root),
    checkProcessWrites(root),
    checkCoverage(root),
    checkKeepBytes(root),
    checkResidueGate(root),
    checkAppliedHashes(root, path.join(root, ".hephaestus", "staging-manifest.json")),
  ];

  for (const message of reports) {
    console.log(message);
  }
  console.log("Package validation passed.");
};

main(process.argv);
