#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED_RUN_STATE_TOP_LEVEL = new Set([
  "runId",
  "status",
  "currentPhase",
  "phaseStates",
  "artifactsWritten",
  "pendingActions",
  "lastUpdatedAt",
]);

const ALLOWED_RUN_STATE_STATUS = new Set([
  "running",
  "interrupted",
  "blocked",
  "completed",
]);

const ALLOWED_PHASES = new Set([
  "discover",
  "snapshot",
  "fragment",
  "classify",
  "synthesize",
  "validate",
  "export_apply",
  "closeout_review",
]);

const ALLOWED_PHASE_STATUS = new Set([
  "not_started",
  "in_progress",
  "produced",
  "validated",
  "failed",
]);

const ALLOWED_ARTIFACT_PHASE = ALLOWED_PHASES;

const ALLOWED_ARTIFACT_VALIDATION = new Set([
  "valid",
  "degraded",
  "blocked",
  "unknown",
]);

const ALLOWED_EXTERNAL_REF_STATUS = new Set([
  "valid",
  "missing",
  "fragile",
  "should-internalize",
]);

const ALLOWED_COVERAGE_ARTIFACT_TYPE = new Set([
  "AGENTS",
  "index",
  "rules",
  "reference",
  "contracts",
  "manifest",
]);

const ALLOWED_COVERAGE_VALIDATION = new Set([
  "valid",
  "degraded",
  "blocked",
]);

const IMMUTABLE_START_PATTERN = /<!-- hephaestus:immutable:start id="([^"]+)" version="([^"]+)" -->/g;
const IMMUTABLE_END_PATTERN = /<!-- hephaestus:immutable:end id="([^"]+)" -->/g;

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
  const markers = [...contents.matchAll(/<!-- hephaestus:immutable:(?:start|end)\b/g)];
  const starts = [...contents.matchAll(IMMUTABLE_START_PATTERN)];
  const ends = [...contents.matchAll(IMMUTABLE_END_PATTERN)];
  if (markers.length !== starts.length + ends.length || starts.length !== ends.length) {
    fail("AGENTS.md: malformed immutable-block marker");
  }
  for (let index = 0; index < starts.length; index += 1) {
    if (starts[index][1] !== ends[index][1] || starts[index].index > ends[index].index) {
      fail("AGENTS.md: immutable-block markers must be paired in order with matching IDs");
    }
  }
  return `AGENTS.md header OK; no placeholders; ${starts.length} immutable block(s) structurally valid.`;
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

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_RUN_STATE_TOP_LEVEL.has(key)) {
      fail(`${fileLabel}: unknown property "${key}" — additionalProperties is false`);
    }
  }

  requireString(parsed, "runId", fileLabel);
  requireString(parsed, "status", fileLabel);
  requireString(parsed, "currentPhase", fileLabel);
  requireString(parsed, "lastUpdatedAt", fileLabel);

  if (!ALLOWED_RUN_STATE_STATUS.has(parsed.status)) {
    fail(`${fileLabel}: status "${parsed.status}" not in enum`);
  }
  if (!ALLOWED_PHASES.has(parsed.currentPhase)) {
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
    if (!ALLOWED_PHASES.has(phase)) {
      fail(`${fileLabel}: phaseStates unknown phase "${phase}"`);
    }
  }
  for (const phase of ALLOWED_PHASES) {
    if (!Object.prototype.hasOwnProperty.call(phaseStates, phase)) {
      fail(`${fileLabel}: phaseStates missing required phase "${phase}"`);
    }
    const state = phaseStates[phase];
    if (typeof state !== "object" || state === null || Array.isArray(state)) {
      fail(`${fileLabel}: phaseStates.${phase} must be an object`);
    }
    if (typeof state.status !== "string" || !ALLOWED_PHASE_STATUS.has(state.status)) {
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
    if (typeof artifact.phase !== "string" || !ALLOWED_ARTIFACT_PHASE.has(artifact.phase)) {
      fail(`${fileLabel}: artifactsWritten[${index}].phase not in enum`);
    }
    if (
      typeof artifact.validationStatus !== "string" ||
      !ALLOWED_ARTIFACT_VALIDATION.has(artifact.validationStatus)
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
    if (!ALLOWED_EXTERNAL_REF_STATUS.has(entry.status)) {
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
    if (!ALLOWED_COVERAGE_ARTIFACT_TYPE.has(entry.artifactType)) {
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
    if (!ALLOWED_COVERAGE_VALIDATION.has(entry.validationStatus)) {
      fail(
        `${fileLabel}: coverageEntries[${index}].validationStatus "${entry.validationStatus}" not in enum`,
      );
    }
  }

  return `coverage-map.json: ${entries.length} entry(ies) structurally valid.`;
};

const checkImmutableBlocksReport = (root) => {
  const reportPath = path.join(root, ".hephaestus", "manifests", "immutable-blocks-report.json");
  const parsed = readJsonObject(reportPath);
  if (parsed === null) {
    const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
    if (agents.includes("<!-- hephaestus:immutable:")) {
      fail("immutable-blocks-report.json: required when AGENTS.md contains immutable blocks");
    }
    return "immutable-blocks-report.json: not present (skipped).";
  }
  const fileLabel = path.relative(root, reportPath);
  if (!Array.isArray(parsed.blocks) || typeof parsed.lastUpdatedAt !== "string" || parsed.lastUpdatedAt.length === 0) {
    fail(`${fileLabel}: requires blocks array and non-empty lastUpdatedAt`);
  }
  const agentsPath = path.join(root, "AGENTS.md");
  const agents = fs.readFileSync(agentsPath, "utf8");
  const starts = [...agents.matchAll(IMMUTABLE_START_PATTERN)];
  const ends = [...agents.matchAll(IMMUTABLE_END_PATTERN)];
  const destinationBlocks = new Map();
  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end = ends[index];
    if (!end || start[1] !== end[1]) {
      fail(`${fileLabel}: cannot map immutable block ${start[1] ?? "unknown"} in AGENTS.md`);
    }
    const content = agents.slice(start.index, end.index + end[0].length);
    destinationBlocks.set(start[1], {
      version: start[2],
      sha256: crypto.createHash("sha256").update(content).digest("hex"),
    });
  }
  if (destinationBlocks.size !== parsed.blocks.length) {
    fail(`${fileLabel}: report count does not match immutable blocks in AGENTS.md`);
  }
  for (const [index, block] of parsed.blocks.entries()) {
    if (typeof block !== "object" || block === null || Array.isArray(block)) {
      fail(`${fileLabel}: blocks[${index}] must be an object`);
    }
    for (const key of ["id", "version", "sourceFile", "destinationFile", "sourceSha256", "destinationSha256", "status"]) {
      if (typeof block[key] !== "string" || block[key].length === 0) {
        fail(`${fileLabel}: blocks[${index}].${key} must be a non-empty string`);
      }
    }
    if (!/^[a-f0-9]{64}$/.test(block.sourceSha256) || !/^[a-f0-9]{64}$/.test(block.destinationSha256)) {
      fail(`${fileLabel}: blocks[${index}] hashes must be lowercase SHA-256`);
    }
    if (block.status !== "preserved" || block.sourceSha256 !== block.destinationSha256) {
      fail(`${fileLabel}: blocks[${index}] is not proven preserved`);
    }
    const destination = destinationBlocks.get(block.id);
    if (!destination || block.destinationFile !== "AGENTS.md" || destination.version !== block.version) {
      fail(`${fileLabel}: blocks[${index}] does not match AGENTS.md marker`);
    }
    if (destination.sha256 !== block.destinationSha256) {
      fail(`${fileLabel}: blocks[${index}] destination hash does not match AGENTS.md`);
    }
  }
  return `immutable-blocks-report.json: ${parsed.blocks.length} block(s) proven preserved.`;
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
    checkImmutableBlocksReport(root),
  ];

  for (const message of reports) {
    console.log(message);
  }
  console.log("Package validation passed.");
};

main(process.argv);
