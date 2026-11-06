#!/usr/bin/env node
// Identity hygiene gate for this public repository: the kit's own SCHEMA 2.5
// scan applied to the kit, plus forbidden names, forbidden tracked paths, and
// commit identity. Reports path and pattern class, never the matched value.
//
//   node scripts/check-identity.mjs            tracked tree + commit history + current identity
//   node scripts/check-identity.mjs --staged   staged changes + current identity (pre-commit)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const kitRoot = path.resolve(import.meta.dirname, "..");
const staged = process.argv.includes("--staged");

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const gitBuffer = (...args) => execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });

const readPolicy = (file) => {
  const policyPath = path.join(kitRoot, "manifests", file);
  if (!fs.existsSync(policyPath)) return [];
  const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
  return Array.isArray(policy.forbiddenPatterns) ? policy.forbiddenPatterns : [];
};
const forbiddenNames = [...readPolicy("naming-policy.json"), ...readPolicy("naming-policy.local.json")]
  .map((name) => name.toLowerCase())
  .filter(Boolean);

const FORBIDDEN_PATH_PREFIXES = ["_app-vault/", ".app-work/", ".hephaestus/", "manifests/naming-policy.local.json"];
const RESERVED_DOMAIN = /(^|\.)(example\.(com|org|net)|invalid|test|local|example)$/i;
const NOREPLY = /^(noreply@github\.com|[^@]+@users\.noreply\.github\.com)$/i;
const EMAIL = /[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g;
const TOKENS = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /\bsk_(?:live|test)?_?[A-Za-z0-9]{16,}/,
  /\bsb_secret_[A-Za-z0-9_-]{10,}/,
  /\bghp_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const HOME_PATHS = [/(?:\/Users|\/home)\/(?!<)[A-Za-z0-9._-]+\//, /C:\\Users\\(?!<)[A-Za-z0-9._-]+\\/i];

const isAllowedEmail = (address) => {
  if (NOREPLY.test(address)) return true;
  const domain = address.split("@")[1] ?? "";
  return RESERVED_DOMAIN.test(domain);
};

const problems = [];
const report = (where, what) => problems.push(`${where}: ${what}`);

const checkPath = (relativePath) => {
  if (FORBIDDEN_PATH_PREFIXES.some((prefix) => relativePath === prefix || relativePath.startsWith(prefix))) {
    report(relativePath, "path must stay local (maintainer-only)");
  }
  const base = path.basename(relativePath);
  if (path.extname(base).toLowerCase() === ".zip") report(relativePath, "release archive must not be versioned");
  if (base.startsWith(".env") && base !== ".env.example") report(relativePath, "real env file must not be versioned");
};

const checkContent = (relativePath, buffer) => {
  if (buffer.includes(0)) return;
  const text = buffer.toString("utf8");
  for (const match of text.matchAll(EMAIL)) {
    if (!isAllowedEmail(match[0])) {
      report(relativePath, "e-mail address outside reserved domains and noreply");
      break;
    }
  }
  if (TOKENS.some((pattern) => pattern.test(text))) report(relativePath, "token or private key");
  if (HOME_PATHS.some((pattern) => pattern.test(text))) report(relativePath, "absolute home path with a real user name");
  const lower = text.toLowerCase();
  if (forbiddenNames.some((name) => lower.includes(name))) report(relativePath, "forbidden real name (naming policy)");
};

const identityEmail = (variable) => {
  const ident = git("var", variable).trim();
  return ident.match(/<([^>]*)>/)?.[1] ?? "";
};

for (const variable of ["GIT_AUTHOR_IDENT", "GIT_COMMITTER_IDENT"]) {
  if (!isAllowedEmail(identityEmail(variable))) {
    report("git identity", `${variable === "GIT_AUTHOR_IDENT" ? "author" : "committer"} e-mail is not a noreply address (set git config user.email)`);
  }
}

if (staged) {
  const names = git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z").split("\0").filter(Boolean);
  for (const name of names) {
    checkPath(name);
    checkContent(name, gitBuffer("show", `:${name}`));
  }
} else {
  const names = git("ls-files", "-z").split("\0").filter(Boolean);
  for (const name of names) {
    checkPath(name);
    if (fs.existsSync(name) && fs.statSync(name).isFile()) checkContent(name, fs.readFileSync(name));
  }
  const addresses = git("log", "--format=%ae%n%ce", "HEAD").split("\n").filter(Boolean);
  const outside = new Set(addresses.filter((address) => !isAllowedEmail(address)));
  if (outside.size > 0) {
    report("git history", `${outside.size} commit author/committer address(es) outside noreply and reserved domains`);
  }
}

if (problems.length > 0) {
  for (const line of problems) console.error(`identity check: ${line}`);
  process.exit(1);
}
console.log(`Identity hygiene: OK (${staged ? "staged changes" : "tracked tree and history"})`);
