#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

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
    checkExternalReferences(root),
    checkCoverageMap(root),
    checkTerritoryRegime(root),
  ];

  for (const message of reports) {
    console.log(message);
  }
  console.log("Package validation passed.");
};

main(process.argv);
