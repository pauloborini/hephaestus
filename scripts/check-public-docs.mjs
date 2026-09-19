import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pairs = [
  ["README.md", "README.pt-BR.md"],
  ["COMMANDS.md", "COMMANDS.pt-BR.md"],
  ["RELEASE.md", "RELEASE.pt-BR.md"],
  ["SKILL.md", "SKILL.pt-BR.md"],
];

// `packExcludes` in kit-manifest is the single source of truth for what travels
// in the distributed kit — same criterion as in `scripts/validate-skill-kit.mjs`,
// preventing the two gates from judging the same pair inconsistently.
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "kit-manifest.json"), "utf8"));
const packExcludes = Array.isArray(manifest.packExcludes) ? manifest.packExcludes : [];
const isPackExcluded = (relativePath) =>
  packExcludes.some((entry) => relativePath === entry || relativePath.startsWith(`${entry}/`));

const languageHeader = (contents) => {
  const lines = contents.split("\n");
  if (lines[0] !== "---") {
    return lines.slice(0, 5).join("\n");
  }

  const frontmatterEnd = lines.indexOf("---", 1);
  if (frontmatterEnd === -1) {
    return "";
  }
  return lines.slice(frontmatterEnd + 1, frontmatterEnd + 6).join("\n");
};

let failed = false;

for (const [english, portuguese] of pairs) {
  if (isPackExcluded(english) && isPackExcluded(portuguese)) {
    continue;
  }

  for (const [file, peer, marker] of [[english, portuguese, "Language:"], [portuguese, english, "Idioma:"]]) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Documentation check failed: ${file} is missing but pairs with ${peer} in the distributed kit.`);
      failed = true;
      continue;
    }

    const prefix = languageHeader(fs.readFileSync(filePath, "utf8"));
    if (!prefix.includes(marker) || !prefix.includes(`](${peer})`)) {
      console.error(`Documentation check failed: ${file} must link ${peer} in its language header.`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("Public documentation language pairs: OK");
