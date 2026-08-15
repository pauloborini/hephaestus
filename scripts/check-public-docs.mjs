import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pairs = [
  ["README.md", "README.pt-BR.md"],
  ["COMMANDS.md", "COMMANDS.pt-BR.md"],
  ["RELEASE.md", "RELEASE.pt-BR.md"],
  ["SKILL.en.md", "SKILL.md"],
];

// `packExcludes` do kit-manifest é a fonte da verdade sobre o que viaja no kit
// distribuído — mesmo critério de `scripts/validate-skill-kit.mjs`, para os dois
// gates não julgarem o mesmo par de forma diferente.
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "kit-manifest.json"), "utf8"));
const packExcludes = Array.isArray(manifest.packExcludes) ? manifest.packExcludes : [];
const isPackExcluded = (relativePath) =>
  packExcludes.some((entry) => relativePath === entry || relativePath.startsWith(`${entry}/`));

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

    const prefix = fs.readFileSync(filePath, "utf8").split("\n").slice(0, 5).join("\n");
    if (!prefix.includes(marker) || !prefix.includes(`](${peer})`)) {
      console.error(`Documentation check failed: ${file} must link ${peer} in its first five lines.`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("Public documentation language pairs: OK");
