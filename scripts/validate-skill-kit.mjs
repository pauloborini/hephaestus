import fs from "node:fs";
import path from "node:path";

const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const manifestPath = path.join(rootDir, "manifests", "kit-manifest.json");
const namingPolicyPath = path.join(rootDir, "manifests", "naming-policy.json");

const fail = (message) => {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
};

if (!fs.existsSync(rootDir)) {
  fail(`root directory not found: ${rootDir}`);
}

if (!fs.existsSync(manifestPath)) {
  fail(`missing manifest: ${manifestPath}`);
}

if (!fs.existsSync(namingPolicyPath)) {
  fail(`missing naming policy: ${namingPolicyPath}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const namingPolicy = JSON.parse(fs.readFileSync(namingPolicyPath, "utf8"));

if (!Array.isArray(manifest.requiredFiles) || manifest.requiredFiles.length === 0) {
  fail("kit-manifest.json must declare requiredFiles");
}

const missingFiles = manifest.requiredFiles.filter((relativePath) => {
  return !fs.existsSync(path.join(rootDir, relativePath));
});

if (missingFiles.length > 0) {
  fail(`missing required files:\n${missingFiles.join("\n")}`);
}

const forbiddenPatterns = Array.isArray(namingPolicy.forbiddenPatterns)
  ? namingPolicy.forbiddenPatterns
  : [];

const legacyPatterns = ["project-context", "extended-memory"];

const allowedExtensions = new Set([".md", ".template", ".json", ".mjs"]);

// Arquivos do repo de desenvolvimento que não fazem parte do pacote distribuído.
const skippedRelativePaths = new Set([
  ".gitignore",
  path.join("scripts", "publish-hardless-skill-kit.sh"),
]);

const collectedFiles = [];

const walk = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === ".gitkeep") {
      continue;
    }

    const absolutePath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, absolutePath);
    if (skippedRelativePaths.has(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }

    collectedFiles.push(absolutePath);
  }
};

walk(rootDir);

const unsupportedFiles = collectedFiles.filter((filePath) => {
  const ext = path.extname(filePath);
  return !allowedExtensions.has(ext);
});

if (unsupportedFiles.length > 0) {
  fail(`unsupported file types found:\n${unsupportedFiles.join("\n")}`);
}

const violations = [];

for (const filePath of collectedFiles) {
  const relativePath = path.relative(rootDir, filePath);
  if (relativePath === path.join("manifests", "naming-policy.json")) {
    continue;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawPattern of forbiddenPatterns) {
    const pattern = String(rawPattern).trim();
    if (pattern.length === 0) {
      continue;
    }
    const matcher = new RegExp(pattern, "i");
    if (matcher.test(contents)) {
      violations.push(`${relativePath} -> ${pattern}`);
    }
  }

  // O próprio validador contém os padrões de busca; não pode se auto-violar.
  const isSelfCheck = relativePath === path.join("scripts", "validate-skill-kit.mjs");
  if (!isSelfCheck) {
    for (const legacy of legacyPatterns) {
      if (contents.includes(legacy)) {
        violations.push(`${relativePath} -> legacy reference: ${legacy}`);
      }
    }

    if (contents.includes("memory/")) {
      violations.push(`${relativePath} -> legacy reference: memory/`);
    }
  }
}

if (violations.length > 0) {
  fail(`naming/legacy policy violations found:\n${violations.join("\n")}`);
}

const requiredTopLevelFiles = ["README.md", "SKILL.md"];
for (const filename of requiredTopLevelFiles) {
  if (!fs.existsSync(path.join(rootDir, filename))) {
    fail(`missing top-level file: ${filename}`);
  }
}

const templateRoot = path.join(rootDir, "templates");
const missingTargets = [];
const templateFiles = collectedFiles.filter((filePath) => {
  return filePath.startsWith(templateRoot + path.sep) && filePath.endsWith(".template");
});

for (const filePath of templateFiles) {
  const contents = fs.readFileSync(filePath, "utf8");
  const linkedPaths = [
    ...contents.matchAll(/`(project-rules\/(?:rules|reference)\/[^`]+\.md)`/g),
  ].map((match) => match[1]);

  for (const linkedPath of linkedPaths) {
    if (linkedPath.includes("*")) {
      continue;
    }
    const expectedTemplatePath = path.join(templateRoot, `${linkedPath}.template`);
    if (!fs.existsSync(expectedTemplatePath)) {
      missingTargets.push(`${path.relative(rootDir, filePath)} -> ${linkedPath}`);
    }
  }
}

if (missingTargets.length > 0) {
  fail(`templates reference missing rule/reference templates:\n${missingTargets.join("\n")}`);
}

console.log("Hardless Skill Kit validation passed.");
